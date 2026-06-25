/**
 * Ingredient parser — normalizes raw ingredient strings into structured data.
 *
 * Examples:
 *   "2 cups flour"           → { quantity: "2", unit: "cups", name: "flour" }
 *   "1/2 tsp salt"           → { quantity: "1/2", unit: "tsp", name: "salt" }
 *   "3 large eggs"           → { quantity: "3", unit: "", name: "large eggs" }
 *   "salt and pepper to taste" → { quantity: "", unit: "", name: "salt and pepper to taste" }
 */

import type { Ingredient } from "@/types";

// Common units (abbreviated and full)
const UNITS = new Set([
  // Volume
  "cup", "cups", "c",
  "tablespoon", "tablespoons", "tbsp", "tbs", "tb",
  "teaspoon", "teaspoons", "tsp", "ts",
  "fluid ounce", "fluid ounces", "fl oz",
  "quart", "quarts", "qt",
  "pint", "pints", "pt",
  "gallon", "gallons", "gal",
  "liter", "liters", "litre", "litres", "l",
  "milliliter", "milliliters", "millilitre", "millilitres", "ml",
  // Weight
  "ounce", "ounces", "oz",
  "pound", "pounds", "lb", "lbs",
  "gram", "grams", "g",
  "kilogram", "kilograms", "kg",
  // Count/other
  "piece", "pieces", "pc", "pcs",
  "slice", "slices",
  "can", "cans",
  "jar", "jars",
  "package", "packages", "pkg",
  "bunch", "bunches",
  "head", "heads",
  "clove", "cloves",
  "stalk", "stalks",
  "sprig", "sprigs",
  "pinch", "dash",
  "handful",
]);

// Match quantities like: 2, 1/2, 1 1/2, ½, 2.5, ¼
const QUANTITY_PATTERN = /^([\d]+[\s][\d]+\/[\d]+|[\d]+\/[\d]+|[\d]+\.[\d]+|[\d]+|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/;

// Unicode fraction map
const FRACTION_MAP: Record<string, string> = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

function normalizeFractions(text: string): string {
  for (const [unicode, ascii] of Object.entries(FRACTION_MAP)) {
    text = text.replace(new RegExp(unicode, "g"), ascii);
  }
  return text;
}

export function parseIngredientLine(raw: string): Ingredient {
  let text = raw.trim();

  // Remove leading bullet points, dashes, asterisks, numbers with dots
  text = text.replace(/^[\s]*[-•*▪]\s*/, "");
  text = text.replace(/^\d+\.\s+/, "");

  // Normalize unicode fractions
  text = normalizeFractions(text);

  // Strip parenthetical notes at the end like "(optional)" or "(about 2 cups)"
  const notes = text.match(/\s*\(.*?\)\s*$/);
  if (notes) {
    text = text.replace(/\s*\(.*?\)\s*$/, "").trim();
  }

  // Try to extract quantity
  const qtyMatch = text.match(QUANTITY_PATTERN);
  let quantity = "";
  if (qtyMatch) {
    quantity = qtyMatch[1].trim();
    text = text.slice(qtyMatch[0].length).trim();
  }

  // Try to extract unit
  let unit = "";
  // Check for unit at the start of remaining text
  const words = text.split(/\s+/);
  if (words.length > 1) {
    // Check 2-word units first (e.g., "fluid ounce")
    const twoWord = (words[0] + " " + words[1]).toLowerCase();
    if (UNITS.has(twoWord)) {
      unit = twoWord;
      text = words.slice(2).join(" ");
    } else if (UNITS.has(words[0].toLowerCase())) {
      unit = words[0].toLowerCase();
      text = words.slice(1).join(" ");
    }
  }

  // Clean up remaining name
  let name = text
    .replace(/^of\s+/i, "") // Remove leading "of" (e.g., "cups of flour" → "flour")
    .replace(/,\s*$/, "") // Remove trailing comma
    .trim();

  // If we got nothing useful, return the original
  if (!name && !quantity && !unit) {
    name = raw.trim();
  }

  return { quantity, unit, name };
}

export function parseIngredientsList(raw: string): Ingredient[] {
  return raw
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseIngredientLine);
}

/**
 * Grocery store category mapping for common ingredients.
 * Used during grocery list generation.
 */
