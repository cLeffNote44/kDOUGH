export type MealTypeKey = "breakfast" | "snack" | "lunch" | "dinner" | "dessert";

export interface MealTypeConfig {
  key: MealTypeKey;
  label: string;
  bg: string;
  text: string;
  accent: string;
  muted: string;
  remove: string;
  hoverBorder: string;
  hoverBg: string;
}

export const MEAL_TYPES: MealTypeConfig[] = [
  {
    key: "breakfast",
    label: "Breakfast",
    bg: "bg-sky-100 dark:bg-sky-900/40",
    text: "text-sky-900 dark:text-sky-200",
    accent: "text-sky-600 dark:text-sky-400",
    muted: "text-sky-400 dark:text-sky-600",
    remove: "text-sky-400 hover:text-red-500",
    hoverBorder: "hover:border-sky-300 dark:hover:border-sky-700",
    hoverBg: "hover:bg-sky-50/50 dark:hover:bg-sky-900/20",
  },
  {
    key: "snack",
    label: "Snack",
    bg: "bg-violet-100 dark:bg-violet-900/40",
    text: "text-violet-900 dark:text-violet-200",
    accent: "text-violet-600 dark:text-violet-400",
    muted: "text-violet-400 dark:text-violet-600",
    remove: "text-violet-400 hover:text-red-500",
    hoverBorder: "hover:border-violet-300 dark:hover:border-violet-700",
    hoverBg: "hover:bg-violet-50/50 dark:hover:bg-violet-900/20",
  },
  {
    key: "lunch",
    label: "Lunch",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-900 dark:text-emerald-200",
    accent: "text-emerald-600 dark:text-emerald-400",
    muted: "text-emerald-400 dark:text-emerald-600",
    remove: "text-emerald-400 hover:text-red-500",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
    hoverBg: "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20",
  },
  {
    key: "dinner",
    label: "Dinner",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-900 dark:text-amber-200",
    accent: "text-amber-600 dark:text-amber-400",
    muted: "text-amber-400 dark:text-amber-600",
    remove: "text-amber-400 hover:text-red-500",
    hoverBorder: "hover:border-amber-300 dark:hover:border-amber-700",
    hoverBg: "hover:bg-amber-50/50 dark:hover:bg-amber-900/20",
  },
  {
    key: "dessert",
    label: "Dessert",
    bg: "bg-rose-100 dark:bg-rose-900/40",
    text: "text-rose-900 dark:text-rose-200",
    accent: "text-rose-600 dark:text-rose-400",
    muted: "text-rose-400 dark:text-rose-600",
    remove: "text-rose-400 hover:text-red-500",
    hoverBorder: "hover:border-rose-300 dark:hover:border-rose-700",
    hoverBg: "hover:bg-rose-50/50 dark:hover:bg-rose-900/20",
  },
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const TOTAL_SLOTS = DAYS.length * MEAL_TYPES.length; // 35
