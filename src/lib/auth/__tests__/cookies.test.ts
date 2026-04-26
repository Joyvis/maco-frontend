import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  REFRESH_TOKEN_MAX_AGE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  clearCookieOptions,
} from '@/lib/auth/cookies';

describe('cookie constants', () => {
  it('exports correct cookie names', () => {
    expect(COOKIE_ACCESS_TOKEN).toBe('access_token');
    expect(COOKIE_REFRESH_TOKEN).toBe('refresh_token');
  });

  it('REFRESH_TOKEN_MAX_AGE is 7 days in seconds', () => {
    expect(REFRESH_TOKEN_MAX_AGE).toBe(7 * 24 * 60 * 60);
  });
});

describe('accessTokenCookieOptions', () => {
  it('returns correct options with given maxAge', () => {
    const opts = accessTokenCookieOptions(900);
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('lax');
    expect(opts.path).toBe('/');
    expect(opts.maxAge).toBe(900);
  });

  it('secure is false in non-production environment', () => {
    const opts = accessTokenCookieOptions(900);
    expect(opts.secure).toBe(false); // NODE_ENV=test in Jest
  });
});

describe('refreshTokenCookieOptions', () => {
  it('returns correct options with REFRESH_TOKEN_MAX_AGE', () => {
    const opts = refreshTokenCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('lax');
    expect(opts.path).toBe('/');
    expect(opts.maxAge).toBe(REFRESH_TOKEN_MAX_AGE);
    expect(opts.secure).toBe(false);
  });
});

describe('clearCookieOptions', () => {
  it('returns options with maxAge 0 to expire the cookie', () => {
    const opts = clearCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('lax');
    expect(opts.path).toBe('/');
    expect(opts.maxAge).toBe(0);
    expect(opts.secure).toBe(false);
  });
});

describe('secure flag in production environment', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accessTokenCookieOptions secure is true in production', () => {
    const opts = accessTokenCookieOptions(900);
    expect(opts.secure).toBe(true);
  });

  it('refreshTokenCookieOptions secure is true in production', () => {
    const opts = refreshTokenCookieOptions();
    expect(opts.secure).toBe(true);
  });

  it('clearCookieOptions secure is true in production', () => {
    const opts = clearCookieOptions();
    expect(opts.secure).toBe(true);
  });
});
