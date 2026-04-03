import type { MealTypeConfig } from "./meal-types";
import type { MealPlan } from "@/types";

interface MealSlotExpandedProps {
  plan: MealPlan;
  mealType: MealTypeConfig;
  onChangeRecipe: () => void;
  onRemove: () => void;
  onViewFull: () => void;
}

export default function MealSlotExpanded({
  plan,
  mealType: mt,
  onChangeRecipe,
  onRemove,
  onViewFull,
}: MealSlotExpandedProps) {
  const recipe = plan.recipes;
  const prep = recipe.prep_time;
  const cook = recipe.cook_time;
  const tags = recipe.tags?.slice(0, 3) ?? [];

  return (
    <div className={`${mt.bg} rounded-lg p-2 space-y-1.5`}>
      {/* Description */}
      {recipe.description && (
        <p className={`text-[10px] leading-snug ${mt.text} opacity-80 line-clamp-2`}>
          {recipe.description}
        </p>
      )}

      {/* Time badges */}
      {(prep || cook) && (
        <div className="flex items-center gap-2">
          {prep != null && prep > 0 && (
            <span className={`flex items-center gap-1 text-[10px] ${mt.accent}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Prep {prep}m
            </span>
          )}
          {cook != null && cook > 0 && (
            <span className={`flex items-center gap-1 text-[10px] ${mt.accent}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
              </svg>
              Cook {cook}m
            </span>
          )}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`text-[9px] px-1.5 py-0.5 rounded-full ${mt.bg} ${mt.accent} border border-current/10`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1.5 pt-0.5">
        <button
          onClick={onChangeRecipe}
          className={`flex-1 text-[10px] font-medium py-1 rounded-md ${mt.accent} hover:underline`}
        >
          Change
        </button>
        <button
          onClick={onRemove}
          className="flex-1 text-[10px] font-medium py-1 rounded-md text-red-500 hover:underline"
        >
          Remove
        </button>
        <button
          onClick={onViewFull}
          className={`flex-1 text-[10px] font-medium py-1 rounded-md ${mt.accent} hover:underline`}
        >
          Full Recipe
        </button>
      </div>
    </div>
  );
}
