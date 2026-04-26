import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  clearCookieOptions,
} from '@/lib/auth/cookies';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_ACCESS_TOKEN, '', clearCookieOptions());
  cookieStore.set(COOKIE_REFRESH_TOKEN, '', clearCookieOptions());
  return NextResponse.json({ message: 'Sessão encerrada' });
}
