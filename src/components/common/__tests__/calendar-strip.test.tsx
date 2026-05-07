import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CalendarStrip } from '../calendar-strip';

const TODAY = new Date('2025-01-15');

function makeDates(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

describe('CalendarStrip', () => {
  it('renders 30 day buttons starting from today', () => {
    render(
      <CalendarStrip
        startDate={TODAY}
        availableDates={[]}
        selectedDate={null}
        onSelect={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(30);
  });

  it('shows availability dot on available dates', () => {
    const dates = makeDates(30);
    render(
      <CalendarStrip
        startDate={TODAY}
        availableDates={[dates[0] ?? '', dates[2] ?? '']}
        selectedDate={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getAllByTestId('availability-dot')).toHaveLength(2);
  });

  it('calls onSelect with ISO date string when a day is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <CalendarStrip
        startDate={TODAY}
        availableDates={[]}
        selectedDate={null}
        onSelect={onSelect}
      />,
    );
    const firstButton = screen.getAllByRole('button')[0];
    expect(firstButton).toBeDefined();
    await userEvent.click(firstButton!);
    expect(onSelect).toHaveBeenCalledWith('2025-01-15');
  });

  it('marks the selected date as aria-selected', () => {
    const selectedDate = '2025-01-15';
    render(
      <CalendarStrip
        startDate={TODAY}
        availableDates={[]}
        selectedDate={selectedDate}
        onSelect={vi.fn()}
      />,
    );
    const selected = screen.getByRole('button', { pressed: true });
    expect(selected).toBeInTheDocument();
  });

  it('shows day-of-month number in each button', () => {
    render(
      <CalendarStrip
        startDate={TODAY}
        availableDates={[]}
        selectedDate={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
  });
});
