import { render, screen } from '@testing-library/react';

import { StatusBadge } from '@/components/common/status-badge';

describe('StatusBadge', () => {
  it('renders the label text', () => {
    render(<StatusBadge variant="active" label="Ativo" />);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('renders active variant with green styling', () => {
    render(<StatusBadge variant="active" label="Ativo" />);
    const badge = screen.getByText('Ativo');
    expect(badge.className).toMatch(/green/);
  });

  it('renders draft variant without green styling', () => {
    render(<StatusBadge variant="draft" label="Rascunho" />);
    const badge = screen.getByText('Rascunho');
    expect(badge.className).not.toMatch(/green/);
  });

  it('renders inactive variant without green styling', () => {
    render(<StatusBadge variant="inactive" label="Inativo" />);
    const badge = screen.getByText('Inativo');
    expect(badge.className).not.toMatch(/green/);
  });

  it('renders archived variant without green styling', () => {
    render(<StatusBadge variant="archived" label="Arquivado" />);
    const badge = screen.getByText('Arquivado');
    expect(badge.className).not.toMatch(/green/);
  });
});
