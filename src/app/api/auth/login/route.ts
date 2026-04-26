import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/config/env';
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from '@/lib/auth/cookies';
import type { AuthTokens, User } from '@/types/auth';

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };

  if (!body.email || !body.password) {
    return NextResponse.json({ message: 'E-mail e senha são obrigatórios' }, { status: 400 });
  }

  const backendRes = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  if (!backendRes.ok) {
    const err = (await backendRes.json().catch(() => ({}))) as { message?: string };
    const status = backendRes.status === 401 ? 401 : 400;
    return NextResponse.json(
      { message: err.message ?? 'E-mail ou senha inválidos' },
      { status }
    );
  }

  const tokens = (await backendRes.json()) as AuthTokens;

  const meRes = await fetch(`${env.NEXT_PUBLIC_API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!meRes.ok) {
    return NextResponse.json({ message: 'Falha ao carregar dados do usuário' }, { status: 502 });
  }

  const user = (await meRes.json()) as User;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_ACCESS_TOKEN, tokens.access_token, accessTokenCookieOptions(tokens.expires_in));
  cookieStore.set(COOKIE_REFRESH_TOKEN, tokens.refresh_token, refreshTokenCookieOptions());

  return NextResponse.json({
    user,
    access_token: tokens.access_token,
    expires_in: tokens.expires_in,
  });
}
