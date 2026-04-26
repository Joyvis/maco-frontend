import { type NextRequest, NextResponse } from 'next/server';

import { decodeToken, isTokenExpired } from '@/lib/auth/jwt';
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from '@/lib/auth/cookies';

const PUBLIC_ROUTES = [
  '/login',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/accept-invite',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_REFRESH_TOKEN)?.value;

  if (!accessToken) {
    if (refreshToken) {
      const refreshUrl = new URL('/api/auth/refresh', request.url);
      const refreshRes = await fetch(refreshUrl, {
        method: 'POST',
        headers: { cookie: request.headers.get('cookie') ?? '' },
      });
      if (refreshRes.ok) {
        const response = NextResponse.next();
        for (const v of refreshRes.headers.getSetCookie()) {
          response.headers.append('set-cookie', v);
        }
        return response;
      }
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeToken(accessToken);

  if (!payload || isTokenExpired(payload)) {
    if (refreshToken) {
      const refreshUrl = new URL('/api/auth/refresh', request.url);
      const refreshRes = await fetch(refreshUrl, {
        method: 'POST',
        headers: { cookie: request.headers.get('cookie') ?? '' },
      });
      if (refreshRes.ok) {
        const response = NextResponse.next();
        for (const v of refreshRes.headers.getSetCookie()) {
          response.headers.append('set-cookie', v);
        }
        return response;
      }
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', payload.tenant_id);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
