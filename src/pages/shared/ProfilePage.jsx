import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Upload,
  Trash2,
  KeyRound,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';

import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useRemoveAvatar,
  useChangePassword,
  useLogoutAll,
  useDeleteAccount,
} from '../../hooks/useUser';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { sanitizePhone, ROLE_BADGE_META, RESPONDER_TYPE_META } from '../../lib/constants';

const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z.string().trim().email('Invalid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\s-]*$/, 'Invalid phone number characters')
    .optional()
    .or(z.literal('')),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(12, 'New password must be at least 12 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const ProfilePage = () => {
  useDocumentTitle('Profile Settings');

  const { data: user, isLoading, isError, error, refetch } = useProfile();

  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const removeAvatarMutation = useRemoveAvatar();
  const changePasswordMutation = useChangePassword();
  const logoutAllMutation = useLogoutAll();
  const deleteAccountMutation = useDeleteAccount();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLogoutAllDialogOpen, setIsLogoutAllDialogOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user) {
      resetProfile({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, resetProfile]);

  const onProfileSave = async (formData) => {
    const payload = {};
    if (formData.full_name !== user?.full_name) payload.full_name = formData.full_name;
    if (formData.email !== user?.email) payload.email = formData.email;
    const sanitizedInputPhone = sanitizePhone(formData.phone);
    const sanitizedUserPhone = sanitizePhone(user?.phone);
    if (sanitizedInputPhone !== sanitizedUserPhone) {
      payload.phone = sanitizedInputPhone;
    }

    if (Object.keys(payload).length === 0) {
      toast('No changes detected', { icon: 'ℹ️' });
      return;
    }

    await updateProfileMutation.mutateAsync(payload);
  };

  const onPasswordSave = async (formData) => {
    await changePasswordMutation.mutateAsync({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
    resetPassword();
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are supported');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar file size must be less than 2 MB');
      return;
    }

    await uploadAvatarMutation.mutateAsync(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Profile Settings"
          subtitle="Manage your personal details, avatar, and security credentials"
        />
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Profile Settings"
          subtitle="Manage your personal details, avatar, and security credentials"
        />
        <Card className="p-8">
          <ErrorState
            title="Failed to load profile"
            message={error?.response?.data?.message || error?.message || 'Could not retrieve profile information.'}
            onRetry={refetch}
          />
        </Card>
      </div>
    );
  }

  const roleMeta = ROLE_BADGE_META[user?.role] || { label: user?.role, tone: 'default' };
  const responderMeta = user?.responder_type ? RESPONDER_TYPE_META[user.responder_type] : null;

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your personal details, avatar, and security credentials"
      />

      {/* 1. Profile Details & Avatar Card */}
      <Card className="p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-ink">Personal Information</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Update your public profile name and contact information
          </p>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 rounded-2xl bg-surface-page/60 border border-line">
          <Avatar
            src={user?.profile_image_url}
            name={user?.full_name}
            size="xl"
            className="ring-4 ring-white shadow-soft"
          />

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">{user?.full_name}</span>
              <Badge variant={roleMeta.variant || 'slate'}>{roleMeta.label}</Badge>
              {responderMeta && (
                <Badge variant={responderMeta.variant || 'peach'}>{responderMeta.label}</Badge>
              )}
            </div>
            <p className="text-xs text-ink-faint">
              JPEG, PNG, or WebP. Maximum file size 2 MB.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={Upload}
                loading={uploadAvatarMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                Change photo
              </Button>
              {user?.profile_image_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  loading={removeAvatarMutation.isPending}
                  onClick={() => removeAvatarMutation.mutate()}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Full Name" required error={profileErrors.full_name?.message}>
              <Input
                icon={User}
                placeholder="Jane Doe"
                {...registerProfile('full_name')}
              />
            </FormField>

            <FormField label="Email Address" required error={profileErrors.email?.message}>
              <Input
                icon={Mail}
                type="email"
                placeholder="jane@example.com"
                {...registerProfile('email')}
              />
            </FormField>
          </div>

          <FormField label="Phone Number" error={profileErrors.phone?.message}>
            <Input
              icon={Phone}
              placeholder="+1 555-0123"
              {...registerProfile('phone')}
            />
          </FormField>

          <div className="flex items-center justify-end pt-3 border-t border-line">
            <Button
              type="submit"
              variant="primary"
              loading={updateProfileMutation.isPending}
              disabled={!isProfileDirty}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Security & Password Change Card */}
      <Card className="p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary-600" />
            Change Password
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Passwords must be at least 12 characters. Changing your password will log you out of all devices.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit(onPasswordSave)} className="space-y-4 max-w-lg">
          <FormField
            label="Current Password"
            required
            error={passwordErrors.currentPassword?.message}
          >
            <Input
              type="password"
              placeholder="••••••••••••"
              {...registerPassword('currentPassword')}
            />
          </FormField>

          <FormField
            label="New Password"
            required
            error={passwordErrors.newPassword?.message}
            hint="Minimum 12 characters"
          >
            <Input
              type="password"
              placeholder="••••••••••••"
              {...registerPassword('newPassword')}
            />
          </FormField>

          <FormField
            label="Confirm New Password"
            required
            error={passwordErrors.confirmPassword?.message}
          >
            <Input
              type="password"
              placeholder="••••••••••••"
              {...registerPassword('confirmPassword')}
            />
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              variant="secondary"
              loading={changePasswordMutation.isPending}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Account Sessions & Danger Zone Card */}
      <Card className="p-6 md:p-8 space-y-6 border-line">
        <div>
          <h2 className="text-base font-semibold text-ink">Account Actions</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Manage your active login sessions or deactivate your SafeRoute account
          </p>
        </div>

        <div className="space-y-4 divide-y divide-line">
          {/* Logout all devices */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 first:pt-0">
            <div>
              <h3 className="text-sm font-medium text-ink">Log out of all devices</h3>
              <p className="text-xs text-ink-faint mt-0.5">
                Revoke all active login refresh tokens across all browsers and devices.
              </p>
            </div>
            <Button
              variant="secondary"
              icon={LogOut}
              size="sm"
              loading={logoutAllMutation.isPending}
              onClick={() => setIsLogoutAllDialogOpen(true)}
            >
              Log out everywhere
            </Button>
          </div>

          {/* Deactivate Account */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
            <div>
              <h3 className="text-sm font-medium text-pastel-rose-text">Deactivate account</h3>
              <p className="text-xs text-ink-faint mt-0.5">
                Permanently disable your account. You will not be able to log in or file new reports.
              </p>
            </div>
            <Button
              variant="danger"
              icon={Trash2}
              size="sm"
              loading={deleteAccountMutation.isPending}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Deactivate Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Logout All Confirm Dialog */}
      <ConfirmDialog
        isOpen={isLogoutAllDialogOpen}
        onClose={() => setIsLogoutAllDialogOpen(false)}
        title="Log out of all devices?"
        message="This will immediately terminate your session across all browsers and mobile devices. You will need to log in again."
        confirmLabel="Log out everywhere"
        tone="danger"
        onConfirm={async () => {
          await logoutAllMutation.mutateAsync();
        }}
      />

      {/* Deactivate Account Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Deactivate SafeRoute account?"
        message="Are you sure you want to deactivate your account? This action cannot be undone and you will immediately be logged out."
        confirmLabel="Yes, deactivate my account"
        tone="danger"
        onConfirm={async () => {
          await deleteAccountMutation.mutateAsync();
        }}
      />
    </div>
  );
};

export default ProfilePage;
