// @vitest-environment node

import { POST } from '../route';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://api.test',
    NEXT_PUBLIC_APP_NAME: 'maco-test',
  },
}));

const cookieGet = vi.fn();
const cookieSet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGet, set: cookieSet })),
}));

const TOKENS = {
  access_token: 'AT2',
  refresh_token: 'RT2',
  expires_in: 600,
};

function jsonResponse(body: unknown, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/refresh', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns 401 when refresh_token cookie is missing', async () => {
    cookieGet.mockReturnValueOnce(undefined);
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    const res = await POST();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: 'Sessão expirada' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns 401 when backend rejects the refresh token', async () => {
    cookieGet.mockReturnValueOnce({ value: 'r1' });
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 401)) as unknown as typeof fetch;

    const res = await POST();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: 'Sessão expirada' });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('happy path: rotates both cookies and returns new access_token', async () => {
    cookieGet.mockReturnValueOnce({ value: 'r1' });
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(TOKENS, 200),
      ) as unknown as typeof fetch;

    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ access_token: 'AT2', expires_in: 600 });

    expect(cookieSet).toHaveBeenCalledWith(
      'access_token',
      'AT2',
      expect.objectContaining({ maxAge: 600 }),
    );
    expect(cookieSet).toHaveBeenCalledWith(
      'refresh_token',
      'RT2',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
  });
});
