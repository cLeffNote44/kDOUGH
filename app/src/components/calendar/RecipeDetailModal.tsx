"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { Recipe, Ingredient } from "@/types";
import { scaleIngredients } from "@/lib/scale-recipe";
import ServingsAdjuster from "@/components/ServingsAdjuster";

interface RecipeDetailModalProps {
  recipe: Recipe;
  mealLabel: string;
  onClose: () => void;
  onChangeRecipe: () => void;
}

export default function RecipeDetailModal({
  recipe: r,
  mealLabel,
  onClose,
  onChangeRecipe,
}: RecipeDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [servings, setServings] = useState(r.servings > 0 ? r.servings : 1);

  // Scale ingredients when servings change
  const scaledIngredients = useMemo(
    () =>
      r.ingredients && r.ingredients.length > 0 && r.servings > 0
        ? scaleIngredients(r.ingredients as Ingredient[], r.servings, servings)
        : (r.ingredients as Ingredient[]) ?? [],
    [r.ingredients, r.servings, servings]
  );

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const totalTime =
    (r.prep_time ?? 0) + (r.cook_time ?? 0) > 0
      ? `${(r.prep_time ?? 0) + (r.cook_time ?? 0)} min total`
      : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="glass-strong rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col border border-stone-200/60 dark:border-stone-700/40"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200/60 dark:border-stone-700/40 flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-stone-900 dark:text-stone-100">{r.title}</h2>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{mealLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close recipe details"
            className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 text-lg"
          >
            &times;
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Recipe image */}
          {r.image_url && (
            <div className="rounded-lg overflow-hidden -mx-1">
              <img
                src={r.image_url}
                alt={r.title}
                className="w-full h-40 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {r.description && (
            <p className="text-sm text-stone-600 dark:text-stone-400">{r.description}</p>
          )}

          {/* Meta info + servings adjuster */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
            {r.servings > 0 && (
              <ServingsAdjuster value={servings} onChange={setServings} />
            )}
            {r.prep_time && <span>{r.prep_time} min prep</span>}
            {r.cook_time && <span>{r.cook_time} min cook</span>}
            {totalTime && (
              <span className="font-medium text-stone-700 dark:text-stone-300">{totalTime}</span>
            )}
          </div>

          {/* Tags */}
          {r.tags && r.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {r.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Ingredients (scaled) */}
          {scaledIngredients.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                  Ingredients
                </h3>
                {servings !== r.servings && r.servings > 0 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Scaled from {r.servings} to {servings}
                  </span>
                )}
              </div>
              <ul className="space-y-1">
                {scaledIngredients.map((ing, i) => (
                  <li key={`${ing.name}-${ing.quantity}-${i}`} className="text-sm text-stone-700 dark:text-stone-300">
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
          )}

          {/* Instructions */}
          {r.instructions && (
            <div>
              <h3 className="text-xs font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wide mb-2">
                Instructions
              </h3>
              <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                {r.instructions}
              </div>
            </div>
          )}

          {/* Source */}
          {r.source_url && (
            <div className="pt-3 border-t border-stone-200/60 dark:border-stone-700/40">
              <a
                href={r.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline"
              >
                View original recipe &rarr;
              </a>
            </div>
          )}
        </div>

        {/* Footer action */}
        <div className="p-3 border-t border-stone-200/60 dark:border-stone-700/40">
          <button
            onClick={onChangeRecipe}
            className="w-full py-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
          >
            Change recipe
          </button>
        </div>
      </div>
    </div>
  );
}
