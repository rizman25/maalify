import { Skeleton } from "@/components/ui/Skeleton";

export default function PengaturanLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Avatar section */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6">
        <div className="flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-8 w-24 rounded-lg mt-2" />
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 space-y-5">
        <Skeleton className="h-5 w-28" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Household section */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 space-y-4">
        <Skeleton className="h-5 w-36" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
