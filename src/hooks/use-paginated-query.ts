'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PaginatedResponse } from '@/types/api';

interface PaginationParams {
  page: number;
  page_size: number;
}

interface PaginatedQueryOptions {
  initialPage?: number;
  pageSize?: number;
}

export function usePaginatedQuery<T>(
  keyFactory: (params: PaginationParams) => readonly unknown[],
  fetcher: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  options: PaginatedQueryOptions = {},
) {
  const { initialPage = 1, pageSize = 10 } = options;
  const [page, setPage] = useState(initialPage);

  const params: PaginationParams = { page, page_size: pageSize };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: keyFactory(params),
    queryFn: () => fetcher(params),
  });

  return {
    data: data?.data,
    meta: data?.meta,
    isLoading,
    isFetching,
    page,
    setPage,
  };
}
