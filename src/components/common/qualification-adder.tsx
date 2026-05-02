'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface QualificationOption {
  id: string;
  label: string;
}

interface QualificationAdderProps {
  options: QualificationOption[];
  onAdd: (id: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  addLabel?: string;
}

export function QualificationAdder({
  options,
  onAdd,
  isLoading = false,
  placeholder = 'Selecione...',
  addLabel = 'Adicionar',
}: QualificationAdderProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [isPending, setIsPending] = useState(false);

  async function handleAdd() {
    if (!selectedId) return;
    setIsPending(true);
    try {
      await onAdd(selectedId);
      setSelectedId('');
    } finally {
      setIsPending(false);
    }
  }

  const busy = isLoading || isPending;

  return (
    <div className="flex gap-2">
      <Select value={selectedId} onValueChange={setSelectedId} disabled={busy}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleAdd} disabled={!selectedId || busy}>
        {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        {addLabel}
      </Button>
    </div>
  );
}
