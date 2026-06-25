"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Ingredient, GroceryItem, PantryItem } from "@/types";
import { categorizeIngredient } from "@/lib/import/parser";
import { resolveRecipeImageUrl } from "@/lib/recipe-images";
import {
  aggregateMealPlanIngredients,
  type MealPlanWithRecipe,
} from "@/lib/grocery-aggregate";
import { isAiAvailable, getAnthropicClient } from "@/lib/import/ai-assist";
import { generateWeekPlan, type PlanRecipe } from "@/lib/meal-plan-ai";
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

  const image_url = await resolveRecipeImageUrl(
    supabase,
    user.id,
    formData.get("image_url") as string | null
  );

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      image_url,
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

  const image_url = await resolveRecipeImageUrl(
    supabase,
    user.id,
    formData.get("image_url") as string | null
  );

  const { error } = await supabase
    .from("recipes")
    .update({
      image_url,
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
  // Note: meal_plans referencing this recipe cascade-delete (FK ON DELETE
  // CASCADE), but already-generated grocery_items keep this id in their
  // recipe_ids[] array (no element FKs in Postgres). That's intentional —
  // grocery lists are point-in-time snapshots; the recipe view degrades to
  // "Unknown" and regenerating the list self-corrects.
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
  const { supabase, user } = auth;

  const r = parsed.data;
  const image_url = await resolveRecipeImageUrl(supabase, user.id, r.image_url);
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: r.title,
      description: r.description || null,
      ingredients: r.ingredients,
      instructions: r.instructions || null,
      image_url,
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

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Upsert a recipe into a (user, date, meal_type) slot, replacing whatever is
 * there. The per-user UNIQUE(user_id, date, meal_type) constraint makes the
 * upsert atomic; the delete+insert fallback only fires on a DB missing that
 * constraint (e.g. migration 20260624000002 not yet applied). Shared by
 * assignRecipeToDay and moveRecipeToSlot.
 */
async function upsertMealPlanSlot(
  supabase: SupabaseServerClient,
  userId: string,
  recipeId: string,
  date: string,
  mealType: string
): Promise<{ error?: string }> {
  const { error: upsertError } = await supabase
    .from("meal_plans")
    .upsert(
      { user_id: userId, recipe_id: recipeId, date, meal_type: mealType },
      { onConflict: "user_id,date,meal_type" }
    );
  if (!upsertError) return {};

  await supabase
    .from("meal_plans")
    .delete()
    .eq("user_id", userId)
    .eq("date", date)
    .eq("meal_type", mealType);

  const { error } = await supabase.from("meal_plans").insert({
    user_id: userId,
    recipe_id: recipeId,
    date,
    meal_type: mealType,
  });
  if (error) {
    console.error("upsertMealPlanSlot DB error:", error);
    return { error: "Failed to save the meal. Please try again." };
  }
  return {};
}

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

  // Validate date format (YYYY-MM-DD) and ensure it's a real date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date + "T00:00:00").getTime())) {
    return { error: "Invalid date" };
  }

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  const result = await upsertMealPlanSlot(
    supabase,
    user.id,
    recipeIdResult.data,
    date,
    mealTypeResult.data
  );
  if (result.error) return { error: result.error };

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

  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return { error: "Invalid date format" };
  }

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  // Delete the old meal plan entry — filter by user_id to prevent cross-user deletion
  await supabase
    .from("meal_plans")
    .delete()
    .eq("id", idResult.data)
    .eq("user_id", user.id);

  const result = await upsertMealPlanSlot(
    supabase,
    user.id,
    recipeIdResult.data,
    targetDate,
    mealTypeResult.data
  );
  if (result.error) return { error: result.error };

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

  // Fetch all meal plans for this user's week with the recipe fields the
  // aggregator actually needs (id + ingredients), not the full recipe row.
  const { data: mealPlans, error: fetchError } = await supabase
    .from("meal_plans")
    .select("*, recipes(id, ingredients)")
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

  // Aggregate ingredients across all planned recipes (pure, tested separately).
  const aggregatedItems = aggregateMealPlanIngredients(
    mealPlans as MealPlanWithRecipe[]
  );

  // Pantry staples the user always has — flag matching items so they show in a
  // collapsed "you likely have these" section instead of the buy list.
  const { data: pantryRows } = await supabase
    .from("pantry_items")
    .select("name")
    .eq("user_id", user.id);
  const pantrySet = new Set(
    (pantryRows ?? []).map((p) => p.name.toLowerCase().trim())
  );

  // Delete existing grocery list for this week (if regenerating) — filter by user_id
  const { data: existingList } = await supabase
    .from("grocery_lists")
    .select("id")
    .eq("week_start", weekStart)
    .eq("user_id", user.id)
    .maybeSingle();

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

  // Insert aggregated items, flagging pantry staples.
  const items = aggregatedItems.map((item) => ({
    list_id: newList.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    checked: false,
    recipe_ids: item.recipe_ids,
    is_manual: false,
    is_pantry: pantrySet.has(item.name.toLowerCase().trim()),
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

  const { data: inserted, error } = await supabase
    .from("grocery_items")
    .insert({
      list_id: listIdResult.data,
      name: trimmedName,
      quantity: 1,
      unit: null,
      category: category || categorizeIngredient(name),
      checked: false,
      recipe_ids: [],
      is_manual: true,
    })
    .select("*")
    .single();

  if (error) {
    console.error("addManualGroceryItem DB error:", error);
    return { error: "Failed to add item. Please try again." };
  }

  revalidatePath("/grocery");
  // Return the inserted row so the client can swap its optimistic temp-id item
  // for the real UUID + computed category (so toggle/remove target a real row).
  return { success: true, item: inserted as GroceryItem };
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

// ============================================
// PANTRY ACTIONS
// ============================================

export async function addPantryItem(name: string) {
  const trimmed = name?.trim();
  if (!trimmed) return { error: "Item name is required" };
  if (trimmed.length > 100) return { error: "Item name is too long" };

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  // Store normalized (lowercase) so matching against grocery items is reliable;
  // ignore duplicates via the unique (user_id, name) constraint.
  const { data: inserted, error } = await supabase
    .from("pantry_items")
    .upsert(
      { user_id: user.id, name: trimmed.toLowerCase() },
      { onConflict: "user_id,name", ignoreDuplicates: true }
    )
    .select("id, name, created_at")
    .maybeSingle();

  if (error) {
    console.error("addPantryItem DB error:", error);
    return { error: "Failed to add staple. Please try again." };
  }

  revalidatePath("/pantry");
  revalidatePath("/grocery");
  return { success: true, item: inserted as PantryItem | null };
}

export async function removePantryItem(itemId: string) {
  const idResult = uuidSchema.safeParse(itemId);
  if (!idResult.success) return { error: "Invalid item ID" };

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", idResult.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("removePantryItem DB error:", error);
    return { error: "Failed to remove staple. Please try again." };
  }

  revalidatePath("/pantry");
  revalidatePath("/grocery");
  return { success: true };
}

// ============================================
// AI WEEK PLANNER
// ============================================

/**
 * Fill the week's EMPTY dinner slots with distinct recipes chosen by Claude from
 * the user's own library. Never overwrites an already-planned dinner, and only
 * assigns recipes the user actually owns.
 */
export async function planMyWeek(weekStart: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return { error: "Invalid week" };
  }

  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const { supabase, user } = auth;

  if (!isAiAvailable()) {
    return { error: "AI planning needs an Anthropic API key to be configured." };
  }
  const client = getAnthropicClient();
  if (!client) return { error: "AI planning is currently unavailable." };

  // Library
  const { data: recipeRows } = await supabase
    .from("recipes")
    .select("id, title, tags, is_favorite")
    .eq("user_id", user.id);
  const library = recipeRows ?? [];
  if (library.length === 0) {
    return { error: "Add some recipes first, then I can plan your week." };
  }

  // Which dinner days are still empty?
  const monday = new Date(weekStart + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`;

  const { data: existing } = await supabase
    .from("meal_plans")
    .select("date")
    .eq("user_id", user.id)
    .eq("meal_type", "dinner")
    .gte("date", weekStart)
    .lte("date", sundayStr);
  const filled = new Set((existing ?? []).map((e) => e.date));

  const dayDates: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const emptyDayIndices = dayDates
    .map((date, i) => ({ date, i }))
    .filter((x) => !filled.has(x.date));

  if (emptyDayIndices.length === 0) {
    return { error: "Every dinner this week is already planned." };
  }

  const planRecipes: PlanRecipe[] = library.map((r) => ({
    id: r.id,
    title: r.title,
    tags: Array.isArray(r.tags) ? r.tags : [],
    favorite: !!r.is_favorite,
  }));

  const entries = await generateWeekPlan(
    client,
    planRecipes,
    emptyDayIndices.map((x) => x.i)
  );
  if (!entries || entries.length === 0) {
    return { error: "Couldn't generate a plan. Please try again." };
  }

  // Assign — only into empty days, and only recipes the user owns.
  const ownedIds = new Set(library.map((r) => r.id));
  let assigned = 0;
  for (const entry of entries) {
    const slot = emptyDayIndices.find((x) => x.i === entry.dayIndex);
    if (!slot || !ownedIds.has(entry.recipeId)) continue;
    const res = await upsertMealPlanSlot(
      supabase,
      user.id,
      entry.recipeId,
      slot.date,
      "dinner"
    );
    if (!res.error) assigned++;
  }

  revalidatePath("/");
  if (assigned === 0) {
    return { error: "Couldn't assign any meals. Please try again." };
  }
  return { success: true, assigned };
}
