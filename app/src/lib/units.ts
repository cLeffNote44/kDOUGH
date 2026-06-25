/**
 * Unit conversion for grocery-list consolidation.
 *
 * Converts compatible measurement units to a canonical base (volume → ml,
 * weight → g) so the same ingredient expressed in different units can be summed
 * into one line, then formatted back to a recipe-friendly unit. Countable units
 * (piece, can, clove…) and unitless amounts have no dimension and are NOT
 * converted — they stay grouped by their literal unit.
 *
 * Units here are the CANONICAL forms produced by normalizeUnit() in parser.ts.
 */

export type Dimension = "volume" | "weight";

// Factor to convert one unit into the dimension's base (ml for volume, g for weight).
const TO_BASE: Record<string, { dimension: Dimension; factor: number }> = {
  // Volume → ml
  ml: { dimension: "volume", factor: 1 },
  l: { dimension: "volume", factor: 1000 },
  tsp: { dimension: "volume", factor: 4.92892 },
  tbsp: { dimension: "volume", factor: 14.7868 },
  "fl oz": { dimension: "volume", factor: 29.5735 },
  cup: { dimension: "volume", factor: 236.588 },
  pt: { dimension: "volume", factor: 473.176 },
  qt: { dimension: "volume", factor: 946.353 },
  gal: { dimension: "volume", factor: 3785.41 },
  // Weight → g
  g: { dimension: "weight", factor: 1 },
  kg: { dimension: "weight", factor: 1000 },
  oz: { dimension: "weight", factor: 28.3495 },
  lb: { dimension: "weight", factor: 453.592 },
};

/** True if a (canonical) unit can be converted/summed across compatible units. */
export function isConvertibleUnit(unit: string): boolean {
  return unit in TO_BASE;
}

/** Dimension of a canonical unit, or null if it isn't convertible. */
export function dimensionOf(unit: string): Dimension | null {
  return TO_BASE[unit]?.dimension ?? null;
}

/** Convert an amount in a canonical unit to its base value, or null if not convertible. */
export function toBase(quantity: number, unit: string): number | null {
  const entry = TO_BASE[unit];
  return entry ? quantity * entry.factor : null;
}

/**
 * Format a base value back into a recipe-friendly unit for its dimension.
 * Volume picks cup/tbsp/tsp by magnitude; weight picks lb/oz. Returns the raw
 * numeric quantity (callers can pretty-print fractions with formatQuantity).
 */
export function fromBase(
  base: number,
  dimension: Dimension
): { quantity: number; unit: string } {
  if (dimension === "volume") {
    if (base >= TO_BASE.cup.factor) {
      return { quantity: base / TO_BASE.cup.factor, unit: "cup" };
    }
    if (base >= TO_BASE.tbsp.factor) {
      return { quantity: base / TO_BASE.tbsp.factor, unit: "tbsp" };
    }
    return { quantity: base / TO_BASE.tsp.factor, unit: "tsp" };
  }
  // weight
  if (base >= TO_BASE.lb.factor) {
    return { quantity: base / TO_BASE.lb.factor, unit: "lb" };
  }
  return { quantity: base / TO_BASE.oz.factor, unit: "oz" };
}
