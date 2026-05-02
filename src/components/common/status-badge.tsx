import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusVariant = 'active' | 'inactive' | 'draft' | 'archived';

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
}

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        variant === 'active'
          ? 'border-green-500 text-green-600 dark:text-green-400'
          : 'border-muted-foreground/40 text-muted-foreground',
      )}
    >
      {label}
    </Badge>
  );
}
