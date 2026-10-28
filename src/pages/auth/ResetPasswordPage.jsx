import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';

import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import IconButton from '../../components/ui/IconButton';
import { authApi } from '../../api/auth';
import { applyFieldErrors, getErrorMessage, isStatus } from '../../lib/errors';
import { useRateLimitCountdown } from '../../hooks/useRateLimitCountdown';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .max(128, 'Password must not exceed 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const ResetPasswordPage = () => {
  useDocumentTitle('Reset Password');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [expiredError, setExpiredError] = useState(false);
  const { isRateLimited, secondsLeft, startCountdown } = useRateLimitCountdown(30);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const passwordValue = useWatch({ control, name: 'newPassword', defaultValue: '' }) || '';
  const hasMinLength = passwordValue.length >= 12;
  const hasLetter = /[a-zA-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);

  // If token is missing from query string
  if (!token) {
    return (
      <AuthLayout
        title="Invalid link"
        subtitle="Password reset link is missing or broken"
        footer={
          <p>
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2"
            >
              Back to sign in
            </Link>
          </p>
        }
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-pastel-rose-bg text-pastel-rose-text flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" aria-hidden="true" />
          </div>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            This reset link is invalid. Please request a new link to reset your password.
          </p>
          <Link to="/forgot-password" className="block w-full">
            <Button variant="primary" size="md" className="w-full">
              Request a new link
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async (values) => {
    setExpiredError(false);
    try {
      await authApi.resetPassword({
        token,
        newPassword: values.newPassword,
      });

      toast.success('Password updated. Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      if (isStatus(err, 400)) {
        setExpiredError(true);
      } else if (isStatus(err, 422)) {
        applyFieldErrors(err, setError);
      } else if (isStatus(err, 429)) {
        toast.error(getErrorMessage(err));
        startCountdown(30);
      } else {
        toast.error(getErrorMessage(err));
      }
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a new secure password"
      footer={
        <p>
          Remember your password?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {expiredError ? (
        <div className="text-center py-2 animate-in fade-in">
          <div className="rounded-xl bg-pastel-rose-bg text-pastel-rose-text border border-pastel-rose-text/20 p-4 mb-5 text-sm text-left">
            <div className="font-semibold mb-1 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Link Expired</span>
            </div>
            This link has expired or was already used.
          </div>
          <Link to="/forgot-password" className="block w-full">
            <Button variant="primary" size="md" className="w-full">
              Request a new link
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            id="newPassword"
            label="New password"
            error={errors.newPassword?.message}
            required
          >
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
              hasError={Boolean(errors.newPassword)}
              disabled={isSubmitting || isRateLimited}
              placeholder="At least 12 characters"
              rightElement={
                <IconButton
                  icon={showPassword ? EyeOff : Eye}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  size="sm"
                  variant="ghost"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                />
              }
              {...register('newPassword')}
            />

            {/* Password Rule Checklist */}
            <div className="mt-2 space-y-1 text-xs" aria-label="Password requirements">
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  hasMinLength ? 'text-pastel-mint-text font-medium' : 'text-ink-faint'
                }`}
              >
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>At least 12 characters</span>
              </div>
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  hasLetter ? 'text-pastel-mint-text font-medium' : 'text-ink-faint'
                }`}
              >
                {hasLetter ? (
                  <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>Contains a letter</span>
              </div>
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  hasNumber ? 'text-pastel-mint-text font-medium' : 'text-ink-faint'
                }`}
              >
                {hasNumber ? (
                  <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>Contains a number</span>
              </div>
            </div>
          </FormField>

          <FormField
            id="confirmPassword"
            label="Confirm new password"
            error={errors.confirmPassword?.message}
            required
          >
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              hasError={Boolean(errors.confirmPassword)}
              disabled={isSubmitting || isRateLimited}
              placeholder="Repeat your new password"
              rightElement={
                <IconButton
                  icon={showConfirmPassword ? EyeOff : Eye}
                  aria-label={
                    showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                  }
                  size="sm"
                  variant="ghost"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                />
              }
              {...register('confirmPassword')}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            loading={isSubmitting}
            disabled={isSubmitting || isRateLimited}
          >
            {isRateLimited ? `Too many attempts (${secondsLeft}s)` : 'Update password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPasswordPage;
