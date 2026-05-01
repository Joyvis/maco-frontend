import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import {
  categoryKeys,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '@/services/categories';
import type { ApiResponse } from '@/types/api';
import type { Category } from '@/types/product';

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
    put: vi.fn(),
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

const mockCategory: Category = {
  id: 'cat-1',
  name: 'Cabelo',
  display_order: 0,
};

// ─── categoryKeys factory ──────────────────────────────────────────────────────
describe('categoryKeys factory', () => {
  it('all returns base key', () => {
    expect(categoryKeys.all).toEqual(['categories']);
  });

  it('lists() returns list key', () => {
    expect(categoryKeys.lists()).toEqual(['categories', 'list']);
  });
});

// ─── useCategories ─────────────────────────────────────────────────────────────
describe('useCategories', () => {
  it('returns unwrapped category array', async () => {
    const response: ApiResponse<Category[]> = { data: [mockCategory] };
    (apiClient.get as Mock).mockResolvedValue(response);

    const { result } = renderHook(() => useCategories(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([mockCategory]);
  });

  it('returns empty array while loading', () => {
    (apiClient.get as Mock).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCategories(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.data).toEqual([]);
  });
});

// ─── useCreateCategory ────────────────────────────────────────────────────────
describe('useCreateCategory invalidates list on success', () => {
  it('calls invalidateQueries for categories list after mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({ data: mockCategory });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateCategory(), { wrapper });
    result.current.mutate({ name: 'Unhas' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: categoryKeys.lists() }),
    );
  });
});

// ─── useUpdateCategory ────────────────────────────────────────────────────────
describe('useUpdateCategory invalidates list on success', () => {
  it('calls invalidateQueries for categories list after mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.patch as Mock).mockResolvedValue({ data: mockCategory });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateCategory(), { wrapper });
    result.current.mutate({ id: 'cat-1', input: { name: 'Cabelo Novo' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: categoryKeys.lists() }),
    );
  });
});

// ─── useDeleteCategory ────────────────────────────────────────────────────────
describe('useDeleteCategory invalidates list on success', () => {
  it('calls invalidateQueries for categories list after mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.delete as Mock).mockResolvedValue({ data: undefined });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteCategory(), { wrapper });
    result.current.mutate('cat-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: categoryKeys.lists() }),
    );
  });
});

// ─── useReorderCategories ─────────────────────────────────────────────────────
describe('useReorderCategories invalidates list on success', () => {
  it('calls invalidateQueries for categories list after mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.put as Mock).mockResolvedValue({ data: undefined });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useReorderCategories(), { wrapper });
    result.current.mutate([{ id: 'cat-1', display_order: 0 }]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: categoryKeys.lists() }),
    );
  });
});
