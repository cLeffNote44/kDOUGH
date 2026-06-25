import type { NextConfig } from "next";

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
  // Required for Electron packaging — main.js expects a flat layout. Harmless on
  // Vercel, which already traces from the project root.
  // process.cwd() is reliable here because Next.js always runs from the project root.
  outputFileTracingRoot: process.cwd(),
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

export default nextConfig;
