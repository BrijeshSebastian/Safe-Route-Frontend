import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { respondersApi } from '../api/responders';
import { qk } from '../lib/queryKeys';
import { usePageVisible } from './usePageVisible';
import { getErrorMessage } from '../lib/errors';
import { triggerLocationSend } from './useLocationSharing';

const NON_TERMINAL_ASSIGNMENT_STATUSES = ['assigned', 'accepted'];

export const useResponderDashboard = () => {
  const isVisible = usePageVisible();

  return useQuery({
    queryKey: qk.responder.dashboard,
    queryFn: async () => {
      const res = await respondersApi.getResponderDashboard();
      return res?.data?.dashboard || res?.data || res;
    },
    refetchInterval: isVisible ? 30000 : false,
    refetchIntervalInBackground: false,
    staleTime: 15000,
  });
};

export const useAssignments = (params = {}) => {
  const isVisible = usePageVisible();

  return useQuery({
    queryKey: qk.responder.assignments(params),
    queryFn: () => respondersApi.getAssignments(params),
    refetchInterval: isVisible ? 30000 : false,
    refetchIntervalInBackground: false,
    staleTime: 15000,
  });
};

export const useAssignment = (id, options = {}) => {
  const isVisible = usePageVisible();

  return useQuery({
    queryKey: qk.responder.assignment(id),
    queryFn: async () => {
      const res = await respondersApi.getAssignment(id);
      return res?.data?.assignment || res?.data || res;
    },
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const assignment = query.state.data;
      if (!assignment) return isVisible ? 30000 : false;
      const isTerminal = !NON_TERMINAL_ASSIGNMENT_STATUSES.includes(assignment.assignment_status);
      return !isTerminal && isVisible ? 30000 : false;
    },
    refetchIntervalInBackground: false,
    ...options,
  });
};

export const useCompletedAssignments = (params = {}) => {
  return useQuery({
    queryKey: qk.responder.completed(params),
    queryFn: () => respondersApi.getCompletedAssignments(params),
    staleTime: 30000,
  });
};

const handleMutationError = (err, id, queryClient) => {
  const errorCode = err.response?.data?.errorCode;
  const status = err.response?.status;

  if (errorCode === 'INCIDENT_002' || status === 404 || status === 403) {
    if (id) {
      queryClient.invalidateQueries({ queryKey: qk.responder.assignment(id) });
    }
    toast.error('This assignment changed. Showing the latest status.');
  } else {
    toast.error(getErrorMessage(err));
  }
};

const handleMutationSuccess = (queryClient, id, message) => {
  if (id) {
    queryClient.invalidateQueries({ queryKey: qk.responder.assignment(id) });
  }
  queryClient.invalidateQueries({ queryKey: ['responder', 'assignments'] });
  queryClient.invalidateQueries({ queryKey: qk.responder.dashboard });
  queryClient.invalidateQueries({ queryKey: qk.notifications.unreadCount });

  if (message) {
    toast.success(message);
  }

  // Trigger immediate location ping so reporters/admins see fresh position
  triggerLocationSend();
};

export const useAcceptAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => respondersApi.acceptAssignment(id),
    onSuccess: (_, id) => {
      handleMutationSuccess(queryClient, id, 'Assignment accepted.');
    },
    onError: (err, id) => {
      handleMutationError(err, id, queryClient);
    },
  });
};

export const useRejectAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }) => respondersApi.rejectAssignment(id, notes),
    onSuccess: (_, { id }) => {
      handleMutationSuccess(queryClient, id, 'Assignment rejected. The admin has been notified.');
    },
    onError: (err, { id }) => {
      handleMutationError(err, id, queryClient);
    },
  });
};

export const useStartTravel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => respondersApi.startTravel(id),
    onSuccess: (_, id) => {
      handleMutationSuccess(queryClient, id, 'En route to the emergency location.');
    },
    onError: (err, id) => {
      handleMutationError(err, id, queryClient);
    },
  });
};

export const useArrived = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => respondersApi.markArrived(id),
    onSuccess: (_, id) => {
      handleMutationSuccess(queryClient, id, 'Arrived at the scene.');
    },
    onError: (err, id) => {
      handleMutationError(err, id, queryClient);
    },
  });
};

export const useResolveAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }) => respondersApi.resolveAssignment(id, notes),
    onSuccess: (_, { id }) => {
      handleMutationSuccess(queryClient, id, 'Emergency marked as resolved. Thank you!');
    },
    onError: (err, { id }) => {
      handleMutationError(err, id, queryClient);
    },
  });
};
