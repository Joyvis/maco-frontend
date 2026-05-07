'use client';

import { CalendarDays, Clock, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { SaleOrder, SaleOrderState } from '@/types/appointment';

import { CancelDialog } from './cancel-dialog';
import { RescheduleSheet } from './reschedule-sheet';

const UPCOMING_STATES: SaleOrderState[] = [
  'confirmed',
  'checked_in',
  'in_progress',
];

const STATE_LABELS: Record<SaleOrderState, string> = {
  confirmed: 'Confirmado',
  checked_in: 'Check-in',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
  pending_payment: 'Aguardando Pagamento',
  pending_checkout: 'Aguardando Checkout',
};

function statusVariant(
  state: SaleOrderState,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (
    state === 'confirmed' ||
    state === 'checked_in' ||
    state === 'in_progress'
  )
    return 'default';
  if (state === 'completed') return 'secondary';
  return 'destructive';
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface AppointmentCardProps {
  order: SaleOrder;
  onRate?: (id: string) => void;
}

export function AppointmentCard({ order, onRate }: AppointmentCardProps) {
  const isUpcoming = UPCOMING_STATES.includes(order.state);
  const isCompleted = order.state === 'completed';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{order.service_name}</CardTitle>
          <Badge variant={statusVariant(order.state)}>
            {STATE_LABELS[order.state]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <CalendarDays className="size-4 shrink-0" />
          <span>{formatDate(order.scheduled_at)}</span>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Clock className="size-4 shrink-0" />
          <span>{formatTime(order.scheduled_at)}</span>
        </div>
        {order.professional_name && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <User className="size-4 shrink-0" />
            <span>{order.professional_name}</span>
          </div>
        )}
      </CardContent>

      {(isUpcoming || isCompleted) && (
        <CardFooter className="gap-2">
          {isUpcoming && (
            <>
              <RescheduleSheet order={order} />
              <CancelDialog order={order} />
            </>
          )}
          {isCompleted && onRate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRate(order.id)}
            >
              Avaliar
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
