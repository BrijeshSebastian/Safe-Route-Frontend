import { create } from 'zustand';
import { REFRESH_TOKEN_KEY } from '../lib/constants';

let queryClientInstance = null;
let bootstrapPromise = null;

export const registerQueryClient = (client) => {
  queryClientInstance = client;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  status: 'booting', // 'booting' | 'authenticated' | 'anonymous'

  setSession: ({ user, accessToken, refreshToken }) => {
    if (refreshToken) {
      try {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } catch (err) {
        console.error('Failed to write refresh token to storage:', err);
      }
    }
    set({
      user: user || null,
      accessToken: accessToken || null,
      status: accessToken ? 'authenticated' : 'anonymous',
    });
  },

  setAccessToken: (accessToken) => {
    set((state) => ({
      accessToken,
      status: accessToken && state.user ? 'authenticated' : state.status,
    }));
  },

  setUser: (user) => {
    set({ user });
  },

  clearSession: () => {
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (err) {
      console.error('Failed to remove refresh token from storage:', err);
    }
    set({
      user: null,
      accessToken: null,
      status: 'anonymous',
    });
    if (queryClientInstance) {
      queryClientInstance.clear();
    }
  },

  bootstrap: async (refreshFn, fetchProfileFn) => {
    if (bootstrapPromise) return bootstrapPromise;

    bootstrapPromise = (async () => {
      let refreshToken = null;
      try {
        refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      } catch (err) {
        console.error('Failed to read refresh token:', err);
      }

      if (!refreshToken) {
        set({ status: 'anonymous', user: null, accessToken: null });
        return;
      }

      try {
        if (typeof refreshFn === 'function') {
          await refreshFn();
        }
        if (typeof fetchProfileFn === 'function') {
          const profile = await fetchProfileFn();
          const loadedUser = profile?.data?.user || profile?.user || profile?.data || null;
          set({
            user: loadedUser,
            status: loadedUser ? 'authenticated' : 'anonymous',
          });
        }
      } catch (err) {
        console.error('Auth bootstrap failed:', err);
        get().clearSession();
      }
    })();

    return bootstrapPromise;
  },
}));
