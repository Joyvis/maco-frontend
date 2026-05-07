import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { BookingItem, TimeSlot } from '@/types/booking';

import { BookingConfirmation } from '../booking-confirmation';

const SLOT: TimeSlot = {
  date: '2025-05-07',
  start_time: '09:00',
  end_time: '10:00',
  available: true,
};

const BASE_ITEMS: BookingItem[] = [
  {
    service_id: 'svc-1',
    service_name: 'Corte de Cabelo',
    price: 50,
    included: false,
  },
];

const INCLUDED_ITEMS: BookingItem[] = [
  ...BASE_ITEMS,
  { service_id: 'svc-2', service_name: 'Lavagem', price: 20, included: true },
];

describe('BookingConfirmation', () => {
  function renderConfirmation(
    overrides: Partial<React.ComponentProps<typeof BookingConfirmation>> = {},
  ) {
    return render(
      <BookingConfirmation
        serviceName="Corte de Cabelo"
        date="2025-05-07"
        timeSlot={SLOT}
        staffName="Ana Lima"
        items={BASE_ITEMS}
        isSubmitting={false}
        onConfirm={vi.fn()}
        {...overrides}
      />,
    );
  }

  it('shows service name', () => {
    renderConfirmation();
    expect(screen.getAllByText('Corte de Cabelo').length).toBeGreaterThan(0);
  });

  it('formats date as DD/MM/YYYY', () => {
    renderConfirmation();
    expect(screen.getByText('07/05/2025')).toBeInTheDocument();
  });

  it('shows time slot start time', () => {
    renderConfirmation();
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('shows staff name when provided', () => {
    renderConfirmation();
    expect(screen.getByText('Ana Lima')).toBeInTheDocument();
  });

  it('shows "Qualquer Disponível" when staffName is null', () => {
    renderConfirmation({ staffName: null });
    expect(screen.getByText('Qualquer Disponível')).toBeInTheDocument();
  });

  it('shows cancellation policy warning', () => {
    renderConfirmation();
    expect(screen.getByText(/política de cancelamento:/i)).toBeInTheDocument();
  });

  it('calls onConfirm when button clicked', async () => {
    const onConfirm = vi.fn();
    renderConfirmation({ onConfirm });
    await userEvent.click(
      screen.getByRole('button', { name: /confirmar agendamento/i }),
    );
    expect(onConfirm).toHaveBeenCalled();
  });

  it('disables button when isSubmitting', () => {
    renderConfirmation({ isSubmitting: true });
    expect(screen.getByRole('button', { name: /confirmando/i })).toBeDisabled();
  });

  it('shows "(incluído)" label for included items', () => {
    renderConfirmation({ items: INCLUDED_ITEMS });
    expect(screen.getByText('(incluído)')).toBeInTheDocument();
  });

  it('shows total price excluding included items', () => {
    renderConfirmation({ items: INCLUDED_ITEMS });
    expect(screen.getByText(/total/i)).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s*50/).length).toBeGreaterThan(0);
  });

  it('renders service price for non-included items', () => {
    renderConfirmation({ items: BASE_ITEMS });
    const priceEl = screen.getAllByText(/R\$/)[0];
    expect(priceEl?.textContent).toMatch(/50/);
  });
});
