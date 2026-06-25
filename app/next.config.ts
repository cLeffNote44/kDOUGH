import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Standalone output is needed ONLY for Electron packaging (main.js loads the
// flat .next/standalone/server.js). It must NOT be set on Vercel: Vercel manages
// its own build output, and since Next 16.2's Turbopack builder the standalone
// layout stopped writing the .next/package.json that Vercel's post-build step
// expects — which made every Vercel deploy fail with `ENOENT ... .next/package.json`.
// Vercel always sets VERCEL=1 during builds, so gate standalone off there and
// keep it for local/Electron builds.
const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  output: isVercel ? undefined : "standalone",
  // Pin tracing root to the project directory so the standalone build outputs
  // server.js at .next/standalone/server.js (flat) instead of nesting it
  // under the full filesystem path (Desktop/KaitohDough/app/server.js).
  // Required for Electron packaging — main.js expects a flat layout.
  // process.cwd() is reliable here because Next.js always runs from the project root.
  // Gated off on Vercel: with Next 16.2's Turbopack builder a custom tracing root
  // makes the @vercel/next post-build step look for a `.next/package.json` that is
  // never written, erroring the deploy. Vercel traces from the project root by
  // default, so it needs neither this nor `output: standalone`.
  outputFileTracingRoot: isVercel ? undefined : process.cwd(),
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing (stops browsers from interpreting files as scripts)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Block embedding in iframes (clickjacking protection)
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Control how much referrer info is sent with requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features the app doesn't need
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Content Security Policy - restricts resources to trusted sources
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
          },
        ],
      },
    ];
  },
};

// Source-map upload requires SENTRY_AUTH_TOKEN; it must be absent in local dev,
// tokenless CI, and Electron builds — and the build MUST still pass there. Only
// enable the upload plugin when the token + org/project are all present. Without
// them, withSentryConfig is a thin pass-through that leaves output/tracing/images
// /headers (and the isVercel gating above) exactly as configured.
const sentryUploadEnabled =
  !!process.env.SENTRY_AUTH_TOKEN &&
  !!process.env.SENTRY_ORG &&
  !!process.env.SENTRY_PROJECT;

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Gate all source-map upload on the token so tokenless builds never fail.
  sourcemaps: { disable: !sentryUploadEnabled },
  // Route Sentry's browser requests through a same-origin path — covered by the
  // existing CSP `connect-src 'self'`, so no header change is needed.
  tunnelRoute: "/monitoring",
});
