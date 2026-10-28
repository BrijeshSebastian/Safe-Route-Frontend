import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AdminIncidentDetailPage from '../pages/admin/AdminIncidentDetailPage';
import AssignResponderModal from '../components/admin/AssignResponderModal';
import UserDetailPage from '../pages/admin/UserDetailPage';
import AnalyticsPage from '../pages/admin/AnalyticsPage';

import { adminApi } from '../api/admin';
import { incidentsApi } from '../api/incidents';
import { SUGGESTED_RESPONDER_BY_INCIDENT_TYPE, RESPONDER_TYPES } from '../lib/constants';

// Mock API modules
vi.mock('../api/admin', () => ({
  adminApi: {
    getAdminDashboard: vi.fn(),
    getAnalytics: vi.fn(),
    getMonthlyReport: vi.fn(),
    getAdminIncidents: vi.fn(),
    getAdminIncident: vi.fn(),
    verifyIncident: vi.fn(),
    rejectIncident: vi.fn(),
    assignResponder: vi.fn(),
    reassignResponder: vi.fn(),
    cancelAssignment: vi.fn(),
    getAvailableResponders: vi.fn(),
    createResponder: vi.fn(),
    getUsers: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    disableUser: vi.fn(),
    getNearbyIncidents: vi.fn(),
  },
}));

vi.mock('../api/incidents', () => ({
  incidentsApi: {
    getIncidentHistory: vi.fn(),
    getResponderLocation: vi.fn(),
  },
}));

// Mock Leaflet components to avoid DOM/Canvas issues in JSDOM
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, eventHandlers }) => (
    <div
      data-testid="map-marker"
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="map-popup">{children}</div>,
  Circle: () => <div data-testid="map-circle" />,
  useMap: () => ({
    flyTo: vi.fn(),
    setView: vi.fn(),
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
    getZoom: vi.fn(() => 13),
    getContainer: vi.fn(() => ({})),
    scrollWheelZoom: { enable: vi.fn(), disable: vi.fn() },
  }),
}));

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  };
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

