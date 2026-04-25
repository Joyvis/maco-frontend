import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Package } from 'lucide-react';
import { EmptyState } from '../empty-state';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items" description="Nothing here yet" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<EmptyState title="No items" description="Nothing" icon={Package} />);
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders CTA button with actionLabel', () => {
    render(<EmptyState title="No items" description="Nothing" actionLabel="Add item" onAction={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
  });

  it('calls onAction when CTA button is clicked', async () => {
    const onAction = jest.fn();
    render(<EmptyState title="No items" description="Nothing" actionLabel="Add item" onAction={onAction} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render CTA button when actionLabel is omitted', () => {
    render(<EmptyState title="No items" description="Nothing" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
