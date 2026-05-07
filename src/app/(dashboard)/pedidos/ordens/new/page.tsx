'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, X, Search } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useCreateSaleOrder,
  useAddOrderItem,
  useAllCatalogItems,
} from '@/services/sale-orders';
import { ORDER_ITEM_TYPE_LABELS } from '@/types/sale-order';
import type {
  SaleOrderItem,
  CatalogItem,
  AddOrderItemInput,
} from '@/types/sale-order';

type Step = 1 | 2 | 3;

interface PendingItem {
  catalogItem: CatalogItem;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1: customer
  const [customerName, setCustomerName] = useState('');

  // Step 2: items
  const [itemSearch, setItemSearch] = useState('');
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [committedItems, setCommittedItems] = useState<SaleOrderItem[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { data: catalogItems, isLoading: catalogLoading } =
    useAllCatalogItems();
  const { mutateAsync: createOrder, isPending: isCreating } =
    useCreateSaleOrder();
  const { mutateAsync: addItem, isPending: isAddingItems } = useAddOrderItem(
    orderId ?? '',
  );

  const filteredCatalog = catalogItems.filter((item) =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase()),
  );

  const total = pendingItems.reduce(
    (sum, pi) => sum + pi.catalogItem.price * pi.quantity,
    0,
  );

  function addPendingItem(item: CatalogItem) {
    setPendingItems((prev) => {
      const existing = prev.find((pi) => pi.catalogItem.id === item.id);
      if (existing) {
        return prev.map((pi) =>
          pi.catalogItem.id === item.id
            ? { ...pi, quantity: pi.quantity + 1 }
            : pi,
        );
      }
      return [...prev, { catalogItem: item, quantity: 1 }];
    });
  }

  function removePendingItem(itemId: string) {
    setPendingItems((prev) =>
      prev.filter((pi) => pi.catalogItem.id !== itemId),
    );
  }

  async function handleStep1Next() {
    if (!customerName.trim()) return;
    try {
      const result = await createOrder({ customer_name: customerName.trim() });
      setOrderId(result.data.id);
      setStep(2);
    } catch {
      toast.error('Erro ao criar ordem. Tente novamente.');
    }
  }

  async function handleStep2Next() {
    if (!orderId || pendingItems.length === 0) return;
    try {
      const inputs: AddOrderItemInput[] = pendingItems.map((pi) => ({
        item_id: pi.catalogItem.id,
        item_type: pi.catalogItem.type,
        quantity: pi.quantity,
      }));

      const addedItems: SaleOrderItem[] = [];
      for (const input of inputs) {
        const result = await addItem(input);
        const added = result.data.items.at(-1);
        if (added) addedItems.push(added);
      }
      setCommittedItems(addedItems);
      setStep(3);
    } catch {
      toast.error('Erro ao adicionar itens. Tente novamente.');
    }
  }

  function handleFinish() {
    toast.success('Ordem criada com sucesso.');
    router.push('/pedidos/ordens');
  }

  const canProceedStep1 = customerName.trim().length > 0;
  const canProceedStep2 = pendingItems.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Nova Ordem de Venda" />

      <div className="flex items-center gap-2">
        {step > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep((s) => (s - 1) as Step)}
            aria-label="Voltar"
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}
        <div className="flex gap-2">
          {([1, 2, 3] as const).map((n) => (
            <div
              key={n}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                n <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="max-w-md space-y-4">
          <h3 className="font-semibold">Passo 1: Cliente</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="customer-name">
              Nome do cliente
            </label>
            <Input
              id="customer-name"
              placeholder="Nome do cliente ou walk-in"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={!canProceedStep1 || isCreating}
            onClick={() => void handleStep1Next()}
          >
            {isCreating ? 'Criando...' : 'Próximo'}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Passo 2: Itens</h3>

          <div className="relative w-full max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Buscar serviços ou produtos..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              aria-label="Buscar itens"
            />
          </div>

          {catalogLoading ? (
            <p className="text-muted-foreground text-sm">Carregando itens...</p>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
              {filteredCatalog.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  Nenhum item encontrado.
                </p>
              ) : (
                filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="hover:bg-muted flex items-center justify-between rounded p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {ORDER_ITEM_TYPE_LABELS[item.type]}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {item.price.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addPendingItem(item)}
                      aria-label={`Adicionar ${item.name}`}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {pendingItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Itens adicionados</h4>
              {pendingItems.map((pi) => (
                <div
                  key={pi.catalogItem.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {pi.catalogItem.name}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      x{pi.quantity} —{' '}
                      {(pi.catalogItem.price * pi.quantity).toLocaleString(
                        'pt-BR',
                        { style: 'currency', currency: 'BRL' },
                      )}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePendingItem(pi.catalogItem.id)}
                    aria-label={`Remover ${pi.catalogItem.name}`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <div className="text-right text-sm font-semibold">
                Total:{' '}
                {total.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!canProceedStep2 || isAddingItems}
            onClick={() => void handleStep2Next()}
          >
            {isAddingItems ? 'Adicionando...' : 'Próximo'}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-md space-y-4">
          <h3 className="font-semibold">Passo 3: Revisão</h3>

          <div className="space-y-3 rounded-md border p-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Cliente</span>
              <span>{customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Status</span>
              <OrderStatusBadge state="confirmed" />
            </div>
            {committedItems.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm font-medium">Itens</span>
                {committedItems.map((item) => (
                  <div
                    key={item.id}
                    className="text-muted-foreground flex justify-between text-sm"
                  >
                    <span>{item.name}</span>
                    <span>
                      {item.price.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {pendingItems.length > 0 && committedItems.length === 0 && (
              <div className="space-y-1">
                <span className="text-sm font-medium">Itens</span>
                {pendingItems.map((pi) => (
                  <div
                    key={pi.catalogItem.id}
                    className="text-muted-foreground flex justify-between text-sm"
                  >
                    <span>
                      {pi.catalogItem.name} x{pi.quantity}
                    </span>
                    <span>
                      {(pi.catalogItem.price * pi.quantity).toLocaleString(
                        'pt-BR',
                        { style: 'currency', currency: 'BRL' },
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-sm font-semibold">
              <span>Total</span>
              <span>
                {total.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>

          <Button className="w-full" onClick={handleFinish}>
            Concluir
          </Button>
        </div>
      )}
    </div>
  );
}
