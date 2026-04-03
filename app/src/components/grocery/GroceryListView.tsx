"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { toggleGroceryItem, removeGroceryItem } from "@/lib/actions";
import type { GroceryItem } from "@/types";
import AddItemForm from "./AddItemForm";
import SwipeableItem from "./SwipeableItem";

// Display order for categories (matches typical store layout)
const CATEGORY_ORDER = [
  "produce",
  "meat",
  "dairy",
  "bakery",
  "frozen",
  "pantry",
  "spices",
  "other",
];

const CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  meat: "Meat & Seafood",
  dairy: "Dairy & Eggs",
  bakery: "Bakery",
  frozen: "Frozen",
  pantry: "Pantry",
  spices: "Spices & Seasonings",
  other: "Other",
};

const CATEGORY_ICONS: Record<string, string> = {
  produce: "🥬",
  meat: "🥩",
  dairy: "🧀",
  bakery: "🍞",
  frozen: "🧊",
  pantry: "🥫",
  spices: "🧂",
  other: "📦",
};

function formatItemDisplay(item: GroceryItem): string {
  const parts: string[] = [];
  if (item.quantity && item.quantity !== 1) {
    // Format nicely
    const q = item.quantity;
    if (q === Math.floor(q)) {
      parts.push(q.toString());
    } else {
      parts.push(q.toFixed(1).replace(/\.0$/, ""));
    }
  }
  if (item.unit) {
    parts.push(item.unit);
  }
  parts.push(item.name);
  return parts.join(" ");
}

type SortMode = "category" | "alpha" | "recipe";

function groupItems(
  items: GroceryItem[],
  mode: SortMode,
  recipeMap: Record<string, string>
): { key: string; label: string; icon?: string; items: GroceryItem[] }[] {
  if (mode === "alpha") {
    const byLetter = new Map<string, GroceryItem[]>();
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    for (const item of sorted) {
      const letter = item.name[0]?.toUpperCase() || "#";
      if (!byLetter.has(letter)) byLetter.set(letter, []);
      byLetter.get(letter)!.push(item);
    }
    return Array.from(byLetter.entries()).map(([letter, items]) => ({
      key: letter,
      label: letter,
      items,
    }));
  }

  if (mode === "recipe") {
    const byRecipe = new Map<string, GroceryItem[]>();
    for (const item of items) {
      if (item.recipe_ids.length > 0) {
        // Group under the first recipe
        const recipeId = item.recipe_ids[0];
        if (!byRecipe.has(recipeId)) byRecipe.set(recipeId, []);
        byRecipe.get(recipeId)!.push(item);
      } else {
        if (!byRecipe.has("__manual__")) byRecipe.set("__manual__", []);
        byRecipe.get("__manual__")!.push(item);
      }
    }
    // Sort: named recipes first (alphabetically), manual last
    const entries = Array.from(byRecipe.entries()).sort((a, b) => {
      if (a[0] === "__manual__") return 1;
      if (b[0] === "__manual__") return -1;
      const nameA = recipeMap[a[0]] || "Unknown";
      const nameB = recipeMap[b[0]] || "Unknown";
      return nameA.localeCompare(nameB);
    });
    return entries.map(([id, items]) => ({
      key: id,
      label: id === "__manual__" ? "Manually Added" : recipeMap[id] || "Unknown Recipe",
      icon: id === "__manual__" ? "✏️" : "📖",
      items,
    }));
  }

  // Default: category mode
  const byCategory = new Map<string, GroceryItem[]>();
  for (const item of items) {
    const cat = item.category || "other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(item);
  }
  const sortedKeys = Array.from(byCategory.keys()).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return sortedKeys.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat] || cat,
    icon: CATEGORY_ICONS[cat] || "📦",
    items: byCategory.get(cat)!,
  }));
}

