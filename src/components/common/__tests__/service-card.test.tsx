import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ShopService } from '@/types/shop';

import { ServiceCard, formatPrice, formatDuration } from '../service-card';

const MOCK_SERVICE: ShopService = {
  id: 'svc-1',
  name: 'Corte de Cabelo',
  description: 'Corte profissional',
  category: 'Cabelo',
  duration_minutes: 60,
  base_price: 50,
};

describe('formatPrice', () => {
  it('formats price with BRL currency symbol', () => {
    const result = formatPrice(50);
    expect(result).toMatch(/R\$/);
    expect(result).toMatch(/50/);
  });

  it('formats decimal amounts correctly', () => {
    const result = formatPrice(99.9);
    expect(result).toMatch(/99/);
  });
});

describe('formatDuration', () => {
  it('shows minutes for durations under 60', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(45)).toBe('45 min');
  });

  it('shows whole hours for exact hour durations', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
  });

  it('shows hours and minutes for mixed durations', () => {
    expect(formatDuration(90)).toBe('1h 30min');
    expect(formatDuration(75)).toBe('1h 15min');
  });
});

describe('ServiceCard', () => {
  it('renders service name', () => {
    render(<ServiceCard service={MOCK_SERVICE} onBook={vi.fn()} />);
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
  });

  it('renders price in BRL format', () => {
    render(<ServiceCard service={MOCK_SERVICE} onBook={vi.fn()} />);
    const priceEl = screen.getByText(/R\$/);
    expect(priceEl).toBeInTheDocument();
    expect(priceEl.textContent).toMatch(/50/);
  });

  it('renders duration', () => {
    render(<ServiceCard service={MOCK_SERVICE} onBook={vi.fn()} />);
    // 60 min = 1h exactly
    expect(screen.getByText('1h')).toBeInTheDocument();
  });

  it('renders category badge when present', () => {
    render(<ServiceCard service={MOCK_SERVICE} onBook={vi.fn()} />);
    expect(screen.getByText('Cabelo')).toBeInTheDocument();
  });

  it('does not render badge when category is absent', () => {
    const noCategory: ShopService = { ...MOCK_SERVICE, category: undefined };
    render(<ServiceCard service={noCategory} onBook={vi.fn()} />);
    expect(screen.queryByText('Cabelo')).not.toBeInTheDocument();
  });

  it('calls onBook with service when Agendar is clicked', async () => {
    const onBook = vi.fn();
    render(<ServiceCard service={MOCK_SERVICE} onBook={onBook} />);
    await userEvent.click(screen.getByRole('button', { name: /agendar/i }));
    expect(onBook).toHaveBeenCalledWith(MOCK_SERVICE);
  });
});
