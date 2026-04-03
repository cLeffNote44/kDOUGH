import { describe, it, expect } from "vitest";
import {
  parseIngredientLine,
  parseIngredientsList,
  normalizeUnit,
  parseQuantity,
  formatQuantity,
  categorizeIngredient,
  CATEGORY_MAP,
} from "./parser";

// ──────────────────────────────────────────────
// parseIngredientLine
// ──────────────────────────────────────────────

describe("parseIngredientLine", () => {
  it("parses a simple ingredient with quantity, unit, and name", () => {
    expect(parseIngredientLine("2 cups flour")).toEqual({
      quantity: "2",
      unit: "cups",
      name: "flour",
    });
  });

  it("parses a fraction quantity", () => {
    expect(parseIngredientLine("1/2 tsp salt")).toEqual({
      quantity: "1/2",
      unit: "tsp",
      name: "salt",
    });
  });

  it("parses a mixed number quantity", () => {
    expect(parseIngredientLine("1 1/2 cups sugar")).toEqual({
      quantity: "1 1/2",
      unit: "cups",
      name: "sugar",
    });
  });

  it("parses a decimal quantity", () => {
    expect(parseIngredientLine("2.5 oz butter")).toEqual({
      quantity: "2.5",
      unit: "oz",
      name: "butter",
    });
  });

  it("parses unicode fractions (½)", () => {
    expect(parseIngredientLine("½ cup milk")).toEqual({
      quantity: "1/2",
      unit: "cup",
      name: "milk",
    });
  });

  it("parses unicode fractions (¼)", () => {
    expect(parseIngredientLine("¼ tsp pepper")).toEqual({
      quantity: "1/4",
      unit: "tsp",
      name: "pepper",
    });
  });

  it("parses unicode fractions (¾)", () => {
    expect(parseIngredientLine("¾ cup cream")).toEqual({
      quantity: "3/4",
      unit: "cup",
      name: "cream",
    });
  });

  it("parses an ingredient without a unit", () => {
    expect(parseIngredientLine("3 large eggs")).toEqual({
      quantity: "3",
      unit: "",
      name: "large eggs",
    });
  });

  it("parses an ingredient without a quantity", () => {
    expect(parseIngredientLine("salt and pepper to taste")).toEqual({
      quantity: "",
      unit: "",
      name: "salt and pepper to taste",
    });
  });

  it("strips leading bullet points", () => {
    expect(parseIngredientLine("• 2 cups flour")).toEqual({
      quantity: "2",
      unit: "cups",
      name: "flour",
    });
  });

  it("strips leading dashes", () => {
    expect(parseIngredientLine("- 1 tbsp olive oil")).toEqual({
      quantity: "1",
      unit: "tbsp",
      name: "olive oil",
    });
  });

  it("strips leading numbered list (1. )", () => {
    expect(parseIngredientLine("1. 2 cups flour")).toEqual({
      quantity: "2",
      unit: "cups",
      name: "flour",
    });
  });

  it("strips parenthetical notes at the end", () => {
    expect(parseIngredientLine("2 cups spinach (optional)")).toEqual({
      quantity: "2",
      unit: "cups",
      name: "spinach",
    });
  });

  it("removes leading 'of' from name", () => {
    expect(parseIngredientLine("1 cup of flour")).toEqual({
      quantity: "1",
      unit: "cup",
      name: "flour",
    });
  });

  it("handles two-word units (fluid ounces)", () => {
    expect(parseIngredientLine("4 fluid ounces cream")).toEqual({
      quantity: "4",
      unit: "fluid ounces",
      name: "cream",
    });
  });

  it("handles empty string", () => {
    const result = parseIngredientLine("");
    expect(result.name).toBe("");
  });

  it("handles whitespace-only string", () => {
    const result = parseIngredientLine("   ");
    expect(result.name).toBe("");
  });

  it("removes trailing comma", () => {
    expect(parseIngredientLine("2 cups flour,")).toEqual({
      quantity: "2",
      unit: "cups",
      name: "flour",
    });
  });
});

