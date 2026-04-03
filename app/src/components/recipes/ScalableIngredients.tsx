"use client";

import { useState, useMemo } from "react";
import type { Ingredient } from "@/types";
import { scaleIngredients } from "@/lib/scale-recipe";
import ServingsAdjuster from "@/components/ServingsAdjuster";

interface ScalableIngredientsProps {
  ingredients: Ingredient[];
  originalServings: number;
}

export default function ScalableIngredients({
  ingredients,
  originalServings,
}: ScalableIngredientsProps) {
  const [servings, setServings] = useState(
    originalServings > 0 ? originalServings : 1
  );

  const scaled = useMemo(
    () =>
      originalServings > 0
        ? scaleIngredients(ingredients, originalServings, servings)
        : ingredients,
    [ingredients, originalServings, servings]
  );

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
          Ingredients
        </h2>
        {originalServings > 0 && (
          <ServingsAdjuster value={servings} onChange={setServings} />
        )}
      </div>
      {servings !== originalServings && originalServings > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
          Scaled from {originalServings} to {servings} servings
        </p>
      )}
      <ul className="space-y-1.5">
        {scaled.map((ing, i) => (
          <li key={`${ing.name}-${ing.quantity}-${i}`} className="text-stone-700 dark:text-stone-300">
            {ing.quantity && (
              <span className="font-medium">{ing.quantity}</span>
            )}{" "}
            {ing.unit && (
              <span className="text-stone-500 dark:text-stone-400">{ing.unit}</span>
            )}{" "}
            {ing.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
