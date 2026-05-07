'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCancelAppointment,
  useRefundPolicies,
} from '@/services/appointments';
import type { SaleOrder } from '@/types/appointment';

const CANCEL_REASONS = [
  { value: 'personal', label: 'Motivo pessoal' },
  { value: 'schedule_conflict', label: 'Conflito de agenda' },
  { value: 'illness', label: 'Doença' },
  { value: 'other', label: 'Outro' },
];

interface CancelDialogProps {
  order: SaleOrder;
}

export function CancelDialog({ order }: CancelDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { data: refundPolicies } = useRefundPolicies();
  const { mutateAsync: cancelAppointment, isPending } = useCancelAppointment();

  const policy = refundPolicies[0];
  const refundAmount = policy
    ? (order.total_amount * policy.refund_percentage) / 100
    : 0;

  async function handleConfirm() {
    if (!reason) return;
    try {
      await cancelAppointment({ id: order.id, reason });
      toast.success('Agendamento cancelado com sucesso');
      setOpen(false);
    } catch {
      toast.error('Erro ao cancelar agendamento');
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Cancelar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {policy && (
              <div className="bg-muted rounded-md p-3 text-sm">
                <p className="font-medium">Política de Reembolso</p>
                <p className="text-muted-foreground mt-1">
                  {policy.description}
                </p>
                <p className="mt-2">
                  Valor do reembolso:{' '}
                  <span className="font-semibold" data-testid="refund-amount">
                    R$ {refundAmount.toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="cancel-reason">
                Motivo do cancelamento
              </label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="cancel-reason" className="w-full">
                  <SelectValue placeholder="Selecione um motivo" />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!reason || isPending}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
