'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TIMEZONES } from '@/config/timezones';
import { useTenantConfigs, useUpdateTenantConfigs } from '@/services/tenant';
import type { TenantConfig } from '@/types/tenant';

const LOCALES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
];

const WEEK_DAYS = [
  { value: 'mon', label: 'Segunda' },
  { value: 'tue', label: 'Terça' },
  { value: 'wed', label: 'Quarta' },
  { value: 'thu', label: 'Quinta' },
  { value: 'fri', label: 'Sexta' },
  { value: 'sat', label: 'Sábado' },
  { value: 'sun', label: 'Domingo' },
];

interface ConfigFormData {
  timezone: string;
  locale: string;
  business_hours_start: string;
  business_hours_end: string;
  business_hours_days: string;
  notify_email: string;
  notify_sms: string;
}

function configsToFormData(configs: TenantConfig[]): ConfigFormData {
  const map = Object.fromEntries(configs.map((c) => [c.key, c.value]));
  return {
    timezone: map['timezone'] ?? 'America/Sao_Paulo',
    locale: map['locale'] ?? 'pt-BR',
    business_hours_start: map['business_hours_start'] ?? '08:00',
    business_hours_end: map['business_hours_end'] ?? '18:00',
    business_hours_days: map['business_hours_days'] ?? 'mon,tue,wed,thu,fri',
    notify_email: map['notify_email'] ?? '',
    notify_sms: map['notify_sms'] ?? '',
  };
}

function formDataToConfigs(data: ConfigFormData): TenantConfig[] {
  return [
    { key: 'timezone', value: data.timezone, group: 'general' },
    { key: 'locale', value: data.locale, group: 'general' },
    {
      key: 'business_hours_start',
      value: data.business_hours_start,
      group: 'business_hours',
    },
    {
      key: 'business_hours_end',
      value: data.business_hours_end,
      group: 'business_hours',
    },
    {
      key: 'business_hours_days',
      value: data.business_hours_days,
      group: 'business_hours',
    },
    { key: 'notify_email', value: data.notify_email, group: 'notifications' },
    { key: 'notify_sms', value: data.notify_sms, group: 'notifications' },
  ];
}

interface ConfigEditorProps {
  tenantId: string;
}

export function ConfigEditor({ tenantId }: ConfigEditorProps) {
  const { data: configs, isLoading } = useTenantConfigs(tenantId);
  const { mutate: updateConfigs, isPending } = useUpdateTenantConfigs(tenantId);
  const [timezoneSearch, setTimezoneSearch] = useState('');

  const { control, handleSubmit, reset } = useForm<ConfigFormData>({
    defaultValues: configsToFormData([]),
  });

  useEffect(() => {
    if (configs.length > 0) {
      reset(configsToFormData(configs));
    }
  }, [configs, reset]);

  const filteredTimezones = TIMEZONES.filter((tz) =>
    tz.toLowerCase().includes(timezoneSearch.toLowerCase()),
  );

  const onSubmit = (data: ConfigFormData) => {
    updateConfigs(
      { configs: formDataToConfigs(data) },
      {
        onSuccess: () => toast.success('Configurações salvas com sucesso'),
        onError: () =>
          toast.error('Erro ao salvar configurações. Tente novamente.'),
      },
    );
  };

  if (isLoading) {
    return (
      <div
        className="space-y-6"
        role="status"
        aria-label="Carregando configurações"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* General */}
      <section className="space-y-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Geral</h3>

        <div className="space-y-2">
          <Label htmlFor="timezone-search">Fuso Horário</Label>
          <Input
            id="timezone-search"
            placeholder="Buscar fuso horário..."
            value={timezoneSearch}
            onChange={(e) => setTimezoneSearch(e.target.value)}
            aria-label="Buscar fuso horário"
          />
          <Controller
            control={control}
            name="timezone"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger aria-label="Fuso horário selecionado">
                  <SelectValue placeholder="Selecione o fuso horário" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTimezones.length === 0 ? (
                    <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                      Nenhum fuso horário encontrado
                    </div>
                  ) : (
                    filteredTimezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Idioma</Label>
          <Controller
            control={control}
            name="locale"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((locale) => (
                    <SelectItem key={locale.value} value={locale.value}>
                      {locale.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </section>

      {/* Business Hours */}
      <section className="space-y-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Horário Comercial</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="business_hours_start">Início</Label>
            <Controller
              control={control}
              name="business_hours_start"
              render={({ field }) => (
                <Input id="business_hours_start" type="time" {...field} />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_hours_end">Fim</Label>
            <Controller
              control={control}
              name="business_hours_end"
              render={({ field }) => (
                <Input id="business_hours_end" type="time" {...field} />
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dias da Semana</Label>
          <Controller
            control={control}
            name="business_hours_days"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione os dias" />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_DAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="mon,tue,wed,thu,fri">
                    Segunda a Sexta
                  </SelectItem>
                  <SelectItem value="mon,tue,wed,thu,fri,sat">
                    Segunda a Sábado
                  </SelectItem>
                  <SelectItem value="mon,tue,wed,thu,fri,sat,sun">
                    Todos os dias
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Notificações</h3>

        <div className="space-y-2">
          <Label htmlFor="notify_email">E-mail para Notificações</Label>
          <Controller
            control={control}
            name="notify_email"
            render={({ field }) => (
              <Input
                id="notify_email"
                type="email"
                placeholder="notificacoes@empresa.com"
                {...field}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notify_sms">Telefone para SMS</Label>
          <Controller
            control={control}
            name="notify_sms"
            render={({ field }) => (
              <Input
                id="notify_sms"
                type="tel"
                placeholder="+55 11 99999-9999"
                {...field}
              />
            )}
          />
        </div>
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Salvar Configurações
      </Button>
    </form>
  );
}
