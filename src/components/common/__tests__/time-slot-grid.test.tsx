import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { TimeSlot } from '@/types/booking';

import { TimeSlotGrid } from '../time-slot-grid';

const SLOTS: TimeSlot[] = [
  {
    date: '2025-01-15',
    start_time: '09:00',
    end_time: '10:00',
    available: true,
  },
  {
    date: '2025-01-15',
    start_time: '10:00',
    end_time: '11:00',
    available: false,
  },
  {
    date: '2025-01-15',
    start_time: '11:00',
    end_time: '12:00',
    available: true,
  },
];

describe('TimeSlotGrid', () => {
  it('renders a button for each slot', () => {
    render(
      <TimeSlotGrid slots={SLOTS} selectedSlot={null} onSelect={vi.fn()} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('shows start time in each button', () => {
    render(
      <TimeSlotGrid slots={SLOTS} selectedSlot={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
  });

  it('disables unavailable slots', () => {
    render(
      <TimeSlotGrid slots={SLOTS} selectedSlot={null} onSelect={vi.fn()} />,
    );
    const unavailableBtn = screen.getByRole('button', { name: /10:00/i });
    expect(unavailableBtn).toBeDisabled();
  });

  it('does not disable available slots', () => {
    render(
      <TimeSlotGrid slots={SLOTS} selectedSlot={null} onSelect={vi.fn()} />,
    );
    const availableBtn = screen.getByRole('button', { name: /09:00/i });
    expect(availableBtn).not.toBeDisabled();
  });

  it('calls onSelect with the slot when an available slot is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <TimeSlotGrid slots={SLOTS} selectedSlot={null} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /09:00/i }));
    expect(onSelect).toHaveBeenCalledWith(SLOTS[0]);
  });

  it('marks selected slot as aria-pressed', () => {
    render(
      <TimeSlotGrid
        slots={SLOTS}
        selectedSlot={SLOTS[0] ?? null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { pressed: true })).toHaveTextContent(
      '09:00',
    );
  });

  it('shows empty message when no slots provided', () => {
    render(<TimeSlotGrid slots={[]} selectedSlot={null} onSelect={vi.fn()} />);
    expect(screen.getByText(/nenhum horário disponível/i)).toBeInTheDocument();
  });
});
