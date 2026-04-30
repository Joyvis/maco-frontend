'use client';

import { useForm } from 'react-hook-form';
import { Loader2, Info } from 'lucide-react';

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
import { PermissionMatrix } from '@/components/common/permission-matrix';
import type { Role, RolePermission, CreateRoleInput } from '@/types/role';

interface RoleFormValues {
  name: string;
  permissions: RolePermission[];
}

interface RoleFormProps {
  role?: Role;
  onSubmit: (input: CreateRoleInput) => Promise<void> | void;
  isLoading: boolean;
}

export function RoleForm({ role, onSubmit, isLoading }: RoleFormProps) {
  const isSystem = role?.is_system ?? false;

  const form = useForm<RoleFormValues>({
    defaultValues: {
      name: role?.name ?? '',
      permissions: role?.permissions ?? [],
    },
  });

  async function handleSubmit(values: RoleFormValues) {
    if (!values.name.trim()) return;
    await onSubmit({
      name: values.name.trim(),
      permissions: values.permissions,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {isSystem && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
          >
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              Papéis de sistema são imutáveis. Nome e permissões não podem ser
              alterados.
            </span>
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Nome é obrigatório' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Papel</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isSystem}
                  placeholder="Ex: Gerente de Vendas"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permissões</FormLabel>
              <FormControl>
                <PermissionMatrix
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={isSystem}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {!isSystem && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
