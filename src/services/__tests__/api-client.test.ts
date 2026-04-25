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
      expect.objectContaining({ method: 'GET' }),
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
      }),
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
      expect.objectContaining({ method: httpMethod }),
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
      }),
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
      }),
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

// ─── AC-8: 401 + refresh failure → redirect /login ───────────────────────────
describe('AC-8: Redirect to /login when refresh fails', () => {
  it('redirects to /login when refresh request fails', async () => {
    configureAuth({
      getToken: () => 'old-token',
      getRefreshToken: () => 'refresh-token',
      getTenantId: () => null,
      onTokenRefreshed: jest.fn(),
    });

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

// ─── AC-10: 403 → redirect /unauthorized ─────────────────────────────────────
describe('AC-10: 403 redirects to /unauthorized', () => {
  it('sets window.location.href to /unauthorized on 403', async () => {
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
    await expect(apiClient.get('/offline')).rejects.toThrow('Network error. Check your connection.');
  });
});