// ──────────────────────────────────────────────
// parseIngredientsList
// ──────────────────────────────────────────────

describe("parseIngredientsList", () => {
  it("splits by newlines and parses each line", () => {
    const result = parseIngredientsList("2 cups flour\n1 tsp salt\n3 eggs");
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("flour");
    expect(result[1].name).toBe("salt");
    expect(result[2].name).toBe("eggs");
  });

  it("skips blank lines", () => {
    const result = parseIngredientsList("2 cups flour\n\n1 tsp salt\n\n");
    expect(result).toHaveLength(2);
  });

  it("handles single line input", () => {
    const result = parseIngredientsList("2 cups flour");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ quantity: "2", unit: "cups", name: "flour" });
  });
});

// ──────────────────────────────────────────────
// normalizeUnit
// ──────────────────────────────────────────────

describe("normalizeUnit", () => {
  it("normalizes 'cups' to 'cup'", () => {
    expect(normalizeUnit("cups")).toBe("cup");
  });

  it("normalizes 'tablespoons' to 'tbsp'", () => {
    expect(normalizeUnit("tablespoons")).toBe("tbsp");
  });

  it("normalizes 'teaspoons' to 'tsp'", () => {
    expect(normalizeUnit("teaspoons")).toBe("tsp");
  });

  it("normalizes 'ounces' to 'oz'", () => {
    expect(normalizeUnit("ounces")).toBe("oz");
  });

  it("normalizes 'pounds' to 'lb'", () => {
    expect(normalizeUnit("pounds")).toBe("lb");
  });

  it("normalizes 'lbs' to 'lb'", () => {
    expect(normalizeUnit("lbs")).toBe("lb");
  });

  it("normalizes 'grams' to 'g'", () => {
    expect(normalizeUnit("grams")).toBe("g");
  });

  it("normalizes 'milliliters' to 'ml'", () => {
    expect(normalizeUnit("milliliters")).toBe("ml");
  });

  it("handles uppercase input", () => {
    expect(normalizeUnit("CUPS")).toBe("cup");
  });

  it("returns unknown units unchanged", () => {
    expect(normalizeUnit("scoop")).toBe("scoop");
  });

  it("handles empty string", () => {
    expect(normalizeUnit("")).toBe("");
  });

  it("trims whitespace", () => {
    expect(normalizeUnit("  cups  ")).toBe("cup");
  });
});

// ──────────────────────────────────────────────
// parseQuantity
// ──────────────────────────────────────────────

describe("parseQuantity", () => {
  it("parses whole number", () => {
    expect(parseQuantity("2")).toBe(2);
  });

  it("parses fraction", () => {
    expect(parseQuantity("1/2")).toBe(0.5);
  });

  it("parses mixed number", () => {
    expect(parseQuantity("1 1/2")).toBe(1.5);
  });

  it("parses decimal", () => {
    expect(parseQuantity("2.5")).toBe(2.5);
  });

  it("returns 1 for empty string", () => {
    expect(parseQuantity("")).toBe(1);
  });

  it("returns 1 for whitespace", () => {
    expect(parseQuantity("  ")).toBe(1);
  });

  it("returns 1 for non-numeric string", () => {
    expect(parseQuantity("abc")).toBe(1);
  });

  it("parses 1/3", () => {
    expect(parseQuantity("1/3")).toBeCloseTo(0.333, 2);
  });

  it("parses 3/4", () => {
    expect(parseQuantity("3/4")).toBe(0.75);
  });

  it("parses 2 1/4", () => {
    expect(parseQuantity("2 1/4")).toBe(2.25);
  });
});

// ──────────────────────────────────────────────
// formatQuantity
// ──────────────────────────────────────────────

