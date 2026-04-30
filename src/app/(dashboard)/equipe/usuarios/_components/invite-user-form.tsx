'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
import { cn } from '@/lib/utils';
import { useInviteUser } from '@/services/users';
import { useRoles } from '@/services/roles';

const inviteSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  role_ids: z.array(z.string()).min(1, 'Selecione pelo menos um papel'),
  message: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export function InviteUserForm() {
  const router = useRouter();
  const { mutateAsync: inviteUser } = useInviteUser();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role_ids: [], message: '' },
  });

  const onSubmit = async (data: InviteFormData) => {
    setFormError(null);
    try {
      await inviteUser(data);
      toast.success('Convite enviado com sucesso');
      form.reset();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Erro ao enviar convite',
      );
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        {formError && (
          <div
            role="alert"
            className={cn(
              'border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm',
            )}
          >
            {formError}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="voce@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Papéis</FormLabel>
              {rolesLoading ? (
                <p className="text-muted-foreground text-sm">
                  Carregando papéis...
                </p>
              ) : (
                <div className="space-y-2">
                  {(roles ?? []).map((role) => (
                    <div key={role.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`role-invite-${role.id}`}
                        checked={field.value.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...field.value, role.id]);
                          } else {
                            field.onChange(
                              field.value.filter((id) => id !== role.id),
                            );
                          }
                        }}
                        className="size-4 rounded border-gray-300"
                      />
                      <label
                        htmlFor={`role-invite-${role.id}`}
                        className="text-sm"
                      >
                        {role.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem (opcional)</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  placeholder="Adicione uma mensagem personalizada ao convite..."
                  rows={3}
                  className={cn(
                    'border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                    'placeholder:text-muted-foreground',
                    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Enviar convite
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/equipe/usuarios')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
