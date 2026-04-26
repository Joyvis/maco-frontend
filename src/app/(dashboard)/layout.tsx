import { PermissionsProvider } from '@/providers/permissions-provider';
import { UserProvider } from '@/providers/user-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DashboardShell } from '@/components/common/dashboard-shell';
import { MOCK_USER } from '@/config/mock-user';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider value={MOCK_USER}>
      <PermissionsProvider>
        <TooltipProvider>
          <DashboardShell>{children}</DashboardShell>
        </TooltipProvider>
      </PermissionsProvider>
    </UserProvider>
  );
}
