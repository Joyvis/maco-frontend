import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SaleOrder } from '@/types/appointment';

vi.mock('../_components/cancel-dialog', () => ({
  CancelDialog: ({ order }: { order: SaleOrder }) => (
    <button>Cancelar {order.id}</button>
  ),
}));

vi.mock('../_components/reschedule-sheet', () => ({
  RescheduleSheet: ({ order }: { order: SaleOrder }) => (
    <button>Remarcar {order.id}</button>
  ),
}));

const BASE_ORDER: SaleOrder = {
  id: 'ord-1',
  state: 'confirmed',
  scheduled_at: '2026-05-10T10:00:00Z',
  service_name: 'Corte de Cabelo',
  professional_name: 'João Silva',
  total_amount: 50,
  created_at: '2026-05-01T00:00:00Z',
};

async function setup(order: SaleOrder, onRate?: (id: string) => void) {
  const { AppointmentCard } = await import('../_components/appointment-card');
  return render(<AppointmentCard order={order} onRate={onRate} />);
}

describe('AppointmentCard', () => {
  it('renders service name', async () => {
    await setup(BASE_ORDER);
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
  });

  it('renders formatted date', async () => {
    await setup(BASE_ORDER);
    expect(screen.getByText('10/05/2026')).toBeInTheDocument();
  });

  it('renders formatted time', async () => {
    await setup(BASE_ORDER);
    const expectedTime = new Date(BASE_ORDER.scheduled_at).toLocaleTimeString(
      'pt-BR',
      { hour: '2-digit', minute: '2-digit' },
    );
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it('renders professional name', async () => {
    await setup(BASE_ORDER);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('renders Confirmado badge for confirmed state', async () => {
    await setup(BASE_ORDER);
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });

  it('renders Cancelado badge for cancelled state', async () => {
    await setup({ ...BASE_ORDER, state: 'cancelled' });
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
  });

  it('renders Concluído badge for completed state', async () => {
    await setup({ ...BASE_ORDER, state: 'completed' });
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('shows Remarcar and Cancelar for upcoming confirmed state', async () => {
    await setup(BASE_ORDER);
    expect(screen.getByText('Remarcar ord-1')).toBeInTheDocument();
    expect(screen.getByText('Cancelar ord-1')).toBeInTheDocument();
  });

  it('shows Remarcar and Cancelar for checked_in state', async () => {
    await setup({ ...BASE_ORDER, state: 'checked_in' });
    expect(screen.getByText('Remarcar ord-1')).toBeInTheDocument();
    expect(screen.getByText('Cancelar ord-1')).toBeInTheDocument();
  });

  it('hides action buttons for cancelled appointments', async () => {
    await setup({ ...BASE_ORDER, state: 'cancelled' });
    expect(screen.queryByText('Cancelar ord-1')).not.toBeInTheDocument();
    expect(screen.queryByText('Remarcar ord-1')).not.toBeInTheDocument();
  });

  it('hides action buttons for no_show appointments', async () => {
    await setup({ ...BASE_ORDER, state: 'no_show' });
    expect(screen.queryByText('Cancelar ord-1')).not.toBeInTheDocument();
  });

  it('shows Avaliar button for completed appointments when onRate is provided', async () => {
    const onRate = vi.fn();
    await setup({ ...BASE_ORDER, state: 'completed' }, onRate);
    expect(
      screen.getByRole('button', { name: /avaliar/i }),
    ).toBeInTheDocument();
  });

  it('calls onRate with appointment id when Rate button clicked', async () => {
    const onRate = vi.fn();
    await setup({ ...BASE_ORDER, state: 'completed' }, onRate);
    await userEvent.click(screen.getByRole('button', { name: /avaliar/i }));
    expect(onRate).toHaveBeenCalledWith('ord-1');
  });

  it('hides Avaliar button when onRate is not provided', async () => {
    await setup({ ...BASE_ORDER, state: 'completed' });
    expect(
      screen.queryByRole('button', { name: /avaliar/i }),
    ).not.toBeInTheDocument();
  });

  it('does not render professional name when absent', async () => {
    const orderWithoutPro: SaleOrder = {
      id: 'ord-1',
      state: 'confirmed',
      scheduled_at: BASE_ORDER.scheduled_at,
      service_name: BASE_ORDER.service_name,
      total_amount: BASE_ORDER.total_amount,
      created_at: BASE_ORDER.created_at,
    };
    await setup(orderWithoutPro);
    expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
  });
});
