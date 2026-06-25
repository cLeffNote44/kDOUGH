import { TOTAL_SLOTS } from "./meal-types";
import type { MealPlan } from "@/types";

interface WeekSummaryBarProps {
  mealPlans: MealPlan[];
}

export default function WeekSummaryBar({ mealPlans }: WeekSummaryBarProps) {
  const filled = mealPlans.length;
  const pct = Math.round((filled / TOTAL_SLOTS) * 100);

  return (
    <div className="glass rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-3 mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Week Progress
        </span>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {filled} / {TOTAL_SLOTS} meals
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200/60 dark:bg-slate-700/40 overflow-hidden">
        <div
          className="h-full rounded-full btn-gradient transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
