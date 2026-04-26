import type { LucideIcon } from 'lucide-react';
import type { Permission } from './permissions';

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  requiredPermission?: Permission;
  children?: NavItem[];
}
