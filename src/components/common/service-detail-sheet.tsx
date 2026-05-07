'use client';

import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ShopService } from '@/types/shop';

import { formatPrice, formatDuration } from './service-card';

interface ServiceDetailSheetProps {
  service: ShopService | null;
  shopSlug: string;
  open: boolean;
  onClose: () => void;
}

export function ServiceDetailSheet({
  service,
  shopSlug,
  open,
  onClose,
}: ServiceDetailSheetProps) {
  const router = useRouter();

  if (!service) return null;

  function handleBook() {
    router.push(`/shop/${shopSlug}/book?service_id=${service!.id}`);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {service.description && (
            <p className="text-muted-foreground text-sm">
              {service.description}
            </p>
          )}
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <Clock className="size-4" />
            {formatDuration(service.duration_minutes)}
          </div>
          <p className="text-lg font-semibold">
            {formatPrice(service.base_price)}
          </p>
          <Button className="w-full" onClick={handleBook}>
            Agendar Agora
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
