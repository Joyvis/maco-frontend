import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import type { MockedFunction } from 'vitest';

import { DashboardShell } from '../dashboard-shell';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/dashboard'),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('../sidebar', () => ({
  Sidebar: ({
    mobileOpen,
    onMobileClose,
  }: {
    mobileOpen: boolean;
    onMobileClose: () => void;
  }) => (
    <div data-testid="sidebar" data-mobile-open={String(mobileOpen)}>
      <button onClick={onMobileClose}>close</button>
    </div>
  ),
}));

vi.mock('../topbar', () => ({
  Topbar: ({ onMenuClick }: { onMenuClick: () => void }) => (
    <button data-testid="menu-button" onClick={onMenuClick}>
      menu
    </button>
  ),
}));

const mockUsePathname = usePathname as MockedFunction<typeof usePathname>;

describe('DashboardShell', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('opens mobile drawer when menu button is clicked', async () => {
    render(
      <DashboardShell>
        <div />
      </DashboardShell>,
    );
    expect(screen.getByTestId('sidebar')).toHaveAttribute(
      'data-mobile-open',
      'false',
    );
    await userEvent.click(screen.getByTestId('menu-button'));
    expect(screen.getByTestId('sidebar')).toHaveAttribute(
      'data-mobile-open',
      'true',
    );
  });

  it('closes mobile drawer when onMobileClose is called', async () => {
    render(
      <DashboardShell>
        <div />
      </DashboardShell>,
    );
    await userEvent.click(screen.getByTestId('menu-button'));
    expect(screen.getByTestId('sidebar')).toHaveAttribute(
      'data-mobile-open',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.getByTestId('sidebar')).toHaveAttribute(
      'data-mobile-open',
      'false',
    );
  });

  it('closes mobile drawer when pathname changes (navigation)', async () => {
    const { rerender } = render(
      <DashboardShell>
        <div />
      </DashboardShell>,
    );
    await userEvent.click(screen.getByTestId('menu-button'));
    expect(screen.getByTestId('sidebar')).toHaveAttribute(
      'data-mobile-open',
      'true',
    );

    mockUsePathname.mockReturnValue('/catalogo/servicos');
    rerender(
      <DashboardShell>
        <div />
      </DashboardShell>,
    );

    expect(screen.getByTestId('sidebar')).toHaveAttribute(
      'data-mobile-open',
      'false',
    );
  });
});
