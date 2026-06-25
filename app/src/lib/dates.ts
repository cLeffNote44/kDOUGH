/**
 * Shared date utilities for week-based calculations.
 *
 * The app's calendar and grocery features are organized by ISO weeks
 * (Monday–Sunday). These helpers ensure consistent Monday calculation
 * across server components and client components.
 */

/**
 * Get the Monday of the week containing a given date.
 *
 * @param dateStr - An ISO date string (e.g. "2025-03-03"). Any day of the week
 *   is normalized to the Monday of its week, so the result is idempotent and a
 *   stale/shared `?week=` param pointing at a non-Monday can't desync the
 *   calendar from the grocery list. If omitted, uses today.
 * @returns A Date object set to midnight local time on the Monday.
 */
export function getMonday(dateStr?: string): Date {
  const base = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const day = base.getDay(); // 0 = Sunday, 1 = Monday, ...
  const monday = new Date(base);
  monday.setDate(base.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Format a Date as an ISO date string (YYYY-MM-DD) in **local** time.
 *
 * IMPORTANT: Do NOT use `date.toISOString().split("T")[0]` — that converts
 * to UTC first, which shifts the date forward by a day for users in US
 * timezones after ~5-8pm local time.
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Get the Monday of the current week as an ISO date string.
 */
export function getCurrentWeekStart(): string {
  return toDateString(getMonday());
}
