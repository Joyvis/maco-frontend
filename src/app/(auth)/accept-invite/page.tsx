'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';

import { env } from '@/config/env';
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

// ─── Schema ────────────────────────────────────────────────────────────────────

const acceptInviteSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    password: z
      .string()
      .min(1, 'Senha é obrigatória')
      .min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

// ─── AcceptInviteForm ──────────────────────────────────────────────────────────

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { name: '', password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          role="alert"
          className={cn(
            'border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm',
          )}
        >
          Link inválido ou expirado. Solicite um novo convite.
        </div>
      </div>
    );
  }

  const onSubmit = async (data: AcceptInviteFormData) => {
    setFormError(null);
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: data.name,
          password: data.password,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          err.message ?? 'Erro ao aceitar convite. Tente novamente.',
        );
      }

      router.push('/login');
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Erro ao aceitar convite. Tente novamente.',
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Aceitar convite
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure seu nome e senha para acessar a plataforma
          </p>
        </div>

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
                  <FormLabel>Seu nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Maria Souza"
                      autoComplete="name"
                      {...field}
                    />
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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar senha</FormLabel>
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

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Salvando…' : 'Definir senha'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
