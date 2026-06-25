"use client";

import { useRouter } from "next/navigation";
import { toDateString } from "@/lib/dates";

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
    router.push(`/grocery?week=${toDateString(d)}`);
  };

  const nextWeek = () => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + 7);
    router.push(`/grocery?week=${toDateString(d)}`);
  };

  const goToThisWeek = () => {
    router.push("/grocery");
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={prevWeek}
        className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      >
        &larr; Prev
      </button>
      {isCurrentWeek ? (
        <span className="px-3 py-1.5 text-sm font-semibold text-teal-700 dark:text-teal-400">
          This Week
        </span>
      ) : (
        <button
          onClick={goToThisWeek}
          className="px-3 py-1.5 text-sm font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
        >
          Go to This Week
        </button>
      )}
      <button
        onClick={nextWeek}
        className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      >
        Next &rarr;
      </button>
    </div>
  );
}
