import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function HutangLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-7 w-32" />
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
      </div>

      {/* Debt list */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} className={i > 0 ? "border-t border-[var(--border)]" : ""} />
        ))}
      </div>
    </div>
  );
}
