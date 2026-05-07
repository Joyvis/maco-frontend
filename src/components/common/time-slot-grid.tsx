'use client';

import { cn } from '@/lib/utils';
import type { TimeSlot } from '@/types/booking';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
}

function slotKey(slot: TimeSlot): string {
  return `${slot.date}-${slot.start_time}`;
}

export function TimeSlotGrid({
  slots,
  selectedSlot,
  onSelect,
}: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        Nenhum horário disponível para esta data.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected =
          selectedSlot !== null && slotKey(slot) === slotKey(selectedSlot);

        return (
          <button
            key={slotKey(slot)}
            type="button"
            disabled={!slot.available}
            aria-pressed={isSelected}
            onClick={() => onSelect(slot)}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              !slot.available &&
                'border-border text-muted-foreground cursor-not-allowed opacity-50',
              slot.available &&
                !isSelected &&
                'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
              isSelected && 'border-primary bg-primary text-primary-foreground',
            )}
          >
            {slot.start_time}
          </button>
        );
      })}
    </div>
  );
}
