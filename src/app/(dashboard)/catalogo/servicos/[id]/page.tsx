'use client';

import { use, useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { QualificationList } from '@/components/common/qualification-list';
import { QualificationAdder } from '@/components/common/qualification-adder';
import { ServiceForm } from '@/components/common/service-form';
import { LifecycleActions } from '@/components/common/lifecycle-actions';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePermissions } from '@/providers/permissions-provider';
import {
  useService,
  useUpdateService,
  useActivateService,
  useArchiveService,
  useConsumptions,
  useAddConsumption,
  useRemoveConsumption,
  useDependencies,
  useAddDependency,
  useRemoveDependency,
  useAllServices,
} from '@/services/services';
import { useUsers } from '@/services/users';
import { useProducts } from '@/services/products';
import {
  useQualifiedStaff,
  useGrantQualification,
  useRevokeQualification,
} from '@/services/qualifications';
import { SERVICE_STATUS_LABELS } from '@/types/service';
import type { UpdateServiceInput } from '@/types/service';

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>;
}

function ConsumptionManager({ serviceId }: { serviceId: string }) {
  const { data: consumptions, isLoading } = useConsumptions(serviceId);
  const { mutateAsync: addConsumption, isPending: isAdding } =
    useAddConsumption(serviceId);
  const { mutateAsync: removeConsumption } = useRemoveConsumption(serviceId);
  const { data: products } = useProducts({}, { pageSize: 100 });

  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');

  async function handleAdd() {
    const qty = parseFloat(quantity);
    if (!productId || isNaN(qty) || qty <= 0) return;
    await addConsumption({ product_id: productId, quantity_per_use: qty });
    toast.success('Consumo adicionado.');
    setProductId('');
    setQuantity('1');
    setShowForm(false);
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Consumos de Produto</h3>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            Adicionar Consumo
          </Button>
        )}
      </div>

      {showForm && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
          <div className="flex flex-col gap-1">
            <Label>Produto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="w-52" aria-label="Selecionar produto">
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {(products ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Quantidade por uso</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-32"
              aria-label="Quantidade por uso"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={isAdding || !productId}>
              Salvar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setProductId('');
                setQuantity('1');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {consumptions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhum consumo cadastrado.
        </p>
      ) : (
        <div className="space-y-2">
          {consumptions.map((c) => (
            <div
              key={c.product_id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span className="text-sm">
                {c.product_name ?? c.product_id} — {c.quantity_per_use} un./uso
              </span>
              <ConfirmDialog
                title="Remover Consumo"
                description={`Remover o consumo de "${c.product_name ?? c.product_id}"?`}
                confirmLabel="Remover"
                variant="destructive"
                onConfirm={async () => {
                  await removeConsumption(c.product_id);
                  toast.success('Consumo removido.');
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Remover consumo"
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DependencyManager({ serviceId }: { serviceId: string }) {
  const { data: dependencies, isLoading } = useDependencies(serviceId);
  const { mutateAsync: addDependency, isPending: isAdding } =
    useAddDependency(serviceId);
  const { mutateAsync: removeDependency } = useRemoveDependency(serviceId);
  const { data: allServices } = useAllServices();

  const [showForm, setShowForm] = useState(false);
  const [depServiceId, setDepServiceId] = useState('');
  const [autoInclude, setAutoInclude] = useState('sim');

  async function handleAdd() {
    if (!depServiceId) return;
    await addDependency({
      service_id: depServiceId,
      auto_include: autoInclude === 'sim',
    });
    toast.success('Dependência adicionada.');
    setDepServiceId('');
    setAutoInclude('sim');
    setShowForm(false);
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Dependências de Serviço</h3>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            Adicionar Dependência
          </Button>
        )}
      </div>

      {showForm && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
          <div className="flex flex-col gap-1">
            <Label>Serviço</Label>
            <Select value={depServiceId} onValueChange={setDepServiceId}>
              <SelectTrigger
                className="w-52"
                aria-label="Selecionar serviço dependente"
              >
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {allServices
                  .filter((s) => s.id !== serviceId)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Incluir automaticamente</Label>
            <Select value={autoInclude} onValueChange={setAutoInclude}>
              <SelectTrigger
                className="w-32"
                aria-label="Incluir automaticamente"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={isAdding || !depServiceId}>
              Salvar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setDepServiceId('');
                setAutoInclude('sim');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {dependencies.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhuma dependência cadastrada.
        </p>
      ) : (
        <div className="space-y-2">
          {dependencies.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span className="text-sm">
                {d.service_name ?? d.service_id} —{' '}
                {d.auto_include ? 'Auto-incluído' : 'Manual'}
              </span>
              <ConfirmDialog
                title="Remover Dependência"
                description={`Remover a dependência de "${d.service_name ?? d.service_id}"?`}
                confirmLabel="Remover"
                variant="destructive"
                onConfirm={async () => {
                  await removeDependency(d.id);
                  toast.success('Dependência removida.');
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Remover dependência"
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { id } = use(params);
  const { hasPermission } = usePermissions();
  const canRead = hasPermission('qualifications:read');
  const canCreate = hasPermission('qualifications:create');
  const canDelete = hasPermission('qualifications:delete');

  const { data: service, isLoading } = useService(id);
  const { mutateAsync: updateService, isPending: isUpdating } =
    useUpdateService(id);
  const { mutateAsync: activate, isPending: isActivating } =
    useActivateService();
  const { mutateAsync: archive, isPending: isArchiving } = useArchiveService();

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

  async function handleSubmit(input: UpdateServiceInput) {
    await updateService(input);
    toast.success('Serviço atualizado com sucesso.');
  }

  async function handleAdd(staffId: string) {
    await grant({ staffId, serviceId: id });
    toast.success('Funcionário qualificado adicionado.');
  }

  async function handleRemove(staffId: string) {
    await revoke({ staffId, serviceId: id });
    toast.success('Qualificação removida.');
  }

  if (isLoading) {
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
      <PageHeader title={service.name}>
        <LifecycleActions
          status={service.status}
          statusLabel={SERVICE_STATUS_LABELS[service.status]}
          entityName={service.name}
          archiveDescription={`Tem certeza que deseja arquivar "${service.name}"? O serviço ficará indisponível.`}
          isActivating={isActivating}
          isArchiving={isArchiving}
          onActivate={async () => {
            await activate(id);
            toast.success('Serviço ativado com sucesso.');
          }}
          onArchive={async () => {
            await archive(id);
            toast.success('Serviço arquivado com sucesso.');
          }}
        />
      </PageHeader>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="consumptions">Consumos</TabsTrigger>
          <TabsTrigger value="dependencies">Dependências</TabsTrigger>
          <TabsTrigger value="equipe">Equipe Qualificada</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="pt-4">
          <ServiceForm
            service={service}
            onSubmit={handleSubmit}
            isLoading={isUpdating}
          />
        </TabsContent>

        <TabsContent value="consumptions" className="pt-4">
          <ConsumptionManager serviceId={id} />
        </TabsContent>

        <TabsContent value="dependencies" className="pt-4">
          <DependencyManager serviceId={id} />
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
