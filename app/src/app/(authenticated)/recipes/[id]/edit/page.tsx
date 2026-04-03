import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import RecipeForm from "@/components/recipes/RecipeForm";
import { updateRecipe } from "@/lib/actions";
import type { Recipe } from "@/types";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (!recipe) {
    notFound();
  }

  const boundUpdate = async (formData: FormData) => {
    "use server";
    return updateRecipe(id, formData);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/recipes/${id}`}
          className="text-stone-400 hover:text-stone-600 transition-colors"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-semibold">Edit Recipe</h1>
      </div>
      <RecipeForm
        recipe={recipe as Recipe}
        action={boundUpdate}
        submitLabel="Update Recipe"
      />
    </div>
  );
}
