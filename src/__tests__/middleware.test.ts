/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';
import { decodeToken, isTokenExpired } from '@/lib/auth/jwt';
import type { JWTPayload } from '@/types/auth';

jest.mock('@/lib/auth/jwt', () => ({
  decodeToken: jest.fn(),
  isTokenExpired: jest.fn(),
}));

const mockDecodeToken = decodeToken as jest.MockedFunction<typeof decodeToken>;
const mockIsTokenExpired = isTokenExpired as jest.MockedFunction<typeof isTokenExpired>;

const MOCK_PAYLOAD: JWTPayload = {
  sub: 'user-1',
  email: 'user@example.com',
  tenant_id: 'tenant-123',
  roles: ['admin'],
  permissions: [],
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
};

beforeEach(() => jest.clearAllMocks());

// ─── AC-6: public routes pass through ────────────────────────────────────────
describe('AC-6: public routes are accessible without authentication', () => {
  it.each(['/login', '/sign-up', '/forgot-password', '/reset-password', '/accept-invite'])(
    '%s passes through without redirect',
    async (path) => {
      const request = new NextRequest(`http://localhost${path}`);
      const response = await middleware(request);
      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(302);
    }
  );
});

// ─── AC-5: unauthenticated redirect ──────────────────────────────────────────
describe('AC-5: unauthenticated requests to protected routes redirect to /login', () => {
  it('redirects to /login?returnTo=/dashboard when no access_token cookie', async () => {
    const request = new NextRequest('http://localhost/dashboard');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('returnTo')).toBe('/dashboard');
  });

  it('preserves the requested pathname in returnTo', async () => {
    const request = new NextRequest('http://localhost/settings/profile');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.searchParams.get('returnTo')).toBe('/settings/profile');
  });
});

// ─── AC-7: authenticated requests pass through with tenant header ─────────────
describe('AC-7: authenticated requests with valid token pass through', () => {
  it('does not redirect and sets x-tenant-id in forwarded request headers', async () => {
    mockDecodeToken.mockReturnValue(MOCK_PAYLOAD);
    mockIsTokenExpired.mockReturnValue(false);

    const nextSpy = jest.spyOn(NextResponse, 'next');

    const request = new NextRequest('http://localhost/dashboard', {
      headers: { cookie: 'access_token=valid.jwt.token' },
    });
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(nextSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({ headers: expect.anything() }),
      })
    );

    const forwardedHeaders: Headers = (
      nextSpy.mock.calls[0]![0] as { request: { headers: Headers } }
    ).request.headers;
    expect(forwardedHeaders.get('x-tenant-id')).toBe('tenant-123');

    nextSpy.mockRestore();
  });
});

// ─── AC-5 (refresh paths): expired/missing access token + refresh token ──────
//
// These cover lines 28-39 and 50-66 of middleware.ts — the silent-refresh
// branches the unit tests above don't exercise. fetch() is mocked to return a
// Response-like object with getSetCookie() so the loop appending Set-Cookie
// headers can be asserted on the forwarded response.
describe('middleware refresh paths', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetchOk(setCookies: string[]) {
    const fakeRes = {
      ok: true,
      headers: { getSetCookie: () => setCookies },
    };
    globalThis.fetch = jest.fn().mockResolvedValue(fakeRes) as unknown as typeof fetch;
  }

  function mockFetchFail() {
    const fakeRes = {
      ok: false,
      headers: { getSetCookie: () => [] },
    };
    globalThis.fetch = jest.fn().mockResolvedValue(fakeRes) as unknown as typeof fetch;
  }

  it('no access token + refresh cookie → silently refreshes and forwards Set-Cookie', async () => {
    mockFetchOk(['access_token=new; Path=/', 'refresh_token=newR; Path=/']);

    const request = new NextRequest('http://localhost/dashboard', {
      headers: { cookie: 'refresh_token=r1' },
    });
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toEqual([
      'access_token=new; Path=/',
      'refresh_token=newR; Path=/',
    ]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/api/auth/refresh' }),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('no access token + refresh cookie + refresh fails → redirects to /login', async () => {
    mockFetchFail();

    const request = new NextRequest('http://localhost/dashboard', {
      headers: { cookie: 'refresh_token=r1' },
    });
    const response = await middleware(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('returnTo')).toBe('/dashboard');
  });

  it('expired access token + refresh cookie → silent refresh succeeds', async () => {
    mockDecodeToken.mockReturnValue(MOCK_PAYLOAD);
    mockIsTokenExpired.mockReturnValue(true);
    mockFetchOk(['access_token=fresh; Path=/']);

    const request = new NextRequest('http://localhost/dashboard', {
      headers: { cookie: 'access_token=expired; refresh_token=r1' },
    });
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toEqual(['access_token=fresh; Path=/']);
  });

  it('access token decodes to null + refresh cookie → silent refresh succeeds', async () => {
    mockDecodeToken.mockReturnValue(null);
    mockFetchOk(['access_token=fresh; Path=/']);

    const request = new NextRequest('http://localhost/dashboard', {
      headers: { cookie: 'access_token=garbage; refresh_token=r1' },
    });
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toEqual(['access_token=fresh; Path=/']);
  });

  it('expired access token + refresh cookie + refresh fails → redirects to /login', async () => {
    mockDecodeToken.mockReturnValue(MOCK_PAYLOAD);
    mockIsTokenExpired.mockReturnValue(true);
    mockFetchFail();

    const request = new NextRequest('http://localhost/settings', {
      headers: { cookie: 'access_token=expired; refresh_token=r1' },
    });
    const response = await middleware(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('returnTo')).toBe('/settings');
  });

  it('expired access token + no refresh cookie → redirects to /login (no fetch attempted)', async () => {
    mockDecodeToken.mockReturnValue(MOCK_PAYLOAD);
    mockIsTokenExpired.mockReturnValue(true);
    globalThis.fetch = jest.fn() as unknown as typeof fetch;

    const request = new NextRequest('http://localhost/dashboard', {
      headers: { cookie: 'access_token=expired' },
    });
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
