import { render, screen, within } from '@testing-library/react';
import { LoadingSkeleton } from '../loading-skeleton';

describe('LoadingSkeleton', () => {
  it('renders a sidebar region', () => {
    render(<LoadingSkeleton />);
    expect(screen.getByTestId('loading-skeleton-sidebar')).toBeInTheDocument();
  });

  it('renders a content region with header strip and body', () => {
    render(<LoadingSkeleton />);
    const content = screen.getByTestId('loading-skeleton-content');
    expect(within(content).getByTestId('loading-skeleton-content-header')).toBeInTheDocument();
    expect(within(content).getByTestId('loading-skeleton-content-body')).toBeInTheDocument();
  });

  it('renders animated skeleton primitives (animate-pulse)', () => {
    const { container } = render(<LoadingSkeleton />);
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThan(0);
  });

  it('exposes a status role for assistive tech', () => {
    render(<LoadingSkeleton />);
    expect(screen.getByRole('status', { name: /carregando/i })).toBeInTheDocument();
  });
});
