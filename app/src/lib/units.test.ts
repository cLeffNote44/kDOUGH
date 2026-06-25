import { describe, it, expect } from "vitest";
import { isConvertibleUnit, dimensionOf, toBase, fromBase } from "./units";

describe("isConvertibleUnit / dimensionOf", () => {
  it("classifies volume units", () => {
    for (const u of ["ml", "l", "tsp", "tbsp", "fl oz", "cup", "pt", "qt", "gal"]) {
      expect(isConvertibleUnit(u)).toBe(true);
      expect(dimensionOf(u)).toBe("volume");
    }
  });
  it("classifies weight units", () => {
    for (const u of ["g", "kg", "oz", "lb"]) {
      expect(isConvertibleUnit(u)).toBe(true);
      expect(dimensionOf(u)).toBe("weight");
    }
  });
  it("rejects countable/unitless units", () => {
    for (const u of ["", "clove", "can", "piece", "bunch", "scoop"]) {
      expect(isConvertibleUnit(u)).toBe(false);
      expect(dimensionOf(u)).toBeNull();
    }
  });
});

describe("toBase", () => {
  it("converts volume to ml", () => {
    expect(toBase(1, "cup")).toBeCloseTo(236.588, 2);
    expect(toBase(1, "tbsp")).toBeCloseTo(14.7868, 3);
    expect(toBase(1, "l")).toBe(1000);
  });
  it("converts weight to g", () => {
    expect(toBase(1, "lb")).toBeCloseTo(453.592, 2);
    expect(toBase(1, "kg")).toBe(1000);
  });
  it("returns null for non-convertible units", () => {
    expect(toBase(2, "clove")).toBeNull();
  });
});

describe("fromBase", () => {
  it("formats volume by magnitude", () => {
    expect(fromBase(236.588 * 3, "volume")).toEqual({ quantity: 3, unit: "cup" });
    expect(fromBase(14.7868 * 2, "volume").unit).toBe("tbsp");
    expect(fromBase(4.92892, "volume").unit).toBe("tsp");
  });
  it("formats weight by magnitude", () => {
    expect(fromBase(453.592 * 2, "weight")).toEqual({ quantity: 2, unit: "lb" });
    expect(fromBase(28.3495 * 4, "weight").unit).toBe("oz");
  });
});
