import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import RecipeSearch from "@/components/recipes/RecipeSearch";
import RecipeCard from "@/components/recipes/RecipeCard";
import QuickAddFAB from "@/components/recipes/QuickAddFAB";
import { EmptyRecipesIllustration } from "@/components/ui/EmptyStateIllustrations";

export const dynamic = "force-dynamic";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select("id, title, description, tags, cook_time, prep_time, image_url, is_favorite")
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false });

  // Search by title
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  // Filter by tag
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data: recipes } = await query;

  // Get all unique tags for the filter
  const { data: allRecipes } = await supabase
    .from("recipes")
    .select("tags");
  const allTags = Array.from(
    new Set(
      (allRecipes ?? []).flatMap((r) => (r.tags as string[]) ?? [])
    )
  ).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-display font-semibold text-stone-900 dark:text-stone-100">Recipes</h1>
        <div className="flex gap-2">
          <Link
            href="/import"
            className="px-4 py-2 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-sm font-medium rounded-lg transition-colors border border-amber-300 dark:border-amber-700"
          >
            Import URL
          </Link>
          <Link
            href="/recipes/new"
            className="px-4 py-2 btn-gradient text-sm rounded-lg"
          >
            + Add Recipe
          </Link>
        </div>
      </div>

      {/* Search and filter */}
      <RecipeSearch currentQuery={q ?? ""} currentTag={tag ?? ""} allTags={allTags} />

      {!recipes || recipes.length === 0 ? (
        <div className="text-center py-16 glass rounded-xl border border-stone-200/60 dark:border-stone-700/40">
          <EmptyRecipesIllustration />
          <p className="text-stone-500 dark:text-stone-400 mb-2">
            {q || tag ? "No recipes match your search" : "No recipes yet"}
          </p>
          <p className="text-sm text-stone-400 dark:text-stone-500">
            {q || tag ? (
              <Link href="/recipes" className="text-amber-600 dark:text-amber-400 underline">
                Clear filters
              </Link>
            ) : (
              "Add your first recipe to get started with meal planning."
            )}
          </p>
        </div>
      ) : (
        <>
          {(q || tag) && (
            <p className="text-sm text-stone-400 dark:text-stone-500 mb-3">
              {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} found
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                description={recipe.description}
                tags={recipe.tags as string[] | null}
                prep_time={recipe.prep_time}
                cook_time={recipe.cook_time}
                image_url={recipe.image_url}
                is_favorite={recipe.is_favorite ?? false}
              />
            ))}
          </div>
        </>
      )}

      <QuickAddFAB />
    </div>
  );
}
