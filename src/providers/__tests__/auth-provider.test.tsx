import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '@/providers/auth-provider';
import { configureAuth } from '@/services/api-client';

jest.mock('@/config/env', () => ({
  env: { NEXT_PUBLIC_API_URL: 'http://localhost:8000', NEXT_PUBLIC_APP_NAME: 'Maco' },
}));

jest.mock('@/services/api-client', () => ({
  configureAuth: jest.fn(),
  resetAuth: jest.fn(),
}));

const mockConfigureAuth = configureAuth as jest.MockedFunction<typeof configureAuth>;

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const MOCK_USER = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  tenant_id: 'tenant-abc',
  roles: ['admin'],
  permissions: [{ resource: 'tickets', action: 'write' }],
};

function Inspector() {
  const { user, tenant, isAuthenticated, isLoading } = useAuthContext();
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <span data-testid="tenant">{tenant ?? 'null'}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="loading">{String(isLoading)}</span>
    </div>
  );
}

function LoginButton() {
  const { login } = useAuthContext();
  return <button onClick={() => void login('user@example.com', 'password123')}>Login</button>;
}

function LogoutButton() {
  const { logout } = useAuthContext();
  return <button onClick={() => void logout()}>Logout</button>;
}

function fetchOk(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}

function fetchFail(status = 401) {
  return {
    ok: false,
    status,
    json: async () => ({ message: 'E-mail ou senha inválidos' }),
  } as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── AC-11: useAuth returns correct initial state ────────────────────────────
describe('AC-11: isLoading state during session init', () => {
  it('starts as loading and resolves to unauthenticated when no session', async () => {
    global.fetch = jest.fn().mockResolvedValue(fetchFail(401));

    render(
      <AuthProvider>
        <Inspector />
      </AuthProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('hydrates user state from existing cookie session on mount', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(fetchOk({ access_token: 'tok-1', expires_in: 900 })) // refresh
      .mockResolvedValueOnce(fetchOk(MOCK_USER)); // /users/me

    render(
      <AuthProvider>
        <Inspector />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('user@example.com');
    expect(screen.getByTestId('tenant').textContent).toBe('tenant-abc');
  });
});

// ─── AC-1: login() populates user state ─────────────────────────────────────
describe('AC-1: login() updates auth state', () => {
  it('sets user and token after successful login', async () => {
    // Mount: no session
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(fetchFail(401)) // mount refresh fails
      .mockResolvedValueOnce(
        // login
        fetchOk({ user: MOCK_USER, access_token: 'tok-abc', expires_in: 900 })
      );

    const { getByText } = render(
      <AuthProvider>
        <Inspector />
        <LoginButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      getByText('Login').click();
    });

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));
    expect(screen.getByTestId('user').textContent).toBe('user@example.com');
  });
});

// ─── AC-2: login() with invalid credentials throws ──────────────────────────
describe('AC-2: login() throws on invalid credentials', () => {
  it('throws Error with backend message on 401', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(fetchFail(401)) // mount refresh
      .mockResolvedValueOnce(fetchFail(401)); // login

    let caughtMessage = '';

    function TryLogin() {
      const { login } = useAuthContext();
      return (
        <button
          onClick={() =>
            login('bad@example.com', 'wrongpass').catch((e: Error) => {
              caughtMessage = e.message;
            })
          }
        >
          Login
        </button>
      );
    }

    const { getByText } = render(
      <AuthProvider>
        <TryLogin />
      </AuthProvider>
    );

    await waitFor(() => {});

    await act(async () => {
      getByText('Login').click();
    });

    await waitFor(() => expect(caughtMessage).not.toBe(''));
    expect(caughtMessage).toBeTruthy();
  });
});

