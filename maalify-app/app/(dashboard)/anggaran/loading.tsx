import { Skeleton } from "@/components/ui/Skeleton";

export default function AnggaranLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>

      {/* Budget list */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
