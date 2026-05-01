'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { RoleForm } from '@/components/common/role-form';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  useRole,
  useUpdateRole,
  useDeleteRole,
  useRoleUsers,
} from '@/services/roles';
import type { CreateRoleInput } from '@/types/role';

interface EditRolePageProps {
  params: Promise<{ id: string }>;
}

export default function EditRolePage({ params }: EditRolePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: role, isLoading } = useRole(id);
  const { data: roleUsers, isLoading: isLoadingUsers } = useRoleUsers(id);
  const { mutateAsync: updateRole, isPending: isUpdating } = useUpdateRole(id);
  const { mutateAsync: deleteRole, isPending: isDeleting } = useDeleteRole();

  async function handleSubmit(input: CreateRoleInput) {
    await updateRole(input);
    toast.success('Papel atualizado com sucesso.');
  }

  async function handleDelete() {
    await deleteRole(id);
    toast.success('Papel excluído com sucesso.');
    router.push('/equipe/papeis');
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Editar Papel" />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-6">
        <PageHeader title="Editar Papel" />
        <p className="text-muted-foreground text-sm">Papel não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Editar Papel: ${role.name}`}>
        {!role.is_system && (
          <ConfirmDialog
            title="Excluir Papel"
            description={`Tem certeza que deseja excluir o papel "${role.name}"? Esta ação não pode ser desfeita.`}
            confirmLabel="Excluir"
            variant="destructive"
            onConfirm={handleDelete}
            trigger={
              <Button variant="destructive" disabled={isDeleting}>
                Excluir Papel
              </Button>
            }
          />
        )}
      </PageHeader>
      <Tabs defaultValue="papel">
        <TabsList>
          <TabsTrigger value="papel">Papel</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>
        <TabsContent value="papel">
          <RoleForm
            role={role}
            onSubmit={handleSubmit}
            isLoading={isUpdating}
          />
        </TabsContent>
        <TabsContent value="usuarios">
          {isLoadingUsers ? (
            <p className="text-muted-foreground text-sm">
              Carregando usuários...
            </p>
          ) : !roleUsers?.length ? (
            <p className="text-muted-foreground text-sm">
              Nenhum usuário atribuído a este papel.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {roleUsers.map((user) => (
                <li key={user.id} className="flex flex-col px-4 py-3">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-muted-foreground text-sm">
                    {user.email}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
