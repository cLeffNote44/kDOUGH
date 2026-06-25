export default function RecipesLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded skeleton-shimmer" />
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg skeleton-shimmer" />
          <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg skeleton-shimmer" />
        </div>
      </div>

      {/* Search bar */}
      <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-lg mb-6 skeleton-shimmer" />

      {/* Recipe grid — matches new RecipeCard layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden"
          >
            {/* Color stripe */}
            <div className="h-1 bg-slate-200 dark:bg-slate-700 skeleton-shimmer" />
            {/* Image placeholder */}
            <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 skeleton-shimmer" />
            {/* Body */}
            <div className="p-4">
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-2 skeleton-shimmer" />
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-3 skeleton-shimmer" />
              <div className="flex gap-2">
                <div className="h-5 w-12 bg-slate-100 dark:bg-slate-700/60 rounded-full skeleton-shimmer" />
                <div className="h-5 w-16 bg-slate-100 dark:bg-slate-700/60 rounded-full skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
