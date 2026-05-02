import { PageHeader } from '@/components/common/page-header';

import { UserDetailTabs } from '../_components/user-detail-tabs';

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
      <UserDetailTabs userId={id} />
    </div>
  );
}
