import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase SSR client so we can drive the authed/unauthed branches.
const getUser = vi.hoisted(() => vi.fn());
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser } }),
}));

import { NextRequest } from "next/server";
import { updateSession } from "./middleware";

function request(path: string) {
  return new NextRequest(new URL(`http://localhost:3000${path}`));
}

function locationOf(res: Response): string | null {
  return res.headers.get("location");
}

describe("updateSession (auth route guard)", () => {
  beforeEach(() => getUser.mockReset());

  it("redirects an unauthenticated user to /login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await updateSession(request("/recipes"));
    expect(res.status).toBe(307);
    expect(locationOf(res)).toContain("/login");
  });

  it.each(["/login", "/auth/callback", "/reset-password"])(
    "lets an unauthenticated user reach the public route %s",
    async (path) => {
      getUser.mockResolvedValue({ data: { user: null } });
      const res = await updateSession(request(path));
      expect(locationOf(res)).toBeNull();
    }
  );

  it("redirects an authenticated user away from /login to /", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await updateSession(request("/login"));
    expect(res.status).toBe(307);
    const loc = locationOf(res);
    expect(loc && new URL(loc).pathname).toBe("/");
  });

  it("lets an authenticated user through to an app page", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await updateSession(request("/grocery"));
    expect(locationOf(res)).toBeNull();
  });

  it("does not redirect an authenticated user on /auth/callback", async () => {
    // Only /login bounces authed users; auth callbacks must pass through so the
    // session-exchange handler can run.
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await updateSession(request("/auth/callback"));
    expect(locationOf(res)).toBeNull();
  });

  it("redirects an unauthenticated user from a nested protected path to /login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await updateSession(request("/recipes/123/edit"));
    expect(res.status).toBe(307);
    const loc = locationOf(res);
    expect(loc && new URL(loc).pathname).toBe("/login");
  });

  it("keeps the login redirect on the same host (no open redirect)", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await updateSession(request("/recipes"));
    const loc = locationOf(res);
    expect(loc && new URL(loc).host).toBe("localhost:3000");
  });
});
