import { notFound } from 'next/navigation';

import { fetchShopProfile } from '@/services/shop';
import { BookingWizard } from '@/components/common/booking-wizard';

interface BookPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service_id?: string }>;
}

export default async function BookPage({
  params,
  searchParams,
}: BookPageProps) {
  const { slug } = await params;
  const { service_id: serviceId } = await searchParams;

  if (!serviceId) notFound();

  const shop = await fetchShopProfile(slug);
  if (!shop) notFound();

  const service = shop.services.find((s) => s.id === serviceId);
  if (!service) notFound();

  return (
    <main className="container mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{service.name}</h1>
      <BookingWizard
        serviceId={service.id}
        serviceName={service.name}
        servicePrice={service.base_price}
        shopSlug={slug}
      />
    </main>
  );
}
