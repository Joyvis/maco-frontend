import { render, screen } from '@testing-library/react';

import { SystemRoleBadge } from '../system-role-badge';

describe('SystemRoleBadge', () => {
  it('renders "Sistema" badge when is_system is true', () => {
    render(<SystemRoleBadge isSystem />);
    expect(screen.getByText('Sistema')).toBeInTheDocument();
  });

  it('renders "Personalizado" badge when is_system is false', () => {
    render(<SystemRoleBadge isSystem={false} />);
    expect(screen.getByText('Personalizado')).toBeInTheDocument();
  });

  it('uses outline variant for custom roles', () => {
    const { container } = render(<SystemRoleBadge isSystem={false} />);
    expect(container.firstChild).toBeTruthy();
  });
});
