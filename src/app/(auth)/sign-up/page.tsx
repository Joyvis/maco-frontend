'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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

function navigateToExternalUrl(url: string): void {
  window.location.href = url;
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const signUpSchema = z.object({
  tenantName: z.string().min(1, 'Nome da empresa é obrigatório'),
  ownerName: z.string().min(1, 'Nome é obrigatório'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'A senha deve ter pelo menos 8 caracteres'),
  plan: z.enum(['trial', 'paid']),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

// ─── PlanCard ──────────────────────────────────────────────────────────────────

interface PlanCardProps {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  selected: boolean;
  onSelect: () => void;
}

function PlanCard({
  id,
  name,
  price,
  description,
  features,
  selected,
  onSelect,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        'flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-colors',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50',
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="radio"
          name="plan"
          aria-label={name}
          checked={selected}
          onChange={onSelect}
          className="accent-primary mt-1"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">{name}</span>
            <span className="text-muted-foreground text-sm">{price}</span>
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
          <ul className="mt-2 space-y-1" aria-hidden="true">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <span className="text-primary">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── SignUpForm ────────────────────────────────────────────────────────────────

function SignUpForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'paid'>('trial');

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      tenantName: '',
      ownerName: '',
      email: '',
      password: '',
      plan: 'trial',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setFormError(null);
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_name: data.tenantName,
          owner_name: data.ownerName,
          email: data.email,
          password: data.password,
          plan: data.plan,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(err.message ?? 'Erro ao criar conta. Tente novamente.');
      }

      const body = (await res.json().catch(() => ({}))) as {
        checkout_url?: string;
      };

      if (data.plan === 'paid' && body.checkout_url) {
        navigateToExternalUrl(body.checkout_url);
        return;
      }

      toast.success('Conta criada com sucesso!');
      router.push('/login');
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Erro ao criar conta. Tente novamente.',
      );
    }
  };

  const submitLabel =
    selectedPlan === 'paid' ? 'Continuar para pagamento' : 'Criar conta';
  const submittingLabel =
    selectedPlan === 'paid' ? 'Redirecionando…' : 'Criando…';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
          <p className="text-muted-foreground text-sm">
            Comece a usar a plataforma hoje mesmo
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
              name="tenantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da empresa</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Ltda."
                      autoComplete="organization"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seu nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="João Silva"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="voce@empresa.com"
                      autoComplete="email"
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

            <div className="space-y-2">
              <p className="text-sm font-medium">Plano</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <PlanCard
                  id="plan-trial"
                  name="Teste grátis"
                  price="Grátis por 14 dias"
                  description="Experimente sem compromisso"
                  features={[
                    'Até 3 usuários',
                    'Módulos essenciais',
                    'Suporte por e-mail',
                  ]}
                  selected={selectedPlan === 'trial'}
                  onSelect={() => {
                    form.setValue('plan', 'trial');
                    setSelectedPlan('trial');
                  }}
                />
                <PlanCard
                  id="plan-paid"
                  name="Plano pago"
                  price="Consultar preços"
                  description="Para times e empresas"
                  features={[
                    'Usuários ilimitados',
                    'Todos os módulos',
                    'Suporte prioritário',
                  ]}
                  selected={selectedPlan === 'paid'}
                  onSelect={() => {
                    form.setValue('plan', 'paid');
                    setSelectedPlan('paid');
                  }}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? submittingLabel : submitLabel}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              Já tem uma conta?{' '}
              <a
                href="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Entrar
              </a>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
