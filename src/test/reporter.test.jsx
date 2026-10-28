import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ReportIncidentPage from '../pages/reporter/ReportIncidentPage';
import EditIncidentPage from '../pages/reporter/EditIncidentPage';
import StatusProgress from '../components/incident/StatusProgress';
import LocationPicker from '../components/map/LocationPicker';
import { incidentsApi } from '../api/incidents';
import * as nominatimLib from '../lib/nominatim';

// Polyfills for jsdom
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn((file) => `blob:mock-${file?.name || 'test'}`);
}
if (!window.URL.revokeObjectURL) {
  window.URL.revokeObjectURL = vi.fn();
}
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock API layer
vi.mock('../api/incidents', () => ({
  incidentsApi: {
    createIncident: vi.fn(),
    uploadIncidentImages: vi.fn(),
    getIncident: vi.fn(),
    getIncidentHistory: vi.fn(),
    updateIncident: vi.fn(),
    cancelIncident: vi.fn(),
    deleteIncident: vi.fn(),
    getMyIncidents: vi.fn(),
    getResponderLocation: vi.fn(),
  },
}));

// Mock Nominatim search & reverse geocode
vi.mock('../lib/nominatim', () => ({
  searchAddress: vi.fn().mockResolvedValue([]),
  reverseGeocode: vi.fn().mockResolvedValue('Mock Address Road'),
}));

// Mock useGeolocation hook to avoid unhandled browser geolocation prompts
vi.mock('../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    getCurrentLocation: vi.fn().mockRejectedValue(new Error('User denied geolocation')),
    isLoading: false,
    error: 'User denied geolocation',
  }),
}));

// Mock MapView and Leaflet so jsdom doesn't choke on map container dimensions
vi.mock('../components/map/MapView', () => ({
  __esModule: true,
  default: ({ children, className }) => (
    <div data-testid="mock-map-view" className={className}>
      {children}
    </div>
  ),
  FlyTo: () => null,
  FitBounds: () => null,
}));

