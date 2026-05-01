'use client';

import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { ComboForm } from '@/components/common/combo-form';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { useCombo, useUpdateCombo, useArchiveCombo } from '@/services/combos';
import type { CreateComboInput } from '@/types/combo';

export default function EditComboPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();

  const { data: combo, isLoading } = useCombo(id);
  const { mutateAsync: updateCombo, isPending: isUpdating } =
    useUpdateCombo(id);
  const { mutateAsync: archiveCombo, isPending: isArchiving } =
    useArchiveCombo();

  async function handleSubmit(input: CreateComboInput) {
    await updateCombo(input);
    toast.success('Combo atualizado com sucesso.');
    router.push('/catalogo/combos');
  }

  async function handleArchive() {
    await archiveCombo(id);
    toast.success('Combo arquivado com sucesso.');
    router.push('/catalogo/combos');
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando...</p>;
  }

  if (!combo) {
    return (
      <p className="text-muted-foreground text-sm">Combo não encontrado.</p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Editar Combo" description={combo.name}>
        {combo.status !== 'archived' && (
          <ConfirmDialog
            title="Arquivar Combo"
            description={`Tem certeza que deseja arquivar "${combo.name}"? O combo ficará indisponível.`}
            confirmLabel="Arquivar"
            variant="destructive"
            onConfirm={handleArchive}
            trigger={
              <Button variant="outline" disabled={isArchiving}>
                Arquivar
              </Button>
            }
          />
        )}
      </PageHeader>
      <ComboForm combo={combo} onSubmit={handleSubmit} isLoading={isUpdating} />
    </div>
  );
}
