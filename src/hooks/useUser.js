import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { authApi } from '../api/auth';
import { refreshSession } from '../api/client';
import { qk } from '../lib/queryKeys';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const useProfile = () => {
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  return useQuery({
    queryKey: qk.users.profile,
    queryFn: async () => {
      const res = await usersApi.getProfile();
      return res?.data?.user || res?.user || res?.data;
    },
    enabled: isAuthenticated,
    staleTime: 60000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (data) => {
      const res = await usersApi.updateProfile(data);
      const updatedUser = res?.data?.user || res?.user || res?.data;

      // Backend advances user.updated_at, which invalidates current access token.
      // Perform single-flight refresh to obtain fresh access token immediately.
      try {
        await refreshSession();
      } catch (err) {
        console.warn('Silent token refresh after profile update failed:', err);
      }

      if (updatedUser) {
        setUser(updatedUser);
      }

      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      toast.success('Profile updated successfully');
      queryClient.setQueryData(qk.users.profile, updatedUser);
      queryClient.invalidateQueries({ queryKey: qk.users.profile });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (file) => {
      const res = await usersApi.uploadAvatar(file);
      const profileImageUrl = res?.data?.profile_image_url || res?.profile_image_url;

      try {
        await refreshSession();
      } catch (err) {
        console.warn('Silent token refresh after avatar update failed:', err);
      }

      if (currentUser && profileImageUrl) {
        const next = { ...currentUser, profile_image_url: profileImageUrl };
        setUser(next);
      }

      return res;
    },
    onSuccess: () => {
      toast.success('Profile photo updated');
      queryClient.invalidateQueries({ queryKey: qk.users.profile });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    },
  });
};

export const useRemoveAvatar = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      const res = await usersApi.removeAvatar();

      try {
        await refreshSession();
      } catch (err) {
        console.warn('Silent token refresh after avatar removal failed:', err);
      }

      if (currentUser) {
        const next = { ...currentUser, profile_image_url: null };
        setUser(next);
      }

      return res;
    },
    onSuccess: () => {
      toast.success('Profile photo removed');
      queryClient.invalidateQueries({ queryKey: qk.users.profile });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to remove photo');
    },
  });
};

export const useChangePassword = () => {
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      return authApi.changePassword({ currentPassword, newPassword });
    },
    onSuccess: () => {
      toast.success('Password changed. Please log in with your new password.');
      clearSession();
      if (typeof window !== 'undefined' && window.location) {
        window.location.assign('/login');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to change password');
    },
  });
};

export const useLogoutAll = () => {
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async () => {
      return usersApi.logoutAll();
    },
    onSuccess: () => {
      toast.success('Logged out from all sessions');
      clearSession();
      if (typeof window !== 'undefined' && window.location) {
        window.location.assign('/login');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to logout from all devices');
    },
  });
};

export const useDeleteAccount = () => {
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async () => {
      return usersApi.deleteAccount();
    },
    onSuccess: () => {
      toast.success('Your account has been deactivated');
      clearSession();
      if (typeof window !== 'undefined' && window.location) {
        window.location.assign('/login');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate account');
    },
  });
};
