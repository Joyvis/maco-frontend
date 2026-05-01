import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

import type { Role } from '@/types/role';
import { apiClient } from '@/services/api-client';

import {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  roleKeys,
} from '../roles';

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = apiClient as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockRole: Role = {
  id: '1',
  name: 'Admin',
  is_system: true,
  user_count: 3,
  created_at: '2024-01-01T00:00:00Z',
  permissions: [{ resource: 'users', action: 'read' }],
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('roleKeys', () => {
  it('returns stable keys', () => {
    expect(roleKeys.all).toEqual(['roles']);
    expect(roleKeys.lists()).toEqual(['roles', 'list']);
    expect(roleKeys.detail('1')).toEqual(['roles', 'detail', '1']);
  });
});

describe('useRoles', () => {
  it('fetches paginated roles', async () => {
    mockApiClient.get.mockResolvedValue({
      data: [mockRole],
      meta: { total: 1, page: 1, page_size: 10 },
    });

    const { result } = renderHook(() => useRoles(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([mockRole]);
  });
});

describe('useRole', () => {
  it('fetches a single role by id', async () => {
    mockApiClient.get.mockResolvedValue({ data: mockRole });

    const { result } = renderHook(() => useRole('1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockRole);
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useRole(''), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});

describe('useCreateRole', () => {
  it('posts to /roles and invalidates list', async () => {
    mockApiClient.post.mockResolvedValue({ data: mockRole });

    const { result } = renderHook(() => useCreateRole(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ name: 'Admin', permissions: [] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiClient.post).toHaveBeenCalledWith('/roles', {
      name: 'Admin',
      permissions: [],
    });
  });
});

describe('useUpdateRole', () => {
  it('patches /roles/:id', async () => {
    mockApiClient.patch.mockResolvedValue({ data: mockRole });

    const { result } = renderHook(() => useUpdateRole('1'), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ name: 'Updated Admin' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiClient.patch).toHaveBeenCalledWith('/roles/1', {
      name: 'Updated Admin',
    });
  });
});

describe('useDeleteRole', () => {
  it('deletes /roles/:id', async () => {
    mockApiClient.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRole(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiClient.delete).toHaveBeenCalledWith('/roles/1');
  });
});
