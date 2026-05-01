import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import {
  serviceKeys,
  consumptionKeys,
  dependencyKeys,
  useServices,
  useService,
  useAllServices,
  useCreateService,
  useUpdateService,
  useActivateService,
  useArchiveService,
  useConsumptions,
  useAddConsumption,
  useRemoveConsumption,
  useDependencies,
  useAddDependency,
  useRemoveDependency,
} from '@/services/services';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import type {
  Service,
  ServiceConsumption,
  ServiceDependency,
} from '@/types/service';

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

const mockService: Service = {
  id: 'svc-1',
  name: 'Corte de Cabelo',
  duration_minutes: 60,
  base_price: 50,
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
};

// ─── serviceKeys factory ───────────────────────────────────────────────────────
describe('serviceKeys factory', () => {
  it('all returns base key', () => {
    expect(serviceKeys.all).toEqual(['services']);
  });

  it('lists() returns list key', () => {
    expect(serviceKeys.lists()).toEqual(['services', 'list']);
  });

  it('list(filters) appends filters', () => {
    expect(serviceKeys.list({ status: 'active' })).toEqual([
      'services',
      'list',
      { status: 'active' },
    ]);
  });

  it('details() returns detail key', () => {
    expect(serviceKeys.details()).toEqual(['services', 'detail']);
  });

  it('detail(id) appends id', () => {
    expect(serviceKeys.detail('abc')).toEqual(['services', 'detail', 'abc']);
  });
});

// ─── consumptionKeys factory ───────────────────────────────────────────────────
describe('consumptionKeys factory', () => {
  it('all(serviceId) returns scoped key', () => {
    expect(consumptionKeys.all('svc-1')).toEqual([
      'services',
      'svc-1',
      'consumptions',
    ]);
  });
});

// ─── dependencyKeys factory ────────────────────────────────────────────────────
describe('dependencyKeys factory', () => {
  it('all(serviceId) returns scoped key', () => {
    expect(dependencyKeys.all('svc-1')).toEqual([
      'services',
      'svc-1',
      'dependencies',
    ]);
  });
});

// ─── useServices ──────────────────────────────────────────────────────────────
describe('useServices returns data, meta, isLoading', () => {
  it('returns data and meta from paginated response', async () => {
    const mockResponse: PaginatedResponse<Service> = {
      data: [mockService],
      meta: { total: 1, page: 1, page_size: 10 },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useServices({}), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockResponse.data);
    expect(result.current.meta).toEqual(mockResponse.meta);
  });
});

// ─── useService ───────────────────────────────────────────────────────────────
describe('useService returns unwrapped single item', () => {
  it('returns unwrapped service data by id', async () => {
    const mockResponse: ApiResponse<Service> = { data: mockService };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useService('svc-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockService);
  });
});

// ─── useAllServices ───────────────────────────────────────────────────────────
describe('useAllServices returns flattened service list', () => {
  it('returns data array from paginated response', async () => {
    const mockResponse: PaginatedResponse<Service> = {
      data: [mockService],
      meta: { total: 1, page: 1, page_size: 100 },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAllServices(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockResponse.data);
  });

  it('returns empty array while loading', () => {
    (apiClient.get as Mock).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAllServices(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.data).toEqual([]);
  });
});

// ─── useCreateService invalidates list ────────────────────────────────────────
describe('useCreateService invalidates services list on success', () => {
  it('calls invalidateQueries for services list after mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    (apiClient.post as Mock).mockResolvedValue({ data: mockService });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateService(), { wrapper });
    result.current.mutate({
      name: 'Corte de Cabelo',
      duration_minutes: 60,
      base_price: 50,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: serviceKeys.lists() }),
    );
  });
});

// ─── useUpdateService invalidates list and detail ─────────────────────────────
describe('useUpdateService invalidates list and detail on success', () => {
  it('invalidates both list and detail caches', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    (apiClient.patch as Mock).mockResolvedValue({ data: mockService });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateService('svc-1'), { wrapper });
    result.current.mutate({ name: 'Novo Nome' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: serviceKeys.lists() }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: serviceKeys.detail('svc-1') }),
    );
  });
});

