import RecipeForm from "@/components/recipes/RecipeForm";
import { createRecipe } from "@/lib/actions";
import Link from "next/link";

export default function NewRecipePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/recipes"
          className="text-stone-400 hover:text-stone-600 transition-colors"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-semibold">Add Recipe</h1>
      </div>
      <RecipeForm action={createRecipe} submitLabel="Save Recipe" />
    </div>
  );
}
