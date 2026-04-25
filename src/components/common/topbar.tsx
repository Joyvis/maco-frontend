'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Menu, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Breadcrumbs } from './breadcrumbs';

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

type ThemeKey = keyof typeof THEME_ICONS;

const MOCK_USER = {
  name: 'Usuário',
  email: 'usuario@maco.app',
  imageUrl: undefined as string | undefined,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function signOut() {
  // stub — replace with real auth signOut in future ticket
}

interface TopbarProps {
  tenantName?: string;
  onMenuClick?: () => void;
}

export function Topbar({ tenantName = 'Maco', onMenuClick }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const currentTheme = (theme as ThemeKey | undefined) ?? 'system';

  function cycleTheme() {
    const order: ThemeKey[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(currentTheme) + 1) % order.length] ?? 'system';
    setTheme(next);
  }

  const ThemeIcon = THEME_ICONS[currentTheme];

  return (
    <header className="flex h-14 items-center gap-3 border-b px-4 bg-background">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="size-4" />
      </Button>

      {/* Tenant name (left) */}
      <span className="hidden md:block text-sm font-medium text-muted-foreground">
        {tenantName}
      </span>

      {/* Breadcrumbs */}
      <div className="flex-1">
        <Breadcrumbs />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={cycleTheme}
          aria-label={`Switch theme (current: ${currentTheme})`}
        >
          <ThemeIcon className="size-4" />
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="User menu">
              <Avatar size="sm">
                {MOCK_USER.imageUrl && (
                  <AvatarImage src={MOCK_USER.imageUrl} alt={MOCK_USER.name} />
                )}
                <AvatarFallback>{getInitials(MOCK_USER.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/configuracoes/perfil">Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/configuracoes">Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                signOut();
                router.push('/login');
              }}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
