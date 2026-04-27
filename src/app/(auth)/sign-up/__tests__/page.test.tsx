import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

import SignUpPage from '@/app/(auth)/sign-up/page';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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
});

function renderSignUpPage() {
  return render(<SignUpPage />);
}

// ─── AC-1: form validation ────────────────────────────────────────────────────
describe('AC-1: form validates all fields before submit', () => {
  it('shows error when tenant name is empty', async () => {
    renderSignUpPage();
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));
    expect(
      await screen.findByText('Nome da empresa é obrigatório'),
    ).toBeInTheDocument();
  });

  it('shows error when owner name is empty', async () => {
    renderSignUpPage();
    await userEvent.type(
      screen.getByLabelText(/nome da empresa/i),
      'Acme Corp',
    );
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));
    expect(await screen.findByText('Nome é obrigatório')).toBeInTheDocument();
  });

  it('shows error for invalid email format', async () => {
    renderSignUpPage();
    await userEvent.type(
      screen.getByLabelText(/nome da empresa/i),
      'Acme Corp',
    );
    await userEvent.type(screen.getByLabelText(/seu nome/i), 'João Silva');
    await userEvent.type(
      screen.getByRole('textbox', { name: /e-mail/i }),
      'notanemail',
    );
    await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));
    expect(
      await screen.findByText('Formato de e-mail inválido'),
    ).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows error when password is too short', async () => {
    renderSignUpPage();
    await userEvent.type(
      screen.getByLabelText(/nome da empresa/i),
      'Acme Corp',
    );
    await userEvent.type(screen.getByLabelText(/seu nome/i), 'João Silva');
    await userEvent.type(
      screen.getByRole('textbox', { name: /e-mail/i }),
      'joao@acme.com',
    );
    await userEvent.type(screen.getByLabelText(/senha/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));
    expect(
      await screen.findByText('A senha deve ter pelo menos 8 caracteres'),
    ).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ─── AC-2: free trial flow ────────────────────────────────────────────────────
describe('AC-2: free trial creates tenant and redirects to /login', () => {
  it('POSTs to /sign-up and redirects to /login with success toast', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Tenant criado com sucesso' }), {
        status: 201,
      }),
    );

    renderSignUpPage();

    await userEvent.type(
      screen.getByLabelText(/nome da empresa/i),
      'Acme Corp',
    );
    await userEvent.type(screen.getByLabelText(/seu nome/i), 'João Silva');
    await userEvent.type(
      screen.getByRole('textbox', { name: /e-mail/i }),
      'joao@acme.com',
    );
    await userEvent.type(screen.getByLabelText(/senha/i), 'password123');

    // free trial is selected by default — click submit
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/sign-up',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            tenant_name: 'Acme Corp',
            owner_name: 'João Silva',
            email: 'joao@acme.com',
            password: 'password123',
            plan: 'trial',
          }),
        }),
      );
    });

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/conta criada/i),
      ),
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });
});

// ─── AC-3: paid plan redirects to Stripe Checkout ────────────────────────────
describe('AC-3: paid plan redirects to Stripe Checkout', () => {
  it('POSTs to /sign-up and redirects to checkout_url', async () => {
    const checkoutUrl = 'https://checkout.stripe.com/pay/cs_test_abc';
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ checkout_url: checkoutUrl }), {
        status: 200,
      }),
    );

    const assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: '', assign: assignMock },
      writable: true,
    });

    renderSignUpPage();

    // select paid plan
    await userEvent.click(screen.getByRole('radio', { name: /plano pago/i }));

    await userEvent.type(
      screen.getByLabelText(/nome da empresa/i),
      'Acme Corp',
    );
    await userEvent.type(screen.getByLabelText(/seu nome/i), 'João Silva');
    await userEvent.type(
      screen.getByRole('textbox', { name: /e-mail/i }),
      'joao@acme.com',
    );
    await userEvent.type(screen.getByLabelText(/senha/i), 'password123');

    await userEvent.click(
      screen.getByRole('button', { name: /continuar para pagamento/i }),
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/sign-up',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            tenant_name: 'Acme Corp',
            owner_name: 'João Silva',
            email: 'joao@acme.com',
            password: 'password123',
            plan: 'paid',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(window.location.href).toBe(checkoutUrl);
    });
  });
});

// ─── AC-5: error states ───────────────────────────────────────────────────────
describe('AC-5: error states shown for API errors', () => {
  it('shows error alert for duplicate email', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'E-mail já cadastrado' }), {
        status: 409,
      }),
    );

    renderSignUpPage();

    await userEvent.type(
      screen.getByLabelText(/nome da empresa/i),
      'Acme Corp',
    );
    await userEvent.type(screen.getByLabelText(/seu nome/i), 'João Silva');
    await userEvent.type(
      screen.getByRole('textbox', { name: /e-mail/i }),
      'joao@acme.com',
    );
    await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail já cadastrado',
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows generic error when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderSignUpPage();

    await userEvent.type(
      screen.getByLabelText(/nome da empresa/i),
      'Acme Corp',
    );
    await userEvent.type(screen.getByLabelText(/seu nome/i), 'João Silva');
    await userEvent.type(
      screen.getByRole('textbox', { name: /e-mail/i }),
      'joao@acme.com',
    );
    await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

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

    renderSignUpPage();

    await userEvent.type(
      screen.getByLabelText(/nome da empresa/i),
      'Acme Corp',
    );
    await userEvent.type(screen.getByLabelText(/seu nome/i), 'João Silva');
    await userEvent.type(
      screen.getByRole('textbox', { name: /e-mail/i }),
      'joao@acme.com',
    );
    await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(
      await screen.findByRole('button', { name: /criando/i }),
    ).toBeDisabled();

    resolveRequest(new Response(JSON.stringify({}), { status: 201 }));
  });
});

// ─── Plan selection UI ────────────────────────────────────────────────────────
describe('plan selection', () => {
  it('renders both plan cards', () => {
    renderSignUpPage();
    expect(
      screen.getByRole('radio', { name: /teste grátis/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /plano pago/i }),
    ).toBeInTheDocument();
  });

  it('free trial is selected by default', () => {
    renderSignUpPage();
    expect(screen.getByRole('radio', { name: /teste grátis/i })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: /plano pago/i }),
    ).not.toBeChecked();
  });

  it('submit button label changes based on selected plan', async () => {
    renderSignUpPage();
    expect(
      screen.getByRole('button', { name: /criar conta/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: /plano pago/i }));
    expect(
      screen.getByRole('button', { name: /continuar para pagamento/i }),
    ).toBeInTheDocument();
  });
});
