"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Ingredient } from "@/types";
import {
  categorizeIngredient,
  normalizeUnit,
  parseQuantity,
} from "@/lib/import/parser";
import {
  recipeFormSchema,
  importedRecipeSchema,
  uuidSchema,
  mealTypeSchema,
} from "@/lib/validations";

// ============================================
// AUTH HELPER
// ============================================

/**
 * Verify the current user is authenticated.
 * Returns { supabase, user } or { error } for early return.
 */
async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "Not authenticated" as const };
  }

  return { supabase, user, error: null };
}

// ============================================
// RECIPE ACTIONS
// ============================================

export async function createRecipe(formData: FormData) {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase } = auth;

  let ingredients: Ingredient[] = [];
  try {
    const raw = formData.get("ingredients");
    ingredients = raw ? JSON.parse(String(raw)) : [];
  } catch {
    ingredients = [];
  }

  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const parsed = recipeFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    ingredients,
    instructions: formData.get("instructions") || null,
    source_url: formData.get("source_url") || null,
    servings: formData.get("servings"),
    prep_time: formData.get("prep_time"),
    cook_time: formData.get("cook_time"),
    tags,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid recipe data";
    return { error: msg };
  }

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      ingredients: parsed.data.ingredients,
      instructions: parsed.data.instructions || null,
      source_url: parsed.data.source_url,
      servings: parsed.data.servings,
      prep_time: parsed.data.prep_time,
      cook_time: parsed.data.cook_time,
      tags: parsed.data.tags,
    })
    .select("id")
    .single();

  if (error) {
    // Log for debugging; in production consider a logging service
    console.error("createRecipe DB error:", error);
    return { error: "Failed to save recipe. Please try again." };
  }

  revalidatePath("/recipes");
  redirect(`/recipes/${data.id}`);
}

export async function updateRecipe(id: string, formData: FormData) {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { error: "Invalid recipe ID" };
  }

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  let ingredients: Ingredient[] = [];
  try {
    const raw = formData.get("ingredients");
    ingredients = raw ? JSON.parse(String(raw)) : [];
  } catch {
    ingredients = [];
  }

  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const parsed = recipeFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    ingredients,
    instructions: formData.get("instructions") || null,
    source_url: formData.get("source_url") || null,
    servings: formData.get("servings"),
    prep_time: formData.get("prep_time"),
    cook_time: formData.get("cook_time"),
    tags,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid recipe data";
    return { error: msg };
  }

  const { error } = await supabase
    .from("recipes")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      ingredients: parsed.data.ingredients,
      instructions: parsed.data.instructions || null,
      source_url: parsed.data.source_url,
      servings: parsed.data.servings,
      prep_time: parsed.data.prep_time,
      cook_time: parsed.data.cook_time,
      tags: parsed.data.tags,
    })
    .eq("id", idResult.data)
    .eq("user_id", user.id);

  if (error) {
    // Log for debugging; in production consider a logging service
    console.error("updateRecipe DB error:", error);
    return { error: "Failed to update recipe. Please try again." };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  revalidatePath("/");
  redirect(`/recipes/${id}`);
}

export async function deleteRecipe(id: string) {
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return { error: "Invalid recipe ID" };
  }

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", idResult.data)
    .eq("user_id", user.id);

  if (error) {
    // Log for debugging; in production consider a logging service
    console.error("deleteRecipe DB error:", error);
    return { error: "Failed to delete recipe. Please try again." };
  }

  revalidatePath("/recipes");
  revalidatePath("/");
  redirect("/recipes");
}

