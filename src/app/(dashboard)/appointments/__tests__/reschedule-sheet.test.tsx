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
  useAvailability: vi.fn(),
  useRescheduleAppointment: vi.fn(),
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
  total_amount: 50,
  created_at: '2026-05-01T00:00:00Z',
};

const SLOT_DATETIME = '2026-05-15T09:00:00Z';

async function setup() {
  const { useAvailability, useRescheduleAppointment } = await vi.importMock<{
    useAvailability: ReturnType<typeof vi.fn>;
    useRescheduleAppointment: ReturnType<typeof vi.fn>;
  }>('@/services/appointments');

  useAvailability.mockReturnValue({
    data: [{ datetime: SLOT_DATETIME, available: true }],
    isLoading: false,
  });

  useRescheduleAppointment.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });

  const { RescheduleSheet } = await import('../_components/reschedule-sheet');
  return render(<RescheduleSheet order={BASE_ORDER} />);
}

describe('RescheduleSheet', () => {
  it('renders Remarcar trigger button', async () => {
    await setup();
    expect(
      screen.getByRole('button', { name: /remarcar/i }),
    ).toBeInTheDocument();
  });

  it('opens sheet on trigger click', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: /remarcar/i }));
    expect(screen.getByText('Remarcar Agendamento')).toBeInTheDocument();
  });

  it('shows current booking date in sheet', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: /remarcar/i }));
    expect(screen.getByText('Agendamento atual')).toBeInTheDocument();
    expect(screen.getByText('10/05/2026')).toBeInTheDocument();
  });

  it('Confirmar Remarcação button is disabled when no slot selected', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: /remarcar/i }));
    const confirmBtn = screen.getByRole('button', {
      name: /confirmar remarcação/i,
    });
    expect(confirmBtn).toBeDisabled();
  });

  it('shows available time slots after selecting a date', async () => {
    await setup();
    await userEvent.click(screen.getByRole('button', { name: /remarcar/i }));

    const dateInput = screen.getByLabelText(/nova data/i);
    await userEvent.type(dateInput, '2026-05-15');
    // fire change event directly since typing into date input may not trigger it
    Object.defineProperty(dateInput, 'value', {
      value: '2026-05-15',
      writable: true,
    });
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));

    const expectedSlotTime = new Date(SLOT_DATETIME).toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: expectedSlotTime }),
      ).toBeInTheDocument(),
    );
  });

  it('calls reschedule mutation with selected slot when confirmed', async () => {
    const { useRescheduleAppointment } = await vi.importMock<{
      useRescheduleAppointment: ReturnType<typeof vi.fn>;
    }>('@/services/appointments');

    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    useRescheduleAppointment.mockReturnValue({ mutateAsync, isPending: false });

    const { RescheduleSheet } = await import('../_components/reschedule-sheet');
    render(<RescheduleSheet order={BASE_ORDER} />);

    await userEvent.click(screen.getByRole('button', { name: /remarcar/i }));

    const dateInput = screen.getByLabelText(/nova data/i);
    Object.defineProperty(dateInput, 'value', {
      value: '2026-05-15',
      writable: true,
    });
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));

    const expectedSlotTime = new Date(SLOT_DATETIME).toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: expectedSlotTime }),
      ).toBeInTheDocument(),
    );

    await userEvent.click(
      screen.getByRole('button', { name: expectedSlotTime }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /confirmar remarcação/i }),
    );

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 'ord-1',
        new_datetime: SLOT_DATETIME,
      }),
    );
  });

  it('shows success toast after successful reschedule', async () => {
    const { toast } = await vi.importMock<{
      toast: {
        success: ReturnType<typeof vi.fn>;
        error: ReturnType<typeof vi.fn>;
      };
    }>('sonner');

    await setup();
    await userEvent.click(screen.getByRole('button', { name: /remarcar/i }));

    const dateInput = screen.getByLabelText(/nova data/i);
    Object.defineProperty(dateInput, 'value', {
      value: '2026-05-15',
      writable: true,
    });
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));

    const expectedSlotTime = new Date(SLOT_DATETIME).toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: expectedSlotTime }),
      ).toBeInTheDocument(),
    );

    await userEvent.click(
      screen.getByRole('button', { name: expectedSlotTime }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /confirmar remarcação/i }),
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Agendamento remarcado com sucesso',
      ),
    );
  });

  it('shows error toast when reschedule fails', async () => {
    const { useRescheduleAppointment } = await vi.importMock<{
      useRescheduleAppointment: ReturnType<typeof vi.fn>;
    }>('@/services/appointments');
    const { toast } = await vi.importMock<{
      toast: { error: ReturnType<typeof vi.fn> };
    }>('sonner');

    useRescheduleAppointment.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('fail')),
      isPending: false,
    });

    const { RescheduleSheet } = await import('../_components/reschedule-sheet');
    render(<RescheduleSheet order={BASE_ORDER} />);

    await userEvent.click(screen.getByRole('button', { name: /remarcar/i }));

    const dateInput = screen.getByLabelText(/nova data/i);
    Object.defineProperty(dateInput, 'value', {
      value: '2026-05-15',
      writable: true,
    });
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));

    const expectedSlotTime = new Date(SLOT_DATETIME).toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: expectedSlotTime }),
      ).toBeInTheDocument(),
    );

    await userEvent.click(
      screen.getByRole('button', { name: expectedSlotTime }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /confirmar remarcação/i }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Erro ao remarcar agendamento'),
    );
  });

  it('shows empty message when no slots available for selected date', async () => {
    const { useAvailability } = await vi.importMock<{
      useAvailability: ReturnType<typeof vi.fn>;
    }>('@/services/appointments');

    useAvailability.mockReturnValue({ data: [], isLoading: false });

    const { RescheduleSheet } = await import('../_components/reschedule-sheet');
    render(<RescheduleSheet order={BASE_ORDER} />);

    await userEvent.click(screen.getByRole('button', { name: /remarcar/i }));

    const dateInput = screen.getByLabelText(/nova data/i);
    Object.defineProperty(dateInput, 'value', {
      value: '2026-05-15',
      writable: true,
    });
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() =>
      expect(
        screen.getByText('Nenhum horário disponível para esta data.'),
      ).toBeInTheDocument(),
    );
  });

  it('shows loading state when slots are loading', async () => {
    const { useAvailability } = await vi.importMock<{
      useAvailability: ReturnType<typeof vi.fn>;
    }>('@/services/appointments');

    useAvailability.mockReturnValue({ data: [], isLoading: true });

    const { RescheduleSheet } = await import('../_components/reschedule-sheet');
    render(<RescheduleSheet order={BASE_ORDER} />);

    await userEvent.click(screen.getByRole('button', { name: /remarcar/i }));

    const dateInput = screen.getByLabelText(/nova data/i);
    Object.defineProperty(dateInput, 'value', {
      value: '2026-05-15',
      writable: true,
    });
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });
});
