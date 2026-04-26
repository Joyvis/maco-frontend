/**
 * @jest-environment node
 */
import { POST } from '../route';

jest.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://api.test',
    NEXT_PUBLIC_APP_NAME: 'maco-test',
  },
}));

const cookieSet = jest.fn();
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ set: cookieSet })),
}));

const TOKENS = {
  access_token: 'AT',
  refresh_token: 'RT',
  expires_in: 900,
};
const USER = {
  id: 'u-1',
  email: 'u@example.com',
  name: 'User',
  tenant_id: 't-1',
  roles: ['admin'],
  permissions: [],
};

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function jsonResponse(body: unknown, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/login', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns 400 when email missing', async () => {
    const res = await POST(jsonRequest({ password: 'p' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: 'E-mail e senha são obrigatórios',
    });
  });

  it('returns 400 when password missing', async () => {
    const res = await POST(jsonRequest({ email: 'u@example.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when backend rejects credentials', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ message: 'invalid' }, 401),
      ) as unknown as typeof fetch;

    const res = await POST(
      jsonRequest({ email: 'u@example.com', password: 'wrong' }),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: 'invalid' });
  });

  it('returns 400 when backend errors with non-401 status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 500)) as unknown as typeof fetch;

    const res = await POST(
      jsonRequest({ email: 'u@example.com', password: 'p' }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: 'E-mail ou senha inválidos' });
  });

  it('returns 400 with fallback message when backend body is non-JSON', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response) as unknown as typeof fetch;

    const res = await POST(
      jsonRequest({ email: 'u@example.com', password: 'p' }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: 'E-mail ou senha inválidos' });
  });

  it('returns 502 when /users/me fetch fails', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(TOKENS, 200))
      .mockResolvedValueOnce(jsonResponse({}, 500)) as unknown as typeof fetch;

    const res = await POST(
      jsonRequest({ email: 'u@example.com', password: 'p' }),
    );
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({
      message: 'Falha ao carregar dados do usuário',
    });
  });

  it('happy path: sets both cookies and returns user + access_token', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(TOKENS, 200))
      .mockResolvedValueOnce(
        jsonResponse(USER, 200),
      ) as unknown as typeof fetch;

    const res = await POST(
      jsonRequest({ email: 'u@example.com', password: 'p' }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      user: USER,
      access_token: 'AT',
      expires_in: 900,
    });

    expect(cookieSet).toHaveBeenCalledWith(
      'access_token',
      'AT',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 900,
        path: '/',
      }),
    );
    expect(cookieSet).toHaveBeenCalledWith(
      'refresh_token',
      'RT',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });
});
