import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

const renderWithProviders = (ui, { route = '/' } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Auth Pages (Prompt F1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  // 1. Login submits exactly {email, password} and navigates by role
  it('login submits exactly {email, password} and updates auth state', async () => {
    const user = userEvent.setup();
    const mockUser = { id: 1, full_name: 'Admin User', role: 'admin' };

    authApi.login.mockResolvedValueOnce({
      success: true,
      message: 'Login successful',
      data: {
        user: mockUser,
        accessToken: 'access-jwt-token',
        refreshToken: 'refresh-jwt-token',
      },
    });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<div>Admin Home Page</div>} />
      </Routes>,
      { route: '/login' }
    );

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign in/i });

    await user.type(emailInput, '  Admin@Example.COM ');
    await user.type(passwordInput, 'SecretPass123!');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledTimes(1);
    });

    // Check payload is strictly { email, password } with trimmed/lowercased email
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'SecretPass123!',
    });

    // Check session stored
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().accessToken).toBe('access-jwt-token');

    // Check navigated to role home
    expect(await screen.findByText('Admin Home Page')).toBeInTheDocument();
  });

  // 2. Register never sends confirmPassword
  it('register never sends confirmPassword in the request body', async () => {
    const user = userEvent.setup();

    authApi.register.mockResolvedValueOnce({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: 2, full_name: 'Citizen Jane', email: 'jane@example.com', role: 'reporter' },
      },
    });

    renderWithProviders(
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<div>Login Screen</div>} />
      </Routes>,
      { route: '/register' }
    );

    await user.type(screen.getByLabelText(/Full name/i), 'Citizen Jane');
    await user.type(screen.getByLabelText(/Email address/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/Phone number/i), '98765-43210');
    await user.type(screen.getByLabelText(/^Password/i, { selector: 'input' }), 'ValidPass1234!');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'ValidPass1234!');

    const submitBtn = screen.getByRole('button', { name: /Create account/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledTimes(1);
    });

    const callArg = authApi.register.mock.calls[0][0];

    // Verify confirmPassword was NOT included
    expect(callArg).not.toHaveProperty('confirmPassword');

    // Verify exact expected keys
    expect(callArg).toEqual({
      full_name: 'Citizen Jane',
      email: 'jane@example.com',
      phone: '9876543210',
      password: 'ValidPass1234!',
    });

    expect(await screen.findByText('Login Screen')).toBeInTheDocument();
  });

  // 3. Register shows duplicate-email error on the email field from a mocked 409
  it('register shows duplicate-email error on the email field from 409 conflict', async () => {
    const user = userEvent.setup();

    const conflictError = new Error('Request failed with status code 409');
    conflictError.response = {
      status: 409,
      data: {
        success: false,
        message: 'Email already registered',
        errorCode: 'USER_002',
      },
    };

    authApi.register.mockRejectedValueOnce(conflictError);

    renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.type(screen.getByLabelText(/Full name/i), 'Citizen Jane');
    await user.type(screen.getByLabelText(/Email address/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/Phone number/i), '9876543210');
    await user.type(screen.getByLabelText(/^Password/i, { selector: 'input' }), 'ValidPass1234!');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'ValidPass1234!');

    const submitBtn = screen.getByRole('button', { name: /Create account/i });
    await user.click(submitBtn);

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
  });

  // 4. Reset page without a token shows the invalid-link state
  it('reset page without a token shows the invalid-link state', () => {
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password' });

    expect(screen.getByText(/This reset link is invalid/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request a new link/i })).toBeInTheDocument();
  });
});
