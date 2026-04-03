import { TOTAL_SLOTS } from "./meal-types";
import type { MealPlan } from "@/types";

interface WeekSummaryBarProps {
  mealPlans: MealPlan[];
}

export default function WeekSummaryBar({ mealPlans }: WeekSummaryBarProps) {
  const filled = mealPlans.length;
  const pct = Math.round((filled / TOTAL_SLOTS) * 100);

  return (
    <div className="glass rounded-xl border border-stone-200/60 dark:border-stone-700/40 p-3 mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
          Week Progress
        </span>
        <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          {filled} / {TOTAL_SLOTS} meals
        </span>
      </div>
      <div className="h-2 rounded-full bg-stone-200/60 dark:bg-stone-700/40 overflow-hidden">
        <div
          className="h-full rounded-full btn-gradient transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
