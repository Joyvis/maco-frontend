import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/dashboard'),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock('../sidebar', () => ({
  Sidebar: ({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) => (
    <div data-testid="sidebar" data-mobile-open={String(mobileOpen)}>
      <button onClick={onMobileClose}>close</button>
    </div>
  ),
}));

jest.mock('../topbar', () => ({
  Topbar: ({ onMenuClick }: { onMenuClick: () => void }) => (
    <button data-testid="menu-button" onClick={onMenuClick}>
      menu
    </button>
  ),
}));

import { usePathname } from 'next/navigation';
import { DashboardShell } from '../dashboard-shell';

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('DashboardShell', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('opens mobile drawer when menu button is clicked', async () => {
    render(
      <DashboardShell>
        <div />
      </DashboardShell>
    );
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'false');
    await userEvent.click(screen.getByTestId('menu-button'));
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'true');
  });

  it('closes mobile drawer when onMobileClose is called', async () => {
    render(
      <DashboardShell>
        <div />
      </DashboardShell>
    );
    await userEvent.click(screen.getByTestId('menu-button'));
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'true');
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'false');
  });

  it('closes mobile drawer when pathname changes (navigation)', async () => {
    const { rerender } = render(
      <DashboardShell>
        <div />
      </DashboardShell>
    );
    await userEvent.click(screen.getByTestId('menu-button'));
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'true');

    mockUsePathname.mockReturnValue('/catalogo/servicos');
    rerender(
      <DashboardShell>
        <div />
      </DashboardShell>
    );

    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'false');
  });
});
