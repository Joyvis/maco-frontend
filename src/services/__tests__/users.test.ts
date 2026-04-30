import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import {
  userKeys,
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useReactivateUser,
  useInviteUser,
} from '@/services/users';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import type { ManagedUser } from '@/types/user-management';

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

beforeEach(() => vi.clearAllMocks());

const MOCK_USER: ManagedUser = {
  id: '1',
  name: 'João Silva',
  email: 'joao@example.com',
  roles: [{ id: 'r1', name: 'Admin' }],
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
};

describe('userKeys factory', () => {
  it('all returns base key', () => {
    expect(userKeys.all).toEqual(['users']);
  });

  it('lists() returns list key', () => {
    expect(userKeys.lists()).toEqual(['users', 'list']);
  });

  it('list(filters) appends filters', () => {
    expect(userKeys.list({ status: 'active' })).toEqual([
      'users',
      'list',
      { status: 'active' },
    ]);
  });

  it('details() returns detail key', () => {
    expect(userKeys.details()).toEqual(['users', 'detail']);
  });

  it('detail(id) appends id', () => {
    expect(userKeys.detail('abc')).toEqual(['users', 'detail', 'abc']);
  });
});

describe('useUsers', () => {
  it('returns data from paginated response', async () => {
    const mockResponse: PaginatedResponse<ManagedUser> = {
      data: [MOCK_USER],
      meta: { total: 1, page: 1, page_size: 100 },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUsers({}), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([MOCK_USER]);
    expect(result.current.meta).toEqual(mockResponse.meta);
  });

  it('returns empty array when no data', async () => {
    (apiClient.get as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUsers(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it('passes status filter to API', async () => {
    const mockResponse: PaginatedResponse<ManagedUser> = {
      data: [],
      meta: { total: 0, page: 1, page_size: 100 },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUsers({ status: 'active' }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith(
      '/users',
      expect.objectContaining({ status: 'active' }),
    );
  });
});

describe('useUser', () => {
  it('returns unwrapped user data', async () => {
    const mockResponse: ApiResponse<ManagedUser> = { data: MOCK_USER };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUser('1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(MOCK_USER);
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useUser(''), {
      wrapper: makeWrapper(),
    });

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});

describe('useCreateUser', () => {
  it('calls POST /users and invalidates list', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const mockResponse: ApiResponse<ManagedUser> = { data: MOCK_USER };
    (apiClient.post as Mock).mockResolvedValue(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );

    const { result } = renderHook(() => useCreateUser(), { wrapper });
    result.current.mutate({
      name: 'João',
      email: 'joao@example.com',
      password: 'senha12345',
      role_ids: ['r1'],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('/users', expect.any(Object));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: userKeys.lists() }),
    );
  });
});

describe('useUpdateUser', () => {
  it('calls PATCH /users/:id and invalidates caches', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const mockResponse: ApiResponse<ManagedUser> = { data: MOCK_USER };
    (apiClient.patch as Mock).mockResolvedValue(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );

    const { result } = renderHook(() => useUpdateUser('1'), { wrapper });
    result.current.mutate({ name: 'João Atualizado', role_ids: ['r1'] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/users/1',
      expect.any(Object),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: userKeys.lists() }),
    );
  });
});

describe('useDeactivateUser', () => {
  it('calls POST /users/:id/deactivate', async () => {
    (apiClient.post as Mock).mockResolvedValue({
      data: { ...MOCK_USER, status: 'inactive' },
    });

    const { result } = renderHook(() => useDeactivateUser(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('/users/1/deactivate');
  });
});

describe('useReactivateUser', () => {
  it('calls POST /users/:id/reactivate', async () => {
    (apiClient.post as Mock).mockResolvedValue({ data: MOCK_USER });

    const { result } = renderHook(() => useReactivateUser(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('/users/1/reactivate');
  });
});

describe('useInviteUser', () => {
  it('calls POST /users/invite', async () => {
    (apiClient.post as Mock).mockResolvedValue({ data: { id: 'inv-1' } });

    const { result } = renderHook(() => useInviteUser(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      email: 'novo@example.com',
      role_ids: ['r1'],
      message: 'Bem-vindo!',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/invite',
      expect.any(Object),
    );
  });
});
