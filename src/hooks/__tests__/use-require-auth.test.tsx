import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthContext } from '@/providers/auth-provider';
import { useRequireAuth } from '@/hooks/use-require-auth';
import type { AuthContextValue } from '@/types/auth';

jest.mock('@/config/env', () => ({
  env: { NEXT_PUBLIC_API_URL: 'http://localhost:8000', NEXT_PUBLIC_APP_NAME: 'Maco' },
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}));

function makeWrapper(isAuthenticated: boolean, isLoading: boolean) {
  const value: AuthContextValue = {
    user: isAuthenticated
      ? {
          id: 'u1',
          email: 'u@e.com',
          name: 'User',
          tenant_id: 't1',
          roles: [],
          permissions: [],
        }
      : null,
    tenant: isAuthenticated ? 't1' : null,
    isAuthenticated,
    isLoading,
    login: jest.fn(),
    logout: jest.fn(),
  };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };
}

beforeEach(() => jest.clearAllMocks());

// ─── AC-5 (client-side): useRequireAuth redirects unauthenticated users ──────
describe('AC-5 (client): useRequireAuth redirects when unauthenticated', () => {
  it('redirects to /login?returnTo= when not authenticated and not loading', () => {
    const { result } = renderHook(() => useRequireAuth(), {
      wrapper: makeWrapper(false, false),
    });

    act(() => {});

    expect(mockPush).toHaveBeenCalledWith('/login?returnTo=%2Fdashboard');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('does not redirect while loading', () => {
    renderHook(() => useRequireAuth(), { wrapper: makeWrapper(false, true) });
    act(() => {});
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not redirect when authenticated', () => {
    renderHook(() => useRequireAuth(), { wrapper: makeWrapper(true, false) });
    act(() => {});
    expect(mockPush).not.toHaveBeenCalled();
  });
});
