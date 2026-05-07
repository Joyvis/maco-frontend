'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSetBulkSchedule } from '@/services/schedules';
import {
  DAY_LABELS,
  DAYS_OF_WEEK,
  type DayOfWeek,
  type ScheduleDay,
  type StaffSchedule,
} from '@/types/schedule';
import type { ApiError } from '@/types/api';

interface DayState {
  closed: boolean;
  start_time: string;
  end_time: string;
}

type ScheduleState = Record<DayOfWeek, DayState>;

function buildInitialState(schedule: StaffSchedule | null): ScheduleState {
  const defaultDay: DayState = {
    closed: true,
    start_time: '09:00',
    end_time: '18:00',
  };
  const state = Object.fromEntries(
    DAYS_OF_WEEK.map((d) => [d, { ...defaultDay }]),
  ) as ScheduleState;

  if (schedule) {
    for (const day of schedule.days) {
      const existing = state[day.day];
      if (existing) {
        existing.closed = false;
        existing.start_time = day.start_time;
        existing.end_time = day.end_time;
      }
    }
  }

  return state;
}

export function buildBulkPayload(state: ScheduleState): ScheduleDay[] {
  return DAYS_OF_WEEK.filter((d) => !state[d]?.closed).map((d) => ({
    day: d,
    start_time: state[d]?.start_time ?? '09:00',
    end_time: state[d]?.end_time ?? '18:00',
  }));
}

interface WeeklyScheduleEditorProps {
  staffId: string;
  schedule: StaffSchedule | null;
  isLoading: boolean;
}

export function WeeklyScheduleEditor({
  staffId,
  schedule,
  isLoading,
}: WeeklyScheduleEditorProps) {
  const [state, setState] = useState<ScheduleState>(() =>
    buildInitialState(schedule),
  );

  const { mutateAsync: saveBulk, isPending } = useSetBulkSchedule(staffId);

  function toggleClosed(day: DayOfWeek) {
    setState((prev) => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day]?.closed },
    }));
  }

  function setTime(
    day: DayOfWeek,
    field: 'start_time' | 'end_time',
    value: string,
  ) {
    setState((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  async function handleSave() {
    const days = buildBulkPayload(state);
    try {
      await saveBulk({ days });
      toast.success('Agenda atualizada');
    } catch (err) {
      const apiError = err as ApiError;
      toast.error(apiError.message ?? 'Erro ao salvar agenda');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  if (!schedule && !isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-muted-foreground text-sm">
          Sem agenda — defina os horários de trabalho
        </p>
        <Button variant="default" onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Definir horários
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-4 text-left font-medium">Dia</th>
              <th className="py-2 pr-4 text-left font-medium">Início</th>
              <th className="py-2 pr-4 text-left font-medium">Fim</th>
              <th className="py-2 text-left font-medium">Fechado</th>
            </tr>
          </thead>
          <tbody>
            {DAYS_OF_WEEK.map((day) => {
              const dayState = state[day];
              if (!dayState) return null;
              return (
                <tr key={day} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{DAY_LABELS[day]}</td>
                  <td className="py-2 pr-4">
                    <Input
                      type="time"
                      value={dayState.start_time}
                      onChange={(e) =>
                        setTime(day, 'start_time', e.target.value)
                      }
                      disabled={dayState.closed}
                      className={cn('w-28', dayState.closed && 'opacity-40')}
                      aria-label={`Horário de início — ${DAY_LABELS[day]}`}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <Input
                      type="time"
                      value={dayState.end_time}
                      onChange={(e) => setTime(day, 'end_time', e.target.value)}
                      disabled={dayState.closed}
                      className={cn('w-28', dayState.closed && 'opacity-40')}
                      aria-label={`Horário de fim — ${DAY_LABELS[day]}`}
                    />
                  </td>
                  <td className="py-2">
                    <Label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={dayState.closed}
                        onChange={() => toggleClosed(day)}
                        aria-label={`Fechado — ${DAY_LABELS[day]}`}
                        className="size-4 rounded border-gray-300"
                      />
                      <span className="text-sm">Fechado</span>
                    </Label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}
