'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrders } from '@/services/orders';
import {
  ADMIN_ORDER_STATE_LABELS,
  type AdminSaleOrder,
  type AdminSaleOrderState,
} from '@/types/order';

const STATE_BADGE_VARIANT: Record<
  AdminSaleOrderState,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending_payment: 'outline',
  confirmed: 'secondary',
  checked_in: 'secondary',
  in_progress: 'default',
  pending_checkout: 'default',
  completed: 'outline',
  cancelled: 'destructive',
  no_show: 'destructive',
};

function OrderStateBadge({ state }: { state: AdminSaleOrderState }) {
  return (
    <Badge variant={STATE_BADGE_VARIANT[state]}>
      {ADMIN_ORDER_STATE_LABELS[state]}
    </Badge>
  );
}

function OrderRowActions({ order }: { order: AdminSaleOrder }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Ações">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/pedidos/ordens/${order.id}`)}
        >
          <Eye className="mr-2 size-4" />
          Ver detalhes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<AdminSaleOrder>[] = [
  {
    accessorKey: 'order_number',
    header: 'Nº Pedido',
    cell: ({ row }) => `#${row.original.order_number}`,
  },
  { accessorKey: 'customer_name', header: 'Cliente' },
  {
    accessorKey: 'assigned_staff',
    header: 'Profissional',
    cell: ({ row }) => row.original.assigned_staff ?? '—',
  },
  {
    accessorKey: 'state',
    header: 'Status',
    cell: ({ row }) => <OrderStateBadge state={row.original.state} />,
  },
  {
    accessorKey: 'total_amount',
    header: 'Total',
    cell: ({ row }) =>
      row.original.total_amount.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
  },
  {
    accessorKey: 'created_at',
    header: 'Criado em',
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleDateString('pt-BR'),
  },
  {
    id: 'actions',
    cell: ({ row }) => <OrderRowActions order={row.original} />,
  },
];

export default function OrdensPage() {
  const [stateFilter, setStateFilter] = useState<AdminSaleOrderState | 'all'>(
    'all',
  );

  const apiState = stateFilter !== 'all' ? stateFilter : undefined;
  const { data, isLoading } = useOrders({ state: apiState });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordens de Venda"
        description="Gerencie o fluxo de atendimento das ordens."
      />
      <div className="flex flex-wrap gap-2">
        <Select
          value={stateFilter}
          onValueChange={(v) =>
            setStateFilter(v as AdminSaleOrderState | 'all')
          }
        >
          <SelectTrigger className="w-52" aria-label="Filtrar por status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(
              Object.keys(ADMIN_ORDER_STATE_LABELS) as AdminSaleOrderState[]
            ).map((s) => (
              <SelectItem key={s} value={s}>
                {ADMIN_ORDER_STATE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <DataTable columns={columns} data={data} searchColumn="customer_name" />
      )}
    </div>
  );
}
