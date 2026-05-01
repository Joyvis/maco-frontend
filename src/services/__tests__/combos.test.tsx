import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import {
  comboKeys,
  useCombos,
  useCombo,
  useCreateCombo,
  useUpdateCombo,
  useArchiveCombo,
} from '@/services/combos';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import type { ComboSummary, Combo } from '@/types/combo';

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

const mockComboSummary: ComboSummary = {
  id: 'combo-1',
  name: 'Combo Relaxamento',
  discount_percentage: 10,
  status: 'active',
  item_count: 2,
  created_at: '2024-01-01T00:00:00Z',
};

const mockCombo: Combo = {
  ...mockComboSummary,
  items: [
    {
      id: 'ci-1',
      item_type: 'service',
      item_id: 'svc-1',
      name: 'Hidratação',
      base_price: 80,
    },
  ],
};

// ─── comboKeys factory ────────────────────────────────────────────────────────
describe('comboKeys factory', () => {
  it('all returns base key', () => {
    expect(comboKeys.all).toEqual(['combos']);
  });

  it('lists() returns list key', () => {
    expect(comboKeys.lists()).toEqual(['combos', 'list']);
  });

  it('list(filters) appends filters', () => {
    expect(comboKeys.list({ status: 'active' })).toEqual([
      'combos',
      'list',
      { status: 'active' },
    ]);
  });

  it('details() returns detail key', () => {
    expect(comboKeys.details()).toEqual(['combos', 'detail']);
  });

  it('detail(id) appends id', () => {
    expect(comboKeys.detail('combo-1')).toEqual([
      'combos',
      'detail',
      'combo-1',
    ]);
  });
});

// ─── useCombos ────────────────────────────────────────────────────────────────
describe('useCombos returns data and meta', () => {
  it('returns data from paginated response', async () => {
    const response: PaginatedResponse<ComboSummary> = {
      data: [mockComboSummary],
      meta: { total: 1, page: 1, page_size: 10 },
    };
    (apiClient.get as Mock).mockResolvedValue(response);

    const { result } = renderHook(() => useCombos({}), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([mockComboSummary]);
  });
});

// ─── useCombo ─────────────────────────────────────────────────────────────────
describe('useCombo returns unwrapped single combo', () => {
  it('returns unwrapped combo data by id', async () => {
    const response: ApiResponse<Combo> = { data: mockCombo };
    (apiClient.get as Mock).mockResolvedValue(response);

    const { result } = renderHook(() => useCombo('combo-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockCombo);
  });
});

// ─── useCreateCombo ───────────────────────────────────────────────────────────
describe('useCreateCombo invalidates list on success', () => {
  it('calls invalidateQueries for combos list after mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({ data: mockCombo });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateCombo(), { wrapper });
    result.current.mutate({
      name: 'Combo Relaxamento',
      discount_percentage: 10,
      items: [],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: comboKeys.lists() }),
    );
  });
});

// ─── useUpdateCombo ───────────────────────────────────────────────────────────
describe('useUpdateCombo invalidates list and detail on success', () => {
  it('invalidates both list and detail caches', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.patch as Mock).mockResolvedValue({ data: mockCombo });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateCombo('combo-1'), { wrapper });
    result.current.mutate({ name: 'Combo Atualizado' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: comboKeys.lists() }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: comboKeys.detail('combo-1') }),
    );
  });
});

// ─── useArchiveCombo ──────────────────────────────────────────────────────────
describe('useArchiveCombo invalidates list and detail on success', () => {
  it('invalidates both list and detail caches', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.post as Mock).mockResolvedValue({ data: mockCombo });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useArchiveCombo(), { wrapper });
    result.current.mutate('combo-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: comboKeys.lists() }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: comboKeys.detail('combo-1') }),
    );
  });
});
