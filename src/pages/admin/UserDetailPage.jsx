import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Marker, Popup } from 'react-leaflet';
import toast from 'react-hot-toast';
import {
  Mail,
  Phone,
  MapPin,
  Save,
} from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import MapView from '../../components/map/MapView';
import { responderIcon } from '../../components/map/markers';

import { useAdminUser, useUpdateUser } from '../../hooks/useAdmin';
import { useAuthStore } from '../../store/authStore';
import { toNumber, isValidCoord } from '../../lib/geo';
import { formatDateTime, timeAgo } from '../../lib/format';
import {
  ROLES,
  ROLE_LABELS,
  RESPONDER_TYPES,
  RESPONDER_TYPE_LABELS,
} from '../../lib/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const userEditSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(20),
  is_active: z.boolean().optional(),
  responder_type: z.enum(['ambulance', 'police', 'fire']).optional(),
});

export const UserDetailPage = () => {
  useDocumentTitle('User Details');
  const { id } = useParams();
  const numericId = parseInt(id, 10);
  const currentAdmin = useAuthStore((s) => s.user);

  const { data, isLoading, isError, refetch } = useAdminUser(numericId);
  const updateUserMutation = useUpdateUser();

  const user = data?.data?.user || data?.user;
  const isSelf = user?.id === currentAdmin?.id;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      is_active: true,
      responder_type: 'ambulance',
    },
  });

  // Populate form with current values
  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        is_active: Boolean(user.is_active),
        responder_type: user.responder_type || 'ambulance',
      });
    }
  }, [user, reset]);

  // Form submission: sends ONLY changed fields
  const onSubmit = async (values) => {
    if (!user) return;

    const changed = {};
    if (values.full_name !== user.full_name) {
      changed.full_name = values.full_name;
    }
    if (values.email !== user.email) {
      changed.email = values.email;
    }
    if (values.phone !== user.phone) {
      changed.phone = values.phone;
    }
    if (!isSelf && values.is_active !== user.is_active) {
      changed.is_active = values.is_active;
    }
    if (user.role === ROLES.RESPONDER && values.responder_type !== user.responder_type) {
      changed.responder_type = values.responder_type;
    }

    if (Object.keys(changed).length === 0) {
      toast('No changes were made.');
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        id: numericId,
        data: changed,
      });
      refetch();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      if (/email/i.test(msg)) {
        setError('email', { message: msg });
      } else if (/phone/i.test(msg)) {
        setError('phone', { message: msg });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="lg:col-span-2 h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <ErrorState
        title="User not found"
        description="Could not load the requested user account details."
        onRetry={refetch}
      />
    );
  }

  const isResponder = user.role === ROLES.RESPONDER;
  const lat = toNumber(user.last_known_latitude);
  const lng = toNumber(user.last_known_longitude);
  const hasLocation = isValidCoord(lat, lng);

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 uppercase text-sm">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <span>{user.full_name}</span>
            {isSelf && (
              <span className="text-xs font-normal text-ink-muted bg-surface-muted px-2 py-0.5 rounded-full border border-line">
                Your Account
              </span>
            )}
          </div>
        }
        subtitle={`Account ID #${user.id} · Registered ${formatDateTime(user.createdAt || user.created_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant={user.role === ROLES.ADMIN ? 'lavender' : isResponder ? 'sky' : 'slate'}
              size="md"
            >
              {ROLE_LABELS[user.role] || user.role}
            </Badge>

            {user.is_active ? (
              <Badge variant="mint" size="md">
                Active
              </Badge>
            ) : (
              <Badge variant="rose" size="md">
                Disabled
              </Badge>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 col): Profile Overview Card & Location Card */}
        <div className="space-y-6">
          <Card title="Account Overview">
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <span className="text-ink-muted block text-xs">Full Name</span>
                <span className="font-semibold text-ink">{user.full_name}</span>
              </div>

              <div>
                <span className="text-ink-muted block text-xs">Email Address</span>
                <a
                  href={`mailto:${user.email}`}
                  className="font-semibold text-primary-600 hover:underline flex items-center gap-1.5 truncate"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </a>
              </div>

              <div>
                <span className="text-ink-muted block text-xs">Phone Number</span>
                {user.phone ? (
                  <a
                    href={`tel:${user.phone}`}
                    className="font-semibold text-primary-600 hover:underline flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{user.phone}</span>
                  </a>
                ) : (
                  <span className="text-ink-muted">—</span>
                )}
              </div>

              <div>
                <span className="text-ink-muted block text-xs">System Role</span>
                <span className="font-semibold text-ink capitalize">{user.role}</span>
              </div>

              {isResponder && user.responder_type && (
                <div>
                  <span className="text-ink-muted block text-xs">Responder Unit</span>
                  <Badge variant="peach" size="sm" className="mt-1">
                    {RESPONDER_TYPE_LABELS[user.responder_type] || user.responder_type}
                  </Badge>
                </div>
              )}

              <div className="pt-2 border-t border-line text-xs text-ink-muted space-y-1">
                <p>Created: {formatDateTime(user.createdAt || user.created_at)}</p>
                <p>Last Profile Update: {formatDateTime(user.updatedAt || user.updated_at)}</p>
              </div>
            </div>
          </Card>

          {/* If Responder: Last Known Location Map */}
          {isResponder && (
            <Card
              title="Last Known Location"
              subtitle={
                hasLocation && user.last_location_at
                  ? `Updated ${timeAgo(user.last_location_at)}`
                  : 'GPS coordinates'
              }
            >
              {hasLocation ? (
                <div className="space-y-2">
                  <div className="h-44 w-full rounded-xl overflow-hidden border border-line">
                    <MapView center={[lat, lng]} zoom={14} className="h-full w-full">
                      <Marker position={[lat, lng]} icon={responderIcon()}>
                        <Popup>
                          <div className="text-xs">
                            <p className="font-semibold text-ink">{user.full_name}</p>
                            <p className="text-ink-muted">
                              {user.last_location_at ? timeAgo(user.last_location_at) : 'Reported'}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapView>
                  </div>
                  <div className="text-xs text-ink-muted flex items-center justify-between">
                    <span>
                      {lat}, {lng}
                    </span>
                    {user.last_location_at && (
                      <span>{formatDateTime(user.last_location_at)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-ink-muted">
                  <MapPin className="w-6 h-6 text-ink-muted mx-auto mb-1.5 opacity-50" />
                  <p className="font-semibold text-ink">No GPS coordinates logged</p>
                  <p className="text-ink-muted mt-0.5">
                    This responder has not yet transmitted live location coordinates.
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column (2 cols): Edit Account Form */}
        <div className="lg:col-span-2">
          <Card
            title="Edit Account Details"
            subtitle="Update user profile information, role unit, or account access status"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                  Full Name / Callsign
                </label>
                <Input
                  type="text"
                  {...register('full_name')}
                  hasError={Boolean(errors.full_name)}
                />
                {errors.full_name && (
                  <p className="text-xs text-rose-600">{errors.full_name.message}</p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    {...register('email')}
                    hasError={Boolean(errors.email)}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    {...register('phone')}
                    hasError={Boolean(errors.phone)}
                  />
                  {errors.phone && (
                    <p className="text-xs text-rose-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Responder Unit Type (Only for Responders) */}
              {isResponder && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                    Responder Unit Type
                  </label>
                  <Select {...register('responder_type')}>
                    <option value={RESPONDER_TYPES.AMBULANCE}>Ambulance (EMS)</option>
                    <option value={RESPONDER_TYPES.POLICE}>Police Unit</option>
                    <option value={RESPONDER_TYPES.FIRE}>Fire Rescue</option>
                  </Select>
                </div>
              )}

              {/* Active Toggle (Hidden for self) */}
              {!isSelf && (
                <div className="p-4 rounded-xl border border-line bg-surface-page flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-ink block">Account Active</span>
                    <span className="text-xs text-ink-muted">
                      Disabled users cannot authenticate or access the platform.
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('is_active')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-line peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              )}

              {/* Form Action */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <Button
                  type="submit"
                  variant="primary"
                  icon={Save}
                  loading={isSubmitting || updateUserMutation.isPending}
                  disabled={isSubmitting || updateUserMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
