'use client';

import { PermissionsProvider } from '@/providers/permissions-provider';
import { UserProvider } from '@/providers/user-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { useAuth } from '@/hooks/use-auth';
import { useRequireAuth } from '@/hooks/use-require-auth';

export function DashboardShellWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useRequireAuth();
  const { user } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <UserProvider value={{ id: user.id, name: user.name, email: user.email }}>
      <PermissionsProvider>
        <TooltipProvider>
          <DashboardShell>{children}</DashboardShell>
        </TooltipProvider>
      </PermissionsProvider>
    </UserProvider>
  );
}
