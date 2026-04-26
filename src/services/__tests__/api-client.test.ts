import { apiClient, configureAuth, resetAuth } from '@/services/api-client';

const BASE_URL = 'http://localhost:8000';

// Mock env module
jest.mock('@/config/env', () => ({
  env: { NEXT_PUBLIC_API_URL: 'http://localhost:8000', NEXT_PUBLIC_APP_NAME: 'Maco' },
}));

// Capture window.location changes
const mockLocationAssign = jest.fn();
Object.defineProperty(window, 'location', {
  value: { href: '', assign: mockLocationAssign },
  writable: true,
});

function mockFetchOk(body: unknown, status = 200) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

function mockFetchFail(status: number, body: unknown = {}) {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => body,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  window.location.href = '';
  resetAuth();
});

// ─── AC-1: GET request ────────────────────────────────────────────────────────
describe('AC-1: GET request URL and response type', () => {
  it('makes GET to BASE_URL/path and resolves with body', async () => {
    global.fetch = mockFetchOk({ data: { id: '1' } });
    const result = await apiClient.get<{ id: string }>('/path');
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/path`,
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual({ data: { id: '1' } });
  });
});

// ─── AC-2: POST with JSON body ────────────────────────────────────────────────
describe('AC-2: POST with JSON body and Content-Type', () => {
  it('sends POST with JSON body and Content-Type header', async () => {
    global.fetch = mockFetchOk({ data: { id: '2' } });
    await apiClient.post('/items', { name: 'test' });
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/items`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });
});

