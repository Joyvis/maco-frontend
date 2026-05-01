'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { ServiceForm } from '@/components/common/service-form';
import { useCreateService } from '@/services/services';
import type { CreateServiceInput } from '@/types/service';

export default function NewServicePage() {
  const router = useRouter();
  const { mutateAsync: createService, isPending } = useCreateService();

  async function handleSubmit(input: CreateServiceInput) {
    const result = await createService(input);
    toast.success('Serviço criado com sucesso.');
    router.push(`/catalogo/servicos/${result.data.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Serviço"
        description="Adicione um novo serviço ao catálogo."
      />
      <ServiceForm onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  );
}
