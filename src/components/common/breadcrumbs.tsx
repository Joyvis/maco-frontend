'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import { SEGMENT_LABELS } from '@/config/navigation';

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="breadcrumb"
      className="text-muted-foreground flex items-center gap-1 text-sm"
    >
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = '/' + segments.slice(0, index + 1).join('/');
        const label = SEGMENT_LABELS[segment] ?? segment;

        return (
          <span key={href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3.5 shrink-0" />}
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link
                href={href}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
