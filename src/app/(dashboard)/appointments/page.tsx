import { PageHeader } from '@/components/common/page-header';

import { AppointmentTabs } from './_components/appointment-tabs';

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Agendamentos"
        description="Gerencie seus agendamentos e histórico de serviços"
      />
      <AppointmentTabs />
    </div>
  );
}
