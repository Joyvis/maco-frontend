import { render, screen } from '@testing-library/react';

import { ShopHero } from '../shop-hero';

describe('ShopHero', () => {
  it('renders shop name', () => {
    render(<ShopHero name="Salão da Maria" />);
    expect(screen.getByText('Salão da Maria')).toBeInTheDocument();
  });

  it('renders city when provided', () => {
    render(<ShopHero name="Salão da Maria" city="São Paulo" />);
    expect(screen.getByText('São Paulo')).toBeInTheDocument();
  });

  it('does not render city when absent', () => {
    render(<ShopHero name="Salão da Maria" />);
    expect(screen.queryByText('São Paulo')).not.toBeInTheDocument();
  });

  it('renders rating when provided', () => {
    render(<ShopHero name="Salão da Maria" rating={4.8} />);
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('does not render rating when absent', () => {
    render(<ShopHero name="Salão da Maria" />);
    expect(screen.queryByText(/4\./)).not.toBeInTheDocument();
  });

  it('renders avatar fallback with first letter of name', () => {
    render(<ShopHero name="Salão da Maria" />);
    expect(screen.getByText('S')).toBeInTheDocument();
  });
});
