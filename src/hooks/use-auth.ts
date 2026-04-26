import { useAuthContext } from '@/providers/auth-provider';
import type { AuthContextValue } from '@/types/auth';

export function useAuth(): AuthContextValue {
  return useAuthContext();
}
