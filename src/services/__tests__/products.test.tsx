import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import {
  productKeys,
  categoryKeys,
  useProducts,
  useProduct,
  useCategories,
  useCreateProduct,
  useActivateProduct,
  useArchiveProduct,
} from '@/services/products';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import type { Product, Category } from '@/types/product';

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

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Shampoo Premium',
  unit: 'ml',
  base_price: 29.9,
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
};

// ─── productKeys factory ───────────────────────────────────────────────────────
describe('productKeys factory', () => {
  it('all returns base key', () => {
    expect(productKeys.all).toEqual(['products']);
  });

  it('lists() returns list key', () => {
    expect(productKeys.lists()).toEqual(['products', 'list']);
  });

  it('list(filters) appends filters', () => {
    expect(productKeys.list({ status: 'active' })).toEqual([
      'products',
      'list',
      { status: 'active' },
    ]);
  });

  it('details() returns detail key', () => {
    expect(productKeys.details()).toEqual(['products', 'detail']);
  });

  it('detail(id) appends id', () => {
    expect(productKeys.detail('abc')).toEqual(['products', 'detail', 'abc']);
  });
});

// ─── categoryKeys factory ──────────────────────────────────────────────────────
describe('categoryKeys factory', () => {
  it('all returns base key', () => {
    expect(categoryKeys.all).toEqual(['categories']);
  });

  it('lists() returns list key', () => {
    expect(categoryKeys.lists()).toEqual(['categories', 'list']);
  });
});

// ─── useProducts ───────────────────────────────────────────────────────────────
describe('useProducts returns data, meta, isLoading', () => {
  it('returns data and meta from paginated response', async () => {
    const mockResponse: PaginatedResponse<Product> = {
      data: [mockProduct],
      meta: { total: 1, page: 1, page_size: 10 },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProducts({}), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockResponse.data);
    expect(result.current.meta).toEqual(mockResponse.meta);
  });
});

// ─── useProduct ────────────────────────────────────────────────────────────────
describe('useProduct returns unwrapped single product', () => {
  it('returns unwrapped product data by id', async () => {
    const mockResponse: ApiResponse<Product> = { data: mockProduct };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProduct('prod-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockProduct);
  });
});

// ─── useCategories ─────────────────────────────────────────────────────────────
describe('useCategories returns category list', () => {
  it('returns unwrapped category array', async () => {
    const categories: Category[] = [{ id: 'cat-1', name: 'Cabelo' }];
    (apiClient.get as Mock).mockResolvedValue({ data: categories });

    const { result } = renderHook(() => useCategories(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(categories);
  });

  it('returns empty array while loading', () => {
    (apiClient.get as Mock).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCategories(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.data).toEqual([]);
  });
});

// ─── useCreateProduct invalidates list ────────────────────────────────────────
describe('useCreateProduct invalidates products list on success', () => {
  it('calls invalidateQueries for products list after mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({ data: mockProduct });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateProduct(), { wrapper });
    result.current.mutate({
      name: 'Shampoo',
      unit: 'ml',
      base_price: 29.9,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: productKeys.lists() }),
    );
  });
});

// ─── useActivateProduct invalidates list and detail ───────────────────────────
describe('useActivateProduct invalidates list and detail on success', () => {
  it('invalidates both list and detail caches', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({ data: mockProduct });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useActivateProduct(), { wrapper });
    result.current.mutate('prod-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: productKeys.lists() }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: productKeys.detail('prod-1') }),
    );
  });
});

// ─── useArchiveProduct invalidates list and detail ────────────────────────────
describe('useArchiveProduct invalidates list and detail on success', () => {
  it('invalidates both list and detail caches', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({ data: mockProduct });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useArchiveProduct(), { wrapper });
    result.current.mutate('prod-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: productKeys.lists() }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: productKeys.detail('prod-1') }),
    );
  });
});
