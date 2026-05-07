import { PageHeader } from '@/components/common/page-header';

import { StaffScheduleList } from './_components/staff-schedule-list';

export default function SchedulesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Gerencie os horários de trabalho da equipe"
      />
      <StaffScheduleList />
    </div>
  );
}
