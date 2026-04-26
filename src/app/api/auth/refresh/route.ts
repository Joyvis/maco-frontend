import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/config/env';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from '@/lib/auth/cookies';
import type { AuthTokens } from '@/types/auth';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: 'Sessão expirada' }, { status: 401 });
  }

  const backendRes = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!backendRes.ok) {
    return NextResponse.json({ message: 'Sessão expirada' }, { status: 401 });
  }

  const tokens = (await backendRes.json()) as AuthTokens;

  cookieStore.set(
    COOKIE_ACCESS_TOKEN,
    tokens.access_token,
    accessTokenCookieOptions(tokens.expires_in)
  );
  cookieStore.set(COOKIE_REFRESH_TOKEN, tokens.refresh_token, refreshTokenCookieOptions());

  return NextResponse.json({
    access_token: tokens.access_token,
    expires_in: tokens.expires_in,
  });
}
