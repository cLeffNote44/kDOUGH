"use client";

interface ServingsAdjusterProps {
  value: number;
  onChange: (servings: number) => void;
  min?: number;
  max?: number;
}

export default function ServingsAdjuster({
  value,
  onChange,
  min = 1,
  max = 24,
}: ServingsAdjusterProps) {
  return (
    <div className="inline-flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-lg px-2 py-1">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease servings"
        className="w-6 h-6 flex items-center justify-center rounded-md text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        &minus;
      </button>
      <span className="text-sm font-medium text-stone-800 dark:text-stone-200 min-w-[3.5rem] text-center tabular-nums">
        {value} {value === 1 ? "serving" : "servings"}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase servings"
        className="w-6 h-6 flex items-center justify-center rounded-md text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        +
      </button>
    </div>
  );
}
