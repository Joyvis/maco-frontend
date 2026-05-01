import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import type { TenantConfig } from '@/types/tenant';

import { ConfigEditor } from '../config-editor';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
  configureAuth: vi.fn(),
  resetAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const MOCK_CONFIGS: TenantConfig[] = [
  { key: 'timezone', value: 'America/Sao_Paulo', group: 'general' },
  { key: 'locale', value: 'pt-BR', group: 'general' },
  { key: 'business_hours_start', value: '08:00', group: 'business_hours' },
  { key: 'business_hours_end', value: '18:00', group: 'business_hours' },
  {
    key: 'business_hours_days',
    value: 'mon,tue,wed,thu,fri',
    group: 'business_hours',
  },
  { key: 'notify_email', value: 'notif@empresa.com', group: 'notifications' },
  { key: 'notify_sms', value: '+55 11 99999', group: 'notifications' },
];

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

describe('ConfigEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching configs', () => {
    (apiClient.get as Mock).mockReturnValue(new Promise(() => {}));
    render(<ConfigEditor tenantId="tenant-1" />, { wrapper: makeWrapper() });
    expect(
      screen.getByRole('status', { name: 'Carregando configurações' }),
    ).toBeInTheDocument();
  });

  it('renders all config groups', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_CONFIGS });
    render(<ConfigEditor tenantId="tenant-1" />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Geral')).toBeInTheDocument();
    });
    expect(screen.getByText('Horário Comercial')).toBeInTheDocument();
    expect(screen.getByText('Notificações')).toBeInTheDocument();
  });

  it('renders timezone search input', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_CONFIGS });
    render(<ConfigEditor tenantId="tenant-1" />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText('Buscar fuso horário')).toBeInTheDocument();
    });
  });

  it('filters timezone options when search is typed', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_CONFIGS });
    render(<ConfigEditor tenantId="tenant-1" />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText('Buscar fuso horário')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Buscar fuso horário');
    await userEvent.type(searchInput, 'Sao_Paulo');

    expect(searchInput).toHaveValue('Sao_Paulo');
  });

  it('populates notify_email field from config', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_CONFIGS });
    render(<ConfigEditor tenantId="tenant-1" />, { wrapper: makeWrapper() });

    const emailInput = await screen.findByLabelText('E-mail para Notificações');
    expect(emailInput).toHaveValue('notif@empresa.com');
  });

  it('submits PUT with all config values on save', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_CONFIGS });
    (apiClient.put as Mock).mockResolvedValue({ data: MOCK_CONFIGS });
    const { toast } = await import('sonner');

    render(<ConfigEditor tenantId="tenant-1" />, { wrapper: makeWrapper() });

    await screen.findByText('Geral');
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar Configurações' }),
    );

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(
        '/tenants/tenant-1/configs',
        expect.objectContaining({
          configs: expect.arrayContaining([
            expect.objectContaining({ key: 'timezone', group: 'general' }),
            expect.objectContaining({ key: 'locale', group: 'general' }),
            expect.objectContaining({
              key: 'business_hours_start',
              group: 'business_hours',
            }),
          ]),
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith(
      'Configurações salvas com sucesso',
    );
  });

  it('shows error toast when save fails', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_CONFIGS });
    (apiClient.put as Mock).mockRejectedValue(new Error('Network error'));
    const { toast } = await import('sonner');

    render(<ConfigEditor tenantId="tenant-1" />, { wrapper: makeWrapper() });

    await screen.findByText('Geral');
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar Configurações' }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Erro ao salvar configurações. Tente novamente.',
      );
    });
  });
});
