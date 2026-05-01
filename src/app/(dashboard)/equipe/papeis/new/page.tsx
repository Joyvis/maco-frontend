'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { RoleForm } from '@/components/common/role-form';
import { useCreateRole } from '@/services/roles';
import type { CreateRoleInput } from '@/types/role';

export default function NewRolePage() {
  const router = useRouter();
  const { mutateAsync: createRole, isPending } = useCreateRole();

  async function handleSubmit(input: CreateRoleInput) {
    await createRole(input);
    toast.success('Papel criado com sucesso.');
    router.push('/equipe/papeis');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Papel"
        description="Crie um papel personalizado com permissões específicas."
      />
      <RoleForm onSubmit={handleSubmit} isLoading={isPending} />
    </div>
  );
}
