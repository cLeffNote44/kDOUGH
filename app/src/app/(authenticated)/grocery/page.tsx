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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const monday = getMonday(week);
  const weekStart = toDateString(monday);

  // Fetch grocery list for the selected week. Explicit user_id filter as
  // defense-in-depth alongside RLS (matches the rest of the app).
  const { data: groceryList } = user
    ? await supabase
        .from("grocery_lists")
        .select("id, week_start")
        .eq("week_start", weekStart)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

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
          <h1 className="text-xl font-display font-semibold text-slate-900 dark:text-slate-100">Grocery List</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
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
        // key forces a fresh mount when the list changes (regenerate creates a
        // new id; week-nav changes the week) so the view re-seeds from server
        // data instead of showing stale optimistic state.
        <GroceryListView
          key={groceryList.id}
          items={items}
          listId={groceryList.id}
          recipeMap={recipeMap}
        />
      ) : (
        <div className="text-center py-16 glass rounded-xl border border-slate-200/60 dark:border-slate-700/40">
          <EmptyGroceryIllustration />
          <p className="text-slate-500 dark:text-slate-400 mb-2">No grocery list yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Plan your meals for the week, then hit &ldquo;Generate from
            Plan&rdquo; to create your shopping list.
          </p>
        </div>
      )}
    </div>
  );
}
