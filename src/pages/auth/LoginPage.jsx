import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import IconButton from '../../components/ui/IconButton';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { ROLE_HOME } from '../../lib/constants';
import { applyFieldErrors, getErrorMessage, isStatus } from '../../lib/errors';
import { useRateLimitCountdown } from '../../hooks/useRateLimitCountdown';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const isPathAllowedForRole = (path, role) => {
  if (!path || typeof path !== 'string' || path === '/' || path.startsWith('/login')) {
    return false;
  }
  if (path.startsWith('/profile') || path.startsWith('/notifications')) {
    return true;
  }
  if (role === 'admin' && path.startsWith('/admin')) {
    return true;
  }
  if (role === 'responder' && path.startsWith('/responder')) {
    return true;
  }
  if (role === 'reporter' && path.startsWith('/reporter')) {
    return true;
  }
  return false;
};

export const LoginPage = () => {
  useDocumentTitle('Sign In');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [deactivatedError, setDeactivatedError] = useState('');
  const { isRateLimited, secondsLeft, startCountdown } = useRateLimitCountdown(30);

  const isExpired = searchParams.get('expired') === '1' || location.state?.expired;
  const prefillEmail = location.state?.email || '';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: prefillEmail,
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setGeneralError('');
    setDeactivatedError('');

    try {
      const payload = {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      };

      const res = await authApi.login(payload);
      const { user, accessToken, refreshToken } = res?.data || {};

      if (!user || !accessToken) {
        throw new Error('Malformed login response from server.');
      }

      // Store credentials
      setSession({ user, accessToken, refreshToken });
      queryClient.clear();

      // Determine redirect path
      const fromPath = location.state?.from?.pathname || location.state?.from;
      if (fromPath && isPathAllowedForRole(fromPath, user.role)) {
        navigate(fromPath, { replace: true });
      } else {
        const home = ROLE_HOME[user.role] || '/reporter/incidents';
        navigate(home, { replace: true });
      }
    } catch (err) {
      if (isStatus(err, 401)) {
        setGeneralError('Incorrect email or password.');
      } else if (isStatus(err, 403)) {
        const msg = err.response?.data?.message || 'Account is deactivated';
        setDeactivatedError(msg);
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
      title="Welcome back"
      subtitle="Sign in to your SafeRoute account"
      footer={
        <p>
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      }
    >
      {isExpired && (
        <div
          role="status"
          className="mb-5 rounded-xl bg-pastel-butter-bg text-pastel-butter-text border border-pastel-butter-text/15 p-3 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Your session has expired. Please sign in again.</span>
        </div>
      )}

      {deactivatedError && (
        <div
          role="alert"
          className="mb-5 rounded-xl bg-pastel-rose-bg text-pastel-rose-text border border-pastel-rose-text/20 p-3 text-sm flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="font-medium">{deactivatedError}</div>
        </div>
      )}

      {generalError && (
        <div
          role="alert"
          className="mb-5 rounded-xl bg-pastel-rose-bg text-pastel-rose-text border border-pastel-rose-text/20 p-3 text-sm flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="font-medium">{generalError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="email"
          label="Email address"
          error={errors.email?.message}
          required
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            hasError={Boolean(errors.email)}
            disabled={isSubmitting || isRateLimited}
            placeholder="you@example.com"
            {...register('email')}
          />
        </FormField>

        <FormField
          id="password"
          label="Password"
          error={errors.password?.message}
          required
        >
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            hasError={Boolean(errors.password)}
            disabled={isSubmitting || isRateLimited}
            placeholder="Enter your password"
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
            {...register('password')}
          />
        </FormField>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-ink-soft hover:text-primary-600 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          loading={isSubmitting}
          disabled={isSubmitting || isRateLimited}
        >
          {isRateLimited ? `Too many attempts (${secondsLeft}s)` : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
