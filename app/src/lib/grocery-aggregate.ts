/**
 * Pure grocery-list aggregation logic, extracted from the generateGroceryList
 * server action so it can be unit-tested without a Supabase dependency.
 *
 * Lives in its own module (not actions.ts) because a `"use server"` file may
 * only export async server actions — these are synchronous helpers.
 */

import { categorizeIngredient, normalizeUnit, parseQuantity } from "@/lib/import/parser";
import { dimensionOf, toBase, fromBase, type Dimension } from "@/lib/units";

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

interface Acc {
  name: string;
  recipeIds: Set<string>;
  // Convertible (volume/weight) path: sum in the dimension's base unit.
  dimension: Dimension | null;
  baseSum: number;
  hasMeasured: boolean;
  // Literal path (countable/unitless units): sum the raw quantity.
  literalUnit: string;
  literalQty: number | null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Consolidate the ingredients of every planned recipe into grocery lines.
 *
 * Items keyed by ingredient name + measurement dimension: compatible volume
 * units (cup/tbsp/tsp/ml/…) sum together and format to one friendly unit, as do
 * compatible weight units (oz/lb/g/kg) — so "1 cup + 2 tbsp" or "1 lb + 8 oz"
 * become a single line. Countable/unitless units stay grouped by their literal
 * unit. Unmeasured amounts ("to taste") are kept as a presence flag (quantity
 * null) rather than fabricating a count.
 */
export function aggregateMealPlanIngredients(
  mealPlans: MealPlanWithRecipe[]
): AggregatedGroceryItem[] {
  const aggregated = new Map<string, Acc>();

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

      const lowerName =
        typeof ing.name === "string" ? ing.name.toLowerCase().trim() : "";
      if (!lowerName) continue;
      const displayName =
        typeof ing.name === "string" ? ing.name.trim() : lowerName;

      const unit = normalizeUnit(typeof ing.unit === "string" ? ing.unit : "");
      const qty = parseQuantity(
        typeof ing.quantity === "string" ? ing.quantity : String(ing.quantity ?? "")
      );
      const dim = dimensionOf(unit);

      if (dim) {
        const key = `${lowerName}|dim:${dim}`;
        const base = qty !== null ? toBase(qty, unit) ?? 0 : 0;
        const existing = aggregated.get(key);
        if (existing) {
          existing.baseSum += base;
          if (qty !== null) existing.hasMeasured = true;
          existing.recipeIds.add(recipeId);
        } else {
          aggregated.set(key, {
            name: displayName,
            recipeIds: new Set([recipeId]),
            dimension: dim,
            baseSum: base,
            hasMeasured: qty !== null,
            literalUnit: "",
            literalQty: null,
          });
        }
      } else {
        const key = `${lowerName}|${unit}`;
        const existing = aggregated.get(key);
        if (existing) {
          if (qty !== null) existing.literalQty = (existing.literalQty ?? 0) + qty;
          existing.recipeIds.add(recipeId);
        } else {
          aggregated.set(key, {
            name: displayName,
            recipeIds: new Set([recipeId]),
            dimension: null,
            baseSum: 0,
            hasMeasured: false,
            literalUnit: unit,
            literalQty: qty,
          });
        }
      }
    }
  }

  return Array.from(aggregated.values()).map((acc) => {
    const base = {
      name: acc.name,
      category: categorizeIngredient(acc.name),
      recipe_ids: Array.from(acc.recipeIds),
    };
    if (acc.dimension) {
      if (!acc.hasMeasured) {
        return { ...base, quantity: null, unit: null };
      }
      const { quantity, unit } = fromBase(acc.baseSum, acc.dimension);
      return { ...base, quantity: round2(quantity), unit };
    }
    return { ...base, quantity: acc.literalQty, unit: acc.literalUnit || null };
  });
}

