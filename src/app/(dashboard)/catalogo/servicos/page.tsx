'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Pencil, CheckCircle, Archive } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { ServiceStatusBadge } from '@/components/common/service-status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
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
import {
  useServices,
  useActivateService,
  useArchiveService,
} from '@/services/services';
import { useCategories } from '@/services/products';
import { SERVICE_STATUS_LABELS } from '@/types/service';
import type { Service, ServiceStatus } from '@/types/service';

function ServiceRowActions({ service }: { service: Service }) {
  const router = useRouter();
  const { mutateAsync: activate } = useActivateService();
  const { mutateAsync: archive } = useArchiveService();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Ações">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/catalogo/servicos/${service.id}`)}
        >
          <Pencil className="mr-2 size-4" />
          Editar
        </DropdownMenuItem>
        {service.status !== 'active' && (
          <DropdownMenuItem
            onClick={async () => {
              await activate(service.id);
              toast.success('Serviço ativado com sucesso.');
            }}
          >
            <CheckCircle className="mr-2 size-4" />
            Ativar
          </DropdownMenuItem>
        )}
        {service.status !== 'archived' && (
          <ConfirmDialog
            title="Arquivar Serviço"
            description={`Tem certeza que deseja arquivar "${service.name}"? O serviço ficará indisponível.`}
            confirmLabel="Arquivar"
            variant="destructive"
            onConfirm={async () => {
              await archive(service.id);
              toast.success('Serviço arquivado com sucesso.');
            }}
            trigger={
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => e.preventDefault()}
              >
                <Archive className="mr-2 size-4" />
                Arquivar
              </DropdownMenuItem>
            }
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<Service>[] = [
  { accessorKey: 'name', header: 'Nome' },
  {
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row }) => row.original.category ?? '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <ServiceStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'duration_minutes',
    header: 'Duração',
    cell: ({ row }) => `${row.original.duration_minutes} min`,
  },
  {
    accessorKey: 'base_price',
    header: 'Preço',
    cell: ({ row }) =>
      row.original.base_price.toLocaleString('pt-BR', {
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
    cell: ({ row }) => <ServiceRowActions service={row.original} />,
  },
];

export default function ServicesPage() {
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>(
    'all',
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const apiStatus = statusFilter !== 'all' ? statusFilter : undefined;
  const apiCategory = categoryFilter !== 'all' ? categoryFilter : undefined;
  const { data, isLoading } = useServices({
    status: apiStatus,
    category: apiCategory,
  });
  const { data: categories } = useCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços"
        description="Gerencie o catálogo de serviços."
      >
        <Button asChild>
          <Link href="/catalogo/servicos/new">Novo Serviço</Link>
        </Button>
      </PageHeader>
      <div className="flex flex-wrap gap-2">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ServiceStatus | 'all')}
        >
          <SelectTrigger className="w-40" aria-label="Filtrar por status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(Object.keys(SERVICE_STATUS_LABELS) as ServiceStatus[]).map(
              (s) => (
                <SelectItem key={s} value={s}>
                  {SERVICE_STATUS_LABELS[s]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40" aria-label="Filtrar por categoria">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <DataTable columns={columns} data={data ?? []} searchColumn="name" />
      )}
    </div>
  );
}
