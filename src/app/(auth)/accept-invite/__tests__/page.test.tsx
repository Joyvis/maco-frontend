import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AcceptInvitePage from '@/app/(auth)/accept-invite/page';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockGet = vi.fn<(key: string) => string | null>().mockReturnValue(null);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({ get: mockGet }),
}));

const mockFetch = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mockFetch;
  mockGet.mockImplementation((key) =>
    key === 'token' ? 'test-invite-token-123' : null,
  );
});

function renderAcceptInvitePage() {
  return render(<AcceptInvitePage />);
}

// ─── AC-4: token extracted from query param ───────────────────────────────────
describe('AC-4: token extracted from URL query param', () => {
  it('renders the form when a token is present', () => {
    renderAcceptInvitePage();
    expect(screen.getByLabelText(/seu nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
  });

  it('shows an error state when no token is present', () => {
    mockGet.mockReturnValue(null);
    renderAcceptInvitePage();
    expect(screen.getByRole('alert')).toHaveTextContent(/link inválido/i);
    expect(
      screen.queryByRole('button', { name: /definir senha/i }),
    ).not.toBeInTheDocument();
  });
});

// ─── AC-1: field validation ───────────────────────────────────────────────────
describe('AC-1: form validates all fields before submit', () => {
  it('shows error when name is empty', async () => {
    renderAcceptInvitePage();
    await userEvent.click(
      screen.getByRole('button', { name: /definir senha/i }),
    );
    expect(await screen.findByText('Nome é obrigatório')).toBeInTheDocument();
  });

  it('shows error when password is too short', async () => {
    renderAcceptInvitePage();
    await userEvent.type(screen.getByLabelText(/seu nome/i), 'Maria');
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'short');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'short');
    await userEvent.click(
      screen.getByRole('button', { name: /definir senha/i }),
    );
    expect(
      await screen.findByText('A senha deve ter pelo menos 8 caracteres'),
    ).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    renderAcceptInvitePage();
    await userEvent.type(screen.getByLabelText(/seu nome/i), 'Maria');
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
    await userEvent.type(
      screen.getByLabelText(/confirmar senha/i),
      'different9',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /definir senha/i }),
    );
    expect(
      await screen.findByText('As senhas não coincidem'),
    ).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ─── AC-4: successful accept-invite flow ──────────────────────────────────────
describe('AC-4: successful submit POSTs to /auth/accept-invite and redirects to /login', () => {
  it('calls the endpoint with token and redirects', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Convite aceito' }), {
        status: 200,
      }),
    );

    renderAcceptInvitePage();

    await userEvent.type(screen.getByLabelText(/seu nome/i), 'Maria Souza');
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
    await userEvent.type(
      screen.getByLabelText(/confirmar senha/i),
      'password123',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /definir senha/i }),
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/accept-invite',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            token: 'test-invite-token-123',
            name: 'Maria Souza',
            password: 'password123',
          }),
        }),
      );
    });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });
});

// ─── AC-5: error states ───────────────────────────────────────────────────────
describe('AC-5: error states shown for invalid token or API errors', () => {
  it('shows error alert for invalid token response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Token inválido ou expirado' }), {
        status: 400,
      }),
    );

    renderAcceptInvitePage();

    await userEvent.type(screen.getByLabelText(/seu nome/i), 'Maria Souza');
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
    await userEvent.type(
      screen.getByLabelText(/confirmar senha/i),
      'password123',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /definir senha/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Token inválido ou expirado',
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows generic error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderAcceptInvitePage();

    await userEvent.type(screen.getByLabelText(/seu nome/i), 'Maria Souza');
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
    await userEvent.type(
      screen.getByLabelText(/confirmar senha/i),
      'password123',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /definir senha/i }),
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ─── AC-7: loading state ──────────────────────────────────────────────────────
describe('AC-7: loading state during API call', () => {
  it('disables submit button while submitting', async () => {
    let resolveRequest!: (value: Response) => void;
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((res) => {
        resolveRequest = res;
      }),
    );

    renderAcceptInvitePage();

    await userEvent.type(screen.getByLabelText(/seu nome/i), 'Maria Souza');
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
    await userEvent.type(
      screen.getByLabelText(/confirmar senha/i),
      'password123',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /definir senha/i }),
    );

    expect(
      await screen.findByRole('button', { name: /salvando/i }),
    ).toBeDisabled();

    resolveRequest(new Response(JSON.stringify({}), { status: 200 }));
  });
});
