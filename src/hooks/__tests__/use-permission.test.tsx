import React from 'react';
import { renderHook } from '@testing-library/react';

import { AuthContext } from '@/providers/auth-provider';
import { usePermission } from '@/hooks/use-permission';
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
  permissions: [
    { resource: 'tickets', action: 'write' },
    { resource: 'tickets', action: 'read' },
  ],
};

function makeWrapper(user: User | null, isLoading = false) {
  const value: AuthContextValue = {
    user,
    tenant: user?.tenant_id ?? null,
    isAuthenticated: user !== null,
    isLoading,
    login: jest.fn(),
    logout: jest.fn(),
  };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  };
}

// ─── AC-12: usePermission checks user.permissions ────────────────────────────
describe('AC-12: usePermission', () => {
  it('returns hasPermission=true when permission exists', () => {
    const { result } = renderHook(() => usePermission('tickets', 'write'), {
      wrapper: makeWrapper(MOCK_USER),
    });
    expect(result.current.hasPermission).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns hasPermission=false when permission does not exist', () => {
    const { result } = renderHook(() => usePermission('admin', 'delete'), {
      wrapper: makeWrapper(MOCK_USER),
    });
    expect(result.current.hasPermission).toBe(false);
  });

  it('returns hasPermission=false when user is null', () => {
    const { result } = renderHook(() => usePermission('tickets', 'write'), {
      wrapper: makeWrapper(null),
    });
    expect(result.current.hasPermission).toBe(false);
  });

  it('reflects isLoading from context', () => {
    const { result } = renderHook(() => usePermission('tickets', 'write'), {
      wrapper: makeWrapper(null, true),
    });
    expect(result.current.isLoading).toBe(true);
  });
});