export default function GroceryListView({
  items,
  listId,
  recipeMap = {},
}: {
  items: GroceryItem[];
  listId: string;
  recipeMap?: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, setOptimisticItems] = useState<GroceryItem[]>(items);
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("kd-grocery-sort") as SortMode) || "category";
    }
    return "category";
  });

  useEffect(() => {
    localStorage.setItem("kd-grocery-sort", sortMode);
  }, [sortMode]);

  // Split into unchecked and checked
  const unchecked = optimisticItems.filter((i) => !i.checked);
  const checked = optimisticItems.filter((i) => i.checked);

  // Group unchecked items based on sort mode
  const groups = groupItems(unchecked, sortMode, recipeMap);

  const handleToggle = (itemId: string, currentChecked: boolean) => {
    const newChecked = !currentChecked;
    setOptimisticItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, checked: newChecked } : i
      )
    );
    startTransition(async () => {
      const result = await toggleGroceryItem(itemId, newChecked);
      if (result?.error) {
        toast.error(result.error);
        setOptimisticItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, checked: currentChecked } : i
          )
        );
      }
    });
  };

  const handleRemove = (itemId: string) => {
    const removed = optimisticItems.find((i) => i.id === itemId);
    setOptimisticItems((prev) => prev.filter((i) => i.id !== itemId));
    startTransition(async () => {
      const result = await removeGroceryItem(itemId);
      if (result?.error) {
        toast.error(result.error);
        if (removed) {
          setOptimisticItems((prev) => [...prev, removed]);
        }
      }
    });
  };

  const handleItemAdded = (newItem: GroceryItem) => {
    setOptimisticItems((prev) => [...prev, newItem]);
  };

  const totalItems = optimisticItems.length;
  const checkedCount = checked.length;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="glass rounded-xl border border-stone-200/60 dark:border-stone-700/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-600 dark:text-stone-400">
              {checkedCount} of {totalItems} items
            </span>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {totalItems - checkedCount} remaining
            </span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Sort toggle */}
      {unchecked.length > 0 && (
        <div className="flex items-center gap-1 p-1 glass rounded-lg border border-stone-200/60 dark:border-stone-700/40 w-fit">
          {([
            { mode: "category" as SortMode, label: "Category" },
            { mode: "alpha" as SortMode, label: "A–Z" },
            { mode: "recipe" as SortMode, label: "Recipe" },
          ]).map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                sortMode === mode
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Unchecked items grouped by sort mode */}
      {groups.map((group) => (
        <div
          key={group.key}
          className="glass rounded-xl border border-stone-200/60 dark:border-stone-700/40 overflow-hidden card-hover-lift"
        >
          <div className="px-4 py-2.5 bg-stone-50/80 dark:bg-stone-800/60 border-b border-stone-200/60 dark:border-stone-700/40">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide flex items-center gap-1.5">
              {group.icon && <span className="text-base" aria-hidden="true">{group.icon}</span>}
              {group.label}
            </h2>
          </div>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {group.items.map((item) => (
              <SwipeableItem
                key={item.id}
                onCheck={() => handleToggle(item.id, item.checked)}
                onRemove={() => handleRemove(item.id)}
                isManual={item.is_manual}
              >
                <li
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/40 active:bg-stone-100 dark:active:bg-stone-800 transition-colors group cursor-pointer"
                  onClick={() => handleToggle(item.id, item.checked)}
                >
                  <div
                    className="w-6 h-6 rounded-md border-2 border-stone-300 dark:border-stone-600 group-hover:border-amber-500 flex-shrink-0 transition-colors"
                  />
                  <span className="flex-1 text-stone-800 dark:text-stone-200 text-[15px]">
                    {formatItemDisplay(item)}
                  </span>
                  {item.is_manual && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                      className="sm:opacity-0 sm:group-hover:opacity-100 text-stone-400 dark:text-stone-500 hover:text-red-500 transition-all p-1"
                      aria-label={`Remove ${item.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </li>
              </SwipeableItem>
            ))}
          </ul>
        </div>
      ))}

      {/* Add manual item */}
      <AddItemForm listId={listId} onItemAdded={handleItemAdded} />

      {/* Checked items (collapsed section) */}
      {checked.length > 0 && (
        <div className="glass rounded-xl border border-stone-200/60 dark:border-stone-700/40 overflow-hidden opacity-60">
          <div className="px-4 py-2.5 bg-stone-50/80 dark:bg-stone-800/60 border-b border-stone-200/60 dark:border-stone-700/40">
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              Done ({checked.length})
            </h2>
          </div>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {checked.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-stone-50 dark:active:bg-stone-800"
                onClick={() => handleToggle(item.id, item.checked)}
              >
                <div
                  className="w-6 h-6 rounded-md border-2 border-amber-400 bg-amber-400 flex-shrink-0 flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="flex-1 text-stone-400 dark:text-stone-500 text-[15px] line-through">
                  {formatItemDisplay(item)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
