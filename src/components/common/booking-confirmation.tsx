'use client';

import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { BookingItem, TimeSlot } from '@/types/booking';

interface BookingConfirmationProps {
  serviceName: string;
  date: string;
  timeSlot: TimeSlot;
  staffName: string | null;
  items: BookingItem[];
  isSubmitting: boolean;
  onConfirm: () => void;
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day ?? ''}/${month ?? ''}/${year ?? ''}`;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function BookingConfirmation({
  serviceName,
  date,
  timeSlot,
  staffName,
  items,
  isSubmitting,
  onConfirm,
}: BookingConfirmationProps) {
  const total = items.reduce(
    (sum, item) => (item.included ? sum : sum + item.price),
    0,
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Confirmação</h3>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Serviço</span>
          <span className="font-medium">{serviceName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Data</span>
          <span className="font-medium">{formatDate(date)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Horário</span>
          <span className="font-medium">{timeSlot.start_time}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Profissional</span>
          <span className="font-medium">
            {staffName ?? 'Qualquer Disponível'}
          </span>
        </div>

        {items.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.service_id}
                  className="flex justify-between text-sm"
                >
                  <span
                    className={cn(item.included && 'text-muted-foreground')}
                  >
                    {item.service_name}
                    {item.included && (
                      <span className="ml-1 text-xs">(incluído)</span>
                    )}
                  </span>
                  <span>{item.included ? '—' : formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>
          <span className="font-semibold">Política de cancelamento:</span> O
          cancelamento deve ser feito com pelo menos 24 horas de antecedência.
        </p>
      </div>

      <Button className="w-full" disabled={isSubmitting} onClick={onConfirm}>
        {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}
      </Button>
    </div>
  );
}
