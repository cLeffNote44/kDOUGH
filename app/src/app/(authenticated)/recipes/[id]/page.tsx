import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteRecipeButton from "@/components/recipes/DeleteRecipeButton";
import FavoriteButton from "@/components/recipes/FavoriteButton";
import ScalableIngredients from "@/components/recipes/ScalableIngredients";
import type { Recipe, Ingredient } from "@/types";

export const dynamic = "force-dynamic";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!recipe) {
    notFound();
  }

  // Boundary cast: the DB row types ingredients as Json, but the app guarantees
  // the Ingredient[] shape (Zod on write + the recipes_ingredients_is_array CHECK).
  const r = recipe as unknown as Recipe;
  const totalTime =
    (r.prep_time ?? 0) + (r.cook_time ?? 0) > 0
      ? `${(r.prep_time ?? 0) + (r.cook_time ?? 0)} min total`
      : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/recipes"
          className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-display font-semibold text-slate-900 dark:text-slate-100 flex-1">{r.title}</h1>
        <Link
          href={`/recipes/${r.id}/edit`}
          className="px-3 py-1.5 text-sm font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
        >
          Edit
        </Link>
        <FavoriteButton recipeId={r.id} initialFavorite={r.is_favorite} />
        <DeleteRecipeButton id={r.id} title={r.title} />
      </div>

      {r.description && (
        <p className="text-slate-600 dark:text-slate-400 mb-4">{r.description}</p>
      )}

      {/* Meta info */}
      <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
        {r.servings && <span>{r.servings} servings</span>}
        {r.prep_time && <span>{r.prep_time} min prep</span>}
        {r.cook_time && <span>{r.cook_time} min cook</span>}
        {totalTime && <span className="font-medium text-slate-700 dark:text-slate-300">{totalTime}</span>}
      </div>

      {/* Tags */}
      {r.tags && r.tags.length > 0 && (
        <div className="flex gap-2 mb-6">
          {r.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Ingredients (with scaling) */}
      {r.ingredients && r.ingredients.length > 0 && (
        <ScalableIngredients
          ingredients={r.ingredients as Ingredient[]}
          originalServings={r.servings}
        />
      )}

      {/* Instructions */}
      {r.instructions && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-3">
            Instructions
          </h2>
          <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {r.instructions}
          </div>
        </div>
      )}

      {/* Source */}
      {r.source_url && (
        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/40">
          <a
            href={r.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 underline"
          >
            View original recipe &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
