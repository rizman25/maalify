import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function TransaksiLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 sm:w-28 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Month nav + summary card */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-[var(--bg-elevated)] rounded-lg px-3 py-2.5 space-y-1.5">
              <Skeleton className="h-3 w-16 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Search + filter */}
      <div className="space-y-2.5">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <SkeletonRow key={i} className={i > 0 ? "border-t border-[var(--border)]" : ""} />
        ))}
      </div>
    </div>
  );
}
