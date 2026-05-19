import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function DompetLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Total balance */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-9 w-44" />
      </div>

      {/* Wallet cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Transfer history */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonRow key={i} className={i > 0 ? "border-t border-[var(--border)]" : ""} />
        ))}
      </div>
    </div>
  );
}
