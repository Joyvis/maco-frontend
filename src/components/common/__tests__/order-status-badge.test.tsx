import { render, screen } from '@testing-library/react';

import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { SALE_ORDER_STATE_LABELS } from '@/types/sale-order';
import type { SaleOrderState } from '@/types/sale-order';

const states: SaleOrderState[] = [
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
];

describe('OrderStatusBadge', () => {
  it.each(states)('renders label for state "%s"', (state) => {
    render(<OrderStatusBadge state={state} />);
    expect(
      screen.getByText(SALE_ORDER_STATE_LABELS[state]),
    ).toBeInTheDocument();
  });

  it('applies green styling for completed state', () => {
    render(<OrderStatusBadge state="completed" />);
    const badge = screen.getByText(SALE_ORDER_STATE_LABELS['completed']);
    expect(badge.className).toMatch(/green/);
  });

  it('applies blue styling for confirmed state', () => {
    render(<OrderStatusBadge state="confirmed" />);
    const badge = screen.getByText(SALE_ORDER_STATE_LABELS['confirmed']);
    expect(badge.className).toMatch(/blue/);
  });

  it('applies red styling for no_show state', () => {
    render(<OrderStatusBadge state="no_show" />);
    const badge = screen.getByText(SALE_ORDER_STATE_LABELS['no_show']);
    expect(badge.className).toMatch(/red/);
  });

  it('applies muted styling for cancelled state', () => {
    render(<OrderStatusBadge state="cancelled" />);
    const badge = screen.getByText(SALE_ORDER_STATE_LABELS['cancelled']);
    expect(badge.className).toMatch(/muted/);
  });
});
