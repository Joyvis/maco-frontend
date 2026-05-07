import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  ManagedSaleOrder,
  SaleOrderFilters,
  CreateSaleOrderInput,
  AddOrderItemInput,
  AssignStaffInput,
  CatalogItem,
} from '@/types/sale-order';

// ─── Query key factories ───────────────────────────────────────────────────────
export const saleOrderKeys = {
  all: ['sale-orders'] as const,
  lists: () => [...saleOrderKeys.all, 'list'] as const,
  list: (filters: SaleOrderFilters) =>
    [...saleOrderKeys.lists(), filters] as const,
  details: () => [...saleOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...saleOrderKeys.details(), id] as const,
  pool: () => [...saleOrderKeys.all, 'pool'] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export function useSaleOrders(
  filters: Omit<SaleOrderFilters, 'page' | 'page_size'> = {},
  options?: { pageSize?: number; initialPage?: number },
) {
  return usePaginatedQuery<ManagedSaleOrder>(
    (params) => saleOrderKeys.list({ ...filters, ...params }),
    (params) =>
      apiClient.get<PaginatedResponse<ManagedSaleOrder>>('/sale-orders', {
        ...filters,
        ...params,
      }),
    options,
  );
}

export function useSaleOrderPool() {
  const { data, ...rest } = useQuery({
    queryKey: saleOrderKeys.pool(),
    queryFn: () =>
      apiClient.get<PaginatedResponse<ManagedSaleOrder>>('/sale-orders/pool', {
        page: 1,
        page_size: 100,
      }),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useCreateSaleOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleOrderInput) =>
      apiClient.post<ApiResponse<ManagedSaleOrder>>('/sale-orders', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: saleOrderKeys.lists() });
    },
  });
}

export function useAddOrderItem(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddOrderItemInput) =>
      apiClient.post<ApiResponse<ManagedSaleOrder>>(
        `/sale-orders/${orderId}/items`,
        input,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: saleOrderKeys.detail(orderId),
      });
    },
  });
}

export function useRemoveOrderItem(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      apiClient.delete<ApiResponse<ManagedSaleOrder>>(
        `/sale-orders/${orderId}/items/${itemId}`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: saleOrderKeys.detail(orderId),
      });
    },
  });
}

export function useClaimSaleOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      apiClient.post<ApiResponse<ManagedSaleOrder>>(
        `/sale-orders/${orderId}/claim`,
      ),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: saleOrderKeys.pool() });
      const previous = queryClient.getQueryData<
        PaginatedResponse<ManagedSaleOrder>
      >(saleOrderKeys.pool());
      queryClient.setQueryData<PaginatedResponse<ManagedSaleOrder>>(
        saleOrderKeys.pool(),
        (old) => {
          if (!old) return old;
          return { ...old, data: old.data.filter((o) => o.id !== orderId) };
        },
      );
      return { previous };
    },
    onError: (_err, _orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(saleOrderKeys.pool(), context.previous);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: saleOrderKeys.pool() });
      void queryClient.invalidateQueries({ queryKey: saleOrderKeys.lists() });
    },
  });
}

export function useAssignSaleOrderStaff(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignStaffInput) =>
      apiClient.post<ApiResponse<ManagedSaleOrder>>(
        `/sale-orders/${orderId}/assign`,
        input,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: saleOrderKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: saleOrderKeys.detail(orderId),
      });
    },
  });
}

export function useAllCatalogItems() {
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['catalog-items', 'services'],
    queryFn: () =>
      apiClient.get<
        PaginatedResponse<{ id: string; name: string; price: number }>
      >('/services', { page: 1, page_size: 100 }),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['catalog-items', 'products'],
    queryFn: () =>
      apiClient.get<
        PaginatedResponse<{ id: string; name: string; base_price: number }>
      >('/products', { page: 1, page_size: 100 }),
  });

  const items: CatalogItem[] = [
    ...(servicesData?.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      type: 'service' as const,
      price: s.price,
    })),
    ...(productsData?.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      type: 'product' as const,
      price: p.base_price,
    })),
  ];

  return { data: items, isLoading: servicesLoading || productsLoading };
}
