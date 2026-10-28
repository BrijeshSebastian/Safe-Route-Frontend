import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import { qk } from '../lib/queryKeys';
import { usePageVisible } from './usePageVisible';
import { TERMINAL_STATUSES } from '../lib/constants';

// Helper to invalidate all incident-related admin queries
const invalidateAdminIncidentQueries = (queryClient, incidentId) => {
  if (incidentId) {
    queryClient.invalidateQueries({ queryKey: qk.admin.incident(incidentId) });
    queryClient.invalidateQueries({ queryKey: qk.incidents.history(incidentId) });
    queryClient.invalidateQueries({ queryKey: qk.incidents.responderLocation(incidentId) });
  }
  queryClient.invalidateQueries({ queryKey: qk.admin.all });
  queryClient.invalidateQueries({ queryKey: qk.notifications.unreadCount });
};

// 1. Dashboard
export const useAdminDashboard = () => {
  const isVisible = usePageVisible();

  return useQuery({
    queryKey: qk.admin.dashboard,
    queryFn: () => adminApi.getAdminDashboard(),
    refetchInterval: isVisible ? 30000 : false,
    refetchIntervalInBackground: false,
    staleTime: 15000,
  });
};

// 2. Incidents List
export const useAdminIncidents = (params = {}, options = {}) => {
  return useQuery({
    queryKey: qk.admin.incidents(params),
    queryFn: () => adminApi.getAdminIncidents(params),
    staleTime: 15000,
    ...options,
  });
};

// 3. Incident Details
export const useAdminIncident = (id, options = {}) => {
  const isVisible = usePageVisible();

  return useQuery({
    queryKey: qk.admin.incident(id),
    queryFn: () => adminApi.getAdminIncident(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const incident = query.state.data?.data?.incident || query.state.data?.incident;
      if (!incident) return false;
      const isTerminal = TERMINAL_STATUSES.includes(incident.status);
      return !isTerminal && isVisible ? 30000 : false;
    },
    refetchIntervalInBackground: false,
    staleTime: 15000,
    ...options,
  });
};

// 4. Verify Incident Mutation
export const useVerifyIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => adminApi.verifyIncident(id),
    onSuccess: (data, id) => {
      invalidateAdminIncidentQueries(queryClient, id);
      toast.success('Incident verified as a real emergency.');
    },
    onError: (err, id) => {
      const message = err.response?.data?.message || err.message || 'Failed to verify incident';
      toast.error(message);
      if (err.response?.data?.errorCode === 'INCIDENT_002') {
        invalidateAdminIncidentQueries(queryClient, id);
      }
    },
  });
};

// 5. Reject Incident Mutation
export const useRejectIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => adminApi.rejectIncident(id, reason),
    onSuccess: (data, { id }) => {
      invalidateAdminIncidentQueries(queryClient, id);
      toast.success('Incident has been rejected.');
    },
    onError: (err, { id }) => {
      const message = err.response?.data?.message || err.message || 'Failed to reject incident';
      toast.error(message);
      if (err.response?.data?.errorCode === 'INCIDENT_002') {
        invalidateAdminIncidentQueries(queryClient, id);
      }
    },
  });
};

// 6. Assign Responder Mutation
export const useAssignResponder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, responderId }) => adminApi.assignResponder(id, responderId),
    onSuccess: (data, { id }) => {
      invalidateAdminIncidentQueries(queryClient, id);
      queryClient.invalidateQueries({ queryKey: qk.admin.all });
      toast.success('Responder assigned. They have been notified.');
    },
    onError: (err, { id }) => {
      const message = err.response?.data?.message || err.message || 'Failed to assign responder';
      toast.error(message);
      if (err.response?.data?.errorCode === 'INCIDENT_002') {
        invalidateAdminIncidentQueries(queryClient, id);
      }
    },
  });
};

// 7. Reassign Responder Mutation
export const useReassignResponder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, responderId }) => adminApi.reassignResponder(id, responderId),
    onSuccess: (data, { id }) => {
      invalidateAdminIncidentQueries(queryClient, id);
      queryClient.invalidateQueries({ queryKey: qk.admin.all });
      toast.success('Responder reassigned. They have been notified.');
    },
    onError: (err, { id }) => {
      const message = err.response?.data?.message || err.message || 'Failed to reassign responder';
      toast.error(message);
      if (err.response?.data?.errorCode === 'INCIDENT_002') {
        invalidateAdminIncidentQueries(queryClient, id);
      }
    },
  });
};

// 8. Cancel Assignment Mutation
export const useCancelAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId }) => adminApi.cancelAssignment(assignmentId),
    onSuccess: (data, { incidentId }) => {
      invalidateAdminIncidentQueries(queryClient, incidentId);
      queryClient.invalidateQueries({ queryKey: qk.admin.all });
      toast.success('Assignment cancelled. Incident returned to verified.');
    },
    onError: (err, { incidentId }) => {
      const message = err.response?.data?.message || err.message || 'Failed to cancel assignment';
      toast.error(message);
      if (incidentId) {
        invalidateAdminIncidentQueries(queryClient, incidentId);
      }
    },
  });
};

// 9. Available Responders
export const useAvailableResponders = (type) => {
  return useQuery({
    queryKey: qk.admin.availableResponders(type),
    queryFn: () => adminApi.getAvailableResponders(type),
    staleTime: 10000,
  });
};

// 10. Users List
export const useAdminUsers = (params = {}) => {
  return useQuery({
    queryKey: qk.admin.users(params),
    queryFn: () => adminApi.getUsers(params),
    staleTime: 15000,
  });
};

// 11. User Details
export const useAdminUser = (id) => {
  return useQuery({
    queryKey: qk.admin.user(id),
    queryFn: () => adminApi.getUser(id),
    enabled: Boolean(id),
    staleTime: 15000,
  });
};

// 12. Create Responder Mutation
export const useCreateResponder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => adminApi.createResponder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.users() });
      queryClient.invalidateQueries({ queryKey: qk.admin.all });
      toast.success('Responder created successfully.');
    },
  });
};

// 13. Update User Mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => adminApi.updateUser(id, data),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: qk.admin.user(id) });
      queryClient.invalidateQueries({ queryKey: qk.admin.users() });
      toast.success('User updated successfully.');
    },
  });
};

// 14. Disable User Mutation
export const useDisableUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => adminApi.disableUser(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: qk.admin.user(id) });
      queryClient.invalidateQueries({ queryKey: qk.admin.users() });
      toast.success('User disabled successfully.');
    },
    onError: (err) => {
      const message = err.response?.data?.message || err.message || 'Failed to disable user';
      toast.error(message);
    },
  });
};

// 15. Analytics
export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: qk.admin.analytics,
    queryFn: () => adminApi.getAnalytics(),
    staleTime: 60000,
  });
};

// 16. Monthly Report
export const useAdminMonthlyReport = (year, month) => {
  return useQuery({
    queryKey: qk.admin.report(year, month),
    queryFn: () => adminApi.getMonthlyReport({ year, month }),
    staleTime: 60000,
  });
};

// 17. Nearby Incidents
export const useNearbyIncidents = (params = {}, options = {}) => {
  const hasCoords = params?.latitude !== undefined && params?.longitude !== undefined;

  return useQuery({
    queryKey: qk.admin.nearby(params),
    queryFn: () => adminApi.getNearbyIncidents(params),
    enabled: hasCoords,
    staleTime: 30000,
    ...options,
  });
};
