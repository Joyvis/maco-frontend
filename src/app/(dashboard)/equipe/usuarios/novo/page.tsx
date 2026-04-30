import { PageHeader } from '@/components/common/page-header';

import { UserForm } from '../_components/user-form';

export default function NovoUsuarioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Criar usuário"
        description="Preencha os dados para criar um novo usuário"
      />
      <div className="max-w-lg">
        <UserForm mode="create" />
      </div>
    </div>
  );
}
