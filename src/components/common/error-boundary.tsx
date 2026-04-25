'use client';

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
      <button
        onClick={reset}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  );
}
