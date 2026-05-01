import { render, screen } from '@testing-library/react';

import { ProductStatusBadge } from '@/components/common/product-status-badge';

describe('ProductStatusBadge', () => {
  it('renders "Rascunho" for draft status', () => {
    render(<ProductStatusBadge status="draft" />);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('renders "Ativo" for active status', () => {
    render(<ProductStatusBadge status="active" />);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('renders "Arquivado" for archived status', () => {
    render(<ProductStatusBadge status="archived" />);
    expect(screen.getByText('Arquivado')).toBeInTheDocument();
  });
});
