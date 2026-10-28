import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';

import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/auth';
import { applyFieldErrors, getErrorMessage, isStatus } from '../../lib/errors';
import { useRateLimitCountdown } from '../../hooks/useRateLimitCountdown';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export const ForgotPasswordPage = () => {
  useDocumentTitle('Forgot Password');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { isRateLimited, secondsLeft, startCountdown } = useRateLimitCountdown(60);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    try {
      const email = values.email.trim().toLowerCase();
      await authApi.forgotPassword(email);

      setSubmittedEmail(email);
      setIsSubmitted(true);
      startCountdown(60);
    } catch (err) {
      if (isStatus(err, 422)) {
        applyFieldErrors(err, setError);
      } else if (isStatus(err, 429)) {
        toast.error(getErrorMessage(err));
        startCountdown(30);
      } else {
        toast.error(getErrorMessage(err));
      }
    }
  };

  const handleResend = async () => {
    if (isRateLimited || !submittedEmail) return;
    try {
      await authApi.forgotPassword(submittedEmail);
      toast.success('Reset email resent.');
      startCountdown(60);
    } catch (err) {
      toast.error(getErrorMessage(err));
      if (isStatus(err, 429)) {
        startCountdown(30);
      }
    }
  };

  const handleDifferentEmail = () => {
    setIsSubmitted(false);
    reset({ email: '' });
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title=""
        subtitle=""
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
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-pastel-mint-bg text-pastel-mint-text border border-pastel-mint-text/20 flex items-center justify-center mx-auto mb-4">
            <MailCheck className="w-8 h-8" aria-hidden="true" />
          </div>

          <h2 className="text-xl font-bold text-ink mb-2">Check your email</h2>

          <div className="rounded-xl bg-pastel-mint-bg/60 text-pastel-mint-text border border-pastel-mint-text/20 p-4 mb-6 text-xs sm:text-sm leading-relaxed text-left">
            If an account exists for <strong className="font-semibold">{submittedEmail}</strong>, a
            reset link has been sent. The link works for 15 minutes.
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full"
              disabled={isRateLimited}
              onClick={handleResend}
            >
              {isRateLimited ? `Send again in ${secondsLeft}s` : 'Send again'}
            </Button>

            <div>
              <button
                type="button"
                onClick={handleDifferentEmail}
                className="text-xs font-medium text-ink-soft hover:text-primary-600 transition-colors cursor-pointer"
              >
                Use a different email
              </button>
            </div>

            <div className="pt-2">
              <Link to="/login" className="block w-full">
                <Button variant="primary" size="md" className="w-full">
                  Back to login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email to receive a password reset link"
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

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          loading={isSubmitting}
          disabled={isSubmitting || isRateLimited}
        >
          {isRateLimited ? `Too many attempts (${secondsLeft}s)` : 'Send reset link'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
