import { env } from '@/config/env';
import type { ShopProfile } from '@/types/shop';

export async function fetchShopProfile(
  slug: string,
): Promise<ShopProfile | null> {
  let res: Response;
  try {
    res = await fetch(`${env.NEXT_PUBLIC_API_URL}/shop/${slug}`, {
      next: { revalidate: 60 },
    });
  } catch {
    return null;
  }
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<ShopProfile>;
}
