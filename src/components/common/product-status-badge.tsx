import { StatusBadge } from '@/components/common/status-badge';
import { PRODUCT_STATUS_LABELS } from '@/types/product';
import type { ProductStatus } from '@/types/product';

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  return <StatusBadge variant={status} label={PRODUCT_STATUS_LABELS[status]} />;
}
