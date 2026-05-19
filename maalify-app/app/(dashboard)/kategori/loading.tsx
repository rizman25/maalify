import { Skeleton } from "@/components/ui/Skeleton";

export default function KategoriLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4 text-center space-y-2">
            <Skeleton className="h-6 w-8 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
      </div>
      {[0, 1].map(section => (
        <div key={section} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            <Skeleton className="h-3 w-36" />
          </div>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-[var(--border)]" : ""}`}>
              <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
