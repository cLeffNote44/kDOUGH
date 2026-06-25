"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { moveRecipeToSlot } from "@/lib/actions";
import { toDateString } from "@/lib/dates";
import { DAYS, MEAL_TYPES } from "./meal-types";
import { useFocusTrap } from "@/components/useFocusTrap";

interface MoveMealModalProps {
  mealPlanId: string;
  recipeId: string;
  recipeTitle: string;
  sourceDate: string;
  sourceMealType: string;
  weekStart: string;
  /** Set of `${date}|${mealType}` slots that already have a meal. */
  occupied: Set<string>;
  onClose: () => void;
  onMoved: () => void;
}

/**
 * Keyboard- and touch-accessible alternative to HTML5 drag-and-drop for moving a
 * planned meal to another day/slot. Drag-and-drop does not work on touch devices
 * or via the keyboard, so this provides the same capability everywhere.
 */
export default function MoveMealModal({
  mealPlanId,
  recipeId,
  recipeTitle,
  sourceDate,
  sourceMealType,
  weekStart,
  occupied,
  onClose,
  onMoved,
}: MoveMealModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [moving, setMoving] = useState(false);
  useFocusTrap(modalRef, onClose);

  const startDate = new Date(weekStart + "T00:00:00");
  const dates = DAYS.map((_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return toDateString(d);
  });

  const handleMove = async (date: string, mealType: string) => {
    if (moving) return;
    setMoving(true);
    const result = await moveRecipeToSlot(mealPlanId, recipeId, date, mealType);
    setMoving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Meal moved");
    onMoved();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[55]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-meal-title"
        className="glass-strong rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col border border-slate-200/60 dark:border-slate-700/40"
      >
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/40 flex items-center justify-between">
          <h2 id="move-meal-title" className="font-display font-semibold text-slate-900 dark:text-slate-100 text-sm">
            Move <span className="text-teal-700 dark:text-teal-400">{recipeTitle}</span> to…
          </h2>
          <button
            onClick={onClose}
            aria-label="Cancel move"
            className="text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white text-lg"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {DAYS.map((dayLabel, i) => {
            const date = dates[i];
            return (
              <div key={date} className="flex items-center gap-2">
                <span className="w-9 shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {dayLabel}
                </span>
                <div className="flex flex-wrap gap-1">
                  {MEAL_TYPES.map((mt) => {
                    const isSource =
                      date === sourceDate && mt.key === sourceMealType;
                    const isOccupied = occupied.has(`${date}|${mt.key}`);
                    return (
                      <button
                        key={mt.key}
                        type="button"
                        disabled={isSource || moving}
                        onClick={() => handleMove(date, mt.key)}
                        aria-label={`Move to ${dayLabel} ${mt.label}${
                          isOccupied ? " (replaces existing meal)" : ""
                        }`}
                        className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSource
                            ? `${mt.bg} ${mt.accent} border-current/20`
                            : `border-slate-200 dark:border-slate-700 ${mt.accent} ${mt.hoverBg}`
                        } ${isOccupied && !isSource ? "ring-1 ring-inset ring-slate-300 dark:ring-slate-600" : ""}`}
                      >
                        {isSource ? "Current" : mt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2.5 border-t border-slate-200/60 dark:border-slate-700/40 text-center">
          <span className="text-[11px] text-slate-400 dark:text-slate-300">
            Outlined slots already have a meal and will be replaced.
          </span>
        </div>
      </div>
    </div>
  );
}
