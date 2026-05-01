import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PRODUCT_STATUS_LABELS } from '@/types/product';
import type { ProductStatus } from '@/types/product';

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'active'
          ? 'border-green-500 text-green-600 dark:text-green-400'
          : status === 'draft'
            ? 'border-blue-400 text-blue-600 dark:text-blue-400'
            : 'border-muted-foreground/40 text-muted-foreground',
      )}
    >
      {PRODUCT_STATUS_LABELS[status]}
    </Badge>
  );
}
