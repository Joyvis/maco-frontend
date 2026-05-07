export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export type BlockReason =
  | 'vacation'
  | 'day_off'
  | 'lunch'
  | 'personal'
  | 'other';

export const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  vacation: 'Férias',
  day_off: 'Folga',
  lunch: 'Almoço',
  personal: 'Pessoal',
  other: 'Outro',
};

export const BLOCK_REASON_COLORS: Record<BlockReason, string> = {
  vacation: 'bg-red-100 border-red-300 text-red-800',
  day_off: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  lunch: 'bg-blue-100 border-blue-300 text-blue-800',
  personal: 'bg-purple-100 border-purple-300 text-purple-800',
  other: 'bg-gray-100 border-gray-300 text-gray-800',
};

export interface ScheduleDay {
  day: DayOfWeek;
  start_time: string;
  end_time: string;
}

export interface StaffSchedule {
  id: string;
  staff_id: string;
  days: ScheduleDay[];
  effective_from: string;
  effective_until?: string;
}

export interface ScheduleBlock {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  reason: BlockReason;
  notes?: string;
}

export interface BulkScheduleInput {
  days: ScheduleDay[];
}

export interface CreateBlockInput {
  start_date: string;
  end_date: string;
  reason: BlockReason;
  notes?: string;
}
