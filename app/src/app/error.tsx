"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error details for debugging (visible in browser console / Electron dev tools)
  useEffect(() => {
    console.error("[kDOUGH Error Boundary]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="text-center max-w-md">
        {/* Error illustration */}
        <div className="flex justify-center mb-5">
          <svg
            className="w-16 h-16 text-amber-400 dark:text-amber-500"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="32" cy="32" r="28" />
            <path d="M32 20v14" strokeWidth="2.5" />
            <circle cx="32" cy="42" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </div>

        <h2 className="text-lg font-display font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
          An unexpected error occurred. Try refreshing the page, or head back to
          the home screen if the problem persists.
        </p>

        {/* Error digest for support (if available) */}
        {error.digest && (
          <p className="text-xs text-stone-400 dark:text-stone-600 mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 btn-gradient rounded-lg text-sm"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
