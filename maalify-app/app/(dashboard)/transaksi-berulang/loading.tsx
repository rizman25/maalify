import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function TransaksiBerulangLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonRow key={i} className={i > 0 ? "border-t border-[var(--border)]" : ""} />
        ))}
      </div>
    </div>
  );
}
