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
import type { Service, CreateServiceInput } from '@/types/service';

interface ServiceFormValues {
  name: string;
  description: string;
  category: string;
  duration_minutes: string;
  base_price: string;
}

interface ServiceFormProps {
  service?: Service;
  onSubmit: (input: CreateServiceInput) => Promise<void> | void;
  isLoading: boolean;
}

export function ServiceForm({
  service,
  onSubmit,
  isLoading,
}: ServiceFormProps) {
  const { data: categories } = useCategories();

  const form = useForm<ServiceFormValues>({
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      category: service?.category ?? '',
      duration_minutes:
        service?.duration_minutes !== undefined
          ? String(service.duration_minutes)
          : '',
      base_price:
        service?.base_price !== undefined ? String(service.base_price) : '',
    },
  });

  async function handleSubmit(values: ServiceFormValues) {
    const duration = parseInt(values.duration_minutes, 10);
    const price = parseFloat(values.base_price);
    if (!values.name.trim() || isNaN(duration) || isNaN(price)) return;
    await onSubmit({
      name: values.name.trim(),
      description: values.description || undefined,
      category: values.category || undefined,
      duration_minutes: duration,
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
                <Input {...field} placeholder="Ex: Corte de Cabelo" />
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
                  placeholder="Descrição do serviço (opcional)"
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
          name="duration_minutes"
          rules={{
            required: 'Duração é obrigatória',
            validate: (v) => !isNaN(parseInt(v, 10)) || 'Duração inválida',
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duração (minutos)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="60"
                />
              </FormControl>
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
