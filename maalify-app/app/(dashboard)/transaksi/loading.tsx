import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function TransaksiLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-9 flex-1 min-w-[140px] rounded-lg" />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <SkeletonRow key={i} className={i > 0 ? "border-t border-[var(--border)]" : ""} />
        ))}
      </div>
    </div>
  );
}
