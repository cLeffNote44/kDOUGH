/**
 * Shared date utilities for week-based calculations.
 *
 * The app's calendar and grocery features are organized by ISO weeks
 * (Monday–Sunday). These helpers ensure consistent Monday calculation
 * across server components and client components.
 */

/**
 * Get the Monday of a given week.
 *
 * @param dateStr - An ISO date string (e.g. "2025-03-03"). If provided,
 *   it's assumed to already represent a Monday (used for week navigation).
 *   If omitted, returns the Monday of the current week.
 * @returns A Date object set to midnight local time on the Monday.
 */
export function getMonday(dateStr?: string): Date {
  if (dateStr) {
    return new Date(dateStr + "T00:00:00");
  }

  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ...
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return monday;
}

/**
 * Format a Date as an ISO date string (YYYY-MM-DD).
 */
export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get the Monday of the current week as an ISO date string.
 */
export function getCurrentWeekStart(): string {
  return toDateString(getMonday());
}