describe("formatQuantity", () => {
  it("formats whole numbers", () => {
    expect(formatQuantity(3)).toBe("3");
  });

  it("formats 0.5 as 1/2", () => {
    expect(formatQuantity(0.5)).toBe("1/2");
  });

  it("formats 0.25 as 1/4", () => {
    expect(formatQuantity(0.25)).toBe("1/4");
  });

  it("formats 0.75 as 3/4", () => {
    expect(formatQuantity(0.75)).toBe("3/4");
  });

  it("formats 1.5 as 1 1/2", () => {
    expect(formatQuantity(1.5)).toBe("1 1/2");
  });

  it("formats 2.25 as 2 1/4", () => {
    expect(formatQuantity(2.25)).toBe("2 1/4");
  });

  it("formats 1/3 as 1/3", () => {
    expect(formatQuantity(1 / 3)).toBe("1/3");
  });

  it("formats values near known fractions as fractions (1.7 ≈ 1 2/3)", () => {
    // 0.7 is within 0.05 of 2/3 (0.666...), so formatQuantity maps it to "1 2/3"
    expect(formatQuantity(1.7)).toBe("1 2/3");
  });

  it("formats values far from known fractions as decimals", () => {
    // 0.43 is not within 0.05 of any fraction in the lookup table
    // (3/8=0.375, 1/2=0.5 — gap of 0.055 and 0.07)
    expect(formatQuantity(1.43)).toBe("1.4");
  });

  it("formats 0 as 0", () => {
    expect(formatQuantity(0)).toBe("0");
  });

  it("formats 1 as 1", () => {
    expect(formatQuantity(1)).toBe("1");
  });
});

// ──────────────────────────────────────────────
// categorizeIngredient
// ──────────────────────────────────────────────

describe("categorizeIngredient", () => {
  it("categorizes produce items", () => {
    expect(categorizeIngredient("tomatoes")).toBe("produce");
    expect(categorizeIngredient("spinach")).toBe("produce");
    expect(categorizeIngredient("garlic")).toBe("produce");
    expect(categorizeIngredient("avocado")).toBe("produce");
  });

  it("categorizes dairy items", () => {
    expect(categorizeIngredient("milk")).toBe("dairy");
    expect(categorizeIngredient("butter")).toBe("dairy");
    expect(categorizeIngredient("eggs")).toBe("dairy");
    expect(categorizeIngredient("parmesan")).toBe("dairy");
  });

  it("categorizes meat items", () => {
    expect(categorizeIngredient("chicken")).toBe("meat");
    expect(categorizeIngredient("ground beef")).toBe("meat");
    expect(categorizeIngredient("salmon")).toBe("meat");
    expect(categorizeIngredient("bacon")).toBe("meat");
  });

  it("categorizes pantry items", () => {
    expect(categorizeIngredient("flour")).toBe("pantry");
    expect(categorizeIngredient("sugar")).toBe("pantry");
    expect(categorizeIngredient("olive oil")).toBe("pantry");
    expect(categorizeIngredient("rice")).toBe("pantry");
  });

  it("categorizes spices", () => {
    expect(categorizeIngredient("cumin")).toBe("spices");
    expect(categorizeIngredient("paprika")).toBe("spices");
    expect(categorizeIngredient("oregano")).toBe("spices");
  });

  it("categorizes frozen items", () => {
    expect(categorizeIngredient("frozen peas")).toBe("frozen");
    expect(categorizeIngredient("ice cream")).toBe("frozen");
  });

  it("categorizes bakery items", () => {
    expect(categorizeIngredient("bread")).toBe("bakery");
    expect(categorizeIngredient("tortillas")).toBe("bakery");
  });

  it("returns 'other' for unknown ingredients", () => {
    expect(categorizeIngredient("xanthan gum")).toBe("other");
    expect(categorizeIngredient("miso paste")).toBe("other");
  });

  it("is case-insensitive", () => {
    expect(categorizeIngredient("SPINACH")).toBe("produce");
    expect(categorizeIngredient("Chicken Breast")).toBe("meat");
  });

  it("does partial matching", () => {
    expect(categorizeIngredient("fresh spinach leaves")).toBe("produce");
    expect(categorizeIngredient("boneless chicken thighs")).toBe("meat");
  });
});
