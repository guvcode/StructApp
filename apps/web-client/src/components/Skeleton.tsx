interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
  width?: string;
  height?: string;
  count?: number;
}

export default function Skeleton({ className = '', variant = 'rect', width, height, count = 1 }: SkeletonProps) {
  const base = 'animate-shimmer rounded-md';
  const shape = variant === 'circle' ? 'rounded-full' : variant === 'text' ? 'rounded h-4' : 'rounded-md';

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={`${base} ${shape} ${className}`}
          style={{ width, height }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface-elevated rounded-lg border border-border/50 p-6 space-y-3 shadow-card">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex gap-3 items-center">
        <Skeleton className="h-8 w-8" variant="circle" />
        <Skeleton className="h-6 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface-elevated rounded-lg border border-border/50 p-6 space-y-3 shadow-card">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="bg-surface-elevated rounded-lg border border-border/50 p-6 space-y-3 shadow-card">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
