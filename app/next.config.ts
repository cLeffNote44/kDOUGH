import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin tracing root to the project directory so the standalone build outputs
  // server.js at .next/standalone/server.js (flat) instead of nesting it
  // under the full filesystem path (Desktop/KaitohDough/app/server.js).
  // Required for Electron packaging — main.js expects a flat layout.
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
