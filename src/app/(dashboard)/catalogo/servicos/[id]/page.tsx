'use client';

import { use } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { QualificationList } from '@/components/common/qualification-list';
import { QualificationAdder } from '@/components/common/qualification-adder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/providers/permissions-provider';
import { useService } from '@/services/services';
import { useUsers } from '@/services/users';
import {
  useQualifiedStaff,
  useGrantQualification,
  useRevokeQualification,
} from '@/services/qualifications';

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { id } = use(params);
  const { hasPermission } = usePermissions();
  const canRead = hasPermission('qualifications:read');
  const canCreate = hasPermission('qualifications:create');
  const canDelete = hasPermission('qualifications:delete');

  const { data: service, isLoading: isLoadingService } = useService(id);
  const { data: qualifiedStaff, isLoading: isLoadingQuals } =
    useQualifiedStaff(id);
  const { data: users, isLoading: isLoadingUsers } = useUsers({
    status: 'active',
  });

  const { mutateAsync: grant } = useGrantQualification();
  const { mutateAsync: revoke } = useRevokeQualification();

  const qualifiedStaffIds = new Set(
    qualifiedStaff?.map((s) => s.user_id) ?? [],
  );

  const staffOptions = (users ?? [])
    .filter(
      (u) =>
        !qualifiedStaffIds.has(u.id) &&
        u.roles.some(
          (r) =>
            r.name.toLowerCase().includes('staff') ||
            r.name.toLowerCase().includes('funcionário'),
        ),
    )
    .map((u) => ({ id: u.id, label: u.name }));

  async function handleAdd(staffId: string) {
    await grant({ staffId, serviceId: id });
    toast.success('Funcionário qualificado adicionado.');
  }

  async function handleRemove(staffId: string) {
    await revoke({ staffId, serviceId: id });
    toast.success('Qualificação removida.');
  }

  if (isLoadingService) {
    return (
      <div className="space-y-6">
        <PageHeader title="Serviço" />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <PageHeader title="Serviço" />
        <p className="text-muted-foreground text-sm">Serviço não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={service.name} />

      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="equipe">Equipe Qualificada</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Status:{' '}
              <span className="font-medium">
                {service.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="equipe" className="space-y-4">
          {!canRead ? (
            <p className="text-muted-foreground text-sm">
              Você não tem permissão para visualizar qualificações.
            </p>
          ) : (
            <>
              {canCreate && (
                <QualificationAdder
                  options={staffOptions}
                  onAdd={handleAdd}
                  isLoading={isLoadingUsers}
                  placeholder="Selecione um funcionário..."
                  addLabel="Adicionar"
                />
              )}
              <QualificationList
                items={(qualifiedStaff ?? []).map((s) => ({
                  id: s.user_id,
                  label: s.name,
                  sublabel: s.email,
                }))}
                onRemove={handleRemove}
                isLoading={isLoadingQuals}
                emptyMessage="Nenhum funcionário qualificado."
                canRemove={canDelete}
                removeDialogTitle="Remover qualificação"
                removeDialogDescription={(label) =>
                  `Tem certeza que deseja remover a qualificação de "${label}"?`
                }
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