// ─── AC-3: All HTTP methods ────────────────────────────────────────────────────
describe('AC-3: HTTP methods map correctly', () => {
  it.each([
    ['get', 'GET'],
    ['post', 'POST'],
    ['patch', 'PATCH'],
    ['delete', 'DELETE'],
  ] as const)('apiClient.%s uses %s method', async (method, httpMethod) => {
    global.fetch = mockFetchOk({});
    if (method === 'get' || method === 'delete') {
      await apiClient[method]('/x');
    } else {
      await apiClient[method]('/x', {});
    }
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/x`,
      expect.objectContaining({ method: httpMethod })
    );
  });
});

// ─── AC-4: Authorization header when authenticated ────────────────────────────
describe('AC-4: Authorization header when authenticated', () => {
  it('sends Authorization: Bearer <token> when token is set', async () => {
    configureAuth({
      getToken: () => 'my-jwt-token',
      getRefreshToken: () => null,
      getTenantId: () => null,
      onTokenRefreshed: jest.fn(),
    });
    global.fetch = mockFetchOk({});
    await apiClient.get('/protected');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-jwt-token' }),
      })
    );
  });
});

// ─── AC-5: X-Tenant-Id header ─────────────────────────────────────────────────
describe('AC-5: X-Tenant-Id header from auth context', () => {
  it('sends X-Tenant-Id header when tenantId is set', async () => {
    configureAuth({
      getToken: () => 'token',
      getRefreshToken: () => null,
      getTenantId: () => 'tenant-123',
      onTokenRefreshed: jest.fn(),
    });
    global.fetch = mockFetchOk({});
    await apiClient.get('/resource');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Tenant-Id': 'tenant-123' }),
      })
    );
  });
});

// ─── AC-6: No Authorization when unauthenticated ──────────────────────────────
describe('AC-6: No Authorization header when unauthenticated', () => {
  it('omits Authorization header when no token', async () => {
    global.fetch = mockFetchOk({});
    await apiClient.get('/public');
    const [, init] = (fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });
});

// ─── AC-7: 401 triggers refresh and retry ─────────────────────────────────────
describe('AC-7: 401 triggers token refresh and retries request', () => {
  it('refreshes token and retries original request on 401', async () => {
    const onTokenRefreshed = jest.fn();
    configureAuth({
      getToken: () => 'old-token',
      getRefreshToken: () => 'refresh-token',
      getTenantId: () => null,
      onTokenRefreshed,
    });

    global.fetch = jest
      .fn()
      // Original request → 401
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      // Refresh request → success
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'new-token' }),
      })
      // Retry original → success
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: 'retried' }) });

    const result = await apiClient.get('/secure');
    expect(onTokenRefreshed).toHaveBeenCalledWith('new-token');
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ data: 'retried' });
  });
});

// ─── AC-8: 401 + refresh failure → onUnauthorized callback ──────────────────
describe('AC-8: Calls onUnauthorized when refresh fails', () => {
  it('calls onUnauthorized callback when refresh request fails', async () => {
    const onUnauthorized = jest.fn();
    configureAuth({
      getToken: () => 'old-token',
      getRefreshToken: () => 'refresh-token',
      getTenantId: () => null,
      onTokenRefreshed: jest.fn(),
      onUnauthorized,
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });

    await expect(apiClient.get('/secure')).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('redirects to /login by default when refresh fails and no onUnauthorized provided', async () => {
    // resetAuth() in beforeEach sets the default redirect callback
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });

    await expect(apiClient.get('/secure')).rejects.toThrow();
    expect(window.location.href).toBe('/login');
  });
});

// ─── AC-9: Concurrent 401s → single refresh ───────────────────────────────────
describe('AC-9: Concurrent 401s trigger only one refresh', () => {
  it('fires only one refresh request for multiple concurrent 401s', async () => {
    configureAuth({
      getToken: () => 'old-token',
      getRefreshToken: () => 'refresh-token',
      getTenantId: () => null,
      onTokenRefreshed: jest.fn(),
    });

    let refreshCount = 0;
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        refreshCount++;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'new-token' }),
        });
      }
      if (refreshCount === 0) {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: 'ok' }) });
    });

    await Promise.all([apiClient.get('/a'), apiClient.get('/b'), apiClient.get('/c')]);
    expect(refreshCount).toBe(1);
  });
});

// ─── AC-10: 403 → onForbidden callback ───────────────────────────────────────
describe('AC-10: 403 calls onForbidden callback', () => {
  it('calls onForbidden callback on 403', async () => {
    const onForbidden = jest.fn();
    configureAuth({
      getToken: () => null,
      getRefreshToken: () => null,
      getTenantId: () => null,
      onTokenRefreshed: jest.fn(),
      onForbidden,
    });
    global.fetch = mockFetchFail(403);
    await expect(apiClient.get('/admin')).rejects.toThrow();
    expect(onForbidden).toHaveBeenCalled();
  });

  it('redirects to /unauthorized by default when 403 and no onForbidden provided', async () => {
    // resetAuth() in beforeEach sets the default redirect callback
    global.fetch = mockFetchFail(403);
    await expect(apiClient.get('/admin')).rejects.toThrow();
    expect(window.location.href).toBe('/unauthorized');
  });
});

// ─── AC-11: 422 → ApiError with validation errors ────────────────────────────
describe('AC-11: 422 throws ApiError with parsed validation errors', () => {
  it('throws ApiError with message and errors on 422', async () => {
    const body = { message: 'Validation failed', errors: { name: ['is required'] } };
    global.fetch = mockFetchFail(422, body);
    await expect(apiClient.post('/items', {})).rejects.toMatchObject({
      message: 'Validation failed',
      errors: { name: ['is required'] },
    });
  });
});

// ─── AC-12: 5xx → generic error ───────────────────────────────────────────────
describe('AC-12: 5xx throws generic error', () => {
  it('throws with "Something went wrong" message on 500', async () => {
    global.fetch = mockFetchFail(500);
    await expect(apiClient.get('/boom')).rejects.toThrow('Something went wrong. Please try again.');
  });
});

// ─── AC-13: Network error ─────────────────────────────────────────────────────
describe('AC-13: Network error throws typed error', () => {
  it('throws with "Network error" message on fetch failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiClient.get('/offline')).rejects.toThrow(
      'Network error. Check your connection.'
    );
  });
});

// ─── Query params serialization ───────────────────────────────────────────────
describe('Query params serialization', () => {
  it('appends defined params to the URL', async () => {
    global.fetch = mockFetchOk({ data: [] });
    await apiClient.get('/items', { status: 'active', page: 1 });
    const [url] = (fetch as jest.Mock).mock.calls[0] as [string];
    expect(url).toContain('status=active');
    expect(url).toContain('page=1');
  });

  it('omits undefined params from the URL', async () => {
    global.fetch = mockFetchOk({ data: [] });
    await apiClient.get('/items', { status: undefined, page: 2 });
    const [url] = (fetch as jest.Mock).mock.calls[0] as [string];
    expect(url).not.toContain('status');
    expect(url).toContain('page=2');
  });
});

// ─── Content-Type header ──────────────────────────────────────────────────────
describe('Content-Type header', () => {
  it('omits Content-Type on bodyless GET requests', async () => {
    global.fetch = mockFetchOk({});
    await apiClient.get('/items');
    const [, init] = (fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('includes Content-Type on POST with body', async () => {
    global.fetch = mockFetchOk({});
    await apiClient.post('/items', { name: 'test' });
    const [, init] = (fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });
});

// ─── Fallback error ───────────────────────────────────────────────────────────
describe('Fallback error for unhandled status codes', () => {
  it('throws with response message for unhandled status (e.g. 404)', async () => {
    global.fetch = mockFetchFail(404, { message: 'Not found' });
    await expect(apiClient.get('/missing')).rejects.toThrow('Not found');
  });

  it('throws default message when body has no message', async () => {
    global.fetch = mockFetchFail(404, {});
    await expect(apiClient.get('/missing')).rejects.toThrow('An unexpected error occurred.');
  });
});

// ─── Initial authConfig lambdas (before resetAuth is ever called) ─────────────
describe('Initial authConfig lambdas', () => {
  it('getToken and getTenantId return null in the initial module state', async () => {
    // Use an isolated module instance so resetAuth() from beforeEach has not run yet,
    // ensuring the module-initialization lambdas (lines 14, 16) are exercised.
    let fresh!: typeof import('@/services/api-client');
    jest.isolateModules(() => {
      jest.mock('@/config/env', () => ({
        env: { NEXT_PUBLIC_API_URL: 'http://localhost:8000', NEXT_PUBLIC_APP_NAME: 'Maco' },
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      fresh = require('@/services/api-client') as typeof import('@/services/api-client');
    });

    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    await fresh.apiClient.get('/test');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
    expect(headers['X-Tenant-Id']).toBeUndefined();
  });
});

// ─── resetAuth default lambdas ────────────────────────────────────────────────
describe('resetAuth default lambdas (getRefreshToken and onTokenRefreshed)', () => {
  it('covers getRefreshToken and onTokenRefreshed defaults when 401+refresh succeeds', async () => {
    // resetAuth() is called in beforeEach — authConfig uses its default lambdas.
    // Trigger a 401 so attemptTokenRefresh calls getRefreshToken (line 27),
    // then mock the refresh succeeding so onTokenRefreshed (line 29) is called.
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'new-token' }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: 'ok' }) });

    const result = await apiClient.get('/secure');
    expect(result).toEqual({ data: 'ok' });
  });
});
