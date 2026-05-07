'use client';

import { toast } from 'sonner';
import { UserCheck } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { Button } from '@/components/ui/button';
import { useSaleOrderPool, useClaimSaleOrder } from '@/services/sale-orders';
import type { ManagedSaleOrder } from '@/types/sale-order';

function PoolOrderCard({
  order,
  onClaim,
  isClaiming,
}: {
  order: ManagedSaleOrder;
  onClaim: () => void;
  isClaiming: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">#{order.order_number}</span>
          <OrderStatusBadge state={order.state} />
        </div>
        <p className="text-muted-foreground text-sm">{order.customer_name}</p>
        <p className="text-muted-foreground text-xs">
          {new Date(order.created_at).toLocaleDateString('pt-BR')}
        </p>
        <p className="text-sm font-semibold">
          {order.total_amount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </p>
      </div>
      <Button
        size="sm"
        disabled={isClaiming}
        onClick={onClaim}
        aria-label={`Assumir ordem #${order.order_number}`}
      >
        <UserCheck className="mr-2 size-4" />
        Assumir
      </Button>
    </div>
  );
}

export default function OrderPoolPage() {
  const { data: orders, isLoading } = useSaleOrderPool();
  const { mutateAsync: claim, isPending: isClaiming } = useClaimSaleOrder();

  async function handleClaim(orderId: string) {
    try {
      await claim(orderId);
      toast.success('Ordem assumida com sucesso.');
    } catch {
      toast.error('Não foi possível assumir a ordem. Tente novamente.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pool de Ordens"
        description="Ordens confirmadas sem colaborador atribuído."
      />

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhuma ordem disponível no pool.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <PoolOrderCard
              key={order.id}
              order={order}
              onClaim={() => void handleClaim(order.id)}
              isClaiming={isClaiming}
            />
          ))}
        </div>
      )}
    </div>
  );
}
