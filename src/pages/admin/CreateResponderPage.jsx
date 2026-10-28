import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Shield,
  Ambulance,
  Flame,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  Users,
  Info,
} from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

import { useCreateResponder } from '../../hooks/useAdmin';
import {
  RESPONDER_TYPES,
  RESPONDER_TYPE_LABELS,
} from '../../lib/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const createResponderSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(20),
  password: z
    .string()
    .min(12, 'Temporary password must be at least 12 characters')
    .max(128),
  responder_type: z.enum(
    [RESPONDER_TYPES.AMBULANCE, RESPONDER_TYPES.POLICE, RESPONDER_TYPES.FIRE],
    {
      required_error: 'Please choose a responder unit type',
    }
  ),
});

export const CreateResponderPage = () => {
  useDocumentTitle('Add Responder');
  const createMutation = useCreateResponder();

  const [showPassword, setShowPassword] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createResponderSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      responder_type: RESPONDER_TYPES.AMBULANCE,
    },
  });

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('password', pwd, { shouldValidate: true, shouldDirty: true });
    setShowPassword(true);
    toast.success('Generated a secure 14-character password');
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        password: values.password,
        responder_type: values.responder_type,
      };

      const res = await createMutation.mutateAsync(payload);
      const responder = res?.data?.responder || res?.responder || payload;

      setCreatedResult({
        ...responder,
        rawPassword: values.password,
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      if (/email/i.test(msg)) {
        setError('email', { message: msg });
      } else if (/phone/i.test(msg)) {
        setError('phone', { message: msg });
      } else {
        toast.error(msg || 'Failed to create responder');
      }
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const text = `SafeRoute Responder Credentials\nUnit: ${createdResult.full_name} (${createdResult.responder_type})\nEmail: ${createdResult.email}\nTemporary Password: ${createdResult.rawPassword}`;
    navigator.clipboard.writeText(text);
    toast.success('Login credentials copied to clipboard');
  };

  const handleResetForAnother = () => {
    setCreatedResult(null);
    reset();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Provision Emergency Responder"
        subtitle="Create dedicated field credentials for Ambulance, Police, or Fire rescue teams"
      />

      {createdResult ? (
        /* Success Panel */
        <Card className="p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-ink">Responder Account Created</h2>
            <p className="text-sm text-ink-muted">
              The field unit is now registered and ready to be dispatched to verified emergencies.
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 bg-surface-page rounded-2xl border border-line text-left space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-1 border-b border-line">
              <span className="text-ink-muted">Unit / Callsign:</span>
              <span className="font-semibold text-ink">{createdResult.full_name}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-line">
              <span className="text-ink-muted">Unit Type:</span>
              <Badge variant="peach" size="sm">
                {RESPONDER_TYPE_LABELS[createdResult.responder_type] ||
                  createdResult.responder_type}
              </Badge>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-line">
              <span className="text-ink-muted">Email / Username:</span>
              <span className="font-semibold text-ink">{createdResult.email}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-ink-muted">Password:</span>
              <span className="font-mono font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                {createdResult.rawPassword}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              icon={Copy}
              onClick={handleCopyCredentials}
            >
              Copy login details
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              icon={UserPlus}
              onClick={handleResetForAnother}
            >
              Add another
            </Button>

            <Button
              as={Link}
              to="/admin/users"
              variant="primary"
              size="md"
              icon={Users}
            >
              View users
            </Button>
          </div>
        </Card>
      ) : (
        /* Create Responder Form */
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 1. Unit Type Selection Tiles */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                Responder Unit Type <span className="text-rose-500">*</span>
              </label>

              <Controller
                name="responder_type"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        type: RESPONDER_TYPES.AMBULANCE,
                        label: 'Ambulance (EMS)',
                        desc: 'Medical triage & trauma hospital transport',
                        icon: Ambulance,
                      },
                      {
                        type: RESPONDER_TYPES.POLICE,
                        label: 'Police Unit',
                        desc: 'Law enforcement, security & traffic control',
                        icon: Shield,
                      },
                      {
                        type: RESPONDER_TYPES.FIRE,
                        label: 'Fire Rescue',
                        desc: 'Fire suppression, hazard & flood rescue',
                        icon: Flame,
                      },
                    ].map(({ type, label, desc, icon: Icon }) => {
                      const isSelected = field.value === type;
                      return (
                        <div
                          key={type}
                          onClick={() => field.onChange(type)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                            isSelected
                              ? 'border-primary-600 bg-primary-50/70 ring-2 ring-primary-200 shadow-xs'
                              : 'border-line bg-surface-card hover:bg-surface-page'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Icon
                              className={`w-6 h-6 ${
                                isSelected ? 'text-primary-600' : 'text-ink-soft'
                              }`}
                            />
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-primary-600 bg-primary-600'
                                  : 'border-line bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-ink block">{label}</span>
                            <span className="text-xs text-ink-muted line-clamp-2 mt-0.5">{desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              />
              {errors.responder_type && (
                <p className="text-xs text-rose-600 font-medium">
                  {errors.responder_type.message}
                </p>
              )}
            </div>

            {/* 2. Full Name / Callsign */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                Unit Callsign or Responder Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Medic Unit 04, Patrol Car 12, Engine 9 Rescue"
                {...register('full_name')}
                hasError={Boolean(errors.full_name)}
              />
              {errors.full_name && (
                <p className="text-xs text-rose-600 font-medium">{errors.full_name.message}</p>
              )}
            </div>

            {/* 3. Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="e.g. ambulance12@saferoute.com"
                  {...register('email')}
                  hasError={Boolean(errors.email)}
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                  Direct Phone Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  {...register('phone')}
                  hasError={Boolean(errors.phone)}
                />
                {errors.phone && (
                  <p className="text-xs text-rose-600 font-medium">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* 4. Temporary Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                  Temporary Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Generate password</span>
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 12 characters"
                  {...register('password')}
                  hasError={Boolean(errors.password)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-600 font-medium">{errors.password.message}</p>
              )}

              <p className="text-xs text-ink-muted flex items-start gap-1.5 pt-1">
                <Info className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                <span>
                  Share this password with the responder securely. They can change it in their Profile
                  page after signing in.
                </span>
              </p>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
              <Button
                as={Link}
                to="/admin/users"
                variant="secondary"
                disabled={isSubmitting || createMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                icon={UserPlus}
                loading={isSubmitting || createMutation.isPending}
                disabled={isSubmitting || createMutation.isPending}
              >
                Create Responder Account
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default CreateResponderPage;
