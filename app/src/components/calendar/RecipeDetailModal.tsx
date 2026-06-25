"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { Recipe, Ingredient } from "@/types";
import { scaleIngredients } from "@/lib/scale-recipe";
import ServingsAdjuster from "@/components/ServingsAdjuster";
import { useFocusTrap } from "@/components/useFocusTrap";

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
  const [hasImageError, setHasImageError] = useState(false);

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

  // Focus trap + Escape-to-close + focus restore.
  useFocusTrap(modalRef, onClose);

  const totalTime =
    (r.prep_time ?? 0) + (r.cook_time ?? 0) > 0
      ? `${(r.prep_time ?? 0) + (r.cook_time ?? 0)} min total`
      : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-detail-title"
        className="glass-strong rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col border border-slate-200/60 dark:border-slate-700/40"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/40 flex items-center justify-between">
          <div>
            <h2 id="recipe-detail-title" className="font-display font-semibold text-slate-900 dark:text-slate-100">{r.title}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{mealLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close recipe details"
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-lg"
          >
            &times;
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Recipe image */}
          {r.image_url && !hasImageError && (
            <div className="rounded-lg overflow-hidden -mx-1">
              <img
                src={r.image_url}
                alt={r.title}
                className="w-full h-40 object-cover"
                onError={() => setHasImageError(true)}
              />
            </div>
          )}

          {r.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{r.description}</p>
          )}

          {/* Meta info + servings adjuster */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {r.servings > 0 && (
              <ServingsAdjuster value={servings} onChange={setServings} />
            )}
            {r.prep_time && <span>{r.prep_time} min prep</span>}
            {r.cook_time && <span>{r.cook_time} min cook</span>}
            {totalTime && (
              <span className="font-medium text-slate-700 dark:text-slate-300">{totalTime}</span>
            )}
          </div>

          {/* Tags */}
          {r.tags && r.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {r.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full"
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
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Ingredients
                </h3>
                {servings !== r.servings && r.servings > 0 && (
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                    Scaled from {r.servings} to {servings}
                  </span>
                )}
              </div>
              <ul className="space-y-1">
                {scaledIngredients.map((ing, i) => (
                  <li key={`${ing.name}-${ing.quantity}-${i}`} className="text-sm text-slate-700 dark:text-slate-300">
                    {ing.quantity && (
                      <span className="font-medium">{ing.quantity}</span>
                    )}{" "}
                    {ing.unit && (
                      <span className="text-slate-500 dark:text-slate-400">{ing.unit}</span>
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
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2">
                Instructions
              </h3>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {r.instructions}
              </div>
            </div>
          )}

          {/* Source */}
          {r.source_url && (
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/40">
              <a
                href={r.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 underline"
              >
                View original recipe &rarr;
              </a>
            </div>
          )}
        </div>

        {/* Footer action */}
        <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/40">
          <button
            onClick={onChangeRecipe}
            className="w-full py-2 text-sm font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
          >
            Change recipe
          </button>
        </div>
      </div>
    </div>
  );
}
