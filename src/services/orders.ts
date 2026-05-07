'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  AdminSaleOrder,
  AdminOrderFilters,
  SaleOrderItem,
  SaleOrderPayment,
  SaleOrderHistoryEntry,
  CancelAdminOrderInput,
} from '@/types/order';

// ─── Query key factory ─────────────────────────────────────────────────────────
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: AdminOrderFilters) =>
    [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  items: (id: string) => [...orderKeys.detail(id), 'items'] as const,
  payments: (id: string) => [...orderKeys.detail(id), 'payments'] as const,
  history: (id: string) => [...orderKeys.detail(id), 'history'] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────────
export function useOrders(filters: AdminOrderFilters = {}) {
  const { data, ...rest } = useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () =>
      apiClient.get<PaginatedResponse<AdminSaleOrder>>('/sale-orders', filters),
  });
  return { data: data?.data ?? [], meta: data?.meta, ...rest };
}

export function useOrder(id: string) {
  const { data, ...rest } = useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () =>
      apiClient.get<ApiResponse<AdminSaleOrder>>(`/sale-orders/${id}`),
    enabled: Boolean(id),
  });
  return { data: data?.data, ...rest };
}

export function useOrderItems(id: string) {
  const { data, ...rest } = useQuery({
    queryKey: orderKeys.items(id),
    queryFn: () =>
      apiClient.get<ApiResponse<SaleOrderItem[]>>(`/sale-orders/${id}/items`),
    enabled: Boolean(id),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useOrderPayments(id: string) {
  const { data, ...rest } = useQuery({
    queryKey: orderKeys.payments(id),
    queryFn: () =>
      apiClient.get<ApiResponse<SaleOrderPayment[]>>(
        `/sale-orders/${id}/payments`,
      ),
    enabled: Boolean(id),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useOrderHistory(id: string) {
  const { data, ...rest } = useQuery({
    queryKey: orderKeys.history(id),
    queryFn: () =>
      apiClient.get<ApiResponse<SaleOrderHistoryEntry[]>>(
        `/sale-orders/${id}/history`,
      ),
    enabled: Boolean(id),
  });
  return { data: data?.data ?? [], ...rest };
}

// ─── Mutations ─────────────────────────────────────────────────────────────────
function useOrderTransition(endpoint: (id: string) => string, body?: unknown) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<ApiResponse<AdminSaleOrder>>(endpoint(id), body),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useCheckIn() {
  return useOrderTransition((id) => `/sale-orders/${id}/check-in`);
}

export function useStartService() {
  return useOrderTransition((id) => `/sale-orders/${id}/start`);
}

export function useCompleteOrder() {
  return useOrderTransition((id) => `/sale-orders/${id}/complete`);
}

export function useNoShowOrder() {
  return useOrderTransition((id) => `/sale-orders/${id}/no-show`);
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & CancelAdminOrderInput) =>
      apiClient.post<ApiResponse<AdminSaleOrder>>(
        `/sale-orders/${id}/cancel`,
        body,
      ),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
