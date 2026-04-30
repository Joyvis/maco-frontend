'use client';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { UserStatusBadge } from '@/components/common/user-status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  useUser,
  useDeactivateUser,
  useReactivateUser,
} from '@/services/users';
import { usePermissions } from '@/providers/permissions-provider';

import { UserForm } from './user-form';

interface UserEditViewProps {
  userId: string;
}

export function UserEditView({ userId }: UserEditViewProps) {
  const { data: user, isLoading, isError } = useUser(userId);
  const { mutateAsync: deactivate } = useDeactivateUser();
  const { mutateAsync: reactivate } = useReactivateUser();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission('users:update');

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Carregando usuário...
      </div>
    );
  }

  if (isError || !user) {
    return (
      <p className="text-destructive py-8 text-sm">
        Não foi possível carregar os dados do usuário.
      </p>
    );
  }

  const isActive = user.status === 'active';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserStatusBadge status={user.status} />
        {canUpdate && (
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
              <Button variant={isActive ? 'destructive' : 'default'} size="sm">
                {isActive ? 'Desativar' : 'Reativar'}
              </Button>
            }
          />
        )}
      </div>

      {canUpdate ? (
        <UserForm mode="edit" user={user} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Você não tem permissão para editar usuários.
        </p>
      )}
    </div>
  );
}
