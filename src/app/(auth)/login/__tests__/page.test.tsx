import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '@/providers/auth-provider';
import type { AuthContextValue } from '@/types/auth';
import LoginPage from '@/app/(auth)/login/page';

jest.mock('@/config/env', () => ({
  env: { NEXT_PUBLIC_API_URL: 'http://localhost:8000', NEXT_PUBLIC_APP_NAME: 'Maco' },
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockGet = jest.fn<string | null, [string]>().mockReturnValue(null);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({ get: mockGet }),
}));

function makeWrapper(overrides: Partial<AuthContextValue> = {}) {
  const value: AuthContextValue = {
    user: null,
    tenant: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    ...overrides,
  };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };
}

function renderLoginPage(overrides?: Partial<AuthContextValue>) {
  return render(<LoginPage />, { wrapper: makeWrapper(overrides) });
}

beforeEach(() => jest.clearAllMocks());

// ─── AC-4: client-side validation ────────────────────────────────────────────
describe('AC-4: client-side validation shows inline errors', () => {
  it('shows "E-mail é obrigatório" when email is empty', async () => {
    const login = jest.fn();
    renderLoginPage({ login });

    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('E-mail é obrigatório')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows "Formato de e-mail inválido" for bad email', async () => {
    const login = jest.fn();
    renderLoginPage({ login });

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'notanemail');
    await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Formato de e-mail inválido')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows "Senha é obrigatória" when password is empty', async () => {
    const login = jest.fn();
    renderLoginPage({ login });

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Senha é obrigatória')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows "A senha deve ter pelo menos 8 caracteres" for short password', async () => {
    const login = jest.fn();
    renderLoginPage({ login });

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(
      await screen.findByText('A senha deve ter pelo menos 8 caracteres')
    ).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});

// ─── AC-1: successful login redirects to /dashboard ─────────────────────────
describe('AC-1: successful login', () => {
  it('calls login() and redirects to /dashboard', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    mockGet.mockReturnValue(null);
    renderLoginPage({ login });

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('user@example.com', 'password123'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
  });
});

// ─── AC-3: returnTo redirect ─────────────────────────────────────────────────
describe('AC-3: returnTo redirect', () => {
  it('redirects to returnTo param after login', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    mockGet.mockImplementation((key: string) => (key === 'returnTo' ? '/settings' : null));
    renderLoginPage({ login });

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/settings'));
  });
});

// ─── AC-2: API failure shows error message ───────────────────────────────────
describe('AC-2: API failure shows error alert', () => {
  it('shows error alert when login throws', async () => {
    const login = jest.fn().mockRejectedValue(new Error('E-mail ou senha inválidos'));
    renderLoginPage({ login });

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos');
    expect(mockPush).not.toHaveBeenCalled();
  });
});
