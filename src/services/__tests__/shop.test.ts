import { fetchShopProfile } from '@/services/shop';
import type { ShopProfile } from '@/types/shop';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

const MOCK_SHOP: ShopProfile = {
  slug: 'salao-da-maria',
  name: 'Salão da Maria',
  city: 'São Paulo',
  rating: 4.8,
  services: [],
  staff: [],
};

const mockFetch = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mockFetch;
});

describe('fetchShopProfile', () => {
  it('returns shop profile on success', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_SHOP), { status: 200 }),
    );

    const result = await fetchShopProfile('salao-da-maria');
    expect(result).toEqual(MOCK_SHOP);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/shop/salao-da-maria',
      expect.objectContaining({ next: { revalidate: 60 } }),
    );
  });

  it('returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 404 }));

    const result = await fetchShopProfile('unknown-slug');
    expect(result).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 500 }));

    const result = await fetchShopProfile('salao-da-maria');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchShopProfile('salao-da-maria');
    expect(result).toBeNull();
  });
});
