import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type { ScheduleBlock } from '@/types/schedule';

import { BlockDialog } from '../_components/block-dialog';

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
    delete: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  usePathname: () => '/schedules',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const MOCK_BLOCK: ScheduleBlock = {
  id: 'block-1',
  staff_id: 'staff-1',
  start_date: '2024-06-01',
  end_date: '2024-06-07',
  reason: 'vacation',
};

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

async function openDialog() {
  const trigger = screen.getByRole('button', { name: /Adicionar Bloqueio/i });
  await userEvent.click(trigger);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BlockDialog — AC: dialog opens with required fields', () => {
  it('opens dialog with date, reason, and notes fields', async () => {
    render(<BlockDialog staffId="staff-1" />, { wrapper: makeWrapper() });
    await openDialog();

    expect(
      screen.getByLabelText('Data de início do bloqueio'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Data de fim do bloqueio'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /Motivo do bloqueio/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Observações do bloqueio'),
    ).toBeInTheDocument();
  });

  it('shows all reason options in dropdown', async () => {
    render(<BlockDialog staffId="staff-1" />, { wrapper: makeWrapper() });
    await openDialog();

    const select = screen.getByRole('combobox', {
      name: /Motivo do bloqueio/i,
    });
    await userEvent.click(select);

    expect(await screen.findByText('Férias')).toBeInTheDocument();
    expect(screen.getByText('Folga')).toBeInTheDocument();
    expect(screen.getByText('Almoço')).toBeInTheDocument();
    expect(screen.getByText('Pessoal')).toBeInTheDocument();
    expect(screen.getByText('Outro')).toBeInTheDocument();
  });
});

describe('BlockDialog — AC: date range validation', () => {
  it('shows error when start date is missing', async () => {
    render(<BlockDialog staffId="staff-1" />, { wrapper: makeWrapper() });
    await openDialog();

    const addBtn = screen.getByRole('button', { name: /^Adicionar$/i });
    await userEvent.click(addBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Data de início é obrigatória/i);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('shows error when end date is missing', async () => {
    render(<BlockDialog staffId="staff-1" />, { wrapper: makeWrapper() });
    await openDialog();

    const startInput = screen.getByLabelText('Data de início do bloqueio');
    await userEvent.type(startInput, '2024-06-01');

    const addBtn = screen.getByRole('button', { name: /^Adicionar$/i });
    await userEvent.click(addBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Data de fim é obrigatória/i);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('shows error when end date is before start date', async () => {
    render(<BlockDialog staffId="staff-1" />, { wrapper: makeWrapper() });
    await openDialog();

    const startInput = screen.getByLabelText('Data de início do bloqueio');
    const endInput = screen.getByLabelText('Data de fim do bloqueio');

    await userEvent.type(startInput, '2024-06-10');
    await userEvent.type(endInput, '2024-06-05');

    const addBtn = screen.getByRole('button', { name: /^Adicionar$/i });
    await userEvent.click(addBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Data de fim deve ser posterior/i);
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});

describe('BlockDialog — AC: submits correct payload', () => {
  it('posts correct block data and shows success toast', async () => {
    const mockResponse: ApiResponse<ScheduleBlock> = { data: MOCK_BLOCK };
    (apiClient.post as Mock).mockResolvedValue(mockResponse);

    render(<BlockDialog staffId="staff-1" />, { wrapper: makeWrapper() });
    await openDialog();

    const startInput = screen.getByLabelText('Data de início do bloqueio');
    const endInput = screen.getByLabelText('Data de fim do bloqueio');
    await userEvent.type(startInput, '2024-06-01');
    await userEvent.type(endInput, '2024-06-07');

    const select = screen.getByRole('combobox', {
      name: /Motivo do bloqueio/i,
    });
    await userEvent.click(select);
    const vacationOption = await screen.findByText('Férias');
    await userEvent.click(vacationOption);

    const addBtn = screen.getByRole('button', { name: /^Adicionar$/i });
    await userEvent.click(addBtn);

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/staff/staff-1/blocks',
        expect.objectContaining({
          start_date: '2024-06-01',
          end_date: '2024-06-07',
          reason: 'vacation',
        }),
      ),
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Bloqueio adicionado'),
    );
  });
});

describe('BlockDialog — AC: API conflict error', () => {
  it('shows API error message when conflict is returned', async () => {
    const conflictError = {
      message: 'Conflitos com 3 pedidos confirmados',
      errors: {},
    };
    (apiClient.post as Mock).mockRejectedValue(conflictError);

    render(<BlockDialog staffId="staff-1" />, { wrapper: makeWrapper() });
    await openDialog();

    const startInput = screen.getByLabelText('Data de início do bloqueio');
    const endInput = screen.getByLabelText('Data de fim do bloqueio');
    await userEvent.type(startInput, '2024-06-01');
    await userEvent.type(endInput, '2024-06-07');

    const select = screen.getByRole('combobox', {
      name: /Motivo do bloqueio/i,
    });
    await userEvent.click(select);
    const dayOffOption = await screen.findByText('Folga');
    await userEvent.click(dayOffOption);

    const addBtn = screen.getByRole('button', { name: /^Adicionar$/i });
    await userEvent.click(addBtn);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Conflitos com 3 pedidos confirmados',
      ),
    );
  });
});
