import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
} from 'lucide-react';

import type { NavItem } from '@/types/navigation';

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    requiredPermission: 'dashboard:read',
  },
  {
    label: 'Pedidos',
    href: '/pedidos',
    icon: ShoppingCart,
    requiredPermission: 'orders:read',
    children: [
      { label: 'Ordens de Venda', href: '/pedidos/ordens' },
      { label: 'Pool', href: '/pedidos/pool' },
    ],
  },
  {
    label: 'Catálogo',
    href: '/catalogo',
    icon: Package,
    requiredPermission: 'catalog:read',
    children: [
      { label: 'Serviços', href: '/catalogo/servicos' },
      { label: 'Produtos', href: '/catalogo/produtos' },
      { label: 'Categorias', href: '/catalogo/categorias' },
      { label: 'Combos', href: '/catalogo/combos' },
    ],
  },
  {
    label: 'Equipe',
    href: '/equipe',
    icon: Users,
    requiredPermission: 'team:manage',
    children: [
      { label: 'Usuários', href: '/equipe/usuarios' },
      { label: 'Papéis', href: '/equipe/papeis' },
      { label: 'Qualificações', href: '/equipe/qualificacoes' },
    ],
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    requiredPermission: 'settings:read',
    children: [
      { label: 'Tenant', href: '/configuracoes/tenant' },
      { label: 'Políticas de Pagamento', href: '/configuracoes/pagamentos' },
    ],
  },
];

export const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  pedidos: 'Pedidos',
  ordens: 'Ordens de Venda',
  pool: 'Pool',
  catalogo: 'Catálogo',
  servicos: 'Serviços',
  produtos: 'Produtos',
  categorias: 'Categorias',
  combos: 'Combos',
  equipe: 'Equipe',
  usuarios: 'Usuários',
  papeis: 'Papéis',
  qualificacoes: 'Qualificações',
  configuracoes: 'Configurações',
  tenant: 'Tenant',
  pagamentos: 'Políticas de Pagamento',
  perfil: 'Perfil',
  novo: 'Novo Usuário',
  convidar: 'Convidar Usuário',
};
