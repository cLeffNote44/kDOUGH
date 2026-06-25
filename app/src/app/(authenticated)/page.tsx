import { createClient } from "@/lib/supabase/server";
import { getMonday, toDateString } from "@/lib/dates";
import WeeklyCalendar from "@/components/calendar/WeeklyCalendar";
import type { MealPlan } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const supabase = await createClient();

  const monday = getMonday(week);
  const mondayStr = toDateString(monday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayStr = toDateString(sunday);

  // Meal plans for the week (RLS scopes rows to the current user).
  const { data: mealPlansData } = await supabase
    .from("meal_plans")
    .select("*, recipes(*)")
    .gte("date", mondayStr)
    .lte("date", sundayStr)
    .order("date");

  // Boundary cast: DB types meal_type as plain string + ingredients as Json; the
  // app's MealPlan view-model narrows these (meal_type union, Ingredient[]).
  const mealPlans = (mealPlansData ?? []) as unknown as MealPlan[];

  // Determine header label
  const isCurrentWeek = mondayStr === toDateString(getMonday());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-display font-semibold text-slate-900 dark:text-slate-100">
          {isCurrentWeek ? "This Week" : "Week of"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {monday.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
          {" – "}
          {sunday.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
      <WeeklyCalendar mealPlans={mealPlans} weekStart={mondayStr} isCurrentWeek={isCurrentWeek} />
    </div>
  );
}
