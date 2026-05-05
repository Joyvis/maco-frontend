'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types/product';

// ─── Query key factories ───────────────────────────────────────────────────────
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export function useCategories() {
  const { data, ...rest } = useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () =>
      apiClient.get<ApiResponse<Category[]>>('/catalog/categories'),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      apiClient.post<ApiResponse<Category>>('/catalog/categories', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      apiClient.patch<ApiResponse<Category>>(
        `/catalog/categories/${id}`,
        input,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<ApiResponse<void>>(`/catalog/categories/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ id: string; display_order: number }>) =>
      apiClient.put<ApiResponse<void>>('/catalog/categories/reorder', {
        items,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}
