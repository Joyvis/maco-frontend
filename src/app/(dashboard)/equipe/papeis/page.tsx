'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { SystemRoleBadge } from '@/components/common/system-role-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRoles, useDeleteRole } from '@/services/roles';
import type { Role } from '@/types/role';

function RoleRowActions({ role }: { role: Role }) {
  const router = useRouter();
  const { mutateAsync: deleteRole } = useDeleteRole();

  async function handleDelete() {
    await deleteRole(role.id);
    toast.success('Papel excluído com sucesso.');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Ações">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/equipe/papeis/${role.id}`)}
        >
          <Pencil className="mr-2 size-4" />
          Editar
        </DropdownMenuItem>
        {!role.is_system && (
          <ConfirmDialog
            title="Excluir Papel"
            description={`Tem certeza que deseja excluir o papel "${role.name}"? Esta ação não pode ser desfeita.`}
            confirmLabel="Excluir"
            variant="destructive"
            onConfirm={handleDelete}
            trigger={
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Excluir
              </DropdownMenuItem>
            }
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<Role>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'is_system',
    header: 'Tipo',
    cell: ({ row }) => <SystemRoleBadge isSystem={row.original.is_system} />,
  },
  {
    accessorKey: 'user_count',
    header: 'Usuários',
  },
  {
    accessorKey: 'created_at',
    header: 'Criado em',
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleDateString('pt-BR'),
  },
  {
    id: 'actions',
    cell: ({ row }) => <RoleRowActions role={row.original} />,
  },
];

export default function RolesPage() {
  const { data, isLoading } = useRoles();

  const sorted = [...(data ?? [])].sort((a, b) => {
    if (a.is_system && !b.is_system) return -1;
    if (!a.is_system && b.is_system) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Papéis"
        description="Gerencie os papéis e permissões da plataforma."
      >
        <Button asChild>
          <Link href="/equipe/papeis/new">Novo Papel</Link>
        </Button>
      </PageHeader>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <DataTable columns={columns} data={sorted} searchColumn="name" />
      )}
    </div>
  );
}
