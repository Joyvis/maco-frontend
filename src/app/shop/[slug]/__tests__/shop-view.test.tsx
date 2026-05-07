import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ShopView } from '@/components/common/shop-view';
import type { ShopProfile } from '@/types/shop';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const MOCK_SHOP: ShopProfile = {
  slug: 'salao-da-maria',
  name: 'Salão da Maria',
  city: 'São Paulo',
  rating: 4.8,
  services: [
    {
      id: 'svc-1',
      name: 'Corte de Cabelo',
      category: 'Cabelo',
      duration_minutes: 60,
      base_price: 50,
    },
    {
      id: 'svc-2',
      name: 'Escova',
      category: 'Cabelo',
      duration_minutes: 45,
      base_price: 35,
    },
    {
      id: 'svc-3',
      name: 'Manicure',
      category: 'Unhas',
      duration_minutes: 30,
      base_price: 25,
    },
  ],
  staff: [
    {
      user_id: 'u1',
      name: 'Maria Santos',
      qualified_services: [{ id: 'svc-1', name: 'Corte de Cabelo' }],
    },
  ],
};

describe('ShopView — service list', () => {
  it('renders all service names', () => {
    render(<ShopView shop={MOCK_SHOP} />);
    // Names may appear in both cards and staff qualification badges
    expect(screen.getAllByText('Corte de Cabelo').length).toBeGreaterThan(0);
    expect(screen.getByText('Escova')).toBeInTheDocument();
    expect(screen.getByText('Manicure')).toBeInTheDocument();
  });

  it('renders category group headings', () => {
    render(<ShopView shop={MOCK_SHOP} />);
    // 'Cabelo' appears as heading and as service badges
    expect(screen.getAllByText('Cabelo').length).toBeGreaterThan(0);
    // 'Unhas' appears as heading and as badge on Manicure card
    expect(screen.getAllByText('Unhas').length).toBeGreaterThan(0);
  });

  it('shows empty message when no services', () => {
    render(<ShopView shop={{ ...MOCK_SHOP, services: [] }} />);
    expect(screen.getByText(/nenhum serviço disponível/i)).toBeInTheDocument();
  });
});

describe('ShopView — staff section', () => {
  it('renders staff section heading and staff names', () => {
    render(<ShopView shop={MOCK_SHOP} />);
    expect(screen.getByText('Nossa Equipe')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('hides staff section when no staff', () => {
    render(<ShopView shop={{ ...MOCK_SHOP, staff: [] }} />);
    expect(screen.queryByText('Nossa Equipe')).not.toBeInTheDocument();
  });
});

describe('ShopView — service detail sheet', () => {
  it('opens service detail sheet when Agendar is clicked', async () => {
    render(<ShopView shop={MOCK_SHOP} />);
    const agendarButtons = screen.getAllByRole('button', {
      name: /^agendar$/i,
    });
    await userEvent.click(agendarButtons[0]!);
    expect(screen.getByText('Agendar Agora')).toBeInTheDocument();
  });

  it('pre-opens detail sheet when initialServiceId is given', () => {
    render(<ShopView shop={MOCK_SHOP} initialServiceId="svc-1" />);
    expect(screen.getByText('Agendar Agora')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows service name in open sheet', async () => {
    render(<ShopView shop={MOCK_SHOP} />);
    const agendarButtons = screen.getAllByRole('button', {
      name: /^agendar$/i,
    });
    await userEvent.click(agendarButtons[0]!);
    expect(screen.getAllByText('Corte de Cabelo').length).toBeGreaterThan(0);
  });
});
