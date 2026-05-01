'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant, useUpdateTenant } from '@/services/tenant';

const profileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  contact_email: z.string().email('E-mail inválido').or(z.literal('')),
  contact_phone: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface TenantProfileFormProps {
  tenantId: string;
}

export function TenantProfileForm({ tenantId }: TenantProfileFormProps) {
  const { data: tenant, isLoading } = useTenant(tenantId);
  const { mutate: updateTenant, isPending } = useUpdateTenant(tenantId);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', contact_email: '', contact_phone: '' },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name,
        contact_email: tenant.contact_email ?? '',
        contact_phone: tenant.contact_phone ?? '',
      });
    }
  }, [tenant, form]);

  const onSubmit = (data: ProfileFormData) => {
    updateTenant(
      {
        name: data.name,
        contact_email: data.contact_email || undefined,
        contact_phone: data.contact_phone || undefined,
      },
      {
        onSuccess: () => toast.success('Perfil salvo com sucesso'),
        onError: () => toast.error('Erro ao salvar perfil. Tente novamente.'),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Carregando perfil">
        <Skeleton className="h-24 w-full rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            ID do Tenant
          </p>
          <p className="mt-1 font-mono text-sm">{tenant?.id ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Tipo de Conta
          </p>
          <p className="mt-1 text-sm capitalize">
            {tenant?.account_type ?? '—'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Tenant</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da empresa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail de Contato</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="contato@empresa.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone de Contato</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+55 11 99999-9999"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Salvar
          </Button>
        </form>
      </Form>
    </div>
  );
}
