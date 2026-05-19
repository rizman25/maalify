import { Skeleton, SkeletonCard, SkeletonRow } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
          <Skeleton className="h-4 w-48 mb-1" />
          <Skeleton className="h-3 w-32 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
          <Skeleton className="h-4 w-40 mb-1" />
          <Skeleton className="h-3 w-28 mb-4" />
          <div className="flex items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Anggaran + Hutang/Dompet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="space-y-4">
              {[0, 1, 2].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Savings Goals */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} className={i > 0 ? "border-t border-[var(--border)]" : ""} />
        ))}
      </div>
    </div>
  );
}
