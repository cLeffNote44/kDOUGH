import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DNS so resolution-based checks are deterministic and offline.
vi.mock("dns/promises", () => ({
  default: {
    resolve4: vi.fn(),
    resolve6: vi.fn(),
  },
}));

import dns from "dns/promises";
import { isPrivateOrInternalUrl, isPrivateIp, normalizeAddr } from "./ssrf";

const mockResolve4 = dns.resolve4 as unknown as ReturnType<typeof vi.fn>;
const mockResolve6 = dns.resolve6 as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  // Default: nothing resolves (so literal-form checks are exercised in isolation).
  mockResolve4.mockRejectedValue(new Error("ENOTFOUND"));
  mockResolve6.mockRejectedValue(new Error("ENOTFOUND"));
});

describe("isPrivateIp", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.0.1",
    "0.0.0.0",
    "169.254.169.254",
    "100.64.0.1",
    "::1",
    "fc00::1",
    "fd12::3",
    "fe80::1",
  ])("flags private/internal literal %s", (addr) => {
    expect(isPrivateIp(addr)).toBe(true);
  });

  it.each(["93.184.216.34", "8.8.8.8", "1.1.1.1", "172.32.0.1", "11.0.0.1"])(
    "passes public literal %s",
    (addr) => {
      expect(isPrivateIp(addr)).toBe(false);
    }
  );
});

describe("normalizeAddr", () => {
  it("collapses dotted IPv4-mapped IPv6", () => {
    expect(normalizeAddr("::ffff:127.0.0.1")).toBe("127.0.0.1");
  });
  it("collapses hex IPv4-mapped IPv6", () => {
    expect(normalizeAddr("::ffff:7f00:1")).toBe("127.0.0.1");
  });
  it("strips IPv6 brackets", () => {
    expect(normalizeAddr("[::1]")).toBe("::1");
  });
});

describe("isPrivateOrInternalUrl", () => {
  it.each([
    "localhost",
    "0.0.0.0",
    "metadata.google.internal",
    "169.254.169.254",
    "foo.local",
    "bar.internal",
    "127.0.0.1",
    "10.0.0.5",
    "192.168.1.1",
    "[::1]",
    "[::ffff:127.0.0.1]",
  ])("blocks %s", async (host) => {
    expect(await isPrivateOrInternalUrl(host)).toBe(true);
  });

  it("allows a public hostname that resolves to a public IP", async () => {
    mockResolve4.mockResolvedValueOnce(["93.184.216.34"]);
    expect(await isPrivateOrInternalUrl("example.com")).toBe(false);
  });

  it("blocks a public-looking hostname that resolves to a private IP (DNS rebinding)", async () => {
    mockResolve4.mockResolvedValueOnce(["127.0.0.1"]);
    expect(await isPrivateOrInternalUrl("evil.example.com")).toBe(true);
  });

  it("blocks a hostname whose only AAAA record is internal", async () => {
    mockResolve6.mockResolvedValueOnce(["::1"]);
    expect(await isPrivateOrInternalUrl("v6.example.com")).toBe(true);
  });

  it("blocks a hostname resolving to an IPv4-mapped-IPv6 private address", async () => {
    mockResolve6.mockResolvedValueOnce(["::ffff:127.0.0.1"]);
    expect(await isPrivateOrInternalUrl("mapped.example.com")).toBe(true);
  });
});
