export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getMonday, toDateString } from "@/lib/dates";
import GroceryListView from "@/components/grocery/GroceryListView";
import GenerateButton from "@/components/grocery/GenerateButton";
import WeekNav from "@/components/grocery/WeekNav";
import type { GroceryItem } from "@/types";
import { EmptyGroceryIllustration } from "@/components/ui/EmptyStateIllustrations";

export default async function GroceryPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const supabase = await createClient();

  const monday = getMonday(week);
  const weekStart = toDateString(monday);

  // Fetch grocery list for the selected week
  const { data: groceryList } = await supabase
    .from("grocery_lists")
    .select("id, week_start")
    .eq("week_start", weekStart)
    .single();

  let items: GroceryItem[] = [];
  if (groceryList) {
    const { data } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("list_id", groceryList.id)
      .order("category")
      .order("name");

    items = (data as GroceryItem[]) || [];
  }

  // Fetch recipe titles for sort-by-recipe grouping
  const allRecipeIds = [...new Set(items.flatMap((i) => i.recipe_ids))];
  let recipeMap: Record<string, string> = {};
  if (allRecipeIds.length > 0) {
    const { data: recipes } = await supabase
      .from("recipes")
      .select("id, title")
      .in("id", allRecipeIds);
    recipeMap = Object.fromEntries(
      (recipes ?? []).map((r) => [r.id, r.title])
    );
  }

  // Calculate week range for display
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const isCurrentWeek = weekStart === toDateString(getMonday());

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-semibold text-stone-900 dark:text-stone-100">Grocery List</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {monday.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            {" – "}
            {sunday.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <GenerateButton
          weekStart={weekStart}
          hasExistingList={!!groceryList}
        />
      </div>

      <WeekNav weekStart={weekStart} isCurrentWeek={isCurrentWeek} />

      {groceryList && items.length > 0 ? (
        <GroceryListView items={items} listId={groceryList.id} recipeMap={recipeMap} />
      ) : (
        <div className="text-center py-16 glass rounded-xl border border-stone-200/60 dark:border-stone-700/40">
          <EmptyGroceryIllustration />
          <p className="text-stone-500 dark:text-stone-400 mb-2">No grocery list yet</p>
          <p className="text-sm text-stone-400 dark:text-stone-500">
            Plan your meals for the week, then hit &ldquo;Generate from
            Plan&rdquo; to create your shopping list.
          </p>
        </div>
      )}
    </div>
  );
}
