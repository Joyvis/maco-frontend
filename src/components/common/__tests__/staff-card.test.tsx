import { render, screen } from '@testing-library/react';

import type { ShopStaff } from '@/types/shop';

import { StaffCard } from '../staff-card';

const MOCK_STAFF: ShopStaff = {
  user_id: 'u1',
  name: 'Maria Santos',
  qualified_services: [
    { id: 'svc-1', name: 'Corte de Cabelo' },
    { id: 'svc-2', name: 'Escova' },
  ],
};

describe('StaffCard', () => {
  it('renders staff name', () => {
    render(<StaffCard staff={MOCK_STAFF} />);
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('renders qualified services', () => {
    render(<StaffCard staff={MOCK_STAFF} />);
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    expect(screen.getByText('Escova')).toBeInTheDocument();
  });

  it('shows empty message when no qualifications', () => {
    const noQuals: ShopStaff = { ...MOCK_STAFF, qualified_services: [] };
    render(<StaffCard staff={noQuals} />);
    expect(screen.getByText('Sem especialidades')).toBeInTheDocument();
  });

  it('renders avatar with first letter of name', () => {
    render(<StaffCard staff={MOCK_STAFF} />);
    expect(screen.getByText('M')).toBeInTheDocument();
  });
});
