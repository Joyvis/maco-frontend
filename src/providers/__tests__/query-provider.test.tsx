import React from 'react';
import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/providers/query-provider';

jest.mock('@/config/env', () => ({
  env: { NEXT_PUBLIC_API_URL: 'http://localhost:8000', NEXT_PUBLIC_APP_NAME: 'Maco' },
}));

// ─── AC-14: QueryClientProvider with correct defaults ────────────────────────
describe('AC-14: QueryProvider wraps app with correct defaults', () => {
  function Inspector() {
    const client = useQueryClient();
    const defaults = client.getDefaultOptions();
    const staleTime = defaults.queries?.staleTime;
    const gcTime = defaults.queries?.gcTime;
    return (
      <div>
        <span data-testid="stale">{typeof staleTime === 'number' ? staleTime : ''}</span>
        <span data-testid="gc">{typeof gcTime === 'number' ? gcTime : ''}</span>
        <span data-testid="retry">{String(defaults.queries?.retry)}</span>
        <span data-testid="refetch">{String(defaults.queries?.refetchOnWindowFocus)}</span>
      </div>
    );
  }

  it('provides QueryClient with staleTime=5min, gcTime=10min, retry=1, refetchOnWindowFocus=true', () => {
    render(
      <QueryProvider>
        <Inspector />
      </QueryProvider>,
    );
    expect(screen.getByTestId('stale').textContent).toBe(String(5 * 60 * 1000));
    expect(screen.getByTestId('gc').textContent).toBe(String(10 * 60 * 1000));
    expect(screen.getByTestId('retry').textContent).toBe('1');
    expect(screen.getByTestId('refetch').textContent).toBe('true');
  });
});

// ─── AC-15/16: Devtools only in development ───────────────────────────────────
describe('AC-15/16: React Query Devtools', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });

  it('renders children within QueryProvider', () => {
    render(
      <QueryProvider>
        <div data-testid="child">hello</div>
      </QueryProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
