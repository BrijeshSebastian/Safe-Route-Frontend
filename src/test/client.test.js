import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { REFRESH_TOKEN_KEY } from '../lib/constants';

describe('apiClient single-flight token refresh', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    useAuthStore.getState().clearSession();
  });

  it('runs exactly ONE refresh call and retries all concurrent 401 requests', async () => {
    // Setup initial store state with valid token and refresh token in localStorage
    localStorage.setItem(REFRESH_TOKEN_KEY, 'initial-refresh-token');
    useAuthStore.getState().setSession({
      user: { id: 1, full_name: 'Test User' },
      accessToken: 'initial-expired-token',
      refreshToken: 'initial-refresh-token',
    });

    let refreshCallCount = 0;
    vi.spyOn(axios, 'post').mockImplementation(async (url, _data) => {
      if (url.includes('/auth/refresh-token')) {
        refreshCallCount++;
        // Small delay to simulate in-flight concurrent requests
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          status: 200,
          data: {
            success: true,
            data: {
              accessToken: 'new-fresh-token',
              refreshToken: 'new-refresh-token',
            },
          },
        };
      }
      return { status: 200, data: {} };
    });

    let adapterCalls = 0;
    apiClient.defaults.adapter = async (config) => {
      adapterCalls++;
      // If the request carries the old or no token, return 401
      if (config.headers?.Authorization !== 'Bearer new-fresh-token') {
        const error = new Error('Request failed with status code 401');
        error.config = config;
        error.response = {
          status: 401,
          data: { success: false, message: 'Unauthorized' },
          headers: {},
          config,
        };
        throw error;
      }

      // If carrying the refreshed token, succeed
      return {
        data: { success: true, url: config.url },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    // Dispatch 3 concurrent requests
    const [res1, res2, res3] = await Promise.all([
      apiClient.get('/incidents/1'),
      apiClient.get('/incidents/2'),
      apiClient.get('/incidents/3'),
    ]);

    // Verify exactly ONE refresh call was made across all 3 concurrent requests
    expect(refreshCallCount).toBe(1);
    expect(adapterCalls).toBeGreaterThanOrEqual(3);

    // Verify all 3 succeeded with retried responses
    expect(res1.data.success).toBe(true);
    expect(res2.data.success).toBe(true);
    expect(res3.data.success).toBe(true);

    // Verify access token updated in store and new refresh token stored
    expect(useAuthStore.getState().accessToken).toBe('new-fresh-token');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('new-refresh-token');
  });

  it('clears session when refresh call fails', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'bad-refresh-token');
    useAuthStore.getState().setSession({
      user: { id: 1, full_name: 'Test User' },
      accessToken: 'expired-token',
      refreshToken: 'bad-refresh-token',
    });

    vi.spyOn(axios, 'post').mockImplementation(async (url) => {
      if (url.includes('/auth/refresh-token')) {
        const error = new Error('Refresh token invalid');
        error.response = { status: 401, data: { message: 'Invalid refresh token' } };
        throw error;
      }
      return { status: 200 };
    });

    apiClient.defaults.adapter = async (config) => {
      const error = new Error('Unauthorized');
      error.config = config;
      error.response = { status: 401, data: { message: 'Unauthorized' }, headers: {}, config };
      throw error;
    };

    await expect(apiClient.get('/incidents/1')).rejects.toThrow();

    // Verify session was cleared
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });
});
