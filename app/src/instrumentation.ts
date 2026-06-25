import * as Sentry from "@sentry/nextjs";

export async function register() {
  // No DSN => skip entirely. Keeps server/edge runtimes clean in dev/CI/Electron.
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors from nested React Server Components, server actions, route
// handlers, and middleware. No-op when Sentry was never initialised (register()
// returned early without a DSN), so it is always safe to export.
export const onRequestError = Sentry.captureRequestError;