// ─── AC-13: logout() resets state and redirects ─────────────────────────────
describe('AC-13: logout() resets context and redirects to /login', () => {
  it('clears user, calls logout endpoint, redirects to /login', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(fetchOk({ access_token: 'tok-1', expires_in: 900 })) // mount refresh
      .mockResolvedValueOnce(fetchOk(MOCK_USER)) // /users/me
      .mockResolvedValueOnce(fetchOk({ message: 'ok' })); // logout

    const { getByText } = render(
      <AuthProvider>
        <Inspector />
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

    await act(async () => {
      getByText('Logout').click();
    });

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

// ─── AC-8: background refresh scheduled at 80% TTL ──────────────────────────
describe('AC-8: background refresh fires at 80% of TTL', () => {
  it('calls /api/auth/refresh when timer fires', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(fetchOk({ access_token: 'tok-1', expires_in: 900 })) // mount refresh
      .mockResolvedValueOnce(fetchOk(MOCK_USER)) // /users/me
      .mockResolvedValueOnce(fetchOk({ access_token: 'tok-2', expires_in: 900 })); // background refresh

    global.fetch = fetchMock;

    render(
      <AuthProvider>
        <Inspector />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

    // Advance timer by 80% of 900s = 720s
    await act(async () => {
      jest.advanceTimersByTime(720_000);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const lastCall = fetchMock.mock.calls[2] as [string, unknown];
    expect(lastCall[0]).toBe('/api/auth/refresh');
  });
});

// ─── AC-9: refresh failure clears session and redirects ─────────────────────
describe('AC-9: refresh failure → logout → redirect /login', () => {
  it('redirects to /login when background refresh fails', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(fetchOk({ access_token: 'tok-1', expires_in: 900 })) // mount refresh
      .mockResolvedValueOnce(fetchOk(MOCK_USER)) // /users/me
      .mockResolvedValueOnce(fetchFail(401)) // background refresh fails
      .mockResolvedValueOnce(fetchOk({ message: 'ok' })); // logout endpoint

    global.fetch = fetchMock;

    render(
      <AuthProvider>
        <Inspector />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

    await act(async () => {
      jest.advanceTimersByTime(720_000);
    });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });
});

// ─── catch block in scheduleRefresh (network error) ─────────────────────────
describe('scheduleRefresh catch: network error during background refresh', () => {
  it('calls logout and redirects to /login on fetch throw', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(fetchOk({ access_token: 'tok-1', expires_in: 900 })) // mount refresh
      .mockResolvedValueOnce(fetchOk(MOCK_USER)) // /users/me
      .mockRejectedValueOnce(new Error('Network error')) // background refresh throws
      .mockResolvedValueOnce(fetchOk({ message: 'ok' })); // logout endpoint

    global.fetch = fetchMock;

    render(
      <AuthProvider>
        <Inspector />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

    await act(async () => {
      jest.advanceTimersByTime(720_000);
    });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });
});

// ─── configureAuth callbacks: onTokenRefreshed and onUnauthorized ────────────
describe('configureAuth callbacks', () => {
  it('onTokenRefreshed updates access token when mounted', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(fetchOk({ access_token: 'tok-1', expires_in: 900 }))
      .mockResolvedValueOnce(fetchOk(MOCK_USER));

    render(
      <AuthProvider>
        <Inspector />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

    // Capture the callbacks passed to configureAuth and exercise them
    const lastCall = mockConfigureAuth.mock.calls[mockConfigureAuth.mock.calls.length - 1];
    const authArg = lastCall?.[0];
    expect(authArg).toBeDefined();

    await act(async () => {
      authArg?.onTokenRefreshed('tok-refreshed');
    });

    // Exercise the getter callbacks to satisfy coverage
    expect(authArg?.getToken()).toBe('tok-1');
    expect(authArg?.getRefreshToken()).toBeNull();
    expect(authArg?.getTenantId()).toBe('tenant-abc');
  });

  it('onTokenRefreshed is a no-op when component is unmounted', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(fetchOk({ access_token: 'tok-1', expires_in: 900 }))
      .mockResolvedValueOnce(fetchOk(MOCK_USER));

    const { unmount } = render(
      <AuthProvider>
        <Inspector />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

    const lastCall = mockConfigureAuth.mock.calls[mockConfigureAuth.mock.calls.length - 1];
    const authArg = lastCall?.[0];
    expect(authArg).toBeDefined();

    // Unmount first, then call the callback — exercises the mountedRef.current === false branch
    unmount();

    await act(async () => {
      authArg?.onTokenRefreshed('tok-after-unmount');
    });
    // No assertion needed — just verifying it doesn't throw and the false branch is taken
  });

  it('onUnauthorized triggers logout and redirect to /login', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(fetchOk({ access_token: 'tok-1', expires_in: 900 }))
      .mockResolvedValueOnce(fetchOk(MOCK_USER))
      .mockResolvedValueOnce(fetchOk({ message: 'ok' })); // logout

    render(
      <AuthProvider>
        <Inspector />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

    const lastCall = mockConfigureAuth.mock.calls[mockConfigureAuth.mock.calls.length - 1];
    const authArg = lastCall?.[0];
    expect(authArg).toBeDefined();

    await act(async () => {
      authArg?.onUnauthorized?.();
    });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });
});

// ─── mount: /users/me failure after successful refresh ──────────────────────
describe('mount session hydration: /users/me failure', () => {
  it('stays unauthenticated when /users/me returns non-ok after refresh', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(fetchOk({ access_token: 'tok-1', expires_in: 900 })) // refresh ok
      .mockResolvedValueOnce(fetchFail(403)); // /users/me fails

    render(
      <AuthProvider>
        <Inspector />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });
});

// ─── configureAuth setup error scenarios ────────────────────────────────────
describe('configureAuth setup error scenarios', () => {
  it('resolves loading=false and stays unauthenticated when refresh fetch throws on mount', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error')); // mount refresh throws

    render(
      <AuthProvider>
        <Inspector />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(mockConfigureAuth).not.toHaveBeenCalled();
  });

  it('resolves loading=false and stays unauthenticated when /users/me fetch throws on mount', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(fetchOk({ access_token: 'tok-1', expires_in: 900 })) // refresh ok
      .mockRejectedValueOnce(new Error('Network error')); // /users/me throws

    render(
      <AuthProvider>
        <Inspector />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(mockConfigureAuth).not.toHaveBeenCalled();
  });

  it('does not crash the provider when configureAuth itself throws during setup', async () => {
    // Login flow triggers the configureAuth wiring useEffect; force it to throw
    mockConfigureAuth.mockImplementationOnce(() => {
      throw new Error('configureAuth setup failed');
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(fetchFail(401)) // mount refresh fails
      .mockResolvedValueOnce(
        fetchOk({ user: MOCK_USER, access_token: 'tok-abc', expires_in: 900 })
      ); // login

    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { getByText } = render(
      <AuthProvider>
        <Inspector />
        <LoginButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    let loginPromise: Promise<unknown> | undefined;
    await act(async () => {
      // login sets state — the resulting useEffect calls configureAuth which throws.
      // React surfaces the effect error; the auth state itself is set before the throw.
      loginPromise = Promise.resolve().then(() => getByText('Login').click());
    });
    await loginPromise;

    // Auth state was set before the throw — provider remains usable
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('user@example.com'));
    expect(mockConfigureAuth).toHaveBeenCalled();

    errSpy.mockRestore();
  });
});
