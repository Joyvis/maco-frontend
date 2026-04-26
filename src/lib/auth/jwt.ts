import { decodeJwt } from 'jose';
import type { JWTPayload } from '@/types/auth';

export function decodeToken(token: string): JWTPayload | null {
  try {
    return decodeJwt(token) as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JWTPayload): boolean {
  return payload.exp * 1000 < Date.now();
}
