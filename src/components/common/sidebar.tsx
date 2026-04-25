'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/config/navigation';
import { usePermissions } from '@/providers/permissions-provider';
import type { NavItem } from '@/types/navigation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const STORAGE_KEY = 'maco-sidebar-state';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'collapsed';
  });

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? 'collapsed' : 'expanded');
      return next;
    });
  }

  return { collapsed, toggle };
}

function NavGroup({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  if (!item.children) {
    return <NavLink item={item} collapsed={collapsed} pathname={pathname} />;
  }

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            )}
          >
            {Icon && <Icon className="size-4 shrink-0" />}
            <span className="sr-only">{item.label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Collapsible defaultOpen={isActive}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isActive && 'font-medium text-sidebar-foreground'
          )}
        >
          {Icon && <Icon className="size-4 shrink-0" />}
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown className="size-3.5 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-1 space-y-0.5 pl-6">
          {item.children.map((child) => (
            <li key={child.href}>
              <NavLink item={child} collapsed={false} pathname={pathname} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function NavLink({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const isActive = pathname === item.href;
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
        collapsed && 'h-9 w-9 justify-center px-0'
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      {!collapsed && <span>{item.label}</span>}
      {collapsed && <span className="sr-only">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

export function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.requiredPermission || hasPermission(item.requiredPermission)
  );

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-sidebar text-sidebar-foreground',
        collapsed ? 'w-14' : 'w-64'
      )}
      data-testid="sidebar-content"
    >
      <div
        className={cn(
          'flex h-14 items-center border-b border-sidebar-border px-3',
          collapsed && 'justify-center'
        )}
      >
        {!collapsed && (
          <span className="text-base font-semibold text-sidebar-foreground">Maco</span>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {visibleItems.map((item) => (
          <NavGroup key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
        ))}
      </nav>
    </div>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { collapsed, toggle } = useSidebarState();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-sidebar-border h-full transition-[width] duration-200',
          collapsed ? 'w-14' : 'w-64'
        )}
        aria-label="Main navigation"
      >
        <SidebarContent collapsed={collapsed} />
        <div
          className={cn('border-t border-sidebar-border p-2', collapsed && 'flex justify-center')}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <PanelLeft className="size-4" />
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden="true"
            data-testid="mobile-drawer-overlay"
          />
          <aside
            className="relative flex flex-col w-64 h-full border-r border-sidebar-border"
            aria-label="Main navigation"
          >
            <SidebarContent collapsed={false} />
          </aside>
        </div>
      )}
    </>
  );
}
