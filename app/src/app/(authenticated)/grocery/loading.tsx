export default function GroceryLoading() {
  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-28 bg-stone-200 dark:bg-stone-700 skeleton-shimmer rounded mb-1.5" />
          <div className="h-4 w-32 bg-stone-200 dark:bg-stone-700 skeleton-shimmer rounded" />
        </div>
        <div className="h-9 w-32 bg-stone-200 dark:bg-stone-700 skeleton-shimmer rounded-lg" />
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 w-16 bg-stone-200 dark:bg-stone-700 skeleton-shimmer rounded-lg" />
        <div className="h-8 w-16 bg-stone-200 dark:bg-stone-700 skeleton-shimmer rounded-lg" />
      </div>

      {/* Category sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white/80 dark:bg-stone-800/60 rounded-xl border border-stone-200/60 dark:border-stone-700/40 overflow-hidden mb-3"
        >
          <div className="px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200/60 dark:border-stone-700/40">
            <div className="h-3 w-20 bg-stone-200 dark:bg-stone-600 skeleton-shimmer rounded" />
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-700">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-700 skeleton-shimmer" />
                <div className="h-4 flex-1 bg-stone-200 dark:bg-stone-700 skeleton-shimmer rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
