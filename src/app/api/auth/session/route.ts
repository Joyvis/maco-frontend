import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { COOKIE_ACCESS_TOKEN } from '@/lib/auth/cookies';
import { decodeToken, isTokenExpired } from '@/lib/auth/jwt';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'Sem sessão' }, { status: 401 });
  }

  const payload = decodeToken(accessToken);
  if (!payload || isTokenExpired(payload)) {
    return NextResponse.json({ message: 'Sem sessão' }, { status: 401 });
  }

  const expiresIn = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
  return NextResponse.json({
    access_token: accessToken,
    expires_in: expiresIn,
  });
}
