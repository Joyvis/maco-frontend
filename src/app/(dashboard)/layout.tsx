'use client';

import { useState } from 'react';
import { PermissionsProvider } from '@/providers/permissions-provider';
import { Sidebar } from '@/components/common/sidebar';
import { Topbar } from '@/components/common/topbar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <PermissionsProvider>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar onMenuClick={() => setMobileOpen(true)} />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </TooltipProvider>
    </PermissionsProvider>
  );
}
