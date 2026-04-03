"use client";

import { Toaster as SonnerToaster } from "sonner";

export default function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={80}
      toastOptions={{
        className:
          "glass-strong !border !border-stone-200/60 dark:!border-stone-700/40 !text-stone-900 dark:!text-stone-100 !text-sm",
        style: {
          // Sonner injects inline styles; these ensure our glassmorphism shows through
          background: "transparent",
        },
      }}
    />
  );
}
