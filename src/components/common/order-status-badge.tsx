import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SALE_ORDER_STATE_LABELS } from '@/types/sale-order';
import type { SaleOrderState } from '@/types/sale-order';

interface OrderStatusBadgeProps {
  state: SaleOrderState;
}

const STATE_CLASSES: Record<SaleOrderState, string> = {
  confirmed: 'border-blue-500 text-blue-600 dark:text-blue-400',
  checked_in: 'border-purple-500 text-purple-600 dark:text-purple-400',
  in_progress: 'border-yellow-500 text-yellow-600 dark:text-yellow-400',
  completed: 'border-green-500 text-green-600 dark:text-green-400',
  cancelled: 'border-muted-foreground/40 text-muted-foreground',
  no_show: 'border-red-500 text-red-600 dark:text-red-400',
};

export function OrderStatusBadge({ state }: OrderStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(STATE_CLASSES[state])}>
      {SALE_ORDER_STATE_LABELS[state]}
    </Badge>
  );
}
