import { notFound } from 'next/navigation';

import { fetchShopProfile } from '@/services/shop';
import { ShopHero } from '@/components/common/shop-hero';
import { ShopView } from '@/components/common/shop-view';

interface ShopPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { slug } = await params;
  const shop = await fetchShopProfile(slug);

  if (!shop) notFound();

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <ShopHero
        name={shop.name}
        logoUrl={shop.logo_url}
        city={shop.city}
        rating={shop.rating}
      />
      <ShopView shop={shop} />
    </main>
  );
}
