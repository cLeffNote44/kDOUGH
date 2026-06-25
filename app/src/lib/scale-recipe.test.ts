import { describe, it, expect } from "vitest";
import { scaleIngredient, scaleIngredients } from "./scale-recipe";
import type { Ingredient } from "@/types";

const ing = (quantity: string, unit: string, name: string): Ingredient => ({
  quantity,
  unit,
  name,
});

describe("scaleIngredient", () => {
  it("doubles a whole-number quantity", () => {
    expect(scaleIngredient(ing("2", "cups", "flour"), 2).quantity).toBe("4");
  });

  it("halves a quantity", () => {
    expect(scaleIngredient(ing("2", "cups", "flour"), 0.5).quantity).toBe("1");
  });

  it("scales a fraction and reformats it", () => {
    expect(scaleIngredient(ing("1/2", "tsp", "salt"), 3).quantity).toBe("1 1/2");
  });

  it("returns the input unchanged when the multiplier is 1", () => {
    const i = ing("2", "cups", "flour");
    expect(scaleIngredient(i, 1)).toBe(i);
  });

  it("leaves unmeasured quantities ('', 'to taste') unchanged", () => {
    const blank = ing("", "", "salt");
    expect(scaleIngredient(blank, 2)).toBe(blank);
    const toTaste = ing("to taste", "", "pepper");
    expect(scaleIngredient(toTaste, 2)).toBe(toTaste);
  });
});

describe("scaleIngredients", () => {
  const items = [
    ing("2", "cups", "flour"),
    ing("1", "tsp", "salt"),
    ing("", "", "pepper"),
  ];

  it("scales every measured ingredient by the servings ratio", () => {
    const out = scaleIngredients(items, 2, 4); // x2
    expect(out[0].quantity).toBe("4");
    expect(out[1].quantity).toBe("2");
    expect(out[2].quantity).toBe(""); // unmeasured stays as-is
  });

  it("returns the same array when servings are equal", () => {
    expect(scaleIngredients(items, 4, 4)).toBe(items);
  });

  it("returns the same array for non-positive servings", () => {
    expect(scaleIngredients(items, 0, 4)).toBe(items);
    expect(scaleIngredients(items, 4, 0)).toBe(items);
  });
});
