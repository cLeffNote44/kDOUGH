"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { assignRecipeToDay } from "@/lib/actions";
import type { Recipe } from "@/types";
import { EmptySearchIllustration } from "@/components/ui/EmptyStateIllustrations";

interface RecipePickerProps {
  date: string;
  dayLabel: string;
  mealType: string;
  onClose: () => void;
}

export default function RecipePicker({ date, dayLabel, mealType, onClose }: RecipePickerProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .order("title");
        if (error) throw error;
        setRecipes((data as Recipe[]) ?? []);
      } catch {
        toast.error("Failed to load recipes");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  // Close on click outside - only if clicking the backdrop (not modal content)
  // Note: per ISSUES_AND_GAPS, some users expect only "Cancel"/X to close; consider adding close button only.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const filtered = recipes
    .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Favorites first, then alphabetical
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return 0;
    });

  const handleAssign = async (recipeId: string) => {
    setAssigning(recipeId);
    const result = await assignRecipeToDay(recipeId, date, mealType);
    if (result?.error) {
      toast.error(result.error);
      setAssigning(null);
      return;
    }
    toast.success("Added to plan");
    onClose();
  };

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="glass-strong rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[70vh] flex flex-col border border-stone-200/60 dark:border-stone-700/40"
      >
        <div className="p-4 border-b border-stone-200/60 dark:border-stone-700/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-stone-900 dark:text-stone-100">
              {dayLabel} {mealType.charAt(0).toUpperCase() + mealType.slice(1)} &middot; {formattedDate}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close recipe picker"
              className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 text-lg"
            >
              &times;
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes..."
            autoFocus
            className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <p className="text-center text-stone-400 dark:text-stone-500 py-8 text-sm">Loading recipes...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <EmptySearchIllustration />
              <p className="text-stone-400 dark:text-stone-500 text-sm">
                {recipes.length === 0
                  ? "No recipes yet. Add some first!"
                  : "No recipes match your search."}
              </p>
            </div>
          ) : (
            filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleAssign(recipe.id)}
                disabled={assigning !== null}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {recipe.is_favorite && (
                    <svg className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  )}
                  <div>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{recipe.title}</p>
                    {recipe.description && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-[280px]">
                        {recipe.description}
                      </p>
                    )}
                  </div>
                </div>
                {assigning === recipe.id && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">Adding...</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
