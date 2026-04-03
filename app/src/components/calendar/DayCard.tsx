import { MEAL_TYPES } from "./meal-types";
import MealSlot from "./MealSlot";
import type { DragPayload } from "./MealSlot";
import type { MealPlan } from "@/types";

interface DayCardProps {
  date: string;
  dayLabel: string;
  isToday: boolean;
  dayPlans: Map<string, MealPlan> | undefined;
  removing: string | null;
  expandedSlot: string | null;
  dragSourceId: string | null;
  dropTarget: { date: string; mealType: string } | null;
  onSlotClick: (plan: MealPlan, mealLabel: string, date: string, dayLabel: string, mealType: string) => void;
  onEmptyClick: (date: string, dayLabel: string, mealType: string) => void;
  onRemoveClick: (e: React.MouseEvent, plan: MealPlan, mealLabel: string) => void;
  onExpandToggle: (slotKey: string) => void;
  onDragStart: (payload: DragPayload) => void;
  onDragOver: (date: string, mealType: string) => void;
  onDragLeave: () => void;
  onDrop: (date: string, mealType: string) => void;
  onDragEnd: () => void;
  renderExpanded: (plan: MealPlan, mealLabel: string, date: string, dayLabel: string, mealType: string) => React.ReactNode;
}

export default function DayCard({
  date,
  dayLabel,
  isToday,
  dayPlans,
  removing,
  expandedSlot,
  dragSourceId,
  dropTarget,
  onSlotClick,
  onEmptyClick,
  onRemoveClick,
  onExpandToggle,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  renderExpanded,
}: DayCardProps) {
  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        isToday
          ? "border-amber-300/60 dark:border-amber-600/40 bg-amber-50/80 dark:bg-amber-950/30 glass"
          : "border-stone-200/60 dark:border-stone-700/40 glass"
      } card-hover-lift`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${
            isToday ? "text-amber-700 dark:text-amber-400" : "text-stone-400 dark:text-stone-500"
          }`}
        >
          {dayLabel}
        </span>
        <span
          className={`text-xs ${
            isToday ? "text-amber-600 dark:text-amber-400 font-medium" : "text-stone-400 dark:text-stone-500"
          }`}
        >
          {(() => {
            const d = new Date(date + "T00:00:00");
            const day = d.getDate();
            // Show month abbreviation on the 1st or on Mondays
            if (day === 1 || d.getDay() === 1) {
              return `${d.toLocaleDateString("en-US", { month: "short" })} ${day}`;
            }
            return day;
          })()}
        </span>
      </div>

      <div className="space-y-1.5">
        {MEAL_TYPES.map((mt) => {
          const plan = dayPlans?.get(mt.key);
          const slotKey = `${date}|${mt.key}`;

          return (
            <MealSlot
              key={mt.key}
              plan={plan}
              mealType={mt}
              date={date}
              dayLabel={dayLabel}
              isRemoving={plan ? removing === plan.id : false}
              isDragSource={plan ? dragSourceId === plan.id : false}
              isDropTarget={dropTarget?.date === date && dropTarget?.mealType === mt.key}
              isExpanded={expandedSlot === slotKey}
              onSlotClick={(p) => onSlotClick(p, mt.label, date, dayLabel, mt.key)}
              onEmptyClick={() => onEmptyClick(date, dayLabel, mt.key)}
              onRemoveClick={(e, p) => onRemoveClick(e, p, mt.label)}
              onExpandToggle={() => onExpandToggle(slotKey)}
              onDragStart={onDragStart}
              onDragOver={() => onDragOver(date, mt.key)}
              onDragLeave={onDragLeave}
              onDrop={() => onDrop(date, mt.key)}
              onDragEnd={onDragEnd}
              expandedContent={
                plan ? renderExpanded(plan, mt.label, date, dayLabel, mt.key) : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
