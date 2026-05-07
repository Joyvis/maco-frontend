'use client';

import { useState } from 'react';
import { CalendarDays, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  useAvailability,
  useRescheduleAppointment,
} from '@/services/appointments';
import { cn } from '@/lib/utils';
import type { SaleOrder } from '@/types/appointment';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface RescheduleSheetProps {
  order: SaleOrder;
}

export function RescheduleSheet({ order }: RescheduleSheetProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  const { data: slots, isLoading: loadingSlots } = useAvailability(
    open ? selectedDate : '',
  );
  const { mutateAsync: reschedule, isPending } = useRescheduleAppointment();

  async function handleConfirm() {
    if (!selectedSlot) return;
    try {
      await reschedule({ id: order.id, new_datetime: selectedSlot });
      toast.success('Agendamento remarcado com sucesso');
      setOpen(false);
    } catch {
      toast.error('Erro ao remarcar agendamento');
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Remarcar
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Remarcar Agendamento</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 p-4">
            <div className="bg-muted rounded-md p-3 text-sm">
              <p className="font-medium">Agendamento atual</p>
              <div className="text-muted-foreground mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  <span>{formatDate(order.scheduled_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4" />
                  <span>{formatTime(order.scheduled_at)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="reschedule-date"
                >
                  Nova data
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot('');
                  }}
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Horários disponíveis</p>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="text-muted-foreground size-4 animate-spin" />
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                      Nenhum horário disponível para esta data.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot) => (
                        <Button
                          key={slot.datetime}
                          variant={
                            selectedSlot === slot.datetime
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.datetime)}
                          className={cn(!slot.available && 'opacity-40')}
                        >
                          {formatTime(slot.datetime)}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Voltar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedSlot || isPending}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmar Remarcação
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
