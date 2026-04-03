export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: Ingredient[];
  instructions: string | null;
  image_url: string | null;
  source_url: string | null;
  servings: number;
  prep_time: number | null;
  cook_time: number | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealPlan {
  id: string;
  recipe_id: string;
  date: string;
  meal_type: "breakfast" | "snack" | "lunch" | "dinner" | "dessert";
  created_at: string;
  recipes: Recipe;
}

export interface GroceryList {
  id: string;
  week_start: string;
  created_at: string;
  updated_at: string;
}

export interface GroceryItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  checked: boolean;
  recipe_ids: string[];
  is_manual: boolean;
  created_at: string;
}
