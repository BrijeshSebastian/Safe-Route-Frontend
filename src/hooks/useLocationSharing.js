import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { respondersApi } from '../api/responders';
import { useGeolocation } from './useGeolocation';
import { usePageVisible } from './usePageVisible';
import { qk } from '../lib/queryKeys';

const SEND_INTERVAL_MS = 30000;
const RATE_LIMIT_BACKOFF_MS = 60000;

// Custom event for immediate trigger from mutations
const SEND_LOCATION_EVENT = 'saferoute:send-location';

export const triggerLocationSend = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SEND_LOCATION_EVENT));
  }
};

const LocationSharingContext = createContext(null);

export const useLocationSharingLogic = () => {
  const isPageVisible = usePageVisible();
  const { getCurrentPosition, permission } = useGeolocation();

  const [lastSentAt, setLastSentAt] = useState(null);
  const [lastPosition, setLastPosition] = useState(null);
  const [error, setError] = useState(null);

  const isSendingRef = useRef(false);
  const rateLimitUntilRef = useRef(0);
  const intervalRef = useRef(null);

  // 1. Check for active accepted assignments from dashboard
  const { data: dashboard } = useQuery({
    queryKey: qk.responder.dashboard,
    queryFn: () => respondersApi.getResponderDashboard(),
    refetchInterval: isPageVisible ? 30000 : false,
    staleTime: 15000,
  });

  const dashboardData = dashboard?.data?.dashboard || dashboard?.data || dashboard;
  const currentAssignments = dashboardData?.currentAssignments;

  // Fallback query if currentAssignments is not present in dashboard
  const { data: fallbackAssignments } = useQuery({
    queryKey: qk.responder.assignments({ status: 'accepted', size: 1 }),
    queryFn: async () => {
      const res = await respondersApi.getAssignments({ status: 'accepted', size: 1 });
      return res || { data: [] };
    },
    enabled: Boolean(dashboard) && currentAssignments === undefined,
    refetchInterval: isPageVisible ? 30000 : false,
    staleTime: 15000,
  });

  const hasAcceptedAssignment = Boolean(
    (Array.isArray(currentAssignments) &&
      currentAssignments.some((a) => a.assignment_status === 'accepted')) ||
    (Array.isArray(fallbackAssignments?.data) && fallbackAssignments.data.length > 0)
  );

  // 2. Core function to send current location once
  const sendLocationNow = useCallback(async () => {
    if (!hasAcceptedAssignment) {
      return;
    }

    if (permission === 'denied') {
      setError('Location permission denied.');
      return;
    }

    // Check rate limit backoff
    if (Date.now() < rateLimitUntilRef.current) {
      return;
    }

    // Avoid overlapping requests
    if (isSendingRef.current) {
      return;
    }

    isSendingRef.current = true;

    try {
      const pos = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      });

      const lat = Number(Number(pos.latitude).toFixed(6));
      const lng = Number(Number(pos.longitude).toFixed(6));

      await respondersApi.sendLocation(lat, lng);

      const now = new Date();
      setLastPosition({ latitude: lat, longitude: lng });
      setLastSentAt(now);
      setError(null);
    } catch (err) {
      if (err.response?.status === 429) {
        // Back off for 60 seconds
        rateLimitUntilRef.current = Date.now() + RATE_LIMIT_BACKOFF_MS;
      }
      // Permission denial or read error
      if (err.code === 1) {
        setError('Location permission denied.');
      } else {
        setError(err.message || 'Failed to send location');
      }
    } finally {
      isSendingRef.current = false;
    }
  }, [hasAcceptedAssignment, permission, getCurrentPosition]);

  // 3. Manage timer interval and visibility
  useEffect(() => {
    if (!hasAcceptedAssignment) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // When it becomes active or page becomes visible, send immediately
    if (isPageVisible && permission !== 'denied') {
      sendLocationNow();
    }

    // Set up repeating interval (30s)
    intervalRef.current = setInterval(() => {
      if (isPageVisible && permission !== 'denied') {
        sendLocationNow();
      }
    }, SEND_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasAcceptedAssignment, isPageVisible, permission, sendLocationNow]);

  // 4. Listen for manual send triggers from mutations
  useEffect(() => {
    const handleTrigger = () => {
      if (hasAcceptedAssignment && permission !== 'denied') {
        sendLocationNow();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(SEND_LOCATION_EVENT, handleTrigger);
      return () => window.removeEventListener(SEND_LOCATION_EVENT, handleTrigger);
    }
  }, [hasAcceptedAssignment, permission, sendLocationNow]);

  return {
    hasAcceptedAssignment,
    active: hasAcceptedAssignment,
    permission,
    lastSentAt,
    lastPosition,
    error,
    sendNow: sendLocationNow,
  };
};

export const LocationSharingProvider = ({ children }) => {
  const value = useLocationSharingLogic();
  return React.createElement(LocationSharingContext.Provider, { value }, children);
};

export const useLocationSharing = () => {
  const context = useContext(LocationSharingContext);
  if (!context) {
    return {
      hasAcceptedAssignment: false,
      active: false,
      permission: 'prompt',
      lastSentAt: null,
      lastPosition: null,
      error: null,
      sendNow: async () => {},
    };
  }
  return context;
};

export default useLocationSharing;
