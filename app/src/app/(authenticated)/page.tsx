import { createClient } from "@/lib/supabase/server";
import { getMonday, toDateString } from "@/lib/dates";
import WeeklyCalendar from "@/components/calendar/WeeklyCalendar";
import StatsCards from "@/components/dashboard/StatsCards";
import type { MealPlan } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const monday = getMonday(week);
  const mondayStr = toDateString(monday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayStr = toDateString(sunday);

  // Run all queries in parallel
  const [mealPlansResult, recipesResult, groceryResult] = await Promise.all([
    // Meal plans for the week
    supabase
      .from("meal_plans")
      .select("*, recipes(*)")
      .gte("date", mondayStr)
      .lte("date", sundayStr)
      .order("date"),

    // Total recipe count
    supabase
      .from("recipes")
      .select("id", { count: "exact", head: true }),

    // Unchecked grocery items for current week
    (async () => {
      if (!user) return { count: 0 };
      const { data: list } = await supabase
        .from("grocery_lists")
        .select("id")
        .eq("week_start", mondayStr)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!list) return { count: 0 };

      const { count } = await supabase
        .from("grocery_items")
        .select("id", { count: "exact", head: true })
        .eq("list_id", list.id)
        .eq("checked", false);

      return { count: count ?? 0 };
    })(),
  ]);

  // Boundary cast: DB types meal_type as plain string + ingredients as Json; the
  // app's MealPlan view-model narrows these (meal_type union, Ingredient[]).
  const mealPlans = (mealPlansResult.data ?? []) as unknown as MealPlan[];
  const recipeCount = recipesResult.count ?? 0;
  const groceryRemaining = groceryResult.count ?? 0;

  // Determine header label
  const isCurrentWeek = mondayStr === toDateString(getMonday());

  return (
    <div>
      <StatsCards
        recipeCount={recipeCount}
        mealsPlanned={mealPlans.length}
        groceryRemaining={groceryRemaining}
      />
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
