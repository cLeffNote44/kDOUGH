import RecipeForm from "@/components/recipes/RecipeForm";
import { createRecipe } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function NewRecipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/recipes"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-semibold">Add Recipe</h1>
      </div>
      <RecipeForm userId={user.id} action={createRecipe} submitLabel="Save Recipe" />
    </div>
  );
}
