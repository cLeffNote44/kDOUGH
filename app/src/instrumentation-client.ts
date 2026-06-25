import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    // Privacy-friendly defaults: keep tracing light; Session Replay OFF.
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

// Required by the App Router for client-side navigation instrumentation.
// No-op if Sentry.init was skipped (no public DSN).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
