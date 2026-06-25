/**
 * kDOUGH Service Worker — Offline caching for grocery lists and recipes.
 *
 * Strategy:
 * - Static assets: Cache-first (icons, fonts, CSS)
 * - API/data routes: Network-first with cache fallback
 * - Pages: Network-first with cache fallback
 */

// Bumped to v3 so the activate handler purges older caches that may contain
// user-specific HTML pages cached by the previous network-first-for-pages logic.
const CACHE_NAME = "kdough-v4";
// Only static, non-user-specific assets are precached. "/" is intentionally NOT
// listed — it renders authenticated, user-specific HTML and must never be cached
// (cross-user leakage on shared devices + staleness).
const STATIC_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
  "/favicon-32.png",
  "/manifest.json",
];

// Minimal, data-free offline page shown when a navigation fails with no network.
const OFFLINE_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline — kDOUGH</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#334155;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px}h1{color:#0f766e;font-size:24px;margin:0 0 8px}p{color:#64748b;font-size:14px;max-width:320px}</style></head><body><h1>You're offline</h1><p>kDOUGH needs a connection to load your meals and grocery lists. Reconnect and try again.</p></body></html>`;

// Install: pre-cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for pages/data, cache-first for static
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip auth and API mutation routes
  // Note: grocery list data could be cached for offline use but requires more sophisticated caching strategy (e.g. IndexedDB for dynamic data)
  if (url.pathname.startsWith("/auth") || url.pathname.startsWith("/api")) {
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff2?)$/) ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Pages & dynamic data: network-only. These responses are user-specific HTML
  // and must never be written to the shared cache (privacy on shared devices +
  // staleness). On failure, show a generic, data-free offline page.
  event.respondWith(
    fetch(request).catch(() => {
      if (request.mode === "navigate") {
        return new Response(OFFLINE_HTML, {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      return new Response("Offline", { status: 503 });
    })
  );
});