export const CATEGORY_MAP: Record<string, string> = {
  // Produce
  lettuce: "produce", tomato: "produce", tomatoes: "produce", onion: "produce",
  onions: "produce", garlic: "produce", potato: "produce", potatoes: "produce",
  carrot: "produce", carrots: "produce", celery: "produce", pepper: "produce",
  peppers: "produce", broccoli: "produce", spinach: "produce", kale: "produce",
  avocado: "produce", lemon: "produce", lemons: "produce", lime: "produce",
  limes: "produce", apple: "produce", apples: "produce", banana: "produce",
  bananas: "produce", berries: "produce", mushrooms: "produce", cucumber: "produce",
  zucchini: "produce", ginger: "produce", cilantro: "produce", parsley: "produce",
  basil: "produce", mint: "produce", "green onions": "produce", scallions: "produce",
  corn: "produce", "jalapeño": "produce", "jalapeños": "produce",

  // Dairy
  milk: "dairy", butter: "dairy", cheese: "dairy", cream: "dairy",
  "sour cream": "dairy", yogurt: "dairy", "cream cheese": "dairy",
  "heavy cream": "dairy", "half and half": "dairy", eggs: "dairy", egg: "dairy",
  parmesan: "dairy", mozzarella: "dairy", cheddar: "dairy",

  // Meat
  chicken: "meat", beef: "meat", pork: "meat", "ground beef": "meat",
  "ground turkey": "meat", turkey: "meat", steak: "meat", bacon: "meat",
  sausage: "meat", "chicken breast": "meat", "chicken thighs": "meat",
  salmon: "meat", shrimp: "meat", fish: "meat", lamb: "meat",

  // Pantry
  flour: "pantry", sugar: "pantry", salt: "pantry", "olive oil": "pantry",
  "vegetable oil": "pantry", vinegar: "pantry", "soy sauce": "pantry",
  rice: "pantry", pasta: "pantry", noodles: "pantry", "chicken broth": "pantry",
  broth: "pantry", stock: "pantry", "tomato sauce": "pantry",
  "tomato paste": "pantry", "canned tomatoes": "pantry", beans: "pantry",
  "black beans": "pantry", lentils: "pantry", oats: "pantry",
  "baking powder": "pantry", "baking soda": "pantry", vanilla: "pantry",
  honey: "pantry", "maple syrup": "pantry", ketchup: "pantry",
  mustard: "pantry", mayonnaise: "pantry", "hot sauce": "pantry",
  "coconut milk": "pantry", "peanut butter": "pantry",

  // Spices
  "black pepper": "spices", cumin: "spices",
  paprika: "spices", "chili powder": "spices", oregano: "spices",
  thyme: "spices", "bay leaf": "spices", cinnamon: "spices",
  nutmeg: "spices", turmeric: "spices", "red pepper flakes": "spices",
  "garlic powder": "spices", "onion powder": "spices",
  "italian seasoning": "spices",

  // Frozen
  "frozen peas": "frozen", "frozen corn": "frozen",
  "frozen berries": "frozen", "ice cream": "frozen",

  // Bakery
  bread: "bakery", tortillas: "bakery", buns: "bakery",
  "pita bread": "bakery", rolls: "bakery",
};

// ============================================
// UNIT NORMALIZATION (used by grocery list aggregation)
// ============================================

const UNIT_ALIASES: Record<string, string> = {
  cups: "cup", c: "cup",
  tablespoons: "tbsp", tablespoon: "tbsp", tbs: "tbsp", tb: "tbsp",
  teaspoons: "tsp", teaspoon: "tsp", ts: "tsp",
  ounces: "oz", ounce: "oz",
  pounds: "lb", pound: "lb", lbs: "lb",
  grams: "g", gram: "g",
  kilograms: "kg", kilogram: "kg",
  liters: "l", liter: "l", litres: "l", litre: "l",
  milliliters: "ml", milliliter: "ml", millilitres: "ml", millilitre: "ml",
  quarts: "qt", quart: "qt",
  pints: "pt", pint: "pt",
  gallons: "gal", gallon: "gal",
  cloves: "clove",
  slices: "slice",
  cans: "can",
  jars: "jar",
  packages: "pkg", package: "pkg",
  bunches: "bunch",
  heads: "head",
  stalks: "stalk",
  sprigs: "sprig",
  pieces: "piece", pcs: "piece", pc: "piece",
  "fluid ounces": "fl oz", "fluid ounce": "fl oz",
};

/**
 * Normalize a unit string to a canonical form for consolidation.
 * e.g. "cups" → "cup", "tablespoons" → "tbsp", "ounces" → "oz"
 */
export function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase().trim();
  return UNIT_ALIASES[u] || u;
}

/**
 * Parse a quantity string (e.g., "2", "1/2", "1 1/2") into a number.
 */
export function parseQuantity(q: string): number {
  if (!q || q.trim() === "") return 1;
  const trimmed = q.trim();

  // Mixed number: "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
  }

  // Fraction: "1/2"
  const fracMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    return parseInt(fracMatch[1]) / parseInt(fracMatch[2]);
  }

  // Decimal or whole number
  const num = parseFloat(trimmed);
  return isNaN(num) ? 1 : num;
}

/**
 * Format a number back to a friendly string.
 * e.g. 1.5 → "1 1/2", 0.25 → "1/4", 3 → "3"
 */
