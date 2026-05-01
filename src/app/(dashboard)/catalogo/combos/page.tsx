'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Archive } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCombos, useArchiveCombo } from '@/services/combos';
import { COMBO_STATUS_LABELS } from '@/types/combo';
import type { ComboSummary } from '@/types/combo';

function ComboRowActions({ combo }: { combo: ComboSummary }) {
  const router = useRouter();
  const { mutateAsync: archive } = useArchiveCombo();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Ações">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/catalogo/combos/${combo.id}`)}
        >
          <Pencil className="mr-2 size-4" />
          Editar
        </DropdownMenuItem>
        {combo.status !== 'archived' && (
          <ConfirmDialog
            title="Arquivar Combo"
            description={`Tem certeza que deseja arquivar "${combo.name}"? O combo ficará indisponível.`}
            confirmLabel="Arquivar"
            variant="destructive"
            onConfirm={async () => {
              await archive(combo.id);
              toast.success('Combo arquivado com sucesso.');
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

const columns: ColumnDef<ComboSummary>[] = [
  { accessorKey: 'name', header: 'Nome' },
  {
    accessorKey: 'item_count',
    header: 'Itens',
    cell: ({ row }) => row.original.item_count,
  },
  {
    accessorKey: 'discount_percentage',
    header: 'Desconto',
    cell: ({ row }) => `${row.original.discount_percentage}%`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === 'active' ? 'default' : 'secondary'}
      >
        {COMBO_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Criado em',
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleDateString('pt-BR'),
  },
  {
    id: 'actions',
    cell: ({ row }) => <ComboRowActions combo={row.original} />,
  },
];

export default function CombosPage() {
  const { data, isLoading } = useCombos();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Combos"
        description="Gerencie os pacotes de combos do catálogo."
      >
        <Button asChild>
          <Link href="/catalogo/combos/new">Novo Combo</Link>
        </Button>
      </PageHeader>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <DataTable columns={columns} data={data ?? []} searchColumn="name" />
      )}
    </div>
  );
}
