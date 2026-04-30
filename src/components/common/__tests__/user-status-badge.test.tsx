import { render, screen } from '@testing-library/react';

import { UserStatusBadge } from '../user-status-badge';

describe('UserStatusBadge', () => {
  it('renders "Ativo" for active status', () => {
    render(<UserStatusBadge status="active" />);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('renders "Inativo" for inactive status', () => {
    render(<UserStatusBadge status="inactive" />);
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('applies green style for active', () => {
    render(<UserStatusBadge status="active" />);
    const badge = screen.getByText('Ativo');
    expect(badge.className).toMatch(/green/);
  });

  it('applies muted style for inactive', () => {
    render(<UserStatusBadge status="inactive" />);
    const badge = screen.getByText('Inativo');
    expect(badge.className).toMatch(/muted/);
  });
});
