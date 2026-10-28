import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AssignmentActions from '../components/responder/AssignmentActions';
import { googleMapsDirectionsUrl } from '../lib/maps';
import { useLocationSharingLogic } from '../hooks/useLocationSharing';
import { useAcceptAssignment } from '../hooks/useResponder';
import { respondersApi } from '../api/responders';
import { qk } from '../lib/queryKeys';

// Mock API layer
vi.mock('../api/responders', () => ({
  respondersApi: {
    getResponderDashboard: vi.fn(),
    getAssignments: vi.fn(),
    getCompletedAssignments: vi.fn(),
    getAssignment: vi.fn(),
    acceptAssignment: vi.fn(),
    rejectAssignment: vi.fn(),
    startTravel: vi.fn(),
    markArrived: vi.fn(),
    resolveAssignment: vi.fn(),
    sendLocation: vi.fn(),
  },
}));

describe('Responder Experience (Prompt F3 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // (1) action table: render AssignmentActions for each of the 6 states and assert exactly which buttons appear
  describe('(1) Action table button states', () => {
    it('State 1: assigned / assigned -> renders Accept and Reject buttons only', () => {
      const assignment = {
        id: 1,
        assignment_status: 'assigned',
        incident: { id: 10, status: 'assigned' },
      };

      render(<AssignmentActions assignment={assignment} />);

      expect(screen.getByRole('button', { name: /^accept$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^reject$/i })).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: /start travel/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /i have arrived/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /mark as resolved/i })).not.toBeInTheDocument();
    });

    it('State 2: accepted / accepted -> renders Start travel only', () => {
      const assignment = {
        id: 2,
        assignment_status: 'accepted',
        incident: { id: 20, status: 'accepted' },
      };

      render(<AssignmentActions assignment={assignment} />);

      expect(screen.getByRole('button', { name: /^start travel$/i })).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: /^accept$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^reject$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /i have arrived/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /mark as resolved/i })).not.toBeInTheDocument();
    });

    it('State 3: accepted / on_the_way -> renders I have arrived only', () => {
      const assignment = {
        id: 3,
        assignment_status: 'accepted',
        incident: { id: 30, status: 'on_the_way' },
      };

      render(<AssignmentActions assignment={assignment} />);

      expect(screen.getByRole('button', { name: /^i have arrived$/i })).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: /^accept$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^reject$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^start travel$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /mark as resolved/i })).not.toBeInTheDocument();
    });

    it('State 4: accepted / reached -> renders Mark as resolved only', () => {
      const assignment = {
        id: 4,
        assignment_status: 'accepted',
        incident: { id: 40, status: 'reached' },
      };

      render(<AssignmentActions assignment={assignment} />);

      expect(screen.getByRole('button', { name: /^mark as resolved$/i })).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: /^accept$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^reject$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^start travel$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^i have arrived$/i })).not.toBeInTheDocument();
    });

    it('State 5: completed / resolved -> renders no action buttons and displays resolved status', () => {
      const assignment = {
        id: 5,
        assignment_status: 'completed',
        completed_at: '2026-10-22T10:00:00Z',
        incident: { id: 50, status: 'resolved' },
      };

      render(<AssignmentActions assignment={assignment} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByText(/Emergency Resolved/i)).toBeInTheDocument();
    });

    it('State 6: rejected / any -> renders no action buttons and displays inactive banner', () => {
      const assignment = {
        id: 6,
        assignment_status: 'rejected',
        incident: { id: 60, status: 'verified' },
      };

      render(<AssignmentActions assignment={assignment} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByText(/This assignment is no longer active/i)).toBeInTheDocument();
    });
  });

  // (2) Google Maps URL has the right destination when coordinates are strings
  it('(2) Google Maps URL has the right destination when coordinates are strings', () => {
    const latStr = '12.971598';
    const lngStr = '77.594562';
    const expected =
      'https://www.google.com/maps/dir/?api=1&destination=12.971598,77.594562&travelmode=driving';

    const url = googleMapsDirectionsUrl(latStr, lngStr);
    expect(url).toBe(expected);

    // Also verify numeric inputs
    expect(googleMapsDirectionsUrl(12.971598, 77.594562)).toBe(expected);

    // Verify invalid inputs return empty string
    expect(googleMapsDirectionsUrl(null, undefined)).toBe('');
    expect(googleMapsDirectionsUrl('invalid', 'coords')).toBe('');
  });

  // (3) useLocationSharing sends immediately and then every 30 s while an accepted assignment exists and stops when there is none
  it('(3) useLocationSharing sends immediately and then every 30 s while an accepted assignment exists and stops when there is none', async () => {
    vi.useFakeTimers();

    // Mock geolocation
    const mockCoords = { latitude: 12.9716, longitude: 77.5946, accuracy: 5 };
    const mockGetCurrentPosition = vi.fn().mockImplementation((success) => success({ coords: mockCoords }));
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    respondersApi.sendLocation.mockResolvedValue({ message: 'Location updated' });
    respondersApi.getAssignments.mockResolvedValue({ data: [] });

    const dashboardWithAccepted = {
      currentAssignments: [{ id: 101, assignment_status: 'accepted' }],
    };

    respondersApi.getResponderDashboard.mockResolvedValue({ data: dashboardWithAccepted });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });

    // Pre-populate queryClient so hasAcceptedAssignment is true on mount
    queryClient.setQueryData(qk.responder.dashboard, { data: dashboardWithAccepted });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { rerender } = renderHook(() => useLocationSharingLogic(), { wrapper });

    // Let microtasks and initial sendLocationNow resolve
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Should send immediately
    expect(respondersApi.sendLocation).toHaveBeenCalledTimes(1);
    expect(respondersApi.sendLocation).toHaveBeenCalledWith(12.9716, 77.5946);

    // Advance 30s
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(respondersApi.sendLocation).toHaveBeenCalledTimes(2);

    // Advance another 30s
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(respondersApi.sendLocation).toHaveBeenCalledTimes(3);

    // Now update dashboard to have no accepted assignments
    const emptyDashboard = { currentAssignments: [] };
    respondersApi.getResponderDashboard.mockResolvedValue({ data: emptyDashboard });
    queryClient.setQueryData(qk.responder.dashboard, { data: emptyDashboard });

    rerender();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Advance 30s again - should NOT send again
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(respondersApi.sendLocation).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  // (4) a failed INCIDENT_002 mutation triggers a refetch
  it('(4) a failed INCIDENT_002 mutation triggers a refetch', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const error = new Error('Invalid status transition');
    error.response = {
      status: 400,
      data: {
        errorCode: 'INCIDENT_002',
        message: 'Invalid incident status transition',
      },
    };

    respondersApi.acceptAssignment.mockRejectedValueOnce(error);

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAcceptAssignment(), { wrapper });

    try {
      await act(async () => {
        await result.current.mutateAsync(42);
      });
    } catch {
      // Mutation is expected to reject
    }

    // Verify invalidateQueries was called for the assignment
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: qk.responder.assignment(42),
    });
  });

  // (5) the Reject modal sends no notes when empty
  it('(5) the Reject modal sends no notes when empty', async () => {
    const handleReject = vi.fn().mockResolvedValue(true);

    const assignment = {
      id: 88,
      assignment_status: 'assigned',
      incident: { id: 880, status: 'assigned' },
    };

    render(
      <AssignmentActions
        assignment={assignment}
        onReject={handleReject}
      />
    );

    // Click Reject button
    const rejectBtn = screen.getByRole('button', { name: /^reject$/i });
    act(() => {
      fireEvent.click(rejectBtn);
    });

    // Reject Modal opens
    expect(screen.getByText('Reject dispatch assignment')).toBeInTheDocument();

    // Confirm without typing any notes
    const confirmBtn = screen.getByRole('button', { name: /confirm rejection/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Expect handleReject to be called with undefined (which results in no notes in API body)
    expect(handleReject).toHaveBeenCalledTimes(1);
    expect(handleReject).toHaveBeenCalledWith(undefined);
  });
});
