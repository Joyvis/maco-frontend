'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSaleOrders } from '@/services/sale-orders';
import { useUsers } from '@/services/users';
import { SALE_ORDER_STATE_LABELS } from '@/types/sale-order';
import type { ManagedSaleOrder, SaleOrderState } from '@/types/sale-order';

const columns: ColumnDef<ManagedSaleOrder>[] = [
  {
    accessorKey: 'order_number',
    header: 'Ordem #',
  },
  {
    accessorKey: 'customer_name',
    header: 'Cliente',
  },
  {
    accessorKey: 'state',
    header: 'Status',
    cell: ({ row }) => <OrderStatusBadge state={row.original.state} />,
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
    accessorKey: 'staff_name',
    header: 'Colaborador',
    cell: ({ row }) => row.original.staff_name ?? '—',
  },
  {
    accessorKey: 'created_at',
    header: 'Criado em',
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleDateString('pt-BR'),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild aria-label="Ver detalhes">
        <Link href={`/pedidos/ordens/${row.original.id}`}>
          <Eye className="size-4" />
        </Link>
      </Button>
    ),
  },
];

const ALL_STATES: SaleOrderState[] = [
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
];

export default function OrdersPage() {
  const [stateFilter, setStateFilter] = useState<SaleOrderState | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useSaleOrders({
    state: stateFilter !== 'all' ? stateFilter : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    staff_id: staffFilter !== 'all' ? staffFilter : undefined,
    search: search || undefined,
  });

  const { data: users } = useUsers({ status: 'active' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordens de Venda"
        description="Gerencie as ordens de venda."
      >
        <Button asChild>
          <Link href="/pedidos/ordens/new">Nova Ordem</Link>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <Input
          className="w-56"
          placeholder="Buscar por cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar por cliente"
        />

        <Select
          value={stateFilter}
          onValueChange={(v) => setStateFilter(v as SaleOrderState | 'all')}
        >
          <SelectTrigger className="w-44" aria-label="Filtrar por status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ALL_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {SALE_ORDER_STATE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="w-40"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="Data início"
        />
        <Input
          className="w-40"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="Data fim"
        />

        <Select value={staffFilter} onValueChange={setStaffFilter}>
          <SelectTrigger className="w-44" aria-label="Filtrar por colaborador">
            <SelectValue placeholder="Colaborador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          searchColumn="customer_name"
        />
      )}
    </div>
  );
}
