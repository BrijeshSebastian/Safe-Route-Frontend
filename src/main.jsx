import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Filter out benign Recharts 2.x defaultProps deprecation warning in React 18.3+
const originalConsoleError = console.error;
console.error = (...args) => {
  const combined = args.map((a) => (typeof a === 'string' ? a : '')).join(' ');
  if (
    combined.includes('Support for defaultProps will be removed from function components') &&
    (combined.includes('XAxis') || combined.includes('YAxis') || combined.includes('recharts'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import 'leaflet/dist/leaflet.css';
import './index.css';

import App from './App.jsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import { registerQueryClient } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Do not retry 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

registerQueryClient(queryClient);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster
            position="top-right"
            containerProps={{
              role: 'status',
              'aria-live': 'polite',
            }}
            toastOptions={{
              duration: 4000,
              className: 'text-sm font-medium',
              style: {
                background: '#FFFFFF',
                color: '#2B2F45',
                border: '1px solid #E6E7F2',
                borderRadius: '0.9rem',
                boxShadow: '0 6px 24px -8px rgba(87,102,214,0.18)',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#1F6B4F',
                  secondary: '#DDF5EA',
                },
              },
              error: {
                iconTheme: {
                  primary: '#A02B45',
                  secondary: '#FFE0E6',
                },
              },
            }}
          />
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
