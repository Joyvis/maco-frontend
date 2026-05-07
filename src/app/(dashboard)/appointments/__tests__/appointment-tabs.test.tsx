import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SaleOrder } from '@/types/appointment';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('@/services/appointments', () => ({
  useUpcomingAppointments: vi.fn(),
  useAppointmentHistory: vi.fn(),
}));

vi.mock('../_components/appointment-card', () => ({
  AppointmentCard: ({ order }: { order: SaleOrder }) => (
    <div data-testid={`card-${order.id}`}>{order.service_name}</div>
  ),
}));

const mockUpcoming: SaleOrder = {
  id: 'ord-1',
  state: 'confirmed',
  scheduled_at: '2026-05-10T10:00:00Z',
  service_name: 'Corte de Cabelo',
  professional_name: 'João',
  total_amount: 50,
  created_at: '2026-05-01T00:00:00Z',
};

const mockHistory: SaleOrder = {
  id: 'ord-2',
  state: 'completed',
  scheduled_at: '2026-04-01T10:00:00Z',
  service_name: 'Escova',
  professional_name: 'Maria',
  total_amount: 35,
  created_at: '2026-03-25T00:00:00Z',
};

async function setup({
  upcoming = [mockUpcoming],
  history = [mockHistory],
  loadingUpcoming = false,
  loadingHistory = false,
}: {
  upcoming?: SaleOrder[];
  history?: SaleOrder[];
  loadingUpcoming?: boolean;
  loadingHistory?: boolean;
} = {}) {
  const { useUpcomingAppointments, useAppointmentHistory } =
    await vi.importMock<{
      useUpcomingAppointments: ReturnType<typeof vi.fn>;
      useAppointmentHistory: ReturnType<typeof vi.fn>;
    }>('@/services/appointments');

  useUpcomingAppointments.mockReturnValue({
    data: upcoming,
    isLoading: loadingUpcoming,
  });
  useAppointmentHistory.mockReturnValue({
    data: history,
    isLoading: loadingHistory,
  });

  const { AppointmentTabs } = await import('../_components/appointment-tabs');
  return render(<AppointmentTabs />);
}

describe('AppointmentTabs', () => {
  it('renders two tabs: Próximos and Histórico', async () => {
    await setup();
    expect(screen.getByRole('tab', { name: /próximos/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /histórico/i })).toBeInTheDocument();
  });

  it('shows upcoming appointments in Próximos tab by default', async () => {
    await setup();
    expect(screen.getByTestId('card-ord-1')).toBeInTheDocument();
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
  });

  it('shows empty state when no upcoming appointments', async () => {
    await setup({ upcoming: [] });
    expect(screen.getByText('Nenhum agendamento próximo')).toBeInTheDocument();
  });

  it('shows Book Now CTA in upcoming empty state', async () => {
    await setup({ upcoming: [] });
    expect(
      screen.getByRole('button', { name: /agendar agora/i }),
    ).toBeInTheDocument();
  });

  it('switches to history tab and shows past appointments', async () => {
    await setup();
    await userEvent.click(screen.getByRole('tab', { name: /histórico/i }));
    expect(screen.getByTestId('card-ord-2')).toBeInTheDocument();
    expect(screen.getByText('Escova')).toBeInTheDocument();
  });

  it('shows empty state when history is empty', async () => {
    await setup({ history: [] });
    await userEvent.click(screen.getByRole('tab', { name: /histórico/i }));
    expect(
      screen.getByText('Nenhum histórico de agendamentos'),
    ).toBeInTheDocument();
  });

  it('upcoming cards are not visible when history tab is active', async () => {
    await setup();
    await userEvent.click(screen.getByRole('tab', { name: /histórico/i }));
    expect(screen.queryByTestId('card-ord-1')).not.toBeInTheDocument();
  });

  it('history cards are not visible when upcoming tab is active', async () => {
    await setup();
    expect(screen.queryByTestId('card-ord-2')).not.toBeInTheDocument();
  });

  it('shows skeleton when upcoming appointments are loading', async () => {
    await setup({ loadingUpcoming: true });
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows skeleton when history is loading after switching tab', async () => {
    await setup({ loadingHistory: true });
    await userEvent.click(screen.getByRole('tab', { name: /histórico/i }));
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('navigates to /shop when Book Now CTA is clicked in empty upcoming', async () => {
    const { useRouter } = await vi.importMock<{
      useRouter: ReturnType<typeof vi.fn>;
    }>('next/navigation');

    const push = vi.fn();
    useRouter.mockReturnValue({ push });

    await setup({ upcoming: [] });
    await userEvent.click(
      screen.getByRole('button', { name: /agendar agora/i }),
    );
    expect(push).toHaveBeenCalledWith('/shop');
  });
});
