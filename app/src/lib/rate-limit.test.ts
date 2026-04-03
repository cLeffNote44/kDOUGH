import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  resetAllRateLimits,
} from "./rate-limit";

const config = { maxRequests: 3, windowMs: 1000 };

beforeEach(() => {
  resetAllRateLimits();
});

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const r1 = checkRateLimit("user1", config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit("user1", config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit("user1", config);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests over the limit", () => {
    checkRateLimit("user2", config);
    checkRateLimit("user2", config);
    checkRateLimit("user2", config);

    const r4 = checkRateLimit("user2", config);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks different keys independently", () => {
    checkRateLimit("a", config);
    checkRateLimit("a", config);
    checkRateLimit("a", config);

    // 'a' is exhausted, but 'b' should still be allowed
    const rA = checkRateLimit("a", config);
    expect(rA.allowed).toBe(false);

    const rB = checkRateLimit("b", config);
    expect(rB.allowed).toBe(true);
  });

  it("resets correctly", () => {
    checkRateLimit("c", config);
    checkRateLimit("c", config);
    checkRateLimit("c", config);

    expect(checkRateLimit("c", config).allowed).toBe(false);

    resetRateLimit("c");

    expect(checkRateLimit("c", config).allowed).toBe(true);
    expect(checkRateLimit("c", config).remaining).toBe(1);
  });

  it("allows requests again after the window expires", async () => {
    const shortConfig = { maxRequests: 1, windowMs: 50 };

    checkRateLimit("d", shortConfig);
    expect(checkRateLimit("d", shortConfig).allowed).toBe(false);

    // Wait for the window to expire
    await new Promise((r) => setTimeout(r, 60));

    expect(checkRateLimit("d", shortConfig).allowed).toBe(true);
  });
});
