"use client";

import { useRouter } from "next/navigation";

export default function WeekNav({
  weekStart,
  isCurrentWeek,
}: {
  weekStart: string;
  isCurrentWeek: boolean;
}) {
  const router = useRouter();

  const prevWeek = () => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() - 7);
    const newStart = d.toISOString().split("T")[0];
    router.push(`/grocery?week=${newStart}`);
  };

  const nextWeek = () => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + 7);
    const newStart = d.toISOString().split("T")[0];
    router.push(`/grocery?week=${newStart}`);
  };

  const goToThisWeek = () => {
    router.push("/grocery");
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={prevWeek}
        className="px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
      >
        &larr; Prev
      </button>
      {!isCurrentWeek && (
        <button
          onClick={goToThisWeek}
          className="px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
        >
          This Week
        </button>
      )}
      <button
        onClick={nextWeek}
        className="px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
      >
        Next &rarr;
      </button>
    </div>
  );
}
