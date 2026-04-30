'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { usePermission } from '@/hooks/use-permission';
import {
  useSuspendTenant,
  useReactivateTenant,
  useCancelTenant,
  useTenant,
} from '@/services/tenant';

interface DangerZoneProps {
  tenantId: string;
}

function CancelTenantDialog({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [confirmInput, setConfirmInput] = useState('');
  const { mutate: cancelTenant, isPending } = useCancelTenant(tenantId);

  const handleCancel = () => {
    cancelTenant(undefined, {
      onSuccess: () => {
        toast.success('Tenant cancelado com sucesso');
        setStep(0);
        setConfirmInput('');
      },
      onError: () => toast.error('Erro ao cancelar tenant. Tente novamente.'),
    });
  };

  const isConfirmValid = confirmInput === 'CANCELAR';

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setStep(1)}
        data-testid="cancel-trigger"
      >
        Cancelar Tenant
      </Button>

      {/* Step 1: Warning */}
      <Dialog open={step === 1} onOpenChange={(open) => !open && setStep(0)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive size-5" />
              Cancelar Tenant
            </DialogTitle>
            <DialogDescription>
              Esta ação é permanente e não pode ser desfeita. O tenant{' '}
              <strong>{tenantName}</strong> será cancelado e todos os dados
              serão desativados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep(0)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setStep(2)}
              data-testid="cancel-step1-confirm"
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2: Type to confirm */}
      <Dialog open={step === 2} onOpenChange={(open) => !open && setStep(0)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmação Final</DialogTitle>
            <DialogDescription>
              Digite <strong>CANCELAR</strong> para confirmar o cancelamento
              permanente do tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-confirm-input">
              Digite CANCELAR para confirmar
            </Label>
            <Input
              id="cancel-confirm-input"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="CANCELAR"
              aria-label="Confirmação de cancelamento"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!isConfirmValid || isPending}
              data-testid="cancel-step2-confirm"
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DangerZone({ tenantId }: DangerZoneProps) {
  const { data: tenant } = useTenant(tenantId);
  const { hasPermission: canSuspend } = usePermission('tenants', 'suspend');
  const { hasPermission: canCancel } = usePermission('tenants', 'cancel');
  const { hasPermission: canReactivate } = usePermission(
    'tenants',
    'reactivate',
  );

  const { mutate: suspendTenant, isPending: isSuspending } =
    useSuspendTenant(tenantId);
  const { mutate: reactivateTenant, isPending: isReactivating } =
    useReactivateTenant(tenantId);

  const handleSuspend = async () => {
    await new Promise<void>((resolve, reject) => {
      suspendTenant(undefined, {
        onSuccess: () => {
          toast.success('Tenant suspenso com sucesso');
          resolve();
        },
        onError: () => {
          toast.error('Erro ao suspender tenant. Tente novamente.');
          reject(new Error('suspend failed'));
        },
      });
    });
  };

  const handleReactivate = async () => {
    await new Promise<void>((resolve, reject) => {
      reactivateTenant(undefined, {
        onSuccess: () => {
          toast.success('Tenant reativado com sucesso');
          resolve();
        },
        onError: () => {
          toast.error('Erro ao reativar tenant. Tente novamente.');
          reject(new Error('reactivate failed'));
        },
      });
    });
  };

  const hasAnyAction = canSuspend || canCancel || canReactivate;
  if (!hasAnyAction) return null;

  return (
    <section className="border-destructive/30 space-y-4 rounded-lg border p-4">
      <div className="space-y-1">
        <h3 className="text-destructive text-sm font-semibold">
          Zona de Perigo
        </h3>
        <p className="text-muted-foreground text-sm">
          Ações irreversíveis que afetam o tenant.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {canSuspend && tenant?.status === 'active' && (
          <ConfirmDialog
            title="Suspender Tenant"
            description="O tenant será suspenso e não poderá acessar a plataforma até ser reativado."
            confirmLabel={isSuspending ? 'Suspendendo…' : 'Suspender'}
            variant="destructive"
            onConfirm={handleSuspend}
            trigger={
              <Button variant="destructive" disabled={isSuspending}>
                Suspender Tenant
              </Button>
            }
          />
        )}

        {canReactivate && tenant?.status === 'suspended' && (
          <ConfirmDialog
            title="Reativar Tenant"
            description="O tenant será reativado e poderá acessar a plataforma novamente."
            confirmLabel={isReactivating ? 'Reativando…' : 'Reativar'}
            onConfirm={handleReactivate}
            trigger={
              <Button variant="outline" disabled={isReactivating}>
                Reativar Tenant
              </Button>
            }
          />
        )}

        {canCancel && tenant?.status !== 'cancelled' && (
          <CancelTenantDialog
            tenantId={tenantId}
            tenantName={tenant?.name ?? ''}
          />
        )}
      </div>
    </section>
  );
}
