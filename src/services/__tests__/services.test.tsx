import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import {
  serviceKeys,
  useServices,
  useService,
  useCreateService,
} from '@/services/services';
import type { PaginatedResponse, ApiResponse } from '@/types/api';

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
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// ─── AC-17: serviceKeys factory ───────────────────────────────────────────────
describe('AC-17: serviceKeys factory', () => {
  it('all returns base key', () => {
    expect(serviceKeys.all).toEqual(['services']);
  });

  it('lists() returns list key', () => {
    expect(serviceKeys.lists()).toEqual(['services', 'list']);
  });

  it('list(filters) appends filters', () => {
    expect(serviceKeys.list({ status: 'active' })).toEqual([
      'services',
      'list',
      { status: 'active' },
    ]);
  });

  it('details() returns detail key', () => {
    expect(serviceKeys.details()).toEqual(['services', 'detail']);
  });

  it('detail(id) appends id', () => {
    expect(serviceKeys.detail('abc')).toEqual(['services', 'detail', 'abc']);
  });
});

// ─── AC-18: useServices hook ──────────────────────────────────────────────────
describe('AC-18: useServices returns data, meta, isLoading', () => {
  it('returns data and meta from paginated response', async () => {
    const mockResponse: PaginatedResponse<{ id: string; name: string }> = {
      data: [{ id: '1', name: 'My Service' }],
      meta: { total: 1, page: 1, page_size: 10 },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useServices({}), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockResponse.data);
    expect(result.current.meta).toEqual(mockResponse.meta);
    expect(result.current.isLoading).toBe(false);
  });
});

// ─── AC-18: useService hook ───────────────────────────────────────────────────
describe('AC-18: useService returns unwrapped single item', () => {
  it('returns unwrapped service data by id', async () => {
    const mockResponse: ApiResponse<{ id: string; name: string }> = {
      data: { id: '1', name: 'My Service' },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useService('1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockResponse.data);
  });
});

// ─── AC-19: useCreateService invalidates list cache ───────────────────────────
describe('AC-19: useCreateService invalidates services list on success', () => {
  it('calls invalidateQueries for services list after mutation success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const mockCreate: ApiResponse<{ id: string; name: string }> = {
      data: { id: '2', name: 'New Service' },
    };
    (apiClient.post as Mock).mockResolvedValue(mockCreate);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateService(), { wrapper });
    result.current.mutate({ name: 'New Service' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: serviceKeys.lists() }),
    );
  });
});
