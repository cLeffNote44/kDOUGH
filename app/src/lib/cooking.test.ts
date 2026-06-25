import { describe, it, expect } from "vitest";
import {
  timesCooked,
  lastCookedAt,
  currentStreak,
  daysSinceCooked,
  staleRecipes,
} from "./cooking";

// All cases pass an explicit `now` and UTC timestamps so they are deterministic.
const NOW = new Date("2026-06-25T12:00:00.000Z");
const ev = (cooked_at: string, recipe_id?: string) => ({ cooked_at, recipe_id });

describe("timesCooked", () => {
  it("is 0 for no events", () => {
    expect(timesCooked([])).toBe(0);
  });
  it("counts every event", () => {
    expect(timesCooked([ev("2026-06-01"), ev("2026-06-02")])).toBe(2);
  });
});

describe("lastCookedAt", () => {
  it("is null when never cooked", () => {
    expect(lastCookedAt([])).toBeNull();
  });
  it("returns the max timestamp even when events are unsorted", () => {
    const last = lastCookedAt([
      ev("2026-06-01T00:00:00Z"),
      ev("2026-06-20T00:00:00Z"),
      ev("2026-06-10T00:00:00Z"),
    ]);
    expect(last?.toISOString()).toBe("2026-06-20T00:00:00.000Z");
  });
  it("ignores unparseable timestamps", () => {
    expect(lastCookedAt([ev("not-a-date")])).toBeNull();
  });
});

describe("currentStreak", () => {
  it("is 0 with no events", () => {
    expect(currentStreak([], NOW)).toBe(0);
  });
  it("counts back-to-back weeks including the current one", () => {
    const events = [
      ev("2026-06-24T00:00:00Z"), // this week (0)
      ev("2026-06-17T00:00:00Z"), // last week (1)
      ev("2026-06-10T00:00:00Z"), // 2 weeks ago (2)
    ];
    expect(currentStreak(events, NOW)).toBe(3);
  });
  it("breaks the streak at the first gap", () => {
    const events = [
      ev("2026-06-24T00:00:00Z"), // week 0
      // no week 1
      ev("2026-06-10T00:00:00Z"), // week 2
    ];
    expect(currentStreak(events, NOW)).toBe(1);
  });
  it("is 0 when nothing was cooked this week", () => {
    expect(currentStreak([ev("2026-06-17T00:00:00Z")], NOW)).toBe(0);
  });
  it("dedups multiple cooks in the same week", () => {
    const events = [
      ev("2026-06-22T00:00:00Z"),
      ev("2026-06-24T00:00:00Z"),
    ];
    expect(currentStreak(events, NOW)).toBe(1);
  });
});

describe("daysSinceCooked", () => {
  it("is Infinity when never cooked", () => {
    expect(daysSinceCooked([], NOW)).toBe(Infinity);
  });
  it("is 0 when cooked earlier the same UTC day", () => {
    expect(daysSinceCooked([ev("2026-06-25T01:00:00Z")], NOW)).toBe(0);
  });
  it("counts whole days since the last cook", () => {
    expect(daysSinceCooked([ev("2026-06-20T00:00:00Z")], NOW)).toBe(5);
  });
});

describe("staleRecipes", () => {
  it("keeps only recipes past the threshold, most-stale first", () => {
    const events = [
      ev("2026-06-24T00:00:00Z", "fresh"), // 1 day ago
      ev("2026-05-01T00:00:00Z", "old"), // ~55 days ago
      ev("2026-05-20T00:00:00Z", "mid"), // ~36 days ago
    ];
    const result = staleRecipes(events, 30, NOW);
    expect(result.map((r) => r.recipeId)).toEqual(["old", "mid"]);
  });
  it("includes never-cooked recipes only when allRecipeIds is supplied", () => {
    const events = [ev("2026-06-24T00:00:00Z", "fresh")];
    expect(staleRecipes(events, 30, NOW)).toEqual([]);
    const withAll = staleRecipes(events, 30, NOW, ["fresh", "never"]);
    expect(withAll).toEqual([{ recipeId: "never", daysSince: Infinity }]);
  });
});
