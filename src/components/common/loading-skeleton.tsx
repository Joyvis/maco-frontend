import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Carregando" className="flex h-screen">
      <div
        data-testid="loading-skeleton-sidebar"
        className="w-64 shrink-0 space-y-3 border-r p-4"
      >
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div
        data-testid="loading-skeleton-content"
        className="flex flex-1 flex-col"
      >
        <div
          data-testid="loading-skeleton-content-header"
          className="flex h-14 items-center justify-between border-b px-4"
        >
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
        <div
          data-testid="loading-skeleton-content-body"
          className="space-y-4 p-6"
        >
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
