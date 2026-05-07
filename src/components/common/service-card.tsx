'use client';

import { Clock } from 'lucide-react';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ShopService } from '@/types/shop';

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

interface ServiceCardProps {
  service: ShopService;
  onBook: (service: ShopService) => void;
}

export function ServiceCard({ service, onBook }: ServiceCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{service.name}</CardTitle>
          {service.category && (
            <Badge variant="secondary" className="shrink-0">
              {service.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <div className="text-muted-foreground flex items-center gap-1 text-sm">
          <Clock className="size-4" />
          {formatDuration(service.duration_minutes)}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-2">
        <span className="font-semibold">{formatPrice(service.base_price)}</span>
        <Button size="sm" onClick={() => onBook(service)}>
          Agendar
        </Button>
      </CardFooter>
    </Card>
  );
}
