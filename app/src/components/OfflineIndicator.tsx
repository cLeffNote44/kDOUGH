"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export default function OfflineIndicator() {
  // useSyncExternalStore is the idiomatic way to read a client-only external
  // value (navigator.onLine) without a setState-in-effect. The server snapshot
  // assumes online so the banner never renders during SSR.
  const isOffline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false
  );

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] bg-teal-500 text-white text-center py-1.5 text-xs font-medium shadow-sm">
      <svg
        className="inline-block w-3.5 h-3.5 mr-1 -mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414 1 1 0 01-1.414-1.414z"
        />
      </svg>
      You&apos;re offline — showing cached data
    </div>
  );
}