export async function saveImportedRecipe(recipe: {
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string;
  image_url: string;
  source_url: string;
  servings: number;
  prep_time: number | null;
  cook_time: number | null;
}) {
  const parsed = importedRecipeSchema.safeParse(recipe);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid imported recipe";
    return { error: msg };
  }

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase } = auth;

  const r = parsed.data;
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title: r.title,
      description: r.description || null,
      ingredients: r.ingredients,
      instructions: r.instructions || null,
      image_url: r.image_url || null,
      source_url: r.source_url || null,
      servings: r.servings,
      prep_time: r.prep_time,
      cook_time: r.cook_time,
      tags: [],
    })
    .select("id")
    .single();

  if (error) {
    // Log for debugging; in production consider a logging service
    console.error("saveImportedRecipe DB error:", error);
    return { error: "Failed to save imported recipe. Please try again." };
  }

  revalidatePath("/recipes");
  return { id: data.id };
}

// ============================================
// FAVORITE ACTIONS
// ============================================

export async function toggleFavorite(recipeId: string) {
  const idResult = uuidSchema.safeParse(recipeId);
  if (!idResult.success) {
    return { error: "Invalid recipe ID" };
  }

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  // Get current favorite status
  const { data: recipe, error: fetchError } = await supabase
    .from("recipes")
    .select("is_favorite")
    .eq("id", idResult.data)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !recipe) {
    return { error: "Recipe not found" };
  }

  const newValue = !recipe.is_favorite;

  const { error } = await supabase
    .from("recipes")
    .update({ is_favorite: newValue })
    .eq("id", idResult.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("toggleFavorite DB error:", error);
    return { error: "Failed to update favorite status" };
  }

  revalidatePath("/recipes");
  revalidatePath("/");
  return { is_favorite: newValue };
}

// ============================================
// MEAL PLAN ACTIONS
// ============================================

