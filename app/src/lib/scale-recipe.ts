/**
 * Scale ingredient quantities proportionally when adjusting servings.
 */

import type { Ingredient } from "@/types";
import { parseQuantity, formatQuantity } from "@/lib/import/parser";

/**
 * Scale a single ingredient's quantity by a multiplier.
 * Returns a new Ingredient with the adjusted quantity string.
 */
export function scaleIngredient(ing: Ingredient, multiplier: number): Ingredient {
  if (!ing.quantity || multiplier === 1) return ing;

  const parsed = parseQuantity(ing.quantity);
  if (parsed === 0) return ing;

  const scaled = parsed * multiplier;
  return {
    ...ing,
    quantity: formatQuantity(scaled),
  };
}

/**
 * Scale all ingredients for a recipe based on original/desired servings.
 */
export function scaleIngredients(
  ingredients: Ingredient[],
  originalServings: number,
  desiredServings: number
): Ingredient[] {
  if (originalServings <= 0 || desiredServings <= 0) return ingredients;
  if (originalServings === desiredServings) return ingredients;

  const multiplier = desiredServings / originalServings;
  return ingredients.map((ing) => scaleIngredient(ing, multiplier));
}
