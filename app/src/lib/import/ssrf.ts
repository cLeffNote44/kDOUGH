/**
 * SSRF protection for outbound fetches (recipe URL import).
 *
 * The previous design validated the user-supplied hostname once in the API
 * route, then let `fetch()` follow redirects with no re-validation — a redirect
 * (or DNS rebinding) to an internal address bypassed the guard entirely. This
 * module centralizes the check and applies it on every redirect hop via
 * `safeFetch`, so the validation can never be skipped.
 */

import dns from "dns/promises";
import { env } from "@/lib/env";

// Block requests to private/internal IP ranges (cloud metadata, loopback, LAN).
const PRIVATE_IP_PATTERNS = [
  /^127\./, // loopback
  /^10\./, // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^192\.168\./, // Class C private
  /^0\./, // "this" network
  /^169\.254\./, // link-local
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // carrier-grade NAT
  /^::1$/, // IPv6 loopback
  /^::$/, // IPv6 unspecified
  /^f[cd]/, // IPv6 unique-local (fc00::/7)
  /^fe80:/, // IPv6 link-local
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "0.0.0.0",
  "[::1]",
  "metadata.google.internal", // GCP metadata
  "169.254.169.254", // AWS/Azure/GCP metadata
];

/** True if a literal IP address string falls in a private/internal range. */
export function isPrivateIp(addr: string): boolean {
  return PRIVATE_IP_PATTERNS.some((r) => r.test(addr));
}

/**
 * Normalize an address before range-matching. Strips IPv6 brackets and
 * collapses IPv4-mapped IPv6 forms (e.g. `::ffff:127.0.0.1`, `::ffff:7f00:1`)
 * to their dotted-decimal IPv4 so the private-range regexes apply.
 */
export function normalizeAddr(addr: string): string {
  const a = addr.toLowerCase().trim().replace(/^\[/, "").replace(/\]$/, "");

  // ::ffff:127.0.0.1 — dotted-decimal IPv4-mapped IPv6
  const dotted = a.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted) return dotted[1];

  // ::ffff:7f00:1 — hex IPv4-mapped IPv6
  const hex = a.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
  }

  return a;
}

/**
 * Returns true if a hostname (or IP literal) is internal/private and must not
 * be fetched. Checks the blocklist, special suffixes, the literal form, and the
 * actual A/AAAA records the hostname resolves to.
 */
export async function isPrivateOrInternalUrl(hostname: string): Promise<boolean> {
  const lower = hostname.toLowerCase();

  // Direct hostname blocklist
  if (BLOCKED_HOSTNAMES.includes(lower)) return true;
  if (lower.endsWith(".local") || lower.endsWith(".internal")) return true;

  // If the hostname is itself an IP literal, check it directly.
  if (isPrivateIp(normalizeAddr(lower))) return true;

  // DNS resolution — check where the hostname actually points.
  try {
    const addresses = await dns.resolve4(hostname);
    for (const addr of addresses) {
      if (isPrivateIp(normalizeAddr(addr))) return true;
    }
  } catch {
    // DNS resolution failed — hostname may be an IP literal already handled
    // above, or simply invalid (which fetch will reject).
  }

  try {
    const addresses = await dns.resolve6(hostname);
    for (const addr of addresses) {
      if (isPrivateIp(normalizeAddr(addr))) return true;
    }
  } catch {
    // No AAAA records — that's fine.
  }

  return false;
}

export interface SafeFetchOptions {
  headers?: Record<string, string>;
  maxRedirects?: number;
  /** Total timeout across all redirect hops. Defaults to env.scraperTimeoutMs. */
  timeoutMs?: number;
}

/**
 * Fetch a URL with SSRF protection enforced on the initial request AND on every
 * redirect hop. Redirects are followed manually so each new Location is
 * re-validated against the private-IP guard before we connect to it.
 */
export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<Response> {
  const maxRedirects = options.maxRedirects ?? 5;
  const signal = AbortSignal.timeout(options.timeoutMs ?? env.scraperTimeoutMs);

  let currentUrl = url;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch {
      throw new Error("Invalid URL");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only HTTP and HTTPS URLs are supported");
    }
    if (await isPrivateOrInternalUrl(parsed.hostname)) {
      throw new Error("Blocked request to an internal or private address");
    }

    const response = await fetch(currentUrl, {
      headers: options.headers,
      redirect: "manual",
      signal,
    });

    // Manually follow 3xx so the redirect target is re-validated.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return response;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return response;
  }

  throw new Error("Too many redirects");
}