vi.mock('../components/map/markers', () => ({
  incidentIcon: vi.fn(() => ({})),
  responderIcon: vi.fn(() => ({})),
  myLocationIcon: vi.fn(() => ({})),
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => <div data-testid="mock-marker" />,
  Popup: ({ children }) => <div>{children}</div>,
  useMap: () => ({
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
  }),
  useMapEvents: () => null,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui, { route = '/' } = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Reporter Experience (Prompt F2 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // (1) report form blocks submit without a location
  it('(1) report form blocks submit without a location', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/reporter/report" element={<ReportIncidentPage />} />
      </Routes>,
      { route: '/reporter/report' }
    );

    // Enter title & description
    const titleInput = screen.getByLabelText(/Title/i);
    await user.type(titleInput, 'Road collision at 5th avenue');

    const descInput = screen.getByLabelText(/Description/i);
    await user.type(descInput, 'Two sedans collided, fluids leaking on the road.');

    // Submit button
    const submitBtn = screen.getByRole('button', { name: /Send emergency report/i });
    await user.click(submitBtn);

    // Assert createIncident was NOT called
    expect(incidentsApi.createIncident).not.toHaveBeenCalled();

    // Assert error message shown
    expect(screen.getByText('Please set the emergency location')).toBeInTheDocument();
  }, 15000);

  // (2) photo validation rejects a 6 MB file, a PDF, and a 6th file
  it('(2) photo validation rejects a 6 MB file, a PDF, and a 6th file', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/reporter/report" element={<ReportIncidentPage />} />
      </Routes>,
      { route: '/reporter/report' }
    );

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    // Case A: 6 MB file
    const largeFile = new File(['x'.repeat(100)], 'huge-photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }); // 6 MB

    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    expect(
      screen.getByText(/exceeds the 5 MB limit/i)
    ).toBeInTheDocument();

    // Case B: PDF file
    const pdfFile = new File(['pdf-content'], 'report.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    expect(
      screen.getByText(/is not a supported format.*JPEG, PNG, or WebP/i)
    ).toBeInTheDocument();

    // Case C: 6th file (more than 5 files)
    const validFiles = Array.from({ length: 6 }, (_, i) => {
      const f = new File(['img'], `img${i}.jpg`, { type: 'image/jpeg' });
      Object.defineProperty(f, 'size', { value: 1024 * 500 }); // 500 KB
      return f;
    });

    fireEvent.change(fileInput, { target: { files: validFiles } });
    expect(
      screen.getByText(/Maximum 5 photos allowed/i)
    ).toBeInTheDocument();
  });

  // (3) when upload fails after a successful create, the create API is NOT called again on retry
  it('(3) when upload fails after a successful create, the create API is NOT called again on retry', async () => {
    const user = userEvent.setup();

    // Mock create success
    incidentsApi.createIncident.mockResolvedValueOnce({
      success: true,
      message: 'Incident reported successfully',
      data: {
        incident: {
          id: 555,
          title: 'Warehouse Fire',
          status: 'pending',
        },
      },
    });

    // Mock upload failure
    incidentsApi.uploadIncidentImages.mockRejectedValueOnce(
      new Error('Failed to upload images')
    );

    renderWithProviders(
      <Routes>
        <Route path="/reporter/report" element={<ReportIncidentPage />} />
        <Route path="/reporter/incidents/:id" element={<div>Detail Page</div>} />
      </Routes>,
      { route: '/reporter/report' }
    );

    // Fill form
    const titleInput = screen.getByLabelText(/Title/i);
    await user.type(titleInput, 'Warehouse Fire on 8th Street');

    const descInput = screen.getByLabelText(/Description/i);
    await user.type(descInput, 'Dense smoke visible from the commercial storage unit.');

    // Manually set location on address input & type
    const addressInput = screen.getByPlaceholderText(/Detailed street address/i);
    await user.type(addressInput, '88 Industrial Way');

    // Attach valid photo
    const fileInput = document.querySelector('input[type="file"]');
    const validPhoto = new File(['img-content'], 'fire.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validPhoto, 'size', { value: 1024 * 1024 });
    fireEvent.change(fileInput, { target: { files: [validPhoto] } });

    // Set coordinates directly through LocationPicker mock or address
    // Wait, let's trigger LocationPicker change by typing place suggestion or simulate coordinates
    // Let's use search or simulate coordinates:
    nominatimLib.searchAddress.mockResolvedValueOnce([
      { place_id: 1, lat: '12.9716', lon: '77.5946', display_name: '88 Industrial Way' },
    ]);

    const searchInput = screen.getByPlaceholderText(/Search a place or address/i);
    await user.type(searchInput, 'Industrial Way');

    // Wait for search result dropdown option
    const option = await screen.findByRole('option');
    await user.click(option);

    // Now submit
    const submitBtn = screen.getByRole('button', { name: /Send emergency report/i });
    await user.click(submitBtn);

    // Wait for Step 2 failure banner
    expect(await screen.findByText(/Your report was sent, but the photos could not be uploaded/i)).toBeInTheDocument();
    expect(incidentsApi.createIncident).toHaveBeenCalledTimes(1);
    expect(incidentsApi.uploadIncidentImages).toHaveBeenCalledTimes(1);

    // Now mock upload images success for retry
    incidentsApi.uploadIncidentImages.mockResolvedValueOnce({
      success: true,
      message: 'Images uploaded',
      data: { images: [] },
    });

    // Click "Retry photo upload"
    const retryBtn = screen.getByRole('button', { name: /Retry photo upload/i });
    await user.click(retryBtn);

    // Verify upload was called again, but create was NOT called again
    await waitFor(() => {
      expect(incidentsApi.uploadIncidentImages).toHaveBeenCalledTimes(2);
    });
    expect(incidentsApi.createIncident).toHaveBeenCalledTimes(1);
  });

  // (4) EditIncident sends only changed fields
  it('(4) EditIncident sends only changed fields', async () => {
    const user = userEvent.setup();

    const mockIncident = {
      id: 99,
      title: 'Original Fire Report',
      description: 'Original description of the fire that is long enough.',
      incident_type: 'fire',
      severity: 'medium',
      latitude: '12.971600',
      longitude: '77.594600',
      address: '123 Main Street',
      status: 'pending',
    };

    incidentsApi.getIncident.mockResolvedValue({
      success: true,
      data: { incident: mockIncident },
    });

    incidentsApi.updateIncident.mockResolvedValueOnce({
      success: true,
      data: { incident: { ...mockIncident, title: 'Updated Fire Report Title' } },
    });

    renderWithProviders(
      <Routes>
        <Route path="/reporter/incidents/:id/edit" element={<EditIncidentPage />} />
        <Route path="/reporter/incidents/:id" element={<div>Detail Page</div>} />
      </Routes>,
      { route: '/reporter/incidents/99/edit' }
    );

    // Wait for title input to load initial value
    const titleInput = await screen.findByDisplayValue('Original Fire Report');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Fire Report Title');

    // Click Save changes
    const saveBtn = screen.getByRole('button', { name: /Save changes/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(incidentsApi.updateIncident).toHaveBeenCalledTimes(1);
    });

    // Verify update was called with only changed field 'title'
    expect(incidentsApi.updateIncident).toHaveBeenCalledWith('99', {
      title: 'Updated Fire Report Title',
    });
  });

  // (5) StatusProgress renders the rejected banner
  it('(5) StatusProgress renders the rejected banner', () => {
    render(
      <StatusProgress
        status="rejected"
        reason="Duplicate emergency report submitted"
      />
    );

    expect(screen.getByText('Emergency Report Rejected')).toBeInTheDocument();
    expect(screen.getByText('Duplicate emergency report submitted')).toBeInTheDocument();
  });

  // (6) LocationPicker debounces search (use fake timers: typing 3 letters quickly triggers one Nominatim call after 700 ms)
  it('(6) LocationPicker debounces search (triggers searchAddress after 700 ms)', async () => {
    vi.useFakeTimers();

    render(
      <LocationPicker
        value={null}
        onChange={vi.fn()}
        autoDetect={false}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search a place or address/i);

    // Type 'b', 'a', 'n' quickly
    fireEvent.change(searchInput, { target: { value: 'b' } });
    fireEvent.change(searchInput, { target: { value: 'ba' } });
    fireEvent.change(searchInput, { target: { value: 'ban' } });

    // At 500 ms, searchAddress should not have been called yet
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(nominatimLib.searchAddress).not.toHaveBeenCalled();

    // Advance past 700 ms
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Should now be called exactly once with 'ban'
    expect(nominatimLib.searchAddress).toHaveBeenCalledTimes(1);
    expect(nominatimLib.searchAddress).toHaveBeenCalledWith('ban', expect.any(Object));

    vi.useRealTimers();
  });
});
