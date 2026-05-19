import { Skeleton } from "@/components/ui/Skeleton";

export default function LaporanLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-32" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <Skeleton className="h-4 w-36" />
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={["flex items-center gap-4 px-5 py-3.5", i > 0 ? "border-t border-[var(--border)]" : ""].join(" ")}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-32 flex-1" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