export function formatQuantity(n: number): string {
  if (n === Math.floor(n)) return n.toString();

  const whole = Math.floor(n);
  const frac = n - whole;

  const fractions: [number, string][] = [
    [1 / 8, "1/8"], [1 / 4, "1/4"], [1 / 3, "1/3"],
    [3 / 8, "3/8"], [1 / 2, "1/2"], [5 / 8, "5/8"],
    [2 / 3, "2/3"], [3 / 4, "3/4"], [7 / 8, "7/8"],
  ];

  for (const [val, str] of fractions) {
    if (Math.abs(frac - val) < 0.05) {
      return whole > 0 ? `${whole} ${str}` : str;
    }
  }

  return n.toFixed(1).replace(/\.0$/, "");
}

// ============================================
// GROCERY CONSOLIDATION (used by grocery list generation)
// ============================================

/**
 * Prep/grade adjectives that don't change *what you buy*. Stripped when
 * building the consolidation key so "shredded mozzarella" merges with
 * "mozzarella". Intentionally conservative — words that change the product
 * (e.g. "dried", "whole", "unsalted", colors) are deliberately excluded.
 */
const NAME_STOP_WORDS = new Set([
  "fresh", "freshly", "finely", "coarsely", "roughly", "thinly", "thickly",
  "chopped", "minced", "diced", "sliced", "grated", "shredded", "crushed",
  "packed", "sifted", "softened", "melted", "divided",
  "large", "small", "medium", "jumbo", "ripe", "lean",
]);

/** Light singularization for matching (eggs→egg, tomatoes→tomato, berries→berry). */
function singularizeWord(w: string): string {
  if (w.length <= 3) return w;
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.endsWith("oes")) return w.slice(0, -2);
  if (w.endsWith("ses") || w.endsWith("xes") || w.endsWith("ches") || w.endsWith("shes"))
    return w.slice(0, -2);
  if (w.endsWith("ss")) return w; // glass, molasses
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

/**
 * Canonical form of an ingredient name, used only as a grouping key for
 * consolidation. Lowercases, collapses whitespace, drops prep adjectives, and
 * singularizes each word so the same item written different ways merges.
 */
export function canonicalizeIngredientName(name: string): string {
  const cleaned = name.toLowerCase().trim().replace(/\s+/g, " ");
  const words = cleaned
    .split(" ")
    .filter((w) => w && !NAME_STOP_WORDS.has(w))
    .map(singularizeWord);
  const result = words.join(" ").trim();
  return result || cleaned;
}

/**
 * Parse a quantity string into a number, or null if it is empty/unparseable
 * (e.g. "to taste"). Unlike parseQuantity, does NOT default to 1 — so
 * unquantified ingredients stay unquantified instead of inflating totals.
 */
export function parseQuantityStrict(q: string): number | null {
  const trimmed = (q ?? "").trim();
  if (trimmed === "") return null;
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  const frac = trimmed.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

export interface RawGroceryIngredient {
  name: string;
  unit: string;
  quantity: string;
  recipeId: string;
}

export interface ConsolidatedGroceryItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  recipeIds: string[];
}

/**
 * Merge ingredients drawn from many recipes into a deduplicated shopping list.
 * Items combine when their canonical name AND normalized unit match, summing
 * quantities across recipes. Items with no quantity stay unquantified rather
 * than counting as 1.
 *
 * Limitation: the same item in *different* units (e.g. "1 cup" + "2 tbsp") is
 * kept as separate lines — no unit conversion is attempted.
 */
export function consolidateIngredients(
  items: RawGroceryIngredient[]
): ConsolidatedGroceryItem[] {
  const groups = new Map<string, {
    name: string;
    unit: string | null;
    qty: number | null;
    recipeIds: Set<string>;
  }>();

  for (const item of items) {
    const displayName = item.name.trim();
    if (!displayName) continue;

    const canonical = canonicalizeIngredientName(displayName);
    const unit = normalizeUnit(item.unit || "") || "";
    const key = `${canonical}|${unit}`;
    const qty = parseQuantityStrict(item.quantity);

    let group = groups.get(key);
    if (!group) {
      group = { name: displayName, unit: unit || null, qty: null, recipeIds: new Set() };
      groups.set(key, group);
    }

    group.recipeIds.add(item.recipeId);
    if (qty !== null) group.qty = (group.qty ?? 0) + qty;
    // Prefer the shortest original name for display (usually the cleanest base).
    if (displayName.length < group.name.length) group.name = displayName;
  }

  return Array.from(groups.values()).map((g) => ({
    name: g.name,
    quantity: g.qty,
    unit: g.unit,
    recipeIds: Array.from(g.recipeIds),
  }));
}

export function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase().trim();

  // Direct match
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];

  // Partial match — check if any key is contained in the name
  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return category;
  }

  return "other";
}
