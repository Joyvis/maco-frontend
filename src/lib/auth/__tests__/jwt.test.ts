// jose uses ESM — mock it with a CJS-compatible implementation
jest.mock('jose', () => ({
  decodeJwt: (token: string) => {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT');
    const payload = parts[1];
    if (!payload) throw new Error('Invalid JWT');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as unknown;
  },
}));

import { decodeToken, isTokenExpired } from '@/lib/auth/jwt';
import type { JWTPayload } from '@/types/auth';

// Build a minimal JWT (header.payload.sig) with a real base64url payload
function makeToken(payload: Partial<JWTPayload>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fakesig`;
}

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
const PAST_EXP = Math.floor(Date.now() / 1000) - 60; // 1 minute ago

const VALID_PAYLOAD: JWTPayload = {
  sub: 'user-1',
  email: 'user@example.com',
  tenant_id: 'tenant-abc',
  roles: ['admin'],
  permissions: [{ resource: 'tickets', action: 'write' }],
  exp: FUTURE_EXP,
  iat: Math.floor(Date.now() / 1000) - 60,
};

describe('decodeToken', () => {
  it('returns JWTPayload for a valid token', () => {
    const token = makeToken(VALID_PAYLOAD);
    const result = decodeToken(token);
    expect(result).not.toBeNull();
    expect(result?.sub).toBe('user-1');
    expect(result?.email).toBe('user@example.com');
    expect(result?.tenant_id).toBe('tenant-abc');
    expect(result?.exp).toBe(FUTURE_EXP);
  });

  it('returns null for a malformed token', () => {
    expect(decodeToken('not.a.token.at.all.garbage')).toBeNull();
    expect(decodeToken('')).toBeNull();
    expect(decodeToken('onlyone')).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('returns false for a token with future exp', () => {
    const payload: JWTPayload = { ...VALID_PAYLOAD, exp: FUTURE_EXP };
    expect(isTokenExpired(payload)).toBe(false);
  });

  it('returns true for a token with past exp', () => {
    const payload: JWTPayload = { ...VALID_PAYLOAD, exp: PAST_EXP };
    expect(isTokenExpired(payload)).toBe(true);
  });
});
