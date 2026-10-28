import { useState, useEffect, useCallback, useMemo } from 'react';
import { FALLBACK_CENTER } from '../lib/geo';

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 15000,
};

export const useGeolocation = (defaultOptions = DEFAULT_OPTIONS) => {
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState('prompt'); // 'granted' | 'prompt' | 'denied' | 'unsupported'

  const mergedOptions = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...defaultOptions }),
    [defaultOptions]
  );

  // Monitor permission status via Permissions API
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setPermission('unsupported');
      return;
    }

    if (!navigator.permissions || !navigator.permissions.query) {
      return;
    }

    let permissionStatus = null;
    let isMounted = true;

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (!isMounted) return;
        permissionStatus = status;
        setPermission(status.state);

        const handlePermissionChange = () => {
          if (isMounted) {
            setPermission(status.state);
          }
        };

        status.addEventListener('change', handlePermissionChange);
      })
      .catch(() => {
        // Permissions API error, ignore
      });

    return () => {
      isMounted = false;
      if (permissionStatus) {
        permissionStatus.removeEventListener?.('change', () => {});
      }
    };
  }, []);

  const getCurrentPosition = useCallback(
    (customOptions = {}) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        const err = new Error('Geolocation is not supported by your browser.');
        setError(err.message);
        setPermission('unsupported');
        return Promise.reject(err);
      }

      setIsLoading(true);
      setError(null);

      const opts = { ...mergedOptions, ...customOptions };

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };
            setCoordinates(coords);
            setPermission('granted');
            setIsLoading(false);
            resolve(coords);
          },
          (err) => {
            let msg = 'Failed to get location.';
            if (err.code === 1) {
              msg = 'Location permission denied.';
              setPermission('denied');
            } else if (err.code === 2) {
              msg = 'Location unavailable.';
            } else if (err.code === 3) {
              msg = 'Location request timed out.';
            }
            setError(msg);
            setIsLoading(false);
            reject(err);
          },
          opts
        );
      });
    },
    [mergedOptions]
  );

  return {
    coordinates: coordinates || FALLBACK_CENTER,
    hasLocation: Boolean(coordinates),
    error,
    isLoading,
    permission,
    getCurrentPosition,
    getCurrentLocation: getCurrentPosition, // Alias for backward compatibility
  };
};

export default useGeolocation;
