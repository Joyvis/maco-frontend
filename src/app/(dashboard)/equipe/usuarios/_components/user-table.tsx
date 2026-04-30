'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { DataTable } from '@/components/common/data-table';
import { UserStatusBadge } from '@/components/common/user-status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  useDeactivateUser,
  useReactivateUser,
  useUsers,
} from '@/services/users';
import { useRoles } from '@/services/roles';
import { usePermissions } from '@/providers/permissions-provider';
import type { ManagedUser } from '@/types/user-management';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

interface RowActionsProps {
  user: ManagedUser;
}

function RowActions({ user }: RowActionsProps) {
  const { mutateAsync: deactivate } = useDeactivateUser();
  const { mutateAsync: reactivate } = useReactivateUser();

  const isActive = user.status === 'active';

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/equipe/usuarios/${user.id}`}>Editar</Link>
      </Button>
      <ConfirmDialog
        title={isActive ? 'Desativar usuário' : 'Reativar usuário'}
        description={
          isActive
            ? `Deseja desativar o usuário "${user.name}"? Ele perderá acesso ao sistema.`
            : `Deseja reativar o usuário "${user.name}"? Ele voltará a ter acesso ao sistema.`
        }
        confirmLabel={isActive ? 'Desativar' : 'Reativar'}
        variant={isActive ? 'destructive' : 'default'}
        onConfirm={async () => {
          if (isActive) {
            await deactivate(user.id);
            toast.success('Usuário desativado');
          } else {
            await reactivate(user.id);
            toast.success('Usuário reativado');
          }
        }}
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className={
              isActive ? 'text-destructive hover:text-destructive' : ''
            }
          >
            {isActive ? 'Desativar' : 'Reativar'}
          </Button>
        }
      />
    </div>
  );
}

export function UserTable() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('users:create');
  const canUpdate = hasPermission('users:update');

  const apiStatus = statusFilter !== 'all' ? statusFilter : undefined;
  const { data: allUsers, isLoading } = useUsers({ status: apiStatus });
  const { data: roles } = useRoles();

  const filteredData = allUsers.filter((user) => {
    if (roleFilter !== 'all') {
      if (!user.roles.some((r) => r.id === roleFilter)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (
        !user.name.toLowerCase().includes(q) &&
        !user.email.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const columns: ColumnDef<ManagedUser>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
    },
    {
      accessorKey: 'email',
      header: 'E-mail',
    },
    {
      id: 'roles',
      header: 'Papéis',
      cell: ({ row }) =>
        row.original.roles.map((r) => r.name).join(', ') || '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'created_at',
      header: 'Criado em',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    ...(canUpdate
      ? [
          {
            id: 'actions',
            header: '',
            cell: ({ row }: { row: { original: ManagedUser } }) => (
              <RowActions user={row.original} />
            ),
          } satisfies ColumnDef<ManagedUser>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
            aria-label="Buscar usuários"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as 'all' | 'active' | 'inactive')
            }
          >
            <SelectTrigger className="w-36" aria-label="Filtrar por status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36" aria-label="Filtrar por papel">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os papéis</SelectItem>
              {(roles ?? []).map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/equipe/usuarios/convidar">
                <UserPlus className="size-4" />
                Convidar
              </Link>
            </Button>
            <Button asChild>
              <Link href="/equipe/usuarios/novo">Criar usuário</Link>
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Carregando usuários...
        </p>
      ) : (
        <DataTable columns={columns} data={filteredData} pageSize={10} />
      )}
    </div>
  );
}