// ─── useActivateService invalidates list and detail ───────────────────────────
describe('useActivateService invalidates list and detail on success', () => {
  it('invalidates both list and detail caches', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    (apiClient.post as Mock).mockResolvedValue({ data: mockService });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useActivateService(), { wrapper });
    result.current.mutate('svc-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: serviceKeys.lists() }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: serviceKeys.detail('svc-1') }),
    );
  });
});

// ─── useArchiveService invalidates list and detail ────────────────────────────
describe('useArchiveService invalidates list and detail on success', () => {
  it('invalidates both list and detail caches', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    (apiClient.post as Mock).mockResolvedValue({ data: mockService });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useArchiveService(), { wrapper });
    result.current.mutate('svc-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: serviceKeys.lists() }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: serviceKeys.detail('svc-1') }),
    );
  });
});

// ─── useConsumptions ──────────────────────────────────────────────────────────
describe('useConsumptions returns consumption list', () => {
  it('returns unwrapped consumptions array', async () => {
    const consumptions: ServiceConsumption[] = [
      { product_id: 'p-1', product_name: 'Shampoo', quantity_per_use: 2 },
    ];
    (apiClient.get as Mock).mockResolvedValue({ data: consumptions });

    const { result } = renderHook(() => useConsumptions('svc-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(consumptions);
  });

  it('returns empty array while loading', () => {
    (apiClient.get as Mock).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useConsumptions('svc-1'), {
      wrapper: makeWrapper(),
    });

    expect(result.current.data).toEqual([]);
  });
});

// ─── useAddConsumption invalidates consumptions ───────────────────────────────
describe('useAddConsumption invalidates consumption list on success', () => {
  it('invalidates consumption cache after add', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    (apiClient.post as Mock).mockResolvedValue({
      data: { product_id: 'p-1', quantity_per_use: 2 },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAddConsumption('svc-1'), {
      wrapper,
    });
    result.current.mutate({ product_id: 'p-1', quantity_per_use: 2 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: consumptionKeys.all('svc-1') }),
    );
  });
});

// ─── useRemoveConsumption invalidates consumptions ────────────────────────────
describe('useRemoveConsumption invalidates consumption list on success', () => {
  it('invalidates consumption cache after remove', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    (apiClient.delete as Mock).mockResolvedValue({ data: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRemoveConsumption('svc-1'), {
      wrapper,
    });
    result.current.mutate('p-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: consumptionKeys.all('svc-1') }),
    );
  });
});

// ─── useDependencies ──────────────────────────────────────────────────────────
describe('useDependencies returns dependency list', () => {
  it('returns unwrapped dependencies array', async () => {
    const deps: ServiceDependency[] = [
      {
        id: 'd-1',
        service_id: 'svc-2',
        service_name: 'Lavagem',
        auto_include: true,
      },
    ];
    (apiClient.get as Mock).mockResolvedValue({ data: deps });

    const { result } = renderHook(() => useDependencies('svc-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(deps);
  });

  it('returns empty array while loading', () => {
    (apiClient.get as Mock).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDependencies('svc-1'), {
      wrapper: makeWrapper(),
    });

    expect(result.current.data).toEqual([]);
  });
});

// ─── useAddDependency invalidates dependencies ────────────────────────────────
describe('useAddDependency invalidates dependency list on success', () => {
  it('invalidates dependency cache after add', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    (apiClient.post as Mock).mockResolvedValue({
      data: { id: 'd-1', service_id: 'svc-2', auto_include: true },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAddDependency('svc-1'), { wrapper });
    result.current.mutate({ service_id: 'svc-2', auto_include: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: dependencyKeys.all('svc-1') }),
    );
  });
});

// ─── useRemoveDependency invalidates dependencies ─────────────────────────────
describe('useRemoveDependency invalidates dependency list on success', () => {
  it('invalidates dependency cache after remove', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    (apiClient.delete as Mock).mockResolvedValue({ data: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRemoveDependency('svc-1'), {
      wrapper,
    });
    result.current.mutate('d-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: dependencyKeys.all('svc-1') }),
    );
  });
});
