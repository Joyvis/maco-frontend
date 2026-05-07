'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateBlock } from '@/services/schedules';
import {
  BLOCK_REASON_LABELS,
  type BlockReason,
  type CreateBlockInput,
} from '@/types/schedule';
import type { ApiError } from '@/types/api';

const BLOCK_REASONS: BlockReason[] = [
  'vacation',
  'day_off',
  'lunch',
  'personal',
  'other',
];

interface BlockDialogProps {
  staffId: string;
}

export function BlockDialog({ staffId }: BlockDialogProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState<BlockReason | ''>('');
  const [notes, setNotes] = useState('');
  const [dateError, setDateError] = useState('');

  const { mutateAsync: createBlock, isPending } = useCreateBlock(staffId);

  function reset() {
    setStartDate('');
    setEndDate('');
    setReason('');
    setNotes('');
    setDateError('');
  }

  function validateDates(): boolean {
    if (!startDate) {
      setDateError('Data de início é obrigatória');
      return false;
    }
    if (!endDate) {
      setDateError('Data de fim é obrigatória');
      return false;
    }
    if (endDate < startDate) {
      setDateError('Data de fim deve ser posterior à data de início');
      return false;
    }
    setDateError('');
    return true;
  }

  async function handleSubmit() {
    if (!validateDates()) return;
    if (!reason) return;

    if (!reason) {
      toast.error('Selecione um motivo');
      return;
    }

    const input: CreateBlockInput = {
      start_date: startDate,
      end_date: endDate,
      reason,
      notes: notes.trim() || undefined,
    };

    try {
      await createBlock(input);
      toast.success('Bloqueio adicionado');
      reset();
      setOpen(false);
    } catch (err) {
      const apiError = err as ApiError;
      toast.error(apiError.message ?? 'Erro ao adicionar bloqueio');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1 size-4" />
          Adicionar Bloqueio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Bloqueio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="block-start-date">Data de início</Label>
              <Input
                id="block-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateError('');
                }}
                aria-label="Data de início do bloqueio"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-end-date">Data de fim</Label>
              <Input
                id="block-end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateError('');
                }}
                aria-label="Data de fim do bloqueio"
              />
            </div>
          </div>

          {dateError && (
            <p className="text-destructive text-sm" role="alert">
              {dateError}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="block-reason">Motivo</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as BlockReason)}
            >
              <SelectTrigger id="block-reason" aria-label="Motivo do bloqueio">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {BLOCK_REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="block-notes">Observações</Label>
            <textarea
              id="block-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações opcionais..."
              rows={3}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Observações do bloqueio"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
