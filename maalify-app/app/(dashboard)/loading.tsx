export default function DashboardLoading() {
  return (
    <div className="flex-1 p-4 lg:p-6 space-y-4 animate-pulse">

      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[var(--bg-elevated)] rounded-lg" />
          <div className="h-4 w-32 bg-[var(--bg-elevated)] rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-36 bg-[var(--bg-elevated)] rounded-lg" />
          <div className="h-9 w-28 bg-[var(--bg-elevated)] rounded-lg" />
        </div>
      </div>

      {/* Cards row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[var(--bg-elevated)] rounded" />
              <div className="w-8 h-8 bg-[var(--bg-elevated)] rounded-xl" />
            </div>
            <div className="h-7 w-28 bg-[var(--bg-elevated)] rounded-lg" />
            <div className="h-3 w-16 bg-[var(--bg-elevated)] rounded" />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart skeleton */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
          <div className="h-5 w-40 bg-[var(--bg-elevated)] rounded-lg" />
          <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded" />
          <div className="h-40 w-full bg-[var(--bg-elevated)] rounded-xl" />
        </div>

        {/* List skeleton */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
          <div className="h-5 w-36 bg-[var(--bg-elevated)] rounded-lg" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--bg-elevated)] rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 bg-[var(--bg-elevated)] rounded" />
                <div className="h-2.5 w-1/2 bg-[var(--bg-elevated)] rounded" />
              </div>
              <div className="h-4 w-16 bg-[var(--bg-elevated)] rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
        <div className="h-5 w-32 bg-[var(--bg-elevated)] rounded-lg" />
        <div className="h-px w-full bg-[var(--border)]" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-1">
            <div className="w-8 h-8 bg-[var(--bg-elevated)] rounded-full flex-shrink-0" />
            <div className="flex-1 h-3 bg-[var(--bg-elevated)] rounded" />
            <div className="h-3 w-20 bg-[var(--bg-elevated)] rounded" />
            <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded" />
          </div>
        ))}
      </div>

    </div>
  );
}
