'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  Product,
  Category,
  ProductFilters,
  CreateProductInput,
  UpdateProductInput,
} from '@/types/product';

// ─── Query key factories ───────────────────────────────────────────────────────
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export function useProducts(
  filters: Omit<ProductFilters, 'page' | 'page_size'> = {},
  options?: { pageSize?: number; initialPage?: number },
) {
  return usePaginatedQuery<Product>(
    (params) => productKeys.list({ ...filters, ...params }),
    (params) =>
      apiClient.get<PaginatedResponse<Product>>('/products', {
        ...filters,
        ...params,
      }),
    options,
  );
}

export function useProduct(id: string) {
  const { data, ...rest } = useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => apiClient.get<ApiResponse<Product>>(`/products/${id}`),
    enabled: Boolean(id),
  });
  return { data: data?.data, ...rest };
}

export function useCategories() {
  const { data, ...rest } = useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () => apiClient.get<ApiResponse<Category[]>>('/categories'),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      apiClient.post<ApiResponse<Product>>('/products', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProductInput) =>
      apiClient.patch<ApiResponse<Product>>(`/products/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    },
  });
}

export function useActivateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<ApiResponse<Product>>(`/products/${id}/activate`),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    },
  });
}

export function useArchiveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<ApiResponse<Product>>(`/products/${id}/archive`),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    },
  });
}
