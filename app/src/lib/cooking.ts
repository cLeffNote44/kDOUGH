import type { CookEvent } from "@/types";

/**
 * Pure cook-history helpers. No DB / Supabase imports — they take plain event
 * arrays + ISO strings so they are deterministic and Vitest-unit-testable
 * (siblings to scale-recipe.ts / grocery-aggregate.ts). All day math is
 * UTC-bucketed to stay TZ-independent.
 */

/** A minimal event shape so callers can pass partial rows. */
type CookLike = Pick<CookEvent, "cooked_at"> & { recipe_id?: string };

/** Total number of times a recipe was cooked. */
export function timesCooked(events: CookLike[]): number {
  return events.length;
}

/** Most recent cooked_at as a Date, or null if never cooked. */
export function lastCookedAt(events: CookLike[]): Date | null {
  let latest: number | null = null;
  for (const e of events) {
    const t = new Date(e.cooked_at).getTime();
    if (!isNaN(t) && (latest === null || t > latest)) latest = t;
  }
  return latest === null ? null : new Date(latest);
}

/** UTC midnight day-index (days since epoch) for stable bucketing. */
function dayIndex(d: Date): number {
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000
  );
}

/**
 * Consecutive-WEEK streak: number of back-to-back 7-day buckets (anchored to
 * `now`) in which the recipe was cooked at least once, counting back from the
 * week containing `now`. Weeks (not days) match weekly home-cooking cadence — a
 * daily streak breaks the first day you skip.
 *
 * Returns 0 if the current week has no cook (streak already broken).
 */
export function currentStreak(events: CookLike[], now: Date = new Date()): number {
  if (events.length === 0) return 0;
  const nowDay = dayIndex(now);
  // Map each event to "weeks ago" relative to now (0 = this week).
  const weeks = new Set<number>();
  for (const e of events) {
    const t = new Date(e.cooked_at);
    if (isNaN(t.getTime())) continue;
    const diff = Math.floor((nowDay - dayIndex(t)) / 7);
    if (diff >= 0) weeks.add(diff);
  }
  let streak = 0;
  while (weeks.has(streak)) streak++;
  return streak;
}

/** Whole days since a recipe was last cooked; Infinity if never. */
export function daysSinceCooked(
  events: CookLike[],
  now: Date = new Date()
): number {
  const last = lastCookedAt(events);
  if (last === null) return Infinity;
  return dayIndex(now) - dayIndex(last);
}

export interface StaleRecipe {
  recipeId: string;
  daysSince: number; // Infinity => never cooked
}

/**
 * "Haven't made in N days" list. Groups events by recipe_id, keeps recipes whose
 * last cook is >= thresholdDays ago (never-cooked recipes pass via Infinity when
 * included in `allRecipeIds`), sorted most-stale first.
 *
 * @param events        all of the user's cook events (any recipes)
 * @param thresholdDays e.g. 30
 * @param now           reference "today"
 * @param allRecipeIds  optional full set so never-cooked recipes can appear
 */
export function staleRecipes(
  events: CookLike[],
  thresholdDays: number,
  now: Date = new Date(),
  allRecipeIds?: string[]
): StaleRecipe[] {
  const byRecipe = new Map<string, CookLike[]>();
  for (const e of events) {
    if (!e.recipe_id) continue;
    const arr = byRecipe.get(e.recipe_id) ?? [];
    arr.push(e);
    byRecipe.set(e.recipe_id, arr);
  }
  const ids = allRecipeIds ?? Array.from(byRecipe.keys());
  const out: StaleRecipe[] = [];
  for (const id of ids) {
    const evs = byRecipe.get(id) ?? [];
    const daysSince = daysSinceCooked(evs, now);
    if (daysSince >= thresholdDays) out.push({ recipeId: id, daysSince });
  }
  return out.sort((a, b) => b.daysSince - a.daysSince);
}
