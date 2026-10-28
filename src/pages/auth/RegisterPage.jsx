import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Check, X } from 'lucide-react';

import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import IconButton from '../../components/ui/IconButton';
import { authApi } from '../../api/auth';
import { applyFieldErrors, getErrorMessage, isStatus } from '../../lib/errors';
import { useRateLimitCountdown } from '../../hooks/useRateLimitCountdown';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters'),
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .trim()
      .refine(
        (val) => {
          const stripped = val.replace(/[\s-]/g, '');
          return stripped.length >= 10 && stripped.length <= 20;
        },
        { message: 'Phone number must be between 10 and 20 digits' }
      ),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .max(128, 'Password must not exceed 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const RegisterPage = () => {
  useDocumentTitle('Create Account');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isRateLimited, secondsLeft, startCountdown } = useRateLimitCountdown(30);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' }) || '';
  const hasMinLength = passwordValue.length >= 12;
  const hasLetter = /[a-zA-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);

  const onSubmit = async (values) => {
    try {
      const payload = {
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.replace(/[\s-]/g, ''),
        password: values.password,
      };

      await authApi.register(payload);

      toast.success('Account created. Please log in.');
      navigate('/login', {
        state: { email: payload.email },
      });
    } catch (err) {
      if (isStatus(err, 409)) {
        const msg = err.response?.data?.message || '';
        if (msg.toLowerCase().includes('email')) {
          setError('email', {
            type: 'server',
            message: 'Email already registered',
          });
        } else if (msg.toLowerCase().includes('phone')) {
          setError('phone', {
            type: 'server',
            message: 'Phone number already registered',
          });
        } else {
          toast.error(msg || 'User already exists');
        }
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
      title="Create account"
      subtitle="Register as a citizen reporter"
      footer={
        <p>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="full_name"
          label="Full name"
          error={errors.full_name?.message}
          required
        >
          <Input
            id="full_name"
            autoComplete="name"
            autoFocus
            hasError={Boolean(errors.full_name)}
            disabled={isSubmitting || isRateLimited}
            placeholder="Jane Doe"
            {...register('full_name')}
          />
        </FormField>

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
            hasError={Boolean(errors.email)}
            disabled={isSubmitting || isRateLimited}
            placeholder="jane@example.com"
            {...register('email')}
          />
        </FormField>

        <FormField
          id="phone"
          label="Phone number"
          hint="10 to 15 digits, e.g. 9876543210"
          error={errors.phone?.message}
          required
        >
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            hasError={Boolean(errors.phone)}
            disabled={isSubmitting || isRateLimited}
            placeholder="9876543210"
            {...register('phone')}
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
            autoComplete="new-password"
            hasError={Boolean(errors.password)}
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
            {...register('password')}
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
          label="Confirm password"
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            hasError={Boolean(errors.confirmPassword)}
            disabled={isSubmitting || isRateLimited}
            placeholder="Repeat your password"
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
          {isRateLimited ? `Too many attempts (${secondsLeft}s)` : 'Create account'}
        </Button>

        <p className="text-[11px] text-ink-faint text-center leading-relaxed pt-1">
          Only citizens register here. Responder accounts are created by an administrator.
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
