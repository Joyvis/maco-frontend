import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserStatusBadgeProps {
  status: 'active' | 'inactive';
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'active'
          ? 'border-green-500 text-green-600 dark:text-green-400'
          : 'border-muted-foreground/40 text-muted-foreground',
      )}
    >
      {status === 'active' ? 'Ativo' : 'Inativo'}
    </Badge>
  );
}
