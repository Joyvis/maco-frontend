'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/common/page-header';

const TABS = [
  { label: 'Perfil', href: '/configuracoes/tenant/perfil' },
  { label: 'Configurações', href: '/configuracoes/tenant/configs' },
] as const;

export default function TenantSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações do Tenant"
        description="Gerencie o perfil, configurações e ações da conta"
      />

      <nav aria-label="Configurações do tenant" className="flex gap-1 border-b">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
