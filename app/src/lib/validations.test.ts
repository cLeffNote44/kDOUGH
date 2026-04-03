import { describe, it, expect } from "vitest";
import {
  recipeFormSchema,
  importedRecipeSchema,
  uuidSchema,
  mealTypeSchema,
} from "./validations";

// ──────────────────────────────────────────────
// recipeFormSchema
// ──────────────────────────────────────────────

describe("recipeFormSchema", () => {
  const validRecipe = {
    title: "Test Recipe",
    description: "A test description",
    ingredients: [{ name: "flour", quantity: "2", unit: "cups" }],
    instructions: "Mix everything together.",
    source_url: "https://example.com/recipe",
    servings: 4,
    prep_time: 10,
    cook_time: 20,
    tags: ["quick", "easy"],
  };

  it("accepts a valid recipe", () => {
    const result = recipeFormSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 500 chars", () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      title: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("allows null/empty description", () => {
    const result1 = recipeFormSchema.safeParse({
      ...validRecipe,
      description: null,
    });
    expect(result1.success).toBe(true);

    const result2 = recipeFormSchema.safeParse({
      ...validRecipe,
      description: "",
    });
    expect(result2.success).toBe(true);
  });

  it("coerces servings string to number", () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      servings: "6",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.servings).toBe(6);
    }
  });

  it("rejects servings of 0", () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      servings: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects servings over 999", () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      servings: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("transforms empty source_url to null", () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      source_url: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source_url).toBe(null);
    }
  });

  it("rejects non-http source_url", () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      source_url: "ftp://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("transforms empty prep_time to null", () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      prep_time: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prep_time).toBe(null);
    }
  });

  it("transforms null cook_time to null", () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      cook_time: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cook_time).toBe(null);
    }
  });

  it("accepts empty tags array", () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, tags: [] });
    expect(result.success).toBe(true);
  });

  it("rejects tag longer than 50 chars", () => {
    const result = recipeFormSchema.safeParse({
      ...validRecipe,
      tags: ["x".repeat(51)],
    });
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────
// importedRecipeSchema
// ──────────────────────────────────────────────

describe("importedRecipeSchema", () => {
  const validImported = {
    title: "Imported Recipe",
    description: "From a website",
    ingredients: [{ name: "eggs", quantity: "3", unit: "" }],
    instructions: "Cook them.",
    image_url: "https://example.com/img.jpg",
    source_url: "https://example.com/recipe",
    servings: 4,
    prep_time: 10,
    cook_time: null,
  };

  it("accepts a valid imported recipe", () => {
    const result = importedRecipeSchema.safeParse(validImported);
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const { title, ...noTitle } = validImported;
    const result = importedRecipeSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = importedRecipeSchema.safeParse({
      ...validImported,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields as undefined", () => {
    const result = importedRecipeSchema.safeParse({
      title: "Simple",
      ingredients: [],
      instructions: "Do it.",
      servings: 2,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative servings", () => {
    const result = importedRecipeSchema.safeParse({
      ...validImported,
      servings: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative prep_time", () => {
    const result = importedRecipeSchema.safeParse({
      ...validImported,
      prep_time: -5,
    });
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────
// uuidSchema
// ──────────────────────────────────────────────

describe("uuidSchema", () => {
  it("accepts a valid UUID v4", () => {
    const result = uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID string", () => {
    const result = uuidSchema.safeParse("not-a-uuid");
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = uuidSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects a number", () => {
    const result = uuidSchema.safeParse(12345);
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────
// mealTypeSchema
// ──────────────────────────────────────────────

describe("mealTypeSchema", () => {
  it("accepts 'breakfast'", () => {
    expect(mealTypeSchema.safeParse("breakfast").success).toBe(true);
  });

  it("accepts 'snack'", () => {
    expect(mealTypeSchema.safeParse("snack").success).toBe(true);
  });

  it("accepts 'lunch'", () => {
    expect(mealTypeSchema.safeParse("lunch").success).toBe(true);
  });

  it("accepts 'dinner'", () => {
    expect(mealTypeSchema.safeParse("dinner").success).toBe(true);
  });

  it("accepts 'dessert'", () => {
    expect(mealTypeSchema.safeParse("dessert").success).toBe(true);
  });

  it("rejects invalid meal type", () => {
    expect(mealTypeSchema.safeParse("brunch").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(mealTypeSchema.safeParse("").success).toBe(false);
  });

  it("is case-sensitive (rejects 'Dinner')", () => {
    expect(mealTypeSchema.safeParse("Dinner").success).toBe(false);
  });
});
