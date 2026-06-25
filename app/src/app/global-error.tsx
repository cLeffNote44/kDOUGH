"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Catches errors thrown in the root layout itself (which onRequestError cannot).
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error); // no-op when Sentry was never initialised
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          color: "#0f172a",
          background: "#cbd5e1",
        }}
      >
        <p>Something went wrong. Please reload.</p>
      </body>
    </html>
  );
}
