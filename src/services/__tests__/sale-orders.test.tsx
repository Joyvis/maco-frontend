import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import {
  saleOrderKeys,
  useSaleOrders,
  useSaleOrderPool,
  useCreateSaleOrder,
  useAddOrderItem,
  useRemoveOrderItem,
  useClaimSaleOrder,
  useAssignSaleOrderStaff,
} from '@/services/sale-orders';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import type { ManagedSaleOrder } from '@/types/sale-order';

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

const mockOrder: ManagedSaleOrder = {
  id: 'order-1',
  order_number: '001',
  customer_name: 'Maria Silva',
  state: 'confirmed',
  total_amount: 150.0,
  items: [],
  prepayment_required: false,
  created_at: '2024-01-01T00:00:00Z',
};

// ─── saleOrderKeys factory ─────────────────────────────────────────────────────
describe('saleOrderKeys factory', () => {
  it('all returns base key', () => {
    expect(saleOrderKeys.all).toEqual(['sale-orders']);
  });

  it('lists() returns list key', () => {
    expect(saleOrderKeys.lists()).toEqual(['sale-orders', 'list']);
  });

  it('list(filters) appends filters', () => {
    expect(saleOrderKeys.list({ state: 'confirmed' })).toEqual([
      'sale-orders',
      'list',
      { state: 'confirmed' },
    ]);
  });

  it('detail(id) appends id', () => {
    expect(saleOrderKeys.detail('abc')).toEqual([
      'sale-orders',
      'detail',
      'abc',
    ]);
  });

  it('pool() returns pool key', () => {
    expect(saleOrderKeys.pool()).toEqual(['sale-orders', 'pool']);
  });
});

// ─── useSaleOrders ─────────────────────────────────────────────────────────────
describe('useSaleOrders', () => {
  it('returns data and meta from paginated response', async () => {
    const mockResponse: PaginatedResponse<ManagedSaleOrder> = {
      data: [mockOrder],
      meta: { total: 1, page: 1, page_size: 10 },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSaleOrders({}), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([mockOrder]);
    expect(result.current.meta).toEqual(mockResponse.meta);
  });
});

// ─── useSaleOrderPool ─────────────────────────────────────────────────────────
describe('useSaleOrderPool', () => {
  it('returns unwrapped pool orders', async () => {
    const mockResponse: PaginatedResponse<ManagedSaleOrder> = {
      data: [mockOrder],
      meta: { total: 1, page: 1, page_size: 100 },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSaleOrderPool(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([mockOrder]);
  });

  it('returns empty array while loading', () => {
    (apiClient.get as Mock).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useSaleOrderPool(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.data).toEqual([]);
  });
});

// ─── useCreateSaleOrder ────────────────────────────────────────────────────────
describe('useCreateSaleOrder', () => {
  it('invalidates sale orders list on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({ data: mockOrder });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateSaleOrder(), { wrapper });
    result.current.mutate({ customer_name: 'Maria Silva' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: saleOrderKeys.lists() }),
    );
  });
});

// ─── useAddOrderItem ───────────────────────────────────────────────────────────
describe('useAddOrderItem', () => {
  it('invalidates order detail on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({ data: mockOrder });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAddOrderItem('order-1'), {
      wrapper,
    });
    result.current.mutate({
      item_id: 'svc-1',
      item_type: 'service',
      quantity: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: saleOrderKeys.detail('order-1') }),
    );
  });
});

// ─── useRemoveOrderItem ────────────────────────────────────────────────────────
describe('useRemoveOrderItem', () => {
  it('invalidates order detail on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.delete as Mock).mockResolvedValue({ data: mockOrder });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRemoveOrderItem('order-1'), {
      wrapper,
    });
    result.current.mutate('item-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: saleOrderKeys.detail('order-1') }),
    );
  });
});

// ─── useClaimSaleOrder ─────────────────────────────────────────────────────────
describe('useClaimSaleOrder', () => {
  it('invalidates pool and lists on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({ data: mockOrder });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useClaimSaleOrder(), { wrapper });
    result.current.mutate('order-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: saleOrderKeys.pool() }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: saleOrderKeys.lists() }),
    );
  });
});

// ─── useAssignSaleOrderStaff ───────────────────────────────────────────────────
describe('useAssignSaleOrderStaff', () => {
  it('invalidates list and detail on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({ data: mockOrder });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAssignSaleOrderStaff('order-1'), {
      wrapper,
    });
    result.current.mutate({ staff_id: 'staff-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: saleOrderKeys.lists() }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: saleOrderKeys.detail('order-1') }),
    );
  });
});

// ─── ApiResponse type usage ────────────────────────────────────────────────────
describe('ApiResponse type', () => {
  it('is assignable from ManagedSaleOrder', () => {
    const resp: ApiResponse<ManagedSaleOrder> = { data: mockOrder };
    expect(resp.data.id).toBe('order-1');
  });
});
