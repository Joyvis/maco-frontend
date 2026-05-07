'use client';

import { User } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { QualifiedStaff } from '@/types/qualification';

const ANY_STAFF_ID = 'any';

interface StaffPickerGridProps {
  staff: QualifiedStaff[];
  selectedStaffId: string | null;
  onSelect: (staffId: string, staffName: string) => void;
  isLoading?: boolean;
}

export function StaffPickerGrid({
  staff,
  selectedStaffId,
  onSelect,
  isLoading,
}: StaffPickerGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted h-24 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <button
        type="button"
        aria-pressed={selectedStaffId === ANY_STAFF_ID}
        onClick={() => onSelect(ANY_STAFF_ID, 'Qualquer Profissional')}
        className={cn(
          'flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm transition-colors',
          selectedStaffId === ANY_STAFF_ID
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border hover:bg-accent',
        )}
      >
        <User className="size-8 opacity-60" />
        <span className="text-center font-medium">Qualquer Profissional</span>
      </button>

      {staff.map((member) => (
        <button
          key={member.user_id}
          type="button"
          aria-pressed={selectedStaffId === member.user_id}
          onClick={() => onSelect(member.user_id, member.name)}
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm transition-colors',
            selectedStaffId === member.user_id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:bg-accent',
          )}
        >
          <div className="bg-muted flex size-8 items-center justify-center rounded-full font-semibold uppercase">
            {member.name.charAt(0)}
          </div>
          <span className="text-center font-medium">{member.name}</span>
        </button>
      ))}
    </div>
  );
}
