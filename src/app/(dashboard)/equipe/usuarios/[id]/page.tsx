import { PageHeader } from '@/components/common/page-header';

import { UserEditView } from '../_components/user-edit-view';

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarUsuarioPage({ params }: EditUserPageProps) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar usuário"
        description="Atualize os dados do usuário"
      />
      <div className="max-w-lg">
        <UserEditView userId={id} />
      </div>
    </div>
  );
}