export async function assignRecipeToDay(
  recipeId: string,
  date: string,
  mealType: string = "dinner"
) {
  const recipeIdResult = uuidSchema.safeParse(recipeId);
  if (!recipeIdResult.success) {
    return { error: "Invalid recipe ID" };
  }

  const mealTypeResult = mealTypeSchema.safeParse(mealType);
  if (!mealTypeResult.success) {
    return { error: "Invalid meal type" };
  }
  const validMealType = mealTypeResult.data;

  // Validate date format (YYYY-MM-DD) and ensure it's a real date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date + "T00:00:00").getTime())) {
    return { error: "Invalid date" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Atomic upsert: replace any existing plan for this date+meal_type slot.
  // Requires a unique constraint on (user_id, date, meal_type) in Supabase.
  // Fallback: delete-then-insert if no unique constraint exists.
  const { error: upsertError } = await supabase
    .from("meal_plans")
    .upsert(
      {
        user_id: user.id,
        recipe_id: recipeIdResult.data,
        date,
        meal_type: validMealType,
      },
      { onConflict: "user_id,date,meal_type" }
    );

  if (upsertError) {
    // Fallback: unique constraint may not exist yet — use delete+insert
    await supabase
      .from("meal_plans")
      .delete()
      .eq("user_id", user.id)
      .eq("date", date)
      .eq("meal_type", validMealType);

    const { error } = await supabase.from("meal_plans").insert({
      user_id: user.id,
      recipe_id: recipeIdResult.data,
      date,
      meal_type: validMealType,
    });

    if (error) {
      console.error("assignRecipeToDay DB error:", error);
      return { error: "Failed to assign recipe. Please try again." };
    }
  }

  revalidatePath("/");
  return { success: true };
}

export async function moveRecipeToSlot(
  mealPlanId: string,
  recipeId: string,
  targetDate: string,
  targetMealType: string
) {
  const idResult = uuidSchema.safeParse(mealPlanId);
  if (!idResult.success) return { error: "Invalid meal plan ID" };

  const recipeIdResult = uuidSchema.safeParse(recipeId);
  if (!recipeIdResult.success) return { error: "Invalid recipe ID" };

  const mealTypeResult = mealTypeSchema.safeParse(targetMealType);
  if (!mealTypeResult.success) return { error: "Invalid meal type" };
  const validMealType = mealTypeResult.data;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return { error: "Invalid date format" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Delete the old meal plan entry — filter by user_id to prevent cross-user deletion
  await supabase
    .from("meal_plans")
    .delete()
    .eq("id", idResult.data)
    .eq("user_id", user.id);

  // Upsert into the target slot
  const { error: upsertError } = await supabase
    .from("meal_plans")
    .upsert(
      {
        user_id: user.id,
        recipe_id: recipeIdResult.data,
        date: targetDate,
        meal_type: validMealType,
      },
      { onConflict: "user_id,date,meal_type" }
    );

  if (upsertError) {
    // Fallback: delete + insert
    await supabase
      .from("meal_plans")
      .delete()
      .eq("user_id", user.id)
      .eq("date", targetDate)
      .eq("meal_type", validMealType);

    const { error } = await supabase.from("meal_plans").insert({
      user_id: user.id,
      recipe_id: recipeIdResult.data,
      date: targetDate,
      meal_type: validMealType,
    });

    if (error) {
      console.error("moveRecipeToSlot DB error:", error);
      return { error: "Failed to move recipe. Please try again." };
    }
  }

  revalidatePath("/");
  return { success: true };
}

export async function removeRecipeFromDay(mealPlanId: string) {
  const idResult = uuidSchema.safeParse(mealPlanId);
  if (!idResult.success) {
    return { error: "Invalid meal plan ID" };
  }

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("id", idResult.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("removeRecipeFromDay DB error:", error);
    return { error: "Failed to remove recipe. Please try again." };
  }

  revalidatePath("/");
  return { success: true };
}

// ============================================
// GROCERY LIST ACTIONS
// ============================================

export async function generateGroceryList(weekStart: string) {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  // Calculate week range
  const monday = new Date(weekStart + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`;

  // Fetch all meal plans for this user's week with recipe data
  const { data: mealPlans, error: fetchError } = await supabase
    .from("meal_plans")
    .select("*, recipes(*)")
    .eq("user_id", user.id)
    .gte("date", weekStart)
    .lte("date", sundayStr)
    .order("date");

  if (fetchError) {
    console.error("generateGroceryList fetch error:", fetchError);
    return { error: "Failed to load meal plans. Please try again." };
  }

  if (!mealPlans || mealPlans.length === 0) {
    return { error: "No meals planned for this week. Add recipes to your calendar first." };
  }

  // Aggregate ingredients across all planned recipes
  // Key: "normalized_name|normalized_unit" → { totalQty, unit, name, recipeIds }
  const aggregated = new Map<string, {
    name: string;
    totalQty: number;
    unit: string;
    recipeIds: Set<string>;
  }>();

  for (const plan of mealPlans) {
    // Safely extract recipe data — Supabase joins return the related row as an object
    const recipe = plan.recipes as Record<string, unknown> | null;
    if (!recipe) continue;

    const recipeId = typeof recipe.id === "string" ? recipe.id : null;
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    if (!recipeId || ingredients.length === 0) continue;

    for (const raw of ingredients) {
      const ing = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : null;
      if (!ing) continue;

      const name = typeof ing.name === "string" ? ing.name.toLowerCase().trim() : "";
      if (!name) continue;

      const unit = normalizeUnit(typeof ing.unit === "string" ? ing.unit : "");
      const key = `${name}|${unit}`;
      const qty = parseQuantity(typeof ing.quantity === "string" ? ing.quantity : String(ing.quantity ?? ""));

      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.totalQty += qty;
        existing.recipeIds.add(recipeId);
      } else {
        aggregated.set(key, {
          name: typeof ing.name === "string" ? ing.name.trim() : name,
          totalQty: qty,
          unit,
          recipeIds: new Set([recipeId]),
        });
      }
    }
  }

  // Delete existing grocery list for this week (if regenerating) — filter by user_id
  const { data: existingList } = await supabase
    .from("grocery_lists")
    .select("id")
    .eq("week_start", weekStart)
    .eq("user_id", user.id)
    .single();

  if (existingList) {
    await supabase.from("grocery_items").delete().eq("list_id", existingList.id);
    await supabase.from("grocery_lists").delete().eq("id", existingList.id).eq("user_id", user.id);
  }

  // Create new grocery list
  const { data: newList, error: listError } = await supabase
    .from("grocery_lists")
    .insert({ week_start: weekStart, user_id: user.id })
    .select("id")
    .single();

  if (listError || !newList) {
    console.error("generateGroceryList list error:", listError);
    return { error: "Failed to create grocery list. Please try again." };
  }

  // Insert aggregated items
  const items = Array.from(aggregated.values()).map((item) => ({
    list_id: newList.id,
    name: item.name,
    quantity: item.totalQty,
    unit: item.unit || null,
    category: categorizeIngredient(item.name),
    checked: false,
    recipe_ids: Array.from(item.recipeIds),
    is_manual: false,
  }));

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("grocery_items")
      .insert(items);

    if (itemsError) {
      console.error("generateGroceryList items error:", itemsError);
      return { error: "Failed to save grocery items. Please try again." };
    }
  }

  revalidatePath("/grocery");
  return { success: true, listId: newList.id };
}

export async function toggleGroceryItem(itemId: string, checked: boolean) {
  const idResult = uuidSchema.safeParse(itemId);
  if (!idResult.success) {
    return { error: "Invalid item ID" };
  }

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  // Verify the item belongs to a list owned by this user
  const { data: item } = await supabase
    .from("grocery_items")
    .select("list_id, grocery_lists!inner(user_id)")
    .eq("id", idResult.data)
    .eq("grocery_lists.user_id", user.id)
    .single();

  if (!item) {
    return { error: "Item not found" };
  }

  const { error } = await supabase
    .from("grocery_items")
    .update({ checked })
    .eq("id", idResult.data);

  if (error) {
    console.error("toggleGroceryItem DB error:", error);
    return { error: "Failed to update item. Please try again." };
  }

  revalidatePath("/grocery");
  return { success: true };
}

export async function addManualGroceryItem(
  listId: string,
  name: string,
  category?: string
) {
  const listIdResult = uuidSchema.safeParse(listId);
  if (!listIdResult.success) {
    return { error: "Invalid list ID" };
  }
  const trimmedName = name?.trim();
  if (!trimmedName) {
    return { error: "Item name is required" };
  }

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  // Verify the grocery list belongs to this user
  const { data: list } = await supabase
    .from("grocery_lists")
    .select("id")
    .eq("id", listIdResult.data)
    .eq("user_id", user.id)
    .single();

  if (!list) {
    return { error: "Grocery list not found" };
  }

  const { error } = await supabase.from("grocery_items").insert({
    list_id: listIdResult.data,
    name: trimmedName,
    quantity: 1,
    unit: null,
    category: category || categorizeIngredient(name),
    checked: false,
    recipe_ids: [],
    is_manual: true,
  });

  if (error) {
    console.error("addManualGroceryItem DB error:", error);
    return { error: "Failed to add item. Please try again." };
  }

  revalidatePath("/grocery");
  return { success: true };
}

export async function removeGroceryItem(itemId: string) {
  const idResult = uuidSchema.safeParse(itemId);
  if (!idResult.success) {
    return { error: "Invalid item ID" };
  }

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  // Verify the item belongs to a list owned by this user
  const { data: item } = await supabase
    .from("grocery_items")
    .select("list_id, grocery_lists!inner(user_id)")
    .eq("id", idResult.data)
    .eq("grocery_lists.user_id", user.id)
    .single();

  if (!item) {
    return { error: "Item not found" };
  }

  const { error } = await supabase
    .from("grocery_items")
    .delete()
    .eq("id", idResult.data);

  if (error) {
    console.error("removeGroceryItem DB error:", error);
    return { error: "Failed to remove item. Please try again." };
  }

  revalidatePath("/grocery");
  return { success: true };
}
