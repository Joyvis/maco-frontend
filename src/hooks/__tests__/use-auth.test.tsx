import React from 'react';
import { renderHook } from '@testing-library/react';

import { AuthContext } from '@/providers/auth-provider';
import { useAuth } from '@/hooks/use-auth';
import type { AuthContextValue, User } from '@/types/auth';

jest.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

const MOCK_USER: User = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  tenant_id: 'tenant-abc',
  roles: ['admin'],
  permissions: [{ resource: 'tickets', action: 'write' }],
};

const MOCK_AUTH: AuthContextValue = {
  user: MOCK_USER,
  tenant: 'tenant-abc',
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
};

// ─── AC-11: useAuth returns AuthContextValue ─────────────────────────────────
describe('AC-11: useAuth', () => {
  it('returns user, tenant, isAuthenticated from context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={MOCK_AUTH}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(MOCK_USER);
    expect(result.current.tenant).toBe('tenant-abc');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow();
  });
});
