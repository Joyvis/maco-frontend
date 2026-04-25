import { PermissionsProvider } from '@/providers/permissions-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DashboardShell } from '@/components/common/dashboard-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider>
      <TooltipProvider>
        <DashboardShell>{children}</DashboardShell>
      </TooltipProvider>
    </PermissionsProvider>
  );
}
