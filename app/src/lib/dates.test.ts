import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMonday, toDateString, getCurrentWeekStart } from "./dates";

describe("getMonday", () => {
  it("returns the date itself when given a Monday string", () => {
    // 2025-03-03 is a Monday
    const result = getMonday("2025-03-03");
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(2); // March = 2
    expect(result.getDate()).toBe(3);
  });

  it("parses any date string at midnight local time", () => {
    const result = getMonday("2025-06-15");
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it("returns the Monday of the current week when no arg is given", () => {
    const result = getMonday();
    const day = result.getDay();
    // getDay() should be 1 (Monday)
    expect(day).toBe(1);
  });

  it("returns the Monday of the current week for a Sunday date via no-arg", () => {
    // Mock a Sunday: 2025-03-09 is a Sunday
    const sundayDate = new Date(2025, 2, 9, 12, 0, 0); // Mar 9, 2025 (Sunday)
    vi.useFakeTimers();
    vi.setSystemTime(sundayDate);

    const result = getMonday();
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(3); // Mar 3 is the Monday of that week

    vi.useRealTimers();
  });

  it("handles week start when today is Monday", () => {
    const mondayDate = new Date(2025, 2, 3, 12, 0, 0); // Mar 3, 2025 (Monday)
    vi.useFakeTimers();
    vi.setSystemTime(mondayDate);

    const result = getMonday();
    expect(result.getDate()).toBe(3);

    vi.useRealTimers();
  });

  it("handles week start when today is Wednesday", () => {
    const wedDate = new Date(2025, 2, 5, 12, 0, 0); // Mar 5, 2025 (Wednesday)
    vi.useFakeTimers();
    vi.setSystemTime(wedDate);

    const result = getMonday();
    expect(result.getDate()).toBe(3); // Monday of that week

    vi.useRealTimers();
  });

  it("handles week start when today is Saturday", () => {
    const satDate = new Date(2025, 2, 8, 12, 0, 0); // Mar 8, 2025 (Saturday)
    vi.useFakeTimers();
    vi.setSystemTime(satDate);

    const result = getMonday();
    expect(result.getDate()).toBe(3);

    vi.useRealTimers();
  });
});

describe("toDateString", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const date = new Date("2025-03-15T00:00:00");
    const result = toDateString(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("pads single-digit months and days", () => {
    // Use local time constructor to avoid UTC offset issues
    const date = new Date(2025, 0, 5); // Jan 5, 2025 local
    const result = toDateString(date);
    expect(result).toBe("2025-01-05");
  });

  it("handles December 31", () => {
    const date = new Date(2025, 11, 31); // Dec 31, 2025 local
    const result = toDateString(date);
    expect(result).toBe("2025-12-31");
  });

  it("handles January 1", () => {
    const date = new Date(2025, 0, 1); // Jan 1, 2025 local
    const result = toDateString(date);
    expect(result).toBe("2025-01-01");
  });

  it("uses local time, not UTC", () => {
    // 11pm EDT on March 15 = March 16 in UTC
    // toDateString should return March 15 (the local date)
    const date = new Date(2025, 2, 15, 23, 0, 0); // Mar 15 at 11pm local
    expect(toDateString(date)).toBe("2025-03-15");
  });
});

describe("getCurrentWeekStart", () => {
  it("returns a YYYY-MM-DD string", () => {
    const result = getCurrentWeekStart();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns a Monday", () => {
    const result = getCurrentWeekStart();
    const date = new Date(result + "T00:00:00");
    expect(date.getDay()).toBe(1);
  });
});
