import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import {
  orderKeys,
  useOrders,
  useOrder,
  useOrderItems,
  useOrderPayments,
  useOrderHistory,
  useCheckIn,
  useStartService,
  useCompleteOrder,
  useCancelOrder,
  useNoShowOrder,
} from '@/services/orders';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import type {
  AdminSaleOrder,
  SaleOrderItem,
  SaleOrderPayment,
  SaleOrderHistoryEntry,
} from '@/types/order';

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

beforeEach(() => {
  vi.clearAllMocks();
});

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

const mockOrder: AdminSaleOrder = {
  id: 'ord-1',
  order_number: 'ORD-001',
  state: 'confirmed',
  customer_name: 'Ana Silva',
  assigned_staff: 'João Barbeiro',
  created_at: '2026-05-01T00:00:00Z',
  balance_due: 0,
  total_amount: 150,
};

// ─── orderKeys factory ─────────────────────────────────────────────────────────
describe('orderKeys factory', () => {
  it('all returns base key', () => {
    expect(orderKeys.all).toEqual(['orders']);
  });

  it('lists returns scoped key', () => {
    expect(orderKeys.lists()).toEqual(['orders', 'list']);
  });

  it('list returns key with filters', () => {
    expect(orderKeys.list({ state: 'confirmed' })).toEqual([
      'orders',
      'list',
      { state: 'confirmed' },
    ]);
  });

  it('detail returns key with id', () => {
    expect(orderKeys.detail('ord-1')).toEqual(['orders', 'detail', 'ord-1']);
  });

  it('items returns nested key', () => {
    expect(orderKeys.items('ord-1')).toEqual([
      'orders',
      'detail',
      'ord-1',
      'items',
    ]);
  });

  it('payments returns nested key', () => {
    expect(orderKeys.payments('ord-1')).toEqual([
      'orders',
      'detail',
      'ord-1',
      'payments',
    ]);
  });

  it('history returns nested key', () => {
    expect(orderKeys.history('ord-1')).toEqual([
      'orders',
      'detail',
      'ord-1',
      'history',
    ]);
  });
});

// ─── useOrders ─────────────────────────────────────────────────────────────────
describe('useOrders', () => {
  it('fetches orders and returns data array', async () => {
    const mockResponse: PaginatedResponse<AdminSaleOrder> = {
      data: [mockOrder],
      meta: { total: 1, page: 1, page_size: 10 },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOrders(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([mockOrder]);
    expect(apiClient.get).toHaveBeenCalledWith('/sale-orders', {});
  });

  it('passes state filter to API', async () => {
    (apiClient.get as Mock).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, page_size: 10 },
    });

    const { result } = renderHook(() => useOrders({ state: 'confirmed' }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith('/sale-orders', {
      state: 'confirmed',
    });
  });

  it('returns empty array when response has no data', async () => {
    (apiClient.get as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOrders(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });
});

// ─── useOrder ──────────────────────────────────────────────────────────────────
describe('useOrder', () => {
  it('fetches single order by id', async () => {
    const mockResponse: ApiResponse<AdminSaleOrder> = { data: mockOrder };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOrder('ord-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockOrder);
    expect(apiClient.get).toHaveBeenCalledWith('/sale-orders/ord-1');
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useOrder(''), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});

// ─── useOrderItems ─────────────────────────────────────────────────────────────
describe('useOrderItems', () => {
  it('fetches order items', async () => {
    const item: SaleOrderItem = {
      id: 'item-1',
      service_id: 'svc-1',
      service_name: 'Corte',
      quantity: 1,
      price_snapshot: 50,
      subtotal: 50,
    };
    const mockResponse: ApiResponse<SaleOrderItem[]> = { data: [item] };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOrderItems('ord-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([item]);
    expect(apiClient.get).toHaveBeenCalledWith('/sale-orders/ord-1/items');
  });
});

// ─── useOrderPayments ──────────────────────────────────────────────────────────
describe('useOrderPayments', () => {
  it('fetches order payments', async () => {
    const payment: SaleOrderPayment = {
      id: 'pay-1',
      amount: 150,
      status: 'paid',
      method: 'Cartão de Crédito',
      created_at: '2026-05-01T10:00:00Z',
    };
    const mockResponse: ApiResponse<SaleOrderPayment[]> = { data: [payment] };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOrderPayments('ord-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([payment]);
    expect(apiClient.get).toHaveBeenCalledWith('/sale-orders/ord-1/payments');
  });
});

// ─── useOrderHistory ───────────────────────────────────────────────────────────
describe('useOrderHistory', () => {
  it('fetches order history entries', async () => {
    const entry: SaleOrderHistoryEntry = {
      id: 'hist-1',
      from_state: null,
      to_state: 'confirmed',
      actor: 'Sistema',
      created_at: '2026-05-01T00:00:00Z',
    };
    const mockResponse: ApiResponse<SaleOrderHistoryEntry[]> = {
      data: [entry],
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOrderHistory('ord-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([entry]);
    expect(apiClient.get).toHaveBeenCalledWith('/sale-orders/ord-1/history');
  });
});

// ─── useCheckIn ────────────────────────────────────────────────────────────────
describe('useCheckIn', () => {
  it('posts to check-in endpoint and invalidates detail and list', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({
      data: { ...mockOrder, state: 'checked_in' },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCheckIn(), { wrapper });
    result.current.mutate('ord-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith(
      '/sale-orders/ord-1/check-in',
      undefined,
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: orderKeys.detail('ord-1') }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: orderKeys.lists() }),
    );
  });
});

// ─── useStartService ───────────────────────────────────────────────────────────
describe('useStartService', () => {
  it('posts to start endpoint', async () => {
    (apiClient.post as Mock).mockResolvedValue({
      data: { ...mockOrder, state: 'in_progress' },
    });

    const { result } = renderHook(() => useStartService(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('ord-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith(
      '/sale-orders/ord-1/start',
      undefined,
    );
  });
});

// ─── useCompleteOrder ──────────────────────────────────────────────────────────
describe('useCompleteOrder', () => {
  it('posts to complete endpoint', async () => {
    (apiClient.post as Mock).mockResolvedValue({
      data: { ...mockOrder, state: 'completed' },
    });

    const { result } = renderHook(() => useCompleteOrder(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('ord-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith(
      '/sale-orders/ord-1/complete',
      undefined,
    );
  });
});

// ─── useCancelOrder ────────────────────────────────────────────────────────────
describe('useCancelOrder', () => {
  it('posts to cancel endpoint with reason and invalidates detail and list', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({
      data: { ...mockOrder, state: 'cancelled' },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCancelOrder(), { wrapper });
    result.current.mutate({ id: 'ord-1', reason: 'Cliente solicitou' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith('/sale-orders/ord-1/cancel', {
      reason: 'Cliente solicitou',
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: orderKeys.detail('ord-1') }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: orderKeys.lists() }),
    );
  });
});

// ─── useNoShowOrder ────────────────────────────────────────────────────────────
describe('useNoShowOrder', () => {
  it('posts to no-show endpoint', async () => {
    (apiClient.post as Mock).mockResolvedValue({
      data: { ...mockOrder, state: 'no_show' },
    });

    const { result } = renderHook(() => useNoShowOrder(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('ord-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith(
      '/sale-orders/ord-1/no-show',
      undefined,
    );
  });
});
