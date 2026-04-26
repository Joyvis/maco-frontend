import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';

import { Breadcrumbs } from '../breadcrumbs';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Breadcrumbs', () => {
  it('renders single segment without link for /dashboard', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Breadcrumbs />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Dashboard' }),
    ).not.toBeInTheDocument();
  });

  it('renders Catálogo as link and Serviços as non-link for /catalogo/servicos', () => {
    mockUsePathname.mockReturnValue('/catalogo/servicos');
    render(<Breadcrumbs />);
    expect(screen.getByRole('link', { name: 'Catálogo' })).toBeInTheDocument();
    expect(screen.getByText('Serviços')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Serviços' }),
    ).not.toBeInTheDocument();
  });

  it('maps segments using SEGMENT_LABELS', () => {
    mockUsePathname.mockReturnValue('/pedidos/ordens');
    render(<Breadcrumbs />);
    expect(screen.getByRole('link', { name: 'Pedidos' })).toBeInTheDocument();
    expect(screen.getByText('Ordens de Venda')).toBeInTheDocument();
  });

  it('renders dynamic id segments as the id value', () => {
    mockUsePathname.mockReturnValue('/pedidos/ordens/abc123');
    render(<Breadcrumbs />);
    expect(screen.getByText('abc123')).toBeInTheDocument();
  });
});
