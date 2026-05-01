'use client';

import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QualificationList } from '@/components/common/qualification-list';
import { QualificationAdder } from '@/components/common/qualification-adder';
import { usePermissions } from '@/providers/permissions-provider';
import {
  useStaffQualifications,
  useGrantQualification,
  useRevokeQualification,
} from '@/services/qualifications';
import { useServices } from '@/services/services';

import { UserEditView } from './user-edit-view';

interface UserDetailTabsProps {
  userId: string;
}

export function UserDetailTabs({ userId }: UserDetailTabsProps) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission('qualifications:read');
  const canCreate = hasPermission('qualifications:create');
  const canDelete = hasPermission('qualifications:delete');

  const { data: qualifications, isLoading: isLoadingQuals } =
    useStaffQualifications(userId);
  const { data: services, isLoading: isLoadingServices } = useServices(
    { status: 'active' },
    { pageSize: 100 },
  );

  const { mutateAsync: grant } = useGrantQualification();
  const { mutateAsync: revoke } = useRevokeQualification();

  const qualifiedServiceIds = new Set(
    qualifications?.map((q) => q.service_id) ?? [],
  );

  const availableServices = (services ?? [])
    .filter((s) => !qualifiedServiceIds.has(s.id))
    .map((s) => ({ id: s.id, label: s.name }));

  async function handleAdd(serviceId: string) {
    await grant({ staffId: userId, serviceId });
    toast.success('Qualificação adicionada.');
  }

  async function handleRemove(serviceId: string) {
    await revoke({ staffId: userId, serviceId });
    toast.success('Qualificação removida.');
  }

  return (
    <Tabs defaultValue="dados">
      <TabsList>
        <TabsTrigger value="dados">Dados</TabsTrigger>
        <TabsTrigger value="qualificacoes">Qualificações</TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="max-w-lg">
        <UserEditView userId={userId} />
      </TabsContent>

      <TabsContent value="qualificacoes" className="space-y-4">
        {!canRead ? (
          <p className="text-muted-foreground text-sm">
            Você não tem permissão para visualizar qualificações.
          </p>
        ) : (
          <>
            {canCreate && (
              <QualificationAdder
                options={availableServices}
                onAdd={handleAdd}
                isLoading={isLoadingServices}
                placeholder="Selecione um serviço..."
                addLabel="Adicionar"
              />
            )}
            <QualificationList
              items={(qualifications ?? []).map((q) => ({
                id: q.service_id,
                label: q.service_name,
              }))}
              onRemove={handleRemove}
              isLoading={isLoadingQuals}
              emptyMessage="Nenhuma qualificação atribuída."
              canRemove={canDelete}
              removeDialogTitle="Remover qualificação"
              removeDialogDescription={(label) =>
                `Tem certeza que deseja remover a qualificação "${label}"?`
              }
            />
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
