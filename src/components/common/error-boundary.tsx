'use client';

import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      <div className="space-y-1 text-center">
        <p className="text-base font-semibold text-destructive">Algo deu errado</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
      <Button onClick={reset}>Tentar Novamente</Button>
    </div>
  );
}
