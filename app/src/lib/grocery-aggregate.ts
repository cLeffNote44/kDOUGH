/**
 * Pure grocery-list aggregation logic, extracted from the generateGroceryList
 * server action so it can be unit-tested without a Supabase dependency.
 *
 * Lives in its own module (not actions.ts) because a `"use server"` file may
 * only export async server actions — these are synchronous helpers.
 */

import { categorizeIngredient, normalizeUnit, parseQuantity } from "@/lib/import/parser";

/** A meal-plan row with its joined recipe (shape mirrors Supabase's select). */
export interface MealPlanWithRecipe {
  recipes?: unknown;
  [key: string]: unknown;
}

/** One consolidated grocery line, ready to be written to grocery_items. */
export interface AggregatedGroceryItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  recipe_ids: string[];
}

/**
 * Consolidate the ingredients of every planned recipe into grocery lines.
 *
 * Items are keyed by `${normalizedName}|${normalizedUnit}` so the same
 * ingredient in compatible units merges while different units stay separate.
 * Measured quantities are summed; unmeasured amounts ("to taste", "a pinch" →
 * parseQuantity returns null) are kept as a presence flag (quantity null)
 * rather than fabricating a count.
 */
export function aggregateMealPlanIngredients(
  mealPlans: MealPlanWithRecipe[]
): AggregatedGroceryItem[] {
  const aggregated = new Map<
    string,
    { name: string; totalQty: number | null; unit: string; recipeIds: Set<string> }
  >();

  for (const plan of mealPlans) {
    const recipe =
      plan.recipes && typeof plan.recipes === "object"
        ? (plan.recipes as Record<string, unknown>)
        : null;
    if (!recipe) continue;

    const recipeId = typeof recipe.id === "string" ? recipe.id : null;
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    if (!recipeId || ingredients.length === 0) continue;

    for (const raw of ingredients) {
      const ing =
        typeof raw === "object" && raw !== null
          ? (raw as Record<string, unknown>)
          : null;
      if (!ing) continue;

      const name = typeof ing.name === "string" ? ing.name.toLowerCase().trim() : "";
      if (!name) continue;

      const unit = normalizeUnit(typeof ing.unit === "string" ? ing.unit : "");
      const key = `${name}|${unit}`;
      const qty = parseQuantity(
        typeof ing.quantity === "string" ? ing.quantity : String(ing.quantity ?? "")
      );

      const existing = aggregated.get(key);
      if (existing) {
        // Only sum real measured amounts so multiple unmeasured staples don't
        // inflate to nonsense like "2 salt".
        if (qty !== null) existing.totalQty = (existing.totalQty ?? 0) + qty;
        existing.recipeIds.add(recipeId);
      } else {
        aggregated.set(key, {
          name: typeof ing.name === "string" ? ing.name.trim() : name,
          totalQty: qty,
          unit,
          recipeIds: new Set([recipeId]),
        });
      }
    }
  }

  return Array.from(aggregated.values()).map((item) => ({
    name: item.name,
    quantity: item.totalQty,
    unit: item.unit || null,
    category: categorizeIngredient(item.name),
    recipe_ids: Array.from(item.recipeIds),
  }));
}
