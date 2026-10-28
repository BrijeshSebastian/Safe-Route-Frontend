import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsApi } from '../api/incidents';
import { qk } from '../lib/queryKeys';
import { usePageVisible } from './usePageVisible';
import { TERMINAL_STATUSES } from '../lib/constants';

export const useMyIncidents = (params = {}) => {
  const isVisible = usePageVisible();

  return useQuery({
    queryKey: qk.incidents.my(params),
    queryFn: () => incidentsApi.getMyIncidents(params),
    refetchInterval: isVisible ? 45000 : false,
    refetchIntervalInBackground: false,
    staleTime: 30000,
  });
};

export const useIncident = (id, options = {}) => {
  const isVisible = usePageVisible();

  return useQuery({
    queryKey: qk.incidents.detail(id),
    queryFn: () => incidentsApi.getIncident(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const incident = query.state.data?.data?.incident || query.state.data?.incident;
      if (!incident) return false;
      const isTerminal = TERMINAL_STATUSES.includes(incident.status);
      return !isTerminal && isVisible ? 20000 : false;
    },
    refetchIntervalInBackground: false,
    ...options,
  });
};

export const useIncidentHistory = (id, options = {}) => {
  return useQuery({
    queryKey: qk.incidents.history(id),
    queryFn: () => incidentsApi.getIncidentHistory(id),
    enabled: Boolean(id),
    staleTime: 60000,
    ...options,
  });
};

export const useResponderLocation = (id, enabled = false) => {
  const isVisible = usePageVisible();

  return useQuery({
    queryKey: qk.incidents.responderLocation(id),
    queryFn: async () => {
      try {
        const res = await incidentsApi.getResponderLocation(id);
        return res?.data?.location || null;
      } catch (err) {
        if (err.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: Boolean(id) && enabled && isVisible,
    refetchInterval: enabled && isVisible ? 15000 : false,
    refetchIntervalInBackground: false,
    retry: false,
  });
};

export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => incidentsApi.createIncident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'my'] });
    },
  });
};

export const useUploadImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, files }) => incidentsApi.uploadIncidentImages(id, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.incidents.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['incidents', 'my'] });
    },
  });
};

export const useUpdateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => incidentsApi.updateIncident(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.incidents.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['incidents', 'my'] });
    },
  });
};

export const useCancelIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => incidentsApi.cancelIncident(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: qk.incidents.detail(id) });
      queryClient.invalidateQueries({ queryKey: qk.incidents.history(id) });
      queryClient.invalidateQueries({ queryKey: ['incidents', 'my'] });
    },
  });
};

export const useDeleteIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => incidentsApi.deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'my'] });
    },
  });
};
