import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import type { TimeSlot } from '@/types/booking';
import type { QualifiedStaff } from '@/types/qualification';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

const mockMutateAsync = vi.fn();
vi.mock('@/services/booking', () => ({
  useAvailability: vi.fn(),
  useCreateBooking: vi.fn().mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/services/qualifications', () => ({
  useQualifiedStaff: vi.fn(),
}));

vi.mock('@/services/services', () => ({
  useDependencies: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const MOCK_SLOTS: TimeSlot[] = [
  {
    date: '2025-01-15',
    start_time: '09:00',
    end_time: '10:00',
    available: true,
  },
  {
    date: '2025-01-15',
    start_time: '11:00',
    end_time: '12:00',
    available: true,
  },
];

const MOCK_STAFF: QualifiedStaff[] = [
  { user_id: 'u1', name: 'Ana Lima', email: 'ana@example.com' },
];

const PROPS = {
  serviceId: 'svc-1',
  serviceName: 'Corte de Cabelo',
  servicePrice: 50,
  shopSlug: 'minha-loja',
};

async function importMocks() {
  const booking = await import('@/services/booking');
  const qualifications = await import('@/services/qualifications');
  const services = await import('@/services/services');
  return { booking, qualifications, services };
}

beforeEach(async () => {
  vi.clearAllMocks();
  const { booking, qualifications, services } = await importMocks();
  (booking.useAvailability as Mock).mockReturnValue({
    data: [],
    isLoading: false,
  });
  (qualifications.useQualifiedStaff as Mock).mockReturnValue({
    data: MOCK_STAFF,
    isLoading: false,
  });
  (services.useDependencies as Mock).mockReturnValue({
    data: [],
    isLoading: false,
  });
});

// ─── Helper: navigate to step 2 ───────────────────────────────────────────────
async function selectDateAndSlot() {
  const { booking } = await importMocks();
  (booking.useAvailability as Mock).mockReturnValue({
    data: MOCK_SLOTS,
    isLoading: false,
  });

  const { BookingWizard } = await import('../booking-wizard');
  render(<BookingWizard {...PROPS} />);

  const calendarButtons = screen
    .getAllByRole('button')
    .filter((b) => !b.textContent?.toLowerCase().includes('próximo'));
  await userEvent.click(calendarButtons[0]!);

  const slotBtn = await screen.findByRole('button', { name: /09:00/i });
  await userEvent.click(slotBtn);
}

// ─── Step navigation tests ────────────────────────────────────────────────────
describe('BookingWizard — step navigation', () => {
  it('renders step 1 (data e horário) by default', async () => {
    const { BookingWizard } = await import('../booking-wizard');
    render(<BookingWizard {...PROPS} />);
    expect(screen.getByText(/data e horário/i)).toBeInTheDocument();
  });

  it('Next button is disabled until a time slot is selected', async () => {
    const { BookingWizard } = await import('../booking-wizard');
    render(<BookingWizard {...PROPS} />);
    expect(screen.getByRole('button', { name: /próximo/i })).toBeDisabled();
  });

  it('shows time slots after selecting a date', async () => {
    const { booking } = await importMocks();
    (booking.useAvailability as Mock).mockReturnValue({
      data: MOCK_SLOTS,
      isLoading: false,
    });
    const { BookingWizard } = await import('../booking-wizard');
    render(<BookingWizard {...PROPS} />);

    const calendarButtons = screen
      .getAllByRole('button')
      .filter((b) => !b.textContent?.toLowerCase().includes('próximo'));
    await userEvent.click(calendarButtons[0]!);

    expect(
      await screen.findByRole('button', { name: /09:00/i }),
    ).toBeInTheDocument();
  });

  it('enables Next after selecting a date and a time slot', async () => {
    await selectDateAndSlot();
    expect(screen.getByRole('button', { name: /próximo/i })).not.toBeDisabled();
  });

  it('advances to step 2 (profissional) after clicking Next', async () => {
    await selectDateAndSlot();
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
    expect(screen.getAllByText(/profissional/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /qualquer profissional/i }),
    ).toBeInTheDocument();
  });

  it('shows "Qualquer Profissional" option in step 2', async () => {
    await selectDateAndSlot();
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
    expect(
      screen.getByRole('button', { name: /qualquer profissional/i }),
    ).toBeInTheDocument();
  });

  it('shows qualified staff in step 2', async () => {
    await selectDateAndSlot();
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
    expect(screen.getByText('Ana Lima')).toBeInTheDocument();
  });

  it('Next button is disabled in step 2 until a professional is selected', async () => {
    await selectDateAndSlot();
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
    expect(screen.getByRole('button', { name: /próximo/i })).toBeDisabled();
  });

  it('advances to step 3 (confirmação) after selecting professional and clicking Next', async () => {
    await selectDateAndSlot();
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /qualquer profissional/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
    expect(screen.getByText(/confirmação/i)).toBeInTheDocument();
  });
});

// ─── Confirmation and submission tests ────────────────────────────────────────
describe('BookingWizard — confirmation and submission', () => {
  async function navigateToConfirmation() {
    await selectDateAndSlot();
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /qualquer profissional/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
  }

  it('shows service name in confirmation', async () => {
    await navigateToConfirmation();
    expect(screen.getAllByText('Corte de Cabelo').length).toBeGreaterThan(0);
  });

  it('shows cancellation policy warning', async () => {
    await navigateToConfirmation();
    expect(screen.getByText(/política de cancelamento:/i)).toBeInTheDocument();
  });

  it('shows "Confirmar Agendamento" button', async () => {
    await navigateToConfirmation();
    expect(
      screen.getByRole('button', { name: /confirmar agendamento/i }),
    ).toBeInTheDocument();
  });

  it('redirects to success screen when booking succeeds without payment', async () => {
    await navigateToConfirmation();
    mockMutateAsync.mockResolvedValue({
      data: { id: 'order-1', requires_payment: false },
    });

    await userEvent.click(
      screen.getByRole('button', { name: /confirmar agendamento/i }),
    );

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/booking/order-1/success'),
    );
  });

  it('redirects to payment screen when booking requires payment', async () => {
    await navigateToConfirmation();
    mockMutateAsync.mockResolvedValue({
      data: {
        id: 'order-2',
        requires_payment: true,
        payment_url: '/payment/order-2',
      },
    });

    await userEvent.click(
      screen.getByRole('button', { name: /confirmar agendamento/i }),
    );

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/payment/order-2'),
    );
  });

  it('shows error toast and navigates back to step 1 when slot is unavailable', async () => {
    const { toast } = await import('sonner');
    await navigateToConfirmation();
    mockMutateAsync.mockRejectedValue({
      message: 'This time slot is no longer available',
    });

    await userEvent.click(
      screen.getByRole('button', { name: /confirmar agendamento/i }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('horário não está mais disponível'),
      );
    });

    await waitFor(() =>
      expect(screen.getByText(/data e horário/i)).toBeInTheDocument(),
    );
  });

  it('shows generic error toast and stays on confirmation when a network error occurs', async () => {
    const { toast } = await import('sonner');
    await navigateToConfirmation();
    mockMutateAsync.mockRejectedValue(
      new Error('Network error. Check your connection.'),
    );

    await userEvent.click(
      screen.getByRole('button', { name: /confirmar agendamento/i }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Não foi possível confirmar'),
      );
    });

    expect(screen.getByText(/confirmação/i)).toBeInTheDocument();
    expect(screen.queryByText(/data e horário/i)).not.toBeInTheDocument();
  });

  it('shows auto-include dependencies with "(incluído)" label in confirmation', async () => {
    const { services } = await importMocks();
    (services.useDependencies as Mock).mockReturnValue({
      data: [
        {
          id: 'dep-1',
          service_id: 'svc-2',
          service_name: 'Lavagem',
          auto_include: true,
        },
      ],
      isLoading: false,
    });

    await navigateToConfirmation();

    expect(screen.getByText('Lavagem')).toBeInTheDocument();
    expect(screen.getByText('(incluído)')).toBeInTheDocument();
  });
});
