"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addManualGroceryItem } from "@/lib/actions";
import type { GroceryItem } from "@/types";

export default function AddItemForm({
  listId,
  onItemAdded,
  onItemReconciled,
  onItemFailed,
}: {
  listId: string;
  onItemAdded?: (item: GroceryItem) => void;
  onItemReconciled?: (tempId: string, realItem: GroceryItem) => void;
  onItemFailed?: (tempId: string) => void;
}) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const itemName = name.trim();
    setName("");

    // Optimistic: create a placeholder item with a temp id.
    const tempId = `temp-${Date.now()}`;
    if (onItemAdded) {
      onItemAdded({
        id: tempId,
        list_id: listId,
        name: itemName,
        quantity: 1,
        unit: null,
        category: "other",
        checked: false,
        recipe_ids: [],
        is_manual: true,
        created_at: new Date().toISOString(),
      });
    }

    startTransition(async () => {
      const result = await addManualGroceryItem(listId, itemName);
      if (result?.error) {
        toast.error(result.error);
        onItemFailed?.(tempId);
      } else if (result?.item) {
        // Swap the temp item for the real DB row (real UUID + computed category)
        // so it can be checked/removed immediately, without a reload.
        onItemReconciled?.(tempId, result.item);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add an item (e.g. paper towels)"
        className="flex-1 px-4 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add
      </button>
    </form>
  );
}
