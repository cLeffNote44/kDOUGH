"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addPantryItem, removePantryItem } from "@/lib/actions";
import type { PantryItem } from "@/types";

// Common staples to seed the pantry with one tap.
const SUGGESTED = [
  "salt",
  "black pepper",
  "olive oil",
  "vegetable oil",
  "butter",
  "sugar",
  "flour",
  "garlic",
  "onion",
  "baking powder",
  "baking soda",
  "eggs",
  "milk",
  "rice",
];

function sortByName(items: PantryItem[]): PantryItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

export default function PantryView({ items }: { items: PantryItem[] }) {
  const [list, setList] = useState<PantryItem[]>(items);
  const [name, setName] = useState("");
  const [, startTransition] = useTransition();

  const has = (n: string) =>
    list.some((i) => i.name.toLowerCase() === n.toLowerCase());

  const add = (raw: string) => {
    const n = raw.trim().toLowerCase();
    if (!n || has(n)) return;
    const tempId = `temp-${Date.now()}-${n}`;
    setList((prev) => sortByName([...prev, { id: tempId, name: n, created_at: "" }]));
    startTransition(async () => {
      const res = await addPantryItem(n);
      if (res?.error) {
        toast.error(res.error);
        setList((prev) => prev.filter((i) => i.id !== tempId));
      } else if (res?.item) {
        const real = res.item;
        setList((prev) => prev.map((i) => (i.id === tempId ? real : i)));
      }
    });
  };

  const remove = (id: string) => {
    const removed = list.find((i) => i.id === id);
    setList((prev) => prev.filter((i) => i.id !== id));
    if (id.startsWith("temp-")) return; // not yet persisted
    startTransition(async () => {
      const res = await removePantryItem(id);
      if (res?.error) {
        toast.error(res.error);
        if (removed) setList((prev) => sortByName([...prev, removed]));
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    add(name);
    setName("");
  };

  const unusedSuggestions = SUGGESTED.filter((s) => !has(s));

  return (
    <div className="space-y-5">
      {/* Add form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a staple (e.g. olive oil)"
          className="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="px-4 py-2 btn-gradient text-sm rounded-lg disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {/* Suggested staples */}
      {unusedSuggestions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2 uppercase tracking-wide">
            Suggested
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unusedSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="px-2.5 py-1 text-xs rounded-full border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current pantry */}
      {list.length > 0 ? (
        <ul className="glass rounded-xl border border-stone-200/60 dark:border-stone-700/40 divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
          {list.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between px-4 py-3 group"
            >
              <span className="text-[15px] text-stone-800 dark:text-stone-200 capitalize">
                {item.name}
              </span>
              <button
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.name}`}
                className="sm:opacity-0 sm:group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-sm text-stone-400 dark:text-stone-500 py-8">
          No staples yet. Add the things you always keep on hand so they don&apos;t
          clutter your grocery list.
        </p>
      )}
    </div>
  );
}
