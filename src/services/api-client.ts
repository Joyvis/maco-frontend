'use client';

import { env } from '@/config/env';
import type { ApiError } from '@/types/api';

export interface AuthConfig {
  getToken: () => string | null;
  getRefreshToken: () => string | null;
  getTenantId: () => string | null;
  onTokenRefreshed: (token: string) => void;
  onUnauthorized?: () => void;
  onForbidden?: () => void;
}

const defaultOnUnauthorized = () => {
  window.location.href = '/login';
};

const defaultOnForbidden = () => {
  window.location.href = '/unauthorized';
};

let authConfig: AuthConfig = {
  getToken: () => null,
  getRefreshToken: () => null,
  getTenantId: () => null,
  onTokenRefreshed: () => undefined,
  onUnauthorized: defaultOnUnauthorized,
  onForbidden: defaultOnForbidden,
};

export function configureAuth(config: AuthConfig): void {
  authConfig = {
    onUnauthorized: defaultOnUnauthorized,
    onForbidden: defaultOnForbidden,
    ...config,
  };
}

export function resetAuth(): void {
  authConfig = {
    getToken: () => null,
    getRefreshToken: () => null,
    getTenantId: () => null,
    onTokenRefreshed: () => undefined,
    onUnauthorized: defaultOnUnauthorized,
    onForbidden: defaultOnForbidden,
  };
  isRefreshing = false;
  refreshQueue = [];
}

// ─── Token refresh queue ───────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: Error) => void;
}> = [];

async function attemptTokenRefresh(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise<string | null>((resolve, reject) => {
      refreshQueue.push({ resolve: (token) => resolve(token), reject });
    });
  }

  isRefreshing = true;
  try {
    const refreshToken = authConfig.getRefreshToken();
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const err = new Error('Session expired. Please log in again.');
      refreshQueue.forEach(({ reject }) => reject(err));
      refreshQueue = [];
      return null;
    }

    const body = (await response.json()) as { access_token: string };
    const newToken = body.access_token;
    authConfig.onTokenRefreshed(newToken);
    refreshQueue.forEach(({ resolve }) => resolve(newToken));
    refreshQueue = [];
    return newToken;
  } finally {
    isRefreshing = false;
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

// ─── Core request ──────────────────────────────────────────────────────────────
async function request<T>(
  method: string,
  path: string,
  options: { params?: QueryParams; body?: unknown } = {},
  isRetry = false,
): Promise<T> {
  const { params, body } = options;
  const baseUrl = env.NEXT_PUBLIC_API_URL;

  let url = `${baseUrl}${path}`;
  if (params && Object.keys(params).length > 0) {
    const search = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    );
    url = `${url}?${search.toString()}`;
  }

  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = authConfig.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const tenantId = authConfig.getTenantId();
  if (tenantId) headers['X-Tenant-Id'] = tenantId;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Network error. Check your connection.');
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  const { status } = response;

  if (status === 401 && !isRetry) {
    const newToken = await attemptTokenRefresh();
    if (!newToken) {
      authConfig.onUnauthorized?.();
      throw new Error('Session expired. Please log in again.');
    }
    return request<T>(method, path, options, true);
  }

  if (status === 403) {
    authConfig.onForbidden?.();
    throw new Error('Forbidden');
  }

  if (status === 422) {
    const apiError = (await response.json()) as ApiError;
    throw apiError;
  }

  if (status >= 500) {
    throw new Error('Something went wrong. Please try again.');
  }

  const fallback = (await response.json().catch(() => ({}))) as ApiError;
  throw new Error(fallback.message ?? 'An unexpected error occurred.');
}

// ─── Public API client ─────────────────────────────────────────────────────────
export const apiClient = {
  get<T>(path: string, params?: QueryParams): Promise<T> {
    return request<T>('GET', path, { params });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('POST', path, { body });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PATCH', path, { body });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>('DELETE', path);
  },
};
