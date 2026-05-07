'use client';

import { CalendarX } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { EmptyState } from '@/components/common/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAppointmentHistory,
  useUpcomingAppointments,
} from '@/services/appointments';

import { AppointmentCard } from './appointment-card';

export function AppointmentTabs() {
  const router = useRouter();
  const { data: upcoming, isLoading: loadingUpcoming } =
    useUpcomingAppointments();
  const { data: history, isLoading: loadingHistory } = useAppointmentHistory();

  function handleRate(id: string) {
    router.push(`/appointments/${id}/review`);
  }

  return (
    <Tabs defaultValue="upcoming">
      <TabsList>
        <TabsTrigger value="upcoming">Próximos</TabsTrigger>
        <TabsTrigger value="history">Histórico</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4">
        {loadingUpcoming ? (
          <AppointmentListSkeleton />
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title="Nenhum agendamento próximo"
            description="Você não tem agendamentos futuros no momento."
            actionLabel="Agendar agora"
            onAction={() => router.push('/shop')}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((order) => (
              <AppointmentCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        {loadingHistory ? (
          <AppointmentListSkeleton />
        ) : history.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title="Nenhum histórico de agendamentos"
            description="Seus agendamentos anteriores aparecerão aqui."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((order) => (
              <AppointmentCard
                key={order.id}
                order={order}
                onRate={handleRate}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function AppointmentListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-muted h-40 animate-pulse rounded-xl" />
      ))}
    </div>
  );
}
