'use client';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDeleteBlock, useStaffBlocks } from '@/services/schedules';
import {
  BLOCK_REASON_COLORS,
  BLOCK_REASON_LABELS,
  type ScheduleBlock,
} from '@/types/schedule';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

interface BlockItemProps {
  block: ScheduleBlock;
  staffId: string;
}

function BlockItem({ block, staffId }: BlockItemProps) {
  const { mutateAsync: deleteBlock } = useDeleteBlock(staffId);

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border p-3',
        BLOCK_REASON_COLORS[block.reason],
      )}
    >
      <div className="space-y-0.5">
        <p className="text-sm font-medium">
          {BLOCK_REASON_LABELS[block.reason]}
        </p>
        <p className="text-xs">
          {formatDate(block.start_date)} — {formatDate(block.end_date)}
        </p>
        {block.notes && <p className="text-xs opacity-80">{block.notes}</p>}
      </div>
      <ConfirmDialog
        title="Remover bloqueio"
        description={`Deseja remover o bloqueio de ${BLOCK_REASON_LABELS[block.reason]} (${formatDate(block.start_date)} — ${formatDate(block.end_date)})?`}
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={async () => {
          await deleteBlock(block.id);
          toast.success('Bloqueio removido');
        }}
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive shrink-0"
          >
            Remover
          </Button>
        }
      />
    </div>
  );
}

interface BlockOverlayProps {
  staffId: string;
}

export function BlockOverlay({ staffId }: BlockOverlayProps) {
  const { data: blocks, isLoading } = useStaffBlocks(staffId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">
        Nenhum bloqueio cadastrado.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {blocks.map((block) => (
        <BlockItem key={block.id} block={block} staffId={staffId} />
      ))}
    </div>
  );
}
