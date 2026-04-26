import { useAuth } from '@/hooks/use-auth';

interface UsePermissionResult {
  hasPermission: boolean;
  isLoading: boolean;
}

export function usePermission(resource: string, action: string): UsePermissionResult {
  const { user, isLoading } = useAuth();

  const hasPermission =
    user?.permissions.some((p) => p.resource === resource && p.action === action) ?? false;

  return { hasPermission, isLoading };
}
