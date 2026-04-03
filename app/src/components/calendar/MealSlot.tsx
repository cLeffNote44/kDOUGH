import type { MealTypeConfig } from "./meal-types";
import type { MealPlan } from "@/types";

export interface DragPayload {
  mealPlanId: string;
  recipeId: string;
  sourceDate: string;
  sourceMealType: string;
}

interface MealSlotProps {
  plan: MealPlan | undefined;
  mealType: MealTypeConfig;
  date: string;
  dayLabel: string;
  isRemoving: boolean;
  isDragSource: boolean;
  isDropTarget: boolean;
  isExpanded: boolean;
  onSlotClick: (plan: MealPlan) => void;
  onEmptyClick: () => void;
  onRemoveClick: (e: React.MouseEvent, plan: MealPlan) => void;
  onExpandToggle: () => void;
  // DnD handlers
  onDragStart?: (payload: DragPayload) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  // Expanded content (rendered below when isExpanded)
  expandedContent?: React.ReactNode;
}

export default function MealSlot({
  plan,
  mealType: mt,
  date,
  isRemoving,
  isDragSource,
  isDropTarget,
  isExpanded,
  onSlotClick,
  onEmptyClick,
  onRemoveClick,
  onExpandToggle,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  expandedContent,
}: MealSlotProps) {
  if (plan) {
    const prep = plan.recipes.prep_time;
    const cook = plan.recipes.cook_time;

    return (
      <div>
        <div
          className={`${mt.bg} rounded-lg p-1.5 group relative transition-all ${
            isDragSource ? "meal-slot-dragging" : ""
          } ${isDropTarget ? "meal-slot-drag-over" : ""} ${
            onDragStart ? "meal-slot-draggable" : ""
          }`}
          draggable={!!onDragStart}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", plan.id);
            onDragStart?.({
              mealPlanId: plan.id,
              recipeId: plan.recipe_id,
              sourceDate: date,
              sourceMealType: plan.meal_type,
            });
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            onDragOver?.(e);
          }}
          onDragLeave={onDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            onDrop?.(e);
          }}
          onDragEnd={onDragEnd}
        >
          <p className={`text-xs font-medium ${mt.text} truncate pr-5`}>
            {plan.recipes.title}
          </p>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] ${mt.accent}`}>{mt.label}</span>
            {/* C10: Visual meal indicators */}
            {prep != null && prep > 0 && (
              <span className={`flex items-center gap-0.5 ${mt.accent} opacity-70`}>
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[9px] hidden sm:inline">{prep}m</span>
              </span>
            )}
            {cook != null && cook > 0 && (
              <span className={`flex items-center gap-0.5 ${mt.accent} opacity-70`}>
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                </svg>
                <span className="text-[9px] hidden sm:inline">{cook}m</span>
              </span>
            )}
          </div>
          <button
            onClick={(e) => onRemoveClick(e, plan)}
            disabled={isRemoving}
            className={`absolute top-0.5 right-0.5 z-10 w-5 h-5 flex items-center justify-center ${mt.remove} sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-xs`}
            aria-label={`Remove ${plan.recipes.title} from plan`}
            title="Remove from plan"
            tabIndex={0}
          >
            &times;
          </button>
          {/* Click overlay for expand/detail */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpandToggle();
            }}
            className="absolute inset-0 rounded-lg"
            aria-label={`View details for ${plan.recipes.title}`}
            title="View details"
            tabIndex={0}
          />
        </div>
        {/* C9: Expanded content slot */}
        <div
          className={`transition-all duration-200 ease-in-out overflow-hidden ${
            isExpanded ? "max-h-48 opacity-100 mt-1.5" : "max-h-0 opacity-0"
          }`}
        >
          {expandedContent}
        </div>
      </div>
    );
  }

  // Empty slot
  return (
    <button
      onClick={onEmptyClick}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver?.(e);
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(e);
      }}
      className={`w-full flex items-center justify-center h-7 border border-dashed border-stone-200 dark:border-stone-700 ${mt.hoverBorder} ${mt.hoverBg} rounded-md transition-colors cursor-pointer ${
        isDropTarget ? "meal-slot-drag-over" : ""
      }`}
    >
      <span className={`text-[10px] ${mt.muted}`}>+ {mt.label}</span>
    </button>
  );
}
