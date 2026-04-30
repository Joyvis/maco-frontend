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
import { Label } from '@/components/ui/label';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useCreateUser, useUpdateUser } from '@/services/users';
import { useRoles } from '@/services/roles';
import type { ManagedUser } from '@/types/user-management';

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'A senha deve ter pelo menos 8 caracteres'),
  role_ids: z.array(z.string()).min(1, 'Selecione pelo menos um papel'),
});

const editSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  role_ids: z.array(z.string()).min(1, 'Selecione pelo menos um papel'),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface UserFormCreateProps {
  mode: 'create';
  user?: undefined;
}

interface UserFormEditProps {
  mode: 'edit';
  user: ManagedUser;
}

type UserFormProps = UserFormCreateProps | UserFormEditProps;

function CreateUserForm() {
  const router = useRouter();
  const { mutateAsync: createUser } = useCreateUser();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', email: '', password: '', role_ids: [] },
  });

  const onSubmit = async (data: CreateFormData) => {
    setFormError(null);
    try {
      await createUser(data);
      toast.success('Usuário criado com sucesso');
      router.push('/equipe/usuarios');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Erro ao criar usuário',
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...field}
                />
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
                        id={`role-create-${role.id}`}
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
                        htmlFor={`role-create-${role.id}`}
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

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Criar usuário
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

function EditUserForm({ user }: { user: ManagedUser }) {
  const router = useRouter();
  const { mutateAsync: updateUser } = useUpdateUser(user.id);
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: user.name,
      role_ids: user.roles.map((r) => r.id),
    },
  });

  const onSubmit = async (data: EditFormData) => {
    setFormError(null);
    try {
      await updateUser(data);
      toast.success('Usuário atualizado com sucesso');
      router.push('/equipe/usuarios');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Erro ao atualizar usuário',
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label htmlFor="edit-email-readonly">E-mail</Label>
          <Input
            id="edit-email-readonly"
            type="email"
            value={user.email}
            disabled
            readOnly
            aria-readonly
            className="bg-muted cursor-not-allowed"
          />
        </div>

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
                        id={`role-edit-${role.id}`}
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
                        htmlFor={`role-edit-${role.id}`}
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

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Salvar alterações
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

export function UserForm(props: UserFormProps) {
  if (props.mode === 'edit') {
    return <EditUserForm user={props.user} />;
  }
  return <CreateUserForm />;
}
