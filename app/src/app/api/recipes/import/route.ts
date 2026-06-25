import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeRecipe } from "@/lib/import/scraper";
import { isPrivateOrInternalUrl } from "@/lib/import/ssrf";
import { checkRateLimit } from "@/lib/rate-limit";

// Rate limit: 10 URL imports per hour per user
const IMPORT_RATE_LIMIT = { maxRequests: 10, windowMs: 60 * 60 * 1000 };

// SSRF protection lives in @/lib/import/ssrf so the same guard runs here (fail
// fast on the user-supplied URL) AND inside scrapeRecipe's safeFetch on every
// redirect hop. Keep the pre-check here for a clear 400 before any fetch.

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
