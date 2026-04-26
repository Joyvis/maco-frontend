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
