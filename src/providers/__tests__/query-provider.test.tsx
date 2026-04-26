import React from 'react';
import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';

import { QueryProvider } from '@/providers/query-provider';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

// Track how many times next/dynamic is invoked (proves dev path uses dynamic import)
let dynamicCallCount = 0;

vi.mock('next/dynamic', () => ({
  default: function dynamic(
    importFn: () => Promise<{ default: React.ComponentType<unknown> }>,
  ) {
    dynamicCallCount++;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const R = require('react') as typeof import('react');
    const Lazy = R.lazy(importFn);
    return function Dynamic(props: Record<string, unknown>) {
      return R.createElement(
        R.Suspense,
        { fallback: null },
        R.createElement(Lazy as React.ElementType, props),
      );
    };
  },
}));

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () =>
    React.createElement('div', { 'data-testid': 'react-query-devtools' }),
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
        <span data-testid="stale">
          {typeof staleTime === 'number' ? staleTime : ''}
        </span>
        <span data-testid="gc">{typeof gcTime === 'number' ? gcTime : ''}</span>
        <span data-testid="retry">{String(defaults.queries?.retry)}</span>
        <span data-testid="refetch">
          {String(defaults.queries?.refetchOnWindowFocus)}
        </span>
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
  beforeEach(() => {
    dynamicCallCount = 0;
  });

  it('uses dynamic import for devtools when NODE_ENV is development (AC-15)', async () => {
    // Load a fresh copy of the module with NODE_ENV=development to trigger the
    // dynamic-import branch. We verify via dynamicCallCount rather than rendering
    // the isolated component, which avoids the "multiple React copies" issue that
    // arises when re-importing creates a separate React instance.
    vi.stubEnv('NODE_ENV', 'development');
    try {
      vi.resetModules();
      await import('@/providers/query-provider');
      expect(dynamicCallCount).toBe(1);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('does not render devtools outside development (AC-16)', () => {
    // NODE_ENV is 'test' in Jest — ReactQueryDevtools resolves to () => null
    render(
      <QueryProvider>
        <div data-testid="child">hello</div>
      </QueryProvider>,
    );

    expect(dynamicCallCount).toBe(0);
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(
      screen.queryByTestId('react-query-devtools'),
    ).not.toBeInTheDocument();
  });
});
