import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { REFRESH_TOKEN_KEY } from '../lib/constants';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 20000,
});

let sessionHandlers = {
  onSessionExpired: null,
  onRateLimited: null,
};

export const setSessionHandlers = (handlers) => {
  sessionHandlers = { ...sessionHandlers, ...handlers };
};

let refreshPromise = null;

export const refreshSession = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    let refreshToken = null;
    try {
      refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (err) {
      console.error('Failed to read refresh token:', err);
    }

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${baseURL}/auth/refresh-token`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data?.data || {};

      if (!accessToken) {
        throw new Error('Refresh response missing access token');
      }

      useAuthStore.getState().setAccessToken(accessToken);

      if (newRefreshToken) {
        try {
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        } catch (err) {
          console.error('Failed to save refreshed token:', err);
        }
      }

      return accessToken;
    } catch (error) {
      useAuthStore.getState().clearSession();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      if (typeof sessionHandlers.onRateLimited === 'function') {
        sessionHandlers.onRateLimited(error);
      }
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshSession();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        useAuthStore.getState().clearSession();

        if (typeof sessionHandlers.onSessionExpired === 'function') {
          sessionHandlers.onSessionExpired();
        } else if (typeof window !== 'undefined' && window.location) {
          window.location.assign('/login');
        }

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
