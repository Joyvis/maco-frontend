import { PageHeader } from '@/components/common/page-header';

import { InviteUserForm } from '../_components/invite-user-form';

export default function ConvidarUsuarioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Convidar usuário"
        description="Envie um convite por e-mail para adicionar um novo usuário"
      />
      <div className="max-w-lg">
        <InviteUserForm />
      </div>
    </div>
  );
}
