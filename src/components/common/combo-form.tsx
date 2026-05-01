'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Search, X, Plus } from 'lucide-react';

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useServices } from '@/services/services';
import { useProducts } from '@/services/products';
import { COMBO_ITEM_TYPE_LABELS } from '@/types/combo';
import type {
  Combo,
  ComboItem,
  ComboItemType,
  CreateComboInput,
} from '@/types/combo';

interface PickableItem {
  item_id: string;
  item_type: ComboItemType;
  name: string;
  base_price: number;
}

interface SelectedItem extends PickableItem {
  key: string;
}

interface ComboFormValues {
  name: string;
  description: string;
  discount_percentage: string;
}

interface ComboFormProps {
  combo?: Combo;
  onSubmit: (input: CreateComboInput) => Promise<void> | void;
  isLoading: boolean;
}

function ItemPicker({
  selectedKeys,
  onAdd,
}: {
  selectedKeys: Set<string>;
  onAdd: (item: PickableItem) => void;
}) {
  const [search, setSearch] = useState('');

  const { data: services } = useServices({}, { pageSize: 100 });
  const { data: products } = useProducts({}, { pageSize: 100 });

  const allItems: PickableItem[] = [
    ...(services ?? []).map((s) => ({
      item_id: s.id,
      item_type: 'service' as ComboItemType,
      name: s.name,
      base_price: s.base_price,
    })),
    ...(products ?? []).map((p) => ({
      item_id: p.id,
      item_type: 'product' as ComboItemType,
      name: p.name,
      base_price: p.base_price,
    })),
  ];

  const filtered = search.trim()
    ? allItems.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allItems;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
        <Input
          className="pl-8"
          placeholder="Buscar serviço ou produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar item"
        />
      </div>
      <ul
        className="divide-border max-h-48 divide-y overflow-y-auto rounded-md border"
        role="list"
        aria-label="Itens disponíveis"
      >
        {filtered.length === 0 && (
          <li className="text-muted-foreground px-3 py-2 text-sm">
            Nenhum item encontrado.
          </li>
        )}
        {filtered.map((item) => {
          const key = `${item.item_type}:${item.item_id}`;
          const already = selectedKeys.has(key);
          return (
            <li
              key={key}
              className="flex items-center justify-between px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="shrink-0 text-xs">
                  {COMBO_ITEM_TYPE_LABELS[item.item_type]}
                </Badge>
                <span className="text-sm">{item.name}</span>
                <span className="text-muted-foreground text-xs">
                  {item.base_price.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={already}
                onClick={() => onAdd(item)}
                aria-label={`Adicionar ${item.name}`}
              >
                <Plus className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ComboForm({ combo, onSubmit, isLoading }: ComboFormProps) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(() => {
    if (!combo?.items) return [];
    return combo.items.map((ci) => ({
      item_id: ci.item_id,
      item_type: ci.item_type,
      name: ci.name,
      base_price: ci.base_price,
      key: `${ci.item_type}:${ci.item_id}`,
    }));
  });

  const form = useForm<ComboFormValues>({
    defaultValues: {
      name: combo?.name ?? '',
      description: combo?.description ?? '',
      discount_percentage:
        combo?.discount_percentage !== undefined
          ? String(combo.discount_percentage)
          : '',
    },
  });

  function addItem(item: PickableItem) {
    const key = `${item.item_type}:${item.item_id}`;
    setSelectedItems((prev) => [...prev, { ...item, key }]);
  }

  function removeItem(key: string) {
    setSelectedItems((prev) => prev.filter((s) => s.key !== key));
  }

  async function handleSubmit(values: ComboFormValues) {
    const pct = parseFloat(values.discount_percentage);
    await onSubmit({
      name: values.name.trim(),
      description: values.description || undefined,
      discount_percentage: pct,
      items: selectedItems.map(({ item_type, item_id }) => ({
        item_type,
        item_id,
      })),
    });
  }

  const selectedKeys = new Set(selectedItems.map((s) => s.key));

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="max-w-xl space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Nome é obrigatório' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Combo Relaxamento" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Descrição do combo (opcional)" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discount_percentage"
          rules={{
            required: 'Desconto é obrigatório',
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Desconto (%)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Itens do Combo</p>

          {selectedItems.length > 0 && (
            <ul
              className="divide-border divide-y rounded-md border"
              role="list"
              aria-label="Itens selecionados"
            >
              {selectedItems.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {COMBO_ITEM_TYPE_LABELS[item.item_type]}
                    </Badge>
                    <span className="text-sm">{item.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {item.base_price.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(item.key)}
                    aria-label={`Remover ${item.name}`}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <ItemPicker selectedKeys={selectedKeys} onAdd={addItem} />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Re-export ComboItem for convenience
export type { ComboItem };