describe('Admin Area Experience (Prompt F4 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getAvailableResponders.mockResolvedValue({ data: { responders: [] } });
    incidentsApi.getIncidentHistory.mockResolvedValue({ data: { history: [] } });
    incidentsApi.getResponderLocation.mockResolvedValue({ data: { location: null } });
  });

  // (1) Action panel renders only valid actions for each incident status
  describe('(1) Action panel renders only valid actions for each incident status', () => {
    const statuses = [
      {
        status: 'pending',
        expectedButtons: ['Verify Emergency', 'Reject Report'],
        forbiddenButtons: ['Assign Responder', 'Reassign Responder', 'Cancel Assignment'],
      },
      {
        status: 'verified',
        expectedButtons: ['Assign Responder'],
        forbiddenButtons: ['Verify Emergency', 'Reject Report', 'Reassign Responder', 'Cancel Assignment'],
      },
      {
        status: 'assigned',
        expectedButtons: ['Reassign Responder', 'Cancel Assignment'],
        forbiddenButtons: ['Verify Emergency', 'Reject Report', 'Assign Responder'],
        hasActiveAssignment: true,
      },
      {
        status: 'accepted',
        expectedButtons: ['Reassign Responder', 'Cancel Assignment'],
        forbiddenButtons: ['Verify Emergency', 'Reject Report', 'Assign Responder'],
        hasActiveAssignment: true,
      },
      {
        status: 'on_the_way',
        expectedButtons: [],
        forbiddenButtons: ['Verify Emergency', 'Reject Report', 'Assign Responder', 'Reassign Responder', 'Cancel Assignment'],
        infoNote: /The responder is actively traveling to or on-site at this emergency/i,
      },
      {
        status: 'resolved',
        expectedButtons: [],
        forbiddenButtons: ['Verify Emergency', 'Reject Report', 'Assign Responder', 'Reassign Responder', 'Cancel Assignment'],
        infoNote: /This incident is in a terminal state/i,
      },
    ];

    statuses.forEach(({ status, expectedButtons, forbiddenButtons, hasActiveAssignment, infoNote }) => {
      it(`Incident status "${status}" renders only valid actions`, async () => {
        const queryClient = createTestQueryClient();
        const incidentMock = {
          id: 10,
          title: `Test Incident ${status}`,
          description: 'Emergency description for test',
          status,
          severity: 'high',
          incident_type: 'fire',
          latitude: '12.9716',
          longitude: '77.5946',
          reporter: { full_name: 'Citizen Jane', email: 'jane@example.com', phone: '9876543210' },
          images: [],
          assignments: hasActiveAssignment
            ? [
                {
                  id: 101,
                  assignment_status: status === 'accepted' ? 'accepted' : 'assigned',
                  responder: { full_name: 'Medic 1', phone: '9000000001', responder_type: 'ambulance' },
                },
              ]
            : [],
        };

        adminApi.getAdminIncident.mockResolvedValue({ data: { incident: incidentMock } });
        incidentsApi.getIncidentHistory.mockResolvedValue({ data: { history: [] } });

        render(
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/admin/incidents/10']}>
              <Routes>
                <Route path="/admin/incidents/:id" element={<AdminIncidentDetailPage />} />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        );

        // Wait for page to load
        await screen.findByText(/Test Incident/i);

        // Assert expected action buttons are present
        for (const btnText of expectedButtons) {
          expect(screen.getByRole('button', { name: new RegExp(btnText, 'i') })).toBeInTheDocument();
        }

        // Assert forbidden action buttons are NOT present
        for (const btnText of forbiddenButtons) {
          expect(screen.queryByRole('button', { name: new RegExp(`^${btnText}$`, 'i') })).not.toBeInTheDocument();
        }

        // If info note expected
        if (infoNote) {
          expect(screen.getByText(infoNote)).toBeInTheDocument();
        }
      });
    });
  });

  // (2) Assign modal sends responder_id as a number and suggests the type from the incident type
  describe('(2) Assign modal sends responder_id as a number and suggests type', () => {
    it('suggests ambulance for road_accident, police for crime, fire for fire', () => {
      expect(SUGGESTED_RESPONDER_BY_INCIDENT_TYPE.road_accident).toBe(RESPONDER_TYPES.AMBULANCE);
      expect(SUGGESTED_RESPONDER_BY_INCIDENT_TYPE.medical_emergency).toBe(RESPONDER_TYPES.AMBULANCE);
      expect(SUGGESTED_RESPONDER_BY_INCIDENT_TYPE.crime).toBe(RESPONDER_TYPES.POLICE);
      expect(SUGGESTED_RESPONDER_BY_INCIDENT_TYPE.fire).toBe(RESPONDER_TYPES.FIRE);
      expect(SUGGESTED_RESPONDER_BY_INCIDENT_TYPE.gas_leak).toBe(RESPONDER_TYPES.FIRE);
      expect(SUGGESTED_RESPONDER_BY_INCIDENT_TYPE.other).toBeNull();
    });

    it('modal pre-selects suggested type and submits responder_id as a number', async () => {
      const queryClient = createTestQueryClient();
      const incident = {
        id: 77,
        title: 'Road accident on Main St',
        incident_type: 'road_accident', // should suggest 'ambulance'
        severity: 'high',
        latitude: '12.9716',
        longitude: '77.5946',
      };

      const availableResponders = [
        {
          id: 42,
          full_name: 'Ambulance 42',
          responder_type: 'ambulance',
          phone: '9000000042',
          last_known_latitude: '12.9720',
          last_known_longitude: '77.5950',
          last_location_at: '2026-10-22T12:00:00Z',
          is_active: true,
        },
      ];

      adminApi.getAvailableResponders.mockResolvedValue({
        data: { responders: availableResponders },
      });
      adminApi.assignResponder.mockResolvedValue({
        data: { assignment: { id: 201, incident_id: 77, responder_id: 42 } },
      });

      const handleDone = vi.fn();
      const handleClose = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AssignResponderModal
              incident={incident}
              mode="assign"
              isOpen={true}
              onClose={handleClose}
              onDone={handleDone}
            />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Wait for responder to appear
      await screen.findByText('Ambulance 42');

      // Click on the responder row
      const responderRow = screen.getByText('Ambulance 42').closest('div[class*="cursor-pointer"]');
      act(() => {
        fireEvent.click(responderRow);
      });

      // Confirm assignment
      const assignButton = screen.getByRole('button', { name: /^assign responder$/i });
      await act(async () => {
        fireEvent.click(assignButton);
      });

      // Check adminApi.assignResponder was called with id: 77 and responderId: 42 (numeric)
      expect(adminApi.assignResponder).toHaveBeenCalledTimes(1);
      expect(adminApi.assignResponder).toHaveBeenCalledWith(77, 42);
      expect(typeof adminApi.assignResponder.mock.calls[0][1]).toBe('number');
      expect(handleDone).toHaveBeenCalledTimes(1);
    });
  });

  // (3) Cancel-assignment uses the assignment id of the ACTIVE assignment
  it('(3) cancel-assignment uses the assignment id of the ACTIVE assignment', async () => {
    const queryClient = createTestQueryClient();
    const incidentMock = {
      id: 88,
      title: 'Incident with prior rejections',
      status: 'assigned',
      severity: 'medium',
      incident_type: 'fire',
      latitude: '12.97',
      longitude: '77.59',
      reporter: { full_name: 'John', email: 'john@example.com' },
      assignments: [
        {
          id: 501,
          assignment_status: 'rejected',
          notes: 'Unit unavailable',
          responder: { full_name: 'Engine 1' },
        },
        {
          id: 502,
          assignment_status: 'assigned', // ACTIVE assignment
          notes: null,
          responder: { full_name: 'Engine 2' },
        },
      ],
    };

    adminApi.getAdminIncident.mockResolvedValue({ data: { incident: incidentMock } });
    incidentsApi.getIncidentHistory.mockResolvedValue({ data: { history: [] } });
    adminApi.cancelAssignment.mockResolvedValue({ data: { success: true } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/incidents/88']}>
          <Routes>
            <Route path="/admin/incidents/:id" element={<AdminIncidentDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await screen.findByText(/Incident with prior rejections/i);

    // Click "Cancel Assignment"
    const cancelBtn = screen.getByRole('button', { name: /cancel assignment/i });
    act(() => {
      fireEvent.click(cancelBtn);
    });

    // Confirm dialog should open
    expect(screen.getByText(/Cancel active assignment\?/i)).toBeInTheDocument();

    // Confirm cancellation
    const confirmCancelBtn = screen.getByRole('button', { name: /confirm cancellation/i });
    await act(async () => {
      fireEvent.click(confirmCancelBtn);
    });

    // Must call cancelAssignment with assignment id 502 (NOT 501, NOT incident id 88)
    expect(adminApi.cancelAssignment).toHaveBeenCalledTimes(1);
    expect(adminApi.cancelAssignment).toHaveBeenCalledWith(502);
  });

  // (4) User edit sends only changed fields
  it('(4) user edit sends only changed fields', async () => {
    const queryClient = createTestQueryClient();
    const initialUser = {
      id: 55,
      full_name: 'Officer Alex',
      email: 'alex@police.gov',
      phone: '9876543210',
      role: 'responder',
      responder_type: 'police',
      is_active: true,
      last_known_latitude: null,
      last_known_longitude: null,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    adminApi.getUser.mockResolvedValue({ data: { user: initialUser } });
    adminApi.updateUser.mockResolvedValue({ data: { user: { ...initialUser, phone: '9876543999' } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/users/55']}>
          <Routes>
            <Route path="/admin/users/:id" element={<UserDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for form to populate
    await screen.findByDisplayValue('Officer Alex');
    expect(screen.getByDisplayValue('alex@police.gov')).toBeInTheDocument();
    expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument();

    // Edit only phone
    const phoneInput = screen.getByDisplayValue('9876543210');
    act(() => {
      fireEvent.change(phoneInput, { target: { value: '9876543999' } });
    });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // adminApi.updateUser must be called with ONLY changed fields: { phone: '9876543999' }
    expect(adminApi.updateUser).toHaveBeenCalledTimes(1);
    expect(adminApi.updateUser).toHaveBeenCalledWith(55, { phone: '9876543999' });
  });

  // (5) Analytics page converts string counts
  it('(5) analytics page converts string counts and displays summaries correctly', async () => {
    const queryClient = createTestQueryClient();
    const stringAnalyticsMock = {
      incidentsByType: [
        { incident_type: 'fire', count: '14' },
        { incident_type: 'road_accident', count: '9' },
      ],
      incidentsBySeverity: [
        { severity: 'low', count: '3' },
        { severity: 'medium', count: '7' },
        { severity: 'high', count: '10' },
        { severity: 'critical', count: '3' },
      ],
      incidentsByStatus: [
        { status: 'pending', count: '4' },
        { status: 'resolved', count: '12' },
      ],
      monthlyTrend: [
        { month: '2026-10', count: '23' },
        { month: '2026-09', count: '15' },
      ],
    };

    adminApi.getAnalytics.mockResolvedValue({
      data: { analytics: stringAnalyticsMock },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AnalyticsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for text summaries to render
    await screen.findByText(/Incidents by Emergency Type/i);

    // Verify type summary contains converted numbers
    expect(screen.getByText(/Fire Emergency: 14 · Road Accident: 9/i)).toBeInTheDocument();

    // Verify severity summary contains converted numbers
    expect(screen.getByText(/Low: 3 · Medium: 7 · High: 10 · Critical: 3/i)).toBeInTheDocument();

    // Verify status summary contains converted numbers
    expect(screen.getByText(/Pending Verification: 4 · Resolved: 12/i)).toBeInTheDocument();

    // Verify monthly trend contains converted numbers
    expect(screen.getByText(/Sep 26: 15 · Oct 26: 23/i)).toBeInTheDocument();
  });
});
