export default function Loading() {
  return (
    <div>
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-stone-200/60 dark:border-stone-700/40 bg-white/60 dark:bg-stone-800/40 p-3 sm:p-4"
          >
            <div className="w-8 h-8 bg-stone-200 dark:bg-stone-700 rounded-lg mb-2 skeleton-shimmer" />
            <div className="h-7 w-10 bg-stone-200 dark:bg-stone-700 rounded mb-1 skeleton-shimmer" />
            <div className="h-3 w-16 bg-stone-200 dark:bg-stone-700 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-28 bg-stone-200 dark:bg-stone-700 rounded skeleton-shimmer" />
        <div className="h-4 w-36 bg-stone-200 dark:bg-stone-700 rounded skeleton-shimmer" />
      </div>

      {/* Summary bar skeleton */}
      <div className="flex items-center gap-3 mb-4 glass rounded-xl border border-stone-200/60 dark:border-stone-700/40 p-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-16 bg-stone-200 dark:bg-stone-700 rounded skeleton-shimmer" />
        ))}
      </div>

      {/* Week navigation skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 w-16 bg-stone-200 dark:bg-stone-700 rounded-lg skeleton-shimmer" />
        <div className="h-8 w-16 bg-stone-200 dark:bg-stone-700 rounded-lg skeleton-shimmer" />
      </div>

      {/* Calendar grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-stone-200/60 dark:border-stone-700/40 bg-white/80 dark:bg-stone-800/60 p-3 min-h-[100px] sm:min-h-[140px]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-8 bg-stone-200 dark:bg-stone-700 rounded skeleton-shimmer" />
              <div className="h-3 w-4 bg-stone-200 dark:bg-stone-700 rounded skeleton-shimmer" />
            </div>
            <div className="space-y-1.5">
              <div className="h-7 bg-stone-100 dark:bg-stone-800 rounded-lg skeleton-shimmer" />
              <div className="h-7 bg-stone-100 dark:bg-stone-800 rounded-lg skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
