import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import { roleKeys, useRoles } from '@/services/roles';
import type { ApiResponse } from '@/types/api';
import type { Role } from '@/types/user-management';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  configureAuth: vi.fn(),
  resetAuth: vi.fn(),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe('roleKeys factory', () => {
  it('all returns base key', () => {
    expect(roleKeys.all).toEqual(['roles']);
  });

  it('lists() returns list key', () => {
    expect(roleKeys.lists()).toEqual(['roles', 'list']);
  });
});

describe('useRoles', () => {
  it('returns list of roles', async () => {
    const mockRoles: Role[] = [
      { id: 'r1', name: 'Admin' },
      { id: 'r2', name: 'Operador' },
    ];
    const mockResponse: ApiResponse<Role[]> = { data: mockRoles };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRoles(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockRoles);
    expect(apiClient.get).toHaveBeenCalledWith('/roles');
  });

  it('returns undefined when loading', () => {
    (apiClient.get as Mock).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useRoles(), { wrapper: makeWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
