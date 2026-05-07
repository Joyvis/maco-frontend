'use client';

import { cn } from '@/lib/utils';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const STRIP_DAYS = 30;

interface CalendarStripProps {
  startDate: Date;
  availableDates: string[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function CalendarStrip({
  startDate,
  availableDates,
  selectedDate,
  onSelect,
}: CalendarStripProps) {
  const availableSet = new Set(availableDates);
  const days = Array.from({ length: STRIP_DAYS }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {days.map((day) => {
        const iso = toIso(day);
        const isSelected = iso === selectedDate;
        const isAvailable = availableSet.has(iso);
        const dayLabel = DAY_LABELS[day.getDay()] ?? '';

        return (
          <button
            key={iso}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(iso)}
            className={cn(
              'flex min-w-[48px] flex-col items-center rounded-lg border px-2 py-2 text-sm transition-colors',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-accent',
            )}
          >
            <span className="text-xs opacity-70">{dayLabel}</span>
            <span className="font-semibold">{day.getDate()}</span>
            {isAvailable && (
              <span
                data-testid="availability-dot"
                className={cn(
                  'mt-1 size-1.5 rounded-full',
                  isSelected ? 'bg-primary-foreground' : 'bg-green-500',
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
