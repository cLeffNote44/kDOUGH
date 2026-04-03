"use client";

import { useState, useRef } from "react";
import type { Ingredient, Recipe } from "@/types";

/** Ingredient with a stable key for React list rendering. */
interface KeyedIngredient extends Ingredient {
  _key: string;
}

interface RecipeFormProps {
  recipe?: Recipe;
  action: (formData: FormData) => Promise<{ error?: string } | undefined>;
  submitLabel: string;
}

function withKey(ing: Ingredient): KeyedIngredient {
  return { ...ing, _key: crypto.randomUUID() };
}

export default function RecipeForm({ recipe, action, submitLabel }: RecipeFormProps) {
  const [ingredients, setIngredients] = useState<KeyedIngredient[]>(
    (recipe?.ingredients ?? [{ name: "", quantity: "", unit: "" }]).map(withKey)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addIngredient = () => {
    setIngredients([...ingredients, withKey({ name: "", quantity: "", unit: "" })]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    setError(null);

    // Attach cleaned ingredients as JSON (strip internal _key field)
    const cleanedIngredients = ingredients
      .filter((i) => i.name.trim())
      .map(({ _key, ...rest }) => rest);
    formData.set("ingredients", JSON.stringify(cleanedIngredients));

    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
    // If no error, the action will redirect
  };

  const inputClasses = "w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent";

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          Recipe Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={recipe?.title}
          placeholder="e.g., Chicken Stir Fry"
          className={inputClasses}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          Description
        </label>
        <input
          id="description"
          name="description"
          type="text"
          defaultValue={recipe?.description ?? ""}
          placeholder="A quick weeknight dinner..."
          className={inputClasses}
        />
      </div>

      {/* Time & Servings Row */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="prep_time" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Prep (min)
          </label>
          <input
            id="prep_time"
            name="prep_time"
            type="number"
            min="0"
            defaultValue={recipe?.prep_time ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="cook_time" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Cook (min)
          </label>
          <input
            id="cook_time"
            name="cook_time"
            type="number"
            min="0"
            defaultValue={recipe?.cook_time ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="servings" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Servings
          </label>
          <input
            id="servings"
            name="servings"
            type="number"
            min="1"
            defaultValue={recipe?.servings ?? 4}
            className={inputClasses}
          />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Ingredients</label>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={ing._key} className="flex gap-2 items-start">
              <input
                type="text"
                value={ing.quantity}
                onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                placeholder="Qty"
                className="w-20 px-2 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                placeholder="Unit"
                className="w-24 px-2 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(i, "name", e.target.value)}
                placeholder="Ingredient name"
                className="flex-1 px-2 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="px-2 py-2 text-stone-400 dark:text-stone-500 hover:text-red-500 transition-colors"
                  title="Remove ingredient"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 text-sm text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium"
        >
          + Add ingredient
        </button>
      </div>

      {/* Instructions */}
      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          Instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={6}
          defaultValue={recipe?.instructions ?? ""}
          placeholder="Step-by-step cooking instructions..."
          className={inputClasses}
        />
      </div>

      {/* Source URL */}
      <div>
        <label htmlFor="source_url" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          Source URL
        </label>
        <input
          id="source_url"
          name="source_url"
          type="url"
          defaultValue={recipe?.source_url ?? ""}
          placeholder="https://example.com/recipe"
          className={inputClasses}
        />
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          Tags
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          defaultValue={recipe?.tags?.join(", ") ?? ""}
          placeholder="quick, chicken, weeknight (comma-separated)"
          className={inputClasses}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 btn-gradient rounded-lg"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
