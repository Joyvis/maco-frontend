import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Topbar } from '../topbar';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/dashboard'),
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock('next-themes', () => ({
  useTheme: jest.fn(() => ({ theme: 'light', setTheme: jest.fn() })),
}));

import { useTheme } from 'next-themes';
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('Topbar', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseTheme.mockReturnValue({ theme: 'light', setTheme: jest.fn() } as unknown as ReturnType<
      typeof useTheme
    >);
  });

  it('renders tenant name', () => {
    render(<Topbar tenantName="Test Corp" />);
    expect(screen.getByText('Test Corp')).toBeInTheDocument();
  });

  it('calls onMenuClick when hamburger button is clicked', async () => {
    const onMenuClick = jest.fn();
    render(<Topbar onMenuClick={onMenuClick} />);
    await userEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('opens user dropdown and shows Perfil, Configurações, Sair', async () => {
    render(<Topbar />);
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(screen.getByText('Sair')).toBeInTheDocument();
  });

  it('cycles theme from light to dark when theme toggle is clicked', async () => {
    const setTheme = jest.fn();
    mockUseTheme.mockReturnValue({ theme: 'light', setTheme } as unknown as ReturnType<
      typeof useTheme
    >);
    render(<Topbar />);
    await userEvent.click(screen.getByRole('button', { name: /switch theme.*light/i }));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles theme from dark to system when theme toggle is clicked', async () => {
    const setTheme = jest.fn();
    mockUseTheme.mockReturnValue({ theme: 'dark', setTheme } as unknown as ReturnType<
      typeof useTheme
    >);
    render(<Topbar />);
    await userEvent.click(screen.getByRole('button', { name: /switch theme.*dark/i }));
    expect(setTheme).toHaveBeenCalledWith('system');
  });

  it('navigates to /login when Sair is selected', async () => {
    render(<Topbar />);
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }));
    await userEvent.click(screen.getByText('Sair'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
