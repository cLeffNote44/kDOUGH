import { NextResponse } from "next/server";
import dns from "dns/promises";
import { createClient } from "@/lib/supabase/server";
import { scrapeRecipe } from "@/lib/import/scraper";
import { checkRateLimit } from "@/lib/rate-limit";

// Rate limit: 10 URL imports per hour per user
const IMPORT_RATE_LIMIT = { maxRequests: 10, windowMs: 60 * 60 * 1000 };

// ── SSRF Protection ──────────────────────────────────────────────────
// Block requests to private/internal IPs to prevent server-side request
// forgery attacks (e.g. probing cloud metadata endpoints or internal services).

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

async function isPrivateOrInternalUrl(hostname: string): Promise<boolean> {
  const lower = hostname.toLowerCase();

  // Direct hostname blocklist
  if (BLOCKED_HOSTNAMES.includes(lower)) return true;
  if (lower.endsWith(".local") || lower.endsWith(".internal")) return true;

  // If hostname looks like an IP literal, check directly
  if (PRIVATE_IP_PATTERNS.some((r) => r.test(lower))) return true;

  // DNS resolution — check where the hostname actually resolves to
  try {
    const addresses = await dns.resolve4(hostname);
    for (const addr of addresses) {
      if (PRIVATE_IP_PATTERNS.some((r) => r.test(addr))) return true;
    }
  } catch {
    // DNS resolution failed — hostname may be an IP literal already handled
    // above, or simply invalid (which fetch will reject)
  }

  // Also check IPv6 resolution
  try {
    const addresses = await dns.resolve6(hostname);
    for (const addr of addresses) {
      if (PRIVATE_IP_PATTERNS.some((r) => r.test(addr))) return true;
    }
  } catch {
    // No AAAA records — that's fine
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Verify auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const rateCheck = checkRateLimit(`import:${user.id}`, IMPORT_RATE_LIMIT);
  if (!rateCheck.allowed) {
    const retryAfterSec = Math.ceil((rateCheck.retryAfterMs ?? 0) / 1000);
    return NextResponse.json(
      { error: "Too many import requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      }
    );
  }

  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format and restrict to HTTP/HTTPS
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Only HTTP and HTTPS URLs are supported" },
        { status: 400 }
      );
    }

    // SSRF protection: block requests to private/internal networks
    if (await isPrivateOrInternalUrl(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "URLs pointing to internal or private networks are not allowed" },
        { status: 400 }
      );
    }

    const recipe = await scrapeRecipe(url);

    return NextResponse.json({ recipe });
  } catch (error) {
    // Log for debugging; in production consider a logging service
    console.error("Recipe import error:", error);
    return NextResponse.json(
      { error: "Failed to import recipe from this URL. Try a different link or add the recipe manually." },
      { status: 422 }
    );
  }
}
