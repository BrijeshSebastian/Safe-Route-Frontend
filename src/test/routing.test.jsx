import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from '../routes/AppRoutes';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/incidents', () => ({
  incidentsApi: {
    getMyIncidents: vi.fn().mockResolvedValue({ success: true, data: [], meta: {} }),
  },
}));

vi.mock('../api/notifications', () => ({
  notificationsApi: {
    getNotifications: vi.fn().mockResolvedValue({ success: true, data: [], meta: {} }),
  },
}));

const renderWithRouter = (initialRoute) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Routing and Route Guards', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('redirects unauthenticated user from /reporter/report to /login', async () => {
    useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null });
    renderWithRouter('/reporter/report');

    expect(await screen.findByText(/Sign in to your SafeRoute account/i)).toBeInTheDocument();
  });

  it('redirects authenticated reporter from /login to their home page', async () => {
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 1, full_name: 'Jane Citizen', role: 'reporter' },
      accessToken: 'valid-token',
    });
    renderWithRouter('/login');

    expect(
      await screen.findByText(
        /Track the status of emergencies you reported/i,
        {},
        { timeout: 5000 }
      )
    ).toBeInTheDocument();
  });

  it('renders NotFoundPage on unmatched routes', async () => {
    renderWithRouter('/some/non-existent/path');

    expect(await screen.findByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to my home/i })).toBeInTheDocument();
  });
});
