'use client';

import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/services/products';
import { PRODUCT_UNIT_LABELS } from '@/types/product';
import type { Product, CreateProductInput, ProductUnit } from '@/types/product';

interface ProductFormValues {
  name: string;
  description: string;
  category: string;
  unit: ProductUnit;
  base_price: string;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (input: CreateProductInput) => Promise<void> | void;
  isLoading: boolean;
}

const UNIT_OPTIONS: { value: ProductUnit; label: string }[] = (
  Object.entries(PRODUCT_UNIT_LABELS) as [ProductUnit, string][]
).map(([value, label]) => ({ value, label }));

export function ProductForm({
  product,
  onSubmit,
  isLoading,
}: ProductFormProps) {
  const { data: categories } = useCategories();

  const form = useForm<ProductFormValues>({
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      category: product?.category ?? '',
      unit: product?.unit ?? 'unit',
      base_price:
        product?.base_price !== undefined ? String(product.base_price) : '',
    },
  });

  async function handleSubmit(values: ProductFormValues) {
    const price = parseFloat(values.base_price);
    if (!values.name.trim() || isNaN(price)) return;
    await onSubmit({
      name: values.name.trim(),
      description: values.description || undefined,
      category: values.category || undefined,
      unit: values.unit,
      base_price: price,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="max-w-lg space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Nome é obrigatório' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Shampoo Premium" />
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
                <Input
                  {...field}
                  placeholder="Descrição do produto (opcional)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger aria-label="Categoria">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unit"
          rules={{ required: 'Unidade é obrigatória' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidade de Medida</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger aria-label="Unidade de Medida">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {UNIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="base_price"
          rules={{
            required: 'Preço é obrigatório',
            validate: (v) => !isNaN(parseFloat(v)) || 'Preço inválido',
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço Base (R$)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
