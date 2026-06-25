import { describe, it, expect } from "vitest";
import {
  aggregateMealPlanIngredients,
  type MealPlanWithRecipe,
} from "./grocery-aggregate";

function plan(id: string, ingredients: unknown[]): MealPlanWithRecipe {
  return { recipes: { id, ingredients } };
}

describe("aggregateMealPlanIngredients", () => {
  it("merges the same ingredient+unit across recipes and sums quantities", () => {
    const result = aggregateMealPlanIngredients([
      plan("r1", [{ name: "Flour", quantity: "2", unit: "cups" }]),
      plan("r2", [{ name: "flour", quantity: "1", unit: "cup" }]),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Flour");
    expect(result[0].quantity).toBe(3); // cups + cup normalize to the same unit
    expect(result[0].unit).toBe("cup");
    expect(result[0].recipe_ids.sort()).toEqual(["r1", "r2"]);
  });

  it("keeps different units as separate lines", () => {
    const result = aggregateMealPlanIngredients([
      plan("r1", [
        { name: "milk", quantity: "1", unit: "cup" },
        { name: "milk", quantity: "8", unit: "oz" },
      ]),
    ]);
    expect(result).toHaveLength(2);
  });

  it("does not fabricate a count for unmeasured staples across recipes", () => {
    const result = aggregateMealPlanIngredients([
      plan("r1", [{ name: "salt", quantity: "", unit: "" }]),
      plan("r2", [{ name: "salt", quantity: "to taste", unit: "" }]),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("salt");
    expect(result[0].quantity).toBeNull(); // not "2 salt"
    expect(result[0].recipe_ids.sort()).toEqual(["r1", "r2"]);
  });

  it("sums a measured amount onto a previously-unmeasured entry", () => {
    const result = aggregateMealPlanIngredients([
      plan("r1", [{ name: "sugar", quantity: "", unit: "cup" }]),
      plan("r2", [{ name: "sugar", quantity: "2", unit: "cup" }]),
    ]);
    expect(result[0].quantity).toBe(2);
  });

  it("categorizes via the (longest-match) categorizer", () => {
    const result = aggregateMealPlanIngredients([
      plan("r1", [
        { name: "black pepper", quantity: "1", unit: "tsp" },
        { name: "chicken", quantity: "1", unit: "lb" },
      ]),
    ]);
    const byName = Object.fromEntries(result.map((i) => [i.name, i.category]));
    expect(byName["black pepper"]).toBe("spices");
    expect(byName["chicken"]).toBe("meat");
  });

  it("skips malformed plans, recipes, and ingredient rows", () => {
    const result = aggregateMealPlanIngredients([
      { recipes: null },
      { recipes: { id: "r1", ingredients: "not-an-array" } },
      plan("r2", ["a string", null, { name: "", quantity: "1", unit: "" }]),
      plan("r3", [{ name: "valid", quantity: "1", unit: "" }]),
    ] as MealPlanWithRecipe[]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("valid");
  });

  it("dedupes recipe ids when one recipe lists an ingredient twice", () => {
    const result = aggregateMealPlanIngredients([
      plan("r1", [
        { name: "egg", quantity: "1", unit: "" },
        { name: "egg", quantity: "1", unit: "" },
      ]),
    ]);
    expect(result[0].quantity).toBe(2);
    expect(result[0].recipe_ids).toEqual(["r1"]);
  });

  it("returns an empty array for no meal plans", () => {
    expect(aggregateMealPlanIngredients([])).toEqual([]);
  });
});
