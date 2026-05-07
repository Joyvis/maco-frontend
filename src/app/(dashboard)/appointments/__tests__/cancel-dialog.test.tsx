import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SaleOrder } from '@/types/appointment';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('@/services/appointments', () => ({
  useCancelAppointment: vi.fn(),
  useRefundPolicies: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const BASE_ORDER: SaleOrder = {
  id: 'ord-1',
  state: 'confirmed',
  scheduled_at: '2026-05-10T10:00:00Z',
  service_name: 'Corte de Cabelo',
  professional_name: 'João',
  total_amount: 100,
  created_at: '2026-05-01T00:00:00Z',
};

async function setup(order = BASE_ORDER) {
  const { useCancelAppointment, useRefundPolicies } = await vi.importMock<{
    useCancelAppointment: ReturnType<typeof vi.fn>;
    useRefundPolicies: ReturnType<typeof vi.fn>;
  }>('@/services/appointments');

  useCancelAppointment.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });

  useRefundPolicies.mockReturnValue({
    data: [
      {
        id: 'pol-1',
        description: 'Cancelamento com 24h de antecedência: reembolso total',
        refund_percentage: 80,
      },
    ],
  });

  const { CancelDialog } = await import('../_components/cancel-dialog');
  return render(<CancelDialog order={order} />);
}

describe('CancelDialog', () => {
  it('renders Cancelar trigger button', async () => {
    await setup();
    expect(
      screen.getByRole('button', { name: /cancelar/i }),
    ).toBeInTheDocument();
  });

  it('opens dialog on trigger click', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByText('Cancelar Agendamento')).toBeInTheDocument();
  });

  it('shows refund policy description in dialog', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(
      screen.getByText('Cancelamento com 24h de antecedência: reembolso total'),
    ).toBeInTheDocument();
  });

  it('shows refund amount preview based on policy percentage', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByTestId('refund-amount')).toHaveTextContent('R$ 80.00');
  });

  it('shows reason selector in dialog', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByText('Motivo do cancelamento')).toBeInTheDocument();
  });

  it('Confirmar Cancelamento button is disabled when no reason selected', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    const confirmBtn = screen.getByRole('button', {
      name: /confirmar cancelamento/i,
    });
    expect(confirmBtn).toBeDisabled();
  });

  it('calls cancel mutation with reason when confirmed', async () => {
    const { useCancelAppointment } = await vi.importMock<{
      useCancelAppointment: ReturnType<typeof vi.fn>;
    }>('@/services/appointments');

    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    useCancelAppointment.mockReturnValue({ mutateAsync, isPending: false });

    const { CancelDialog } = await import('../_components/cancel-dialog');
    render(<CancelDialog order={BASE_ORDER} />);

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('Motivo pessoal'));

    await userEvent.click(
      screen.getByRole('button', { name: /confirmar cancelamento/i }),
    );

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 'ord-1',
        reason: 'personal',
      }),
    );
  });

  it('shows error toast when cancellation fails', async () => {
    const { useCancelAppointment } = await vi.importMock<{
      useCancelAppointment: ReturnType<typeof vi.fn>;
    }>('@/services/appointments');
    const { toast } = await vi.importMock<{
      toast: { error: ReturnType<typeof vi.fn> };
    }>('sonner');

    useCancelAppointment.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('fail')),
      isPending: false,
    });

    const { CancelDialog } = await import('../_components/cancel-dialog');
    render(<CancelDialog order={BASE_ORDER} />);

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('Motivo pessoal'));
    await userEvent.click(
      screen.getByRole('button', { name: /confirmar cancelamento/i }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Erro ao cancelar agendamento'),
    );
  });

  it('shows no refund info when policies are empty', async () => {
    const { useCancelAppointment, useRefundPolicies } = await vi.importMock<{
      useCancelAppointment: ReturnType<typeof vi.fn>;
      useRefundPolicies: ReturnType<typeof vi.fn>;
    }>('@/services/appointments');

    useCancelAppointment.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useRefundPolicies.mockReturnValue({ data: [] });

    const { CancelDialog } = await import('../_components/cancel-dialog');
    render(<CancelDialog order={BASE_ORDER} />);

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByTestId('refund-amount')).not.toBeInTheDocument();
  });

  it('shows success toast after successful cancellation', async () => {
    const { toast } = await vi.importMock<{
      toast: {
        success: ReturnType<typeof vi.fn>;
        error: ReturnType<typeof vi.fn>;
      };
    }>('sonner');

    await setup();
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('Motivo pessoal'));
    await userEvent.click(
      screen.getByRole('button', { name: /confirmar cancelamento/i }),
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Agendamento cancelado com sucesso',
      ),
    );
  });
});
