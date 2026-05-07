'use client';

import { useState } from 'react';

import type { ShopProfile, ShopService } from '@/types/shop';

import { ServiceCard } from './service-card';
import { StaffCard } from './staff-card';
import { ServiceDetailSheet } from './service-detail-sheet';

interface ShopViewProps {
  shop: ShopProfile;
  initialServiceId?: string;
}

export function ShopView({ shop, initialServiceId }: ShopViewProps) {
  const initialService =
    initialServiceId != null
      ? (shop.services.find((s) => s.id === initialServiceId) ?? null)
      : null;

  const [selectedService, setSelectedService] = useState<ShopService | null>(
    initialService,
  );

  const servicesByCategory = shop.services.reduce<
    Record<string, ShopService[]>
  >((acc, service) => {
    const cat = service.category ?? 'Outros';
    const existing = acc[cat];
    if (existing) {
      existing.push(service);
    } else {
      acc[cat] = [service];
    }
    return acc;
  }, {});

  return (
    <>
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Serviços</h2>
        {shop.services.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum serviço disponível.
          </p>
        ) : (
          Object.entries(servicesByCategory).map(([category, services]) => (
            <div key={category} className="mb-6">
              <h3 className="text-muted-foreground mb-3 font-medium">
                {category}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onBook={setSelectedService}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {shop.staff.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Nossa Equipe</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shop.staff.map((member) => (
              <StaffCard key={member.user_id} staff={member} />
            ))}
          </div>
        </section>
      )}

      <ServiceDetailSheet
        service={selectedService}
        open={selectedService !== null}
        onClose={() => setSelectedService(null)}
      />
    </>
  );
}
