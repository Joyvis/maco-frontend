import { PageHeader } from '@/components/common/page-header';

import { UserTable } from './_components/user-table';

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários da plataforma"
      />
      <UserTable />
    </div>
  );
}
