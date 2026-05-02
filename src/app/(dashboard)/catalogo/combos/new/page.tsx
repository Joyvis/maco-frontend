'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { ComboForm } from '@/components/common/combo-form';
import { useCreateCombo } from '@/services/combos';
import type { CreateComboInput } from '@/types/combo';

export default function NewComboPage() {
  const router = useRouter();
  const { mutateAsync: createCombo, isPending } = useCreateCombo();

  async function handleSubmit(input: CreateComboInput) {
    await createCombo(input);
    toast.success('Combo criado com sucesso.');
    router.push('/catalogo/combos');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Combo"
        description="Crie um novo pacote de combo."
      />
      <ComboForm onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  );
}
