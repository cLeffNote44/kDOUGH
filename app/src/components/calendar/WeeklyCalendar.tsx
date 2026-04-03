"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeRecipeFromDay, moveRecipeToSlot } from "@/lib/actions";
import { getMonday, toDateString } from "@/lib/dates";
import type { MealPlan } from "@/types";
import { DAYS, MEAL_TYPES } from "./meal-types";
import type { DragPayload } from "./MealSlot";
import DayCard from "./DayCard";
import MealSlotExpanded from "./MealSlotExpanded";
import WeekSummaryBar from "./WeekSummaryBar";
import RecipePicker from "./RecipePicker";
import RecipeDetailModal from "./RecipeDetailModal";

interface WeeklyCalendarProps {
  mealPlans: MealPlan[];
  weekStart: string;
}

export default function WeeklyCalendar({ mealPlans, weekStart }: WeeklyCalendarProps) {
  // Picker / detail state
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [pickerDay, setPickerDay] = useState("");
  const [pickerMealType, setPickerMealType] = useState("dinner");
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; title: string; mealLabel: string } | null>(null);
  const [detailPlan, setDetailPlan] = useState<{ plan: MealPlan; mealLabel: string; date: string; dayLabel: string; mealType: string } | null>(null);

  // C9: Expansion state
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);

  // C8: Drag & drop state
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [dropTarget, setDropTarget] = useState<{ date: string; mealType: string } | null>(null);

  const router = useRouter();

  // Escape key closes confirm dialog
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && confirmRemove) {
      e.preventDefault();
      setConfirmRemove(null);
    }
  }, [confirmRemove]);

  useEffect(() => {
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [handleEscapeKey]);

  // Build planMap: date → meal_type → plan
  const planMap = new Map<string, Map<string, MealPlan>>();
  for (const plan of mealPlans) {
    if (!planMap.has(plan.date)) {
      planMap.set(plan.date, new Map());
    }
    planMap.get(plan.date)!.set(plan.meal_type, plan);
  }

  // Generate 7 dates
  const startDate = new Date(weekStart + "T00:00:00");
  const dates = DAYS.map((_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return toDateString(d);
  });

  const today = toDateString(new Date());

  // ── Handlers ──────────────────────────────────

  const handleRemoveClick = (e: React.MouseEvent, plan: MealPlan, mealLabel: string) => {
    e.stopPropagation();
    setConfirmRemove({ id: plan.id, title: plan.recipes?.title ?? "Untitled", mealLabel });
  };

  const confirmAndRemove = async () => {
    if (!confirmRemove) return;
    setRemoving(confirmRemove.id);
    setConfirmRemove(null);
    setExpandedSlot(null);
    const result = await removeRecipeFromDay(confirmRemove.id);
    setRemoving(null);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Meal removed");
    router.refresh();
  };

  const openPicker = (date: string, dayLabel: string, mealType: string) => {
    setPickerDate(date);
    setPickerDay(dayLabel);
    setPickerMealType(mealType);
  };

  // Week navigation
  const prevWeek = () => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() - 7);
    router.push(`/?week=${toDateString(d)}`);
  };

  const nextWeek = () => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + 7);
    router.push(`/?week=${toDateString(d)}`);
  };

  // C9: Toggle expansion
  const handleExpandToggle = (slotKey: string) => {
    if (dragPayload) return; // Don't toggle during drag
    setExpandedSlot((prev) => (prev === slotKey ? null : slotKey));
  };

  // C8: DnD handlers
  const handleDragStart = (payload: DragPayload) => {
    setDragPayload(payload);
    setExpandedSlot(null); // Collapse any expanded slot
  };

  const handleDragOver = (date: string, mealType: string) => {
    setDropTarget({ date, mealType });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (date: string, mealType: string) => {
    if (!dragPayload) return;

    // Same slot — no-op
    if (dragPayload.sourceDate === date && dragPayload.sourceMealType === mealType) {
      setDragPayload(null);
      setDropTarget(null);
      return;
    }

    setDropTarget(null);
    setDragPayload(null);

    await moveRecipeToSlot(dragPayload.mealPlanId, dragPayload.recipeId, date, mealType);
    toast.success("Meal moved");
    router.refresh();
  };

  const handleDragEnd = () => {
    setDragPayload(null);
    setDropTarget(null);
  };

  // C9: Render expanded content for a slot
  const renderExpanded = (plan: MealPlan, mealLabel: string, date: string, dayLabel: string, mealType: string) => {
    const mt = MEAL_TYPES.find((m) => m.key === mealType)!;
    return (
      <MealSlotExpanded
        plan={plan}
        mealType={mt}
        onChangeRecipe={() => {
          setExpandedSlot(null);
          openPicker(date, dayLabel, mealType);
        }}
        onRemove={() => {
          setExpandedSlot(null);
          setConfirmRemove({ id: plan.id, title: plan.recipes.title, mealLabel });
        }}
        onViewFull={() => {
          setExpandedSlot(null);
          setDetailPlan({ plan, mealLabel, date, dayLabel, mealType });
        }}
      />
    );
  };

  const isCurrentWeek = weekStart === toDateString(getMonday());

  return (
    <>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevWeek}
          className="px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
        >
          &larr; Prev
        </button>
        {!isCurrentWeek && (
          <button
            onClick={() => router.push("/")}
            className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
          >
            Today
          </button>
        )}
        <button
          onClick={nextWeek}
          className="px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
        >
          Next &rarr;
        </button>
      </div>

      {/* C11: Week summary bar */}
      <WeekSummaryBar mealPlans={mealPlans} />

      {/* Empty week CTA */}
      {mealPlans.length === 0 && (
        <div className="text-center py-6 mb-4 glass rounded-xl border border-stone-200/60 dark:border-stone-700/40">
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-1">
            No meals planned this week yet.
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Tap an empty slot below to start adding recipes.
          </p>
        </div>
      )}

      {/* Calendar grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {DAYS.map((dayLabel, i) => {
          const date = dates[i];

          return (
            <DayCard
              key={date}
              date={date}
              dayLabel={dayLabel}
              isToday={date === today}
              dayPlans={planMap.get(date)}
              removing={removing}
              expandedSlot={expandedSlot}
              dragSourceId={dragPayload?.mealPlanId ?? null}
              dropTarget={dropTarget}
              onSlotClick={(plan, mealLabel, d, dl, mt) =>
                setDetailPlan({ plan, mealLabel, date: d, dayLabel: dl, mealType: mt })
              }
              onEmptyClick={(d, dl, mt) => openPicker(d, dl, mt)}
              onRemoveClick={handleRemoveClick}
              onExpandToggle={handleExpandToggle}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              renderExpanded={renderExpanded}
            />
          );
        })}
      </div>

      {/* Remove confirmation dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-strong rounded-xl shadow-lg w-full max-w-xs mx-4 p-5 border border-stone-200/60 dark:border-stone-700/40">
            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-100 mb-1">Remove meal?</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              Remove <span className="font-medium text-stone-700 dark:text-stone-300">{confirmRemove.title}</span> from {confirmRemove.mealLabel.toLowerCase()}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndRemove}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe detail modal */}
      {detailPlan && (
        <RecipeDetailModal
          recipe={detailPlan.plan.recipes}
          mealLabel={detailPlan.mealLabel}
          onClose={() => setDetailPlan(null)}
          onChangeRecipe={() => {
            const { date, dayLabel, mealType } = detailPlan;
            setDetailPlan(null);
            openPicker(date, dayLabel, mealType);
          }}
        />
      )}

      {/* Recipe picker modal */}
      {pickerDate && (
        <RecipePicker
          date={pickerDate}
          dayLabel={pickerDay}
          mealType={pickerMealType}
          onClose={() => {
            setPickerDate(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
