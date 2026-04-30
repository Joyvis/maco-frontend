import { Badge } from '@/components/ui/badge';

interface SystemRoleBadgeProps {
  isSystem: boolean;
}

export function SystemRoleBadge({ isSystem }: SystemRoleBadgeProps) {
  if (isSystem) {
    return <Badge variant="default">Sistema</Badge>;
  }
  return <Badge variant="outline">Personalizado</Badge>;
}
