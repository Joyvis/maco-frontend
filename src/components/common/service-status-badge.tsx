import { StatusBadge } from '@/components/common/status-badge';
import { SERVICE_STATUS_LABELS } from '@/types/service';
import type { ServiceStatus } from '@/types/service';

interface ServiceStatusBadgeProps {
  status: ServiceStatus;
}

export function ServiceStatusBadge({ status }: ServiceStatusBadgeProps) {
  return <StatusBadge variant={status} label={SERVICE_STATUS_LABELS[status]} />;
}
