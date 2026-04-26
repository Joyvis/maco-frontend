'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import { configureAuth, resetAuth } from '@/services/api-client';
import { env } from '@/config/env';
import type { AuthContextValue, User } from '@/types/auth';

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null);
  const mountedRef = useRef(true);
  // Holds the latest scheduleRefresh so the timer callback never captures a stale ref
  const scheduleRefreshRef = useRef<(expiresIn: number) => void>(() => {});

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const logout = useCallback(async () => {
    clearTimer();
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    if (mountedRef.current) {
      setUser(null);
      setAccessToken(null);
    }
    resetAuth();
    router.push('/login');
  }, [router]);

  // schedule a background token refresh at 80% of TTL
  const scheduleRefresh = useCallback(
    (expiresIn: number) => {
      clearTimer();
      const delay = Math.floor(expiresIn * 1000 * 0.8);
      timerRef.current = setTimeout(async () => {
        if (refreshInFlightRef.current) return;
        refreshInFlightRef.current = (async (): Promise<string | null> => {
          try {
            const r = await fetch('/api/auth/refresh', { method: 'POST' });
            if (!r.ok) {
              await logout();
              return null;
            }
            const d = (await r.json()) as {
              access_token: string;
              expires_in: number;
            };
            if (mountedRef.current) {
              setAccessToken(d.access_token);
              scheduleRefreshRef.current(d.expires_in);
            }
            return d.access_token;
          } catch {
            await logout();
            return null;
          } finally {
            refreshInFlightRef.current = null;
          }
        })();
        await refreshInFlightRef.current;
      }, delay);
    },
    [logout],
  );

  // Keep ref in sync so the timer callback always calls the latest version
  useEffect(() => {
    scheduleRefreshRef.current = scheduleRefresh;
  }, [scheduleRefresh]);

  // Wire api-client whenever token/user changes
  useEffect(() => {
    try {
      if (accessToken) {
        configureAuth({
          getToken: () => accessToken,
          getRefreshToken: () => null,
          getTenantId: () => user?.tenant_id ?? null,
          onTokenRefreshed: (t) => {
            if (mountedRef.current) setAccessToken(t);
          },
          onUnauthorized: () => {
            void logout();
          },
        });
      } else {
        resetAuth();
      }
    } catch (err) {
      // configureAuth/resetAuth setup failure must not crash the provider —
      // the auth state remains valid; the api-client will fall back to its
      // default (no-token) config.
      console.error('Failed to configure api-client auth', err);
    }
  }, [accessToken, user, logout]);

  // On mount: try to restore session via refresh cookie
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const r = await fetch('/api/auth/refresh', { method: 'POST' });
        if (!r.ok) return;
        const d = (await r.json()) as {
          access_token: string;
          expires_in: number;
        };
        const meR = await fetch(`${env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${d.access_token}` },
        });
        if (!meR.ok) return;
        const userData = (await meR.json()) as User;
        if (mountedRef.current) {
          setUser(userData);
          setAccessToken(d.access_token);
          scheduleRefreshRef.current(d.expires_in);
        }
      } catch {
        // Network error or configureAuth setup failure — fall through and
        // remain unauthenticated. Avoids unhandled promise rejection.
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    })();

    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message ?? 'E-mail ou senha inválidos');
      }

      const d = (await r.json()) as {
        user: User;
        access_token: string;
        expires_in: number;
      };
      setUser(d.user);
      setAccessToken(d.access_token);
      scheduleRefresh(d.expires_in);
    },
    [scheduleRefresh],
  );

  const tenant = user?.tenant_id ?? null;
  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{ user, tenant, isAuthenticated, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
