import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../sidebar';
import type { Permission } from '@/types/permissions';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/dashboard'),
}));

jest.mock('@/providers/permissions-provider', () => ({
  usePermissions: jest.fn(() => ({
    hasPermission: () => true,
    permissions: [] as Permission[],
  })),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => children,
  Tooltip: ({ children }: { children: React.ReactNode }) => children,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => children,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tooltip-content">{children}</span>
  ),
}));

import { usePathname } from 'next/navigation';
import { usePermissions } from '@/providers/permissions-provider';

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

function allPermissions() {
  return {
    hasPermission: () => true,
    permissions: [] as Permission[],
  };
}

function withoutPermission(denied: Permission) {
  return {
    hasPermission: (p: Permission) => p !== denied,
    permissions: [] as Permission[],
  };
}

function renderSidebar(props: { mobileOpen?: boolean; onMobileClose?: () => void } = {}) {
  return render(<Sidebar {...props} />);
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUsePathname.mockReturnValue('/dashboard');
    mockUsePermissions.mockReturnValue(allPermissions());
  });

  it('renders all navigation groups when all permissions are present', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Catálogo')).toBeInTheDocument();
    expect(screen.getByText('Equipe')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('collapses sidebar on toggle click and persists to localStorage', async () => {
    renderSidebar();
    const toggle = screen.getByRole('button', { name: /collapse sidebar/i });
    await userEvent.click(toggle);
    expect(localStorage.getItem('maco-sidebar-state')).toBe('collapsed');
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
  });

  it('expands sidebar on toggle click when collapsed and updates localStorage', async () => {
    localStorage.setItem('maco-sidebar-state', 'collapsed');
    renderSidebar();
    const toggle = screen.getByRole('button', { name: /expand sidebar/i });
    await userEvent.click(toggle);
    expect(localStorage.getItem('maco-sidebar-state')).toBe('expanded');
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
  });

  it('renders mobile drawer when mobileOpen is true', () => {
    renderSidebar({ mobileOpen: true });
    const navigations = screen.getAllByRole('complementary');
    expect(navigations.length).toBeGreaterThan(0);
  });

  it('calls onMobileClose when overlay is clicked', () => {
    const onMobileClose = jest.fn();
    renderSidebar({ mobileOpen: true, onMobileClose });
    fireEvent.click(screen.getByTestId('mobile-drawer-overlay'));
    expect(onMobileClose).toHaveBeenCalledTimes(1);
  });

  it('hides Equipe group when team:manage permission is absent', () => {
    mockUsePermissions.mockReturnValue(withoutPermission('team:manage'));
    renderSidebar();
    expect(screen.queryByText('Equipe')).not.toBeInTheDocument();
  });

  it('highlights the active route', () => {
    mockUsePathname.mockReturnValue('/catalogo/servicos');
    renderSidebar();
    expect(screen.getByText('Serviços')).toBeInTheDocument();
    const servicos = screen.getByText('Serviços').closest('a');
    expect(servicos?.className).toMatch(/bg-sidebar-accent/);
  });

  it('expands parent group for active child route', () => {
    mockUsePathname.mockReturnValue('/catalogo/servicos');
    renderSidebar();
    expect(screen.getByText('Catálogo')).toBeInTheDocument();
    expect(screen.getByText('Serviços')).toBeInTheDocument();
    const groupTrigger = screen.getByText('Catálogo').closest('button');
    expect(groupTrigger).toHaveAttribute('data-state', 'open');
  });
});
