/**
 * Environment variable validation — imported at app startup.
 *
 * Throws immediately with a helpful error message if any required
 * env vars are missing, instead of crashing later with a cryptic
 * "fetch failed" from Supabase.
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

// Optional but recommended for scraper
const optional = ["SCRAPER_TIMEOUT_MS", "ANTHROPIC_API_KEY"] as const;
void optional; // documented for reference; not validated (all optional)

// Skip the hard fail during `next build` (no runtime env is available while
// collecting page data / prerendering static pages) and during unit tests.
// Validation still runs whenever the server actually boots.
const skipValidation =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NODE_ENV === "test" ||
  !!process.env.VITEST;

if (!skipValidation) {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(
        `Missing required environment variable: ${key}\n` +
          "Copy .env.example to .env.local and fill in the values."
      );
    }
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? null,
  scraperTimeoutMs: parseInt(process.env.SCRAPER_TIMEOUT_MS ?? "15000", 10),
} as const;
