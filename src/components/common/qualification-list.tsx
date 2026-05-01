'use client';

import { X } from 'lucide-react';

import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';

export interface QualificationListItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface QualificationListProps {
  items: QualificationListItem[];
  onRemove: (id: string) => Promise<void>;
  isLoading?: boolean;
  emptyMessage?: string;
  canRemove?: boolean;
  removeDialogTitle?: string;
  removeDialogDescription?: (label: string) => string;
}

export function QualificationList({
  items,
  onRemove,
  isLoading = false,
  emptyMessage = 'Nenhum item encontrado.',
  canRemove = true,
  removeDialogTitle = 'Remover qualificação',
  removeDialogDescription = (label) =>
    `Tem certeza que deseja remover "${label}"? Esta ação não pode ser desfeita.`,
}: QualificationListProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando...</p>;
  }

  if (!items.length) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y rounded-md border">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between px-4 py-3"
        >
          <div className="flex flex-col">
            <span className="font-medium">{item.label}</span>
            {item.sublabel && (
              <span className="text-muted-foreground text-sm">
                {item.sublabel}
              </span>
            )}
          </div>
          {canRemove && (
            <ConfirmDialog
              title={removeDialogTitle}
              description={removeDialogDescription(item.label)}
              confirmLabel="Remover"
              variant="destructive"
              onConfirm={() => onRemove(item.id)}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${item.label}`}
                >
                  <X className="size-4" />
                </Button>
              }
            />
          )}
        </li>
      ))}
    </ul>
  );
}
