'use client';

import { useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useStaffList, useStaffSchedule } from '@/services/schedules';
import type { ManagedUser } from '@/types/user-management';

import { BlockDialog } from './block-dialog';
import { BlockOverlay } from './block-overlay';
import { WeeklyScheduleEditor } from './weekly-schedule-editor';

interface ScheduleSheetProps {
  staff: ManagedUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ScheduleSheet({ staff, open, onOpenChange }: ScheduleSheetProps) {
  const { data: schedule, isLoading } = useStaffSchedule(open ? staff.id : '');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Agenda — {staff.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 p-4">
          <WeeklyScheduleEditor
            staffId={staff.id}
            schedule={schedule}
            isLoading={isLoading}
          />

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Bloqueios</h3>
              <BlockDialog staffId={staff.id} />
            </div>
            {open && <BlockOverlay staffId={staff.id} />}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function StaffScheduleList() {
  const { data: staffList, isLoading } = useStaffList();
  const [selectedStaff, setSelectedStaff] = useState<ManagedUser | null>(null);

  const columns: ColumnDef<ManagedUser>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
    },
    {
      accessorKey: 'email',
      header: 'E-mail',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.status === 'active' ? 'Ativo' : 'Inativo',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedStaff(row.original)}
        >
          <Calendar className="mr-1 size-4" />
          Gerenciar Agenda
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  if (staffList.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum membro da equipe encontrado.
      </p>
    );
  }

  return (
    <>
      <DataTable columns={columns} data={staffList} pageSize={20} />

      {selectedStaff && (
        <ScheduleSheet
          staff={selectedStaff}
          open={Boolean(selectedStaff)}
          onOpenChange={(open) => {
            if (!open) setSelectedStaff(null);
          }}
        />
      )}
    </>
  );
}
