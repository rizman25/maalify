import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-[var(--bg-elevated)]", className)} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5", className)}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 px-5 py-3.5", className)}>
      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <Skeleton className="h-4 w-20 flex-shrink-0" />
    </div>
  );
}
