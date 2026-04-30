import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import {
  tenantKeys,
  useTenant,
  useUpdateTenant,
  useTenantConfigs,
  useUpdateTenantConfigs,
  useSuspendTenant,
  useReactivateTenant,
  useCancelTenant,
} from '@/services/tenant';
import type { Tenant, TenantConfig } from '@/types/tenant';
import type { ApiResponse } from '@/types/api';

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

const MOCK_TENANT: Tenant = {
  id: 'tenant-1',
  name: 'Empresa Teste',
  account_type: 'standard',
  status: 'active',
  contact_email: 'contato@empresa.com',
  contact_phone: '+55 11 99999-9999',
};

const MOCK_CONFIGS: TenantConfig[] = [
  { key: 'timezone', value: 'America/Sao_Paulo', group: 'general' },
  { key: 'locale', value: 'pt-BR', group: 'general' },
  { key: 'business_hours_start', value: '08:00', group: 'business_hours' },
];

// ─── tenantKeys factory ────────────────────────────────────────────────────────
describe('tenantKeys factory', () => {
  it('all returns base key', () => {
    expect(tenantKeys.all).toEqual(['tenants']);
  });

  it('detail(id) includes id', () => {
    expect(tenantKeys.detail('t1')).toEqual(['tenants', 'detail', 't1']);
  });

  it('configs(id) nests under detail', () => {
    expect(tenantKeys.configs('t1')).toEqual([
      'tenants',
      'detail',
      't1',
      'configs',
    ]);
  });
});

// ─── useTenant ────────────────────────────────────────────────────────────────
describe('useTenant', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns unwrapped tenant data', async () => {
    const response: ApiResponse<Tenant> = { data: MOCK_TENANT };
    (apiClient.get as Mock).mockResolvedValue(response);

    const { result } = renderHook(() => useTenant('tenant-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(MOCK_TENANT);
    expect(apiClient.get).toHaveBeenCalledWith('/tenants/tenant-1');
  });

  it('is disabled when tenantId is empty', () => {
    const { result } = renderHook(() => useTenant(''), {
      wrapper: makeWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});

// ─── useUpdateTenant ──────────────────────────────────────────────────────────
describe('useUpdateTenant', () => {
  it('calls PATCH /tenants/:id and invalidates cache', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const response: ApiResponse<Tenant> = { data: MOCK_TENANT };
    (apiClient.patch as Mock).mockResolvedValue(response);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateTenant('tenant-1'), {
      wrapper,
    });

    result.current.mutate({ name: 'Novo Nome' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.patch).toHaveBeenCalledWith('/tenants/tenant-1', {
      name: 'Novo Nome',
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: tenantKeys.detail('tenant-1') }),
    );
  });
});

// ─── useTenantConfigs ─────────────────────────────────────────────────────────
describe('useTenantConfigs', () => {
  it('returns empty array when no data', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useTenantConfigs('tenant-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it('returns configs array', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_CONFIGS });

    const { result } = renderHook(() => useTenantConfigs('tenant-1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(MOCK_CONFIGS);
  });
});

// ─── useUpdateTenantConfigs ───────────────────────────────────────────────────
describe('useUpdateTenantConfigs', () => {
  it('calls PUT /tenants/:id/configs and invalidates configs cache', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    (apiClient.put as Mock).mockResolvedValue({ data: MOCK_CONFIGS });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateTenantConfigs('tenant-1'), {
      wrapper,
    });

    result.current.mutate({ configs: MOCK_CONFIGS });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('/tenants/tenant-1/configs', {
      configs: MOCK_CONFIGS,
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: tenantKeys.configs('tenant-1') }),
    );
  });
});

// ─── useSuspendTenant ─────────────────────────────────────────────────────────
describe('useSuspendTenant', () => {
  it('calls POST /tenants/:id/suspend', async () => {
    (apiClient.post as Mock).mockResolvedValue({
      data: { ...MOCK_TENANT, status: 'suspended' },
    });

    const { result } = renderHook(() => useSuspendTenant('tenant-1'), {
      wrapper: makeWrapper(),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('/tenants/tenant-1/suspend');
  });
});

// ─── useReactivateTenant ──────────────────────────────────────────────────────
describe('useReactivateTenant', () => {
  it('calls POST /tenants/:id/reactivate', async () => {
    (apiClient.post as Mock).mockResolvedValue({ data: MOCK_TENANT });

    const { result } = renderHook(() => useReactivateTenant('tenant-1'), {
      wrapper: makeWrapper(),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('/tenants/tenant-1/reactivate');
  });
});

// ─── useCancelTenant ──────────────────────────────────────────────────────────
describe('useCancelTenant', () => {
  it('calls POST /tenants/:id/cancel', async () => {
    (apiClient.post as Mock).mockResolvedValue({
      data: { ...MOCK_TENANT, status: 'cancelled' },
    });

    const { result } = renderHook(() => useCancelTenant('tenant-1'), {
      wrapper: makeWrapper(),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('/tenants/tenant-1/cancel');
  });
});
