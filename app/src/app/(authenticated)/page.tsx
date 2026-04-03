import { createClient } from "@/lib/supabase/server";
import { getMonday, toDateString } from "@/lib/dates";
import WeeklyCalendar from "@/components/calendar/WeeklyCalendar";
import StatsCards from "@/components/dashboard/StatsCards";

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
      const { data: list } = await supabase
        .from("grocery_lists")
        .select("id")
        .eq("week_start", mondayStr)
        .single();

      if (!list) return { count: 0 };

      const { count } = await supabase
        .from("grocery_items")
        .select("id", { count: "exact", head: true })
        .eq("list_id", list.id)
        .eq("checked", false);

      return { count: count ?? 0 };
    })(),
  ]);

  const mealPlans = mealPlansResult.data ?? [];
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
        <h1 className="text-xl font-display font-semibold text-stone-900 dark:text-stone-100">
          {isCurrentWeek ? "This Week" : "Week of"}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
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
      <WeeklyCalendar mealPlans={mealPlans} weekStart={mondayStr} />
    </div>
  );
}
