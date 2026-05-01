'use client';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { StatusBadge } from '@/components/common/status-badge';
import type { StatusVariant } from '@/components/common/status-badge';

interface LifecycleActionsProps {
  status: StatusVariant;
  statusLabel: string;
  entityName: string;
  archiveDescription?: string;
  isActivating?: boolean;
  isArchiving?: boolean;
  onActivate: () => Promise<void>;
  onArchive: () => Promise<void>;
}

export function LifecycleActions({
  status,
  statusLabel,
  entityName,
  archiveDescription,
  isActivating,
  isArchiving,
  onActivate,
  onArchive,
}: LifecycleActionsProps) {
  const description =
    archiveDescription ??
    `Tem certeza que deseja arquivar "${entityName}"? Ele ficará indisponível.`;

  return (
    <div className="flex items-center gap-3">
      <StatusBadge variant={status} label={statusLabel} />
      {status !== 'active' && (
        <Button size="sm" disabled={isActivating} onClick={onActivate}>
          Ativar
        </Button>
      )}
      {status !== 'archived' && (
        <ConfirmDialog
          title="Arquivar"
          description={description}
          confirmLabel="Arquivar"
          variant="destructive"
          onConfirm={onArchive}
          trigger={
            <Button variant="destructive" size="sm" disabled={isArchiving}>
              Arquivar
            </Button>
          }
        />
      )}
    </div>
  );
}
