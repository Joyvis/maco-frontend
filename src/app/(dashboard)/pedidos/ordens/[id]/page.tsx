'use client';

import { use, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useOrder,
  useOrderItems,
  useOrderPayments,
  useOrderHistory,
  useCheckIn,
  useStartService,
  useCompleteOrder,
  useCancelOrder,
  useNoShowOrder,
} from '@/services/orders';
import {
  ADMIN_ORDER_STATE_LABELS,
  ORDER_FLOW_STATES,
  type AdminSaleOrder,
  type AdminSaleOrderState,
  type SaleOrderItem,
  type SaleOrderPayment,
  type SaleOrderHistoryEntry,
} from '@/types/order';

// ─── State Progress Bar ────────────────────────────────────────────────────────
function StateProgressBar({
  currentState,
}: {
  currentState: AdminSaleOrderState;
}) {
  const isTerminal = currentState === 'cancelled' || currentState === 'no_show';
  const currentIndex = ORDER_FLOW_STATES.indexOf(currentState);

  return (
    <div className="flex items-center gap-1" aria-label="Progresso do pedido">
      {ORDER_FLOW_STATES.map((state, idx) => {
        const isPast = !isTerminal && idx < currentIndex;
        const isCurrent = !isTerminal && idx === currentIndex;
        return (
          <div key={state} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={[
                'h-2 w-full rounded-full',
                isPast
                  ? 'bg-primary/40'
                  : isCurrent
                    ? 'bg-primary'
                    : 'bg-muted',
              ].join(' ')}
            />
            <span
              aria-hidden="true"
              className={[
                'hidden text-xs sm:block',
                isCurrent
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground',
              ].join(' ')}
            >
              {ADMIN_ORDER_STATE_LABELS[state]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Cancel Dialog ─────────────────────────────────────────────────────────────
function CancelDialog({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { mutateAsync: cancel, isPending } = useCancelOrder();

  async function handleConfirm() {
    if (!reason.trim()) return;
    await cancel({ id: orderId, reason });
    toast.success('Pedido cancelado.');
    setOpen(false);
    setReason('');
    onSuccess();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Cancelar Pedido</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
          <AlertDialogDescription>
            Informe o motivo do cancelamento. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Motivo</Label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Descreva o motivo do cancelamento..."
            rows={3}
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Voltar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || !reason.trim()}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirmar Cancelamento
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── No-show Dialog ────────────────────────────────────────────────────────────
function NoShowDialog({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { mutateAsync: noShow, isPending } = useNoShowOrder();

  async function handleConfirm() {
    await noShow(orderId);
    toast.success('Pedido marcado como não compareceu.');
    setOpen(false);
    onSuccess();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Não Compareceu</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Marcar como Não Compareceu</AlertDialogTitle>
          <AlertDialogDescription>
            O cliente não compareceu ao agendamento? Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Voltar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirmar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Workflow Actions ──────────────────────────────────────────────────────────
function WorkflowActions({ order }: { order: AdminSaleOrder }) {
  const { mutateAsync: checkIn, isPending: isCheckingIn } = useCheckIn();
  const { mutateAsync: startService, isPending: isStarting } =
    useStartService();
  const { mutateAsync: complete, isPending: isCompleting } = useCompleteOrder();

  const { state, id, balance_due } = order;
  const canCancel = [
    'pending_payment',
    'confirmed',
    'checked_in',
    'in_progress',
    'pending_checkout',
  ].includes(state);
  const canNoShow = state === 'confirmed' || state === 'checked_in';

  function noop() {}

  return (
    <div className="flex flex-wrap gap-2">
      {state === 'confirmed' && (
        <Button
          onClick={async () => {
            await checkIn(id);
            toast.success('Check-in realizado.');
          }}
          disabled={isCheckingIn}
        >
          {isCheckingIn && <Loader2 className="mr-2 size-4 animate-spin" />}
          Realizar Check-in
        </Button>
      )}

      {state === 'checked_in' && (
        <Button
          onClick={async () => {
            await startService(id);
            toast.success('Atendimento iniciado.');
          }}
          disabled={isStarting}
        >
          {isStarting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Iniciar Atendimento
        </Button>
      )}

      {state === 'pending_checkout' && (
        <Button
          onClick={async () => {
            await complete(id);
            toast.success('Pedido concluído.');
          }}
          disabled={isCompleting || balance_due > 0}
          title={
            balance_due > 0
              ? 'Saldo pendente deve ser zerado antes de concluir'
              : undefined
          }
        >
          {isCompleting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Concluir Pedido
        </Button>
      )}

      {canNoShow && <NoShowDialog orderId={id} onSuccess={noop} />}

      {canCancel && <CancelDialog orderId={id} onSuccess={noop} />}
    </div>
  );
}

// ─── Items Tab ─────────────────────────────────────────────────────────────────
function OrderItemsTab({ items }: { items: SaleOrderItem[] }) {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Nenhum item encontrado.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-3 text-left font-medium">Serviço</th>
              <th className="p-3 text-right font-medium">Qtd</th>
              <th className="p-3 text-right font-medium">Preço Unit.</th>
              <th className="p-3 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="p-3">{item.service_name}</td>
                <td className="p-3 text-right">{item.quantity}</td>
                <td className="p-3 text-right">
                  {item.price_snapshot.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </td>
                <td className="p-3 text-right">
                  {item.subtotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50">
              <td colSpan={3} className="p-3 text-right font-medium">
                Total
              </td>
              <td className="p-3 text-right font-semibold">
                {total.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Payments Tab ──────────────────────────────────────────────────────────────
function OrderPaymentsTab({ payments }: { payments: SaleOrderPayment[] }) {
  if (payments.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhum pagamento registrado.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{payment.method}</p>
            <p className="text-muted-foreground text-xs">
              {new Date(payment.created_at).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={payment.status === 'paid' ? 'default' : 'secondary'}
            >
              {payment.status}
            </Badge>
            <span className="text-sm font-medium">
              {payment.amount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── History Tab ───────────────────────────────────────────────────────────────
function OrderHistoryTab({ entries }: { entries: SaleOrderHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhuma transição registrada.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start justify-between rounded-lg border p-3"
        >
          <div className="space-y-0.5">
            <p className="text-sm">
              {entry.from_state
                ? `${ADMIN_ORDER_STATE_LABELS[entry.from_state]} → ${ADMIN_ORDER_STATE_LABELS[entry.to_state]}`
                : ADMIN_ORDER_STATE_LABELS[entry.to_state]}
            </p>
            {entry.actor && (
              <p className="text-muted-foreground text-xs">por {entry.actor}</p>
            )}
          </div>
          <span className="text-muted-foreground text-xs">
            {new Date(entry.created_at).toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);

  const { data: order, isLoading } = useOrder(id);
  const { data: items, isLoading: isLoadingItems } = useOrderItems(id);
  const { data: payments, isLoading: isLoadingPayments } = useOrderPayments(id);
  const { data: history, isLoading: isLoadingHistory } = useOrderHistory(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ordem de Venda" />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ordem de Venda" />
        <p className="text-muted-foreground text-sm">Ordem não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Pedido #${order.order_number}`}>
        <Badge variant="outline">{ADMIN_ORDER_STATE_LABELS[order.state]}</Badge>
      </PageHeader>

      <div className="rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs">Cliente</p>
            <p className="text-sm font-medium">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Profissional</p>
            <p className="text-sm font-medium">{order.assigned_staff ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Total</p>
            <p className="text-sm font-medium">
              {order.total_amount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Criado em</p>
            <p className="text-sm font-medium">
              {new Date(order.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <StateProgressBar currentState={order.state} />

      <WorkflowActions order={order} />

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="pt-4">
          {isLoadingItems ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : (
            <OrderItemsTab items={items} />
          )}
        </TabsContent>

        <TabsContent value="payments" className="pt-4">
          {isLoadingPayments ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : (
            <OrderPaymentsTab payments={payments} />
          )}
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          {isLoadingHistory ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : (
            <OrderHistoryTab entries={history} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
