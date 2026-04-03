"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ShortcutHelpModal from "./ShortcutHelpModal";

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if modifier keys are held (except shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "w":
          e.preventDefault();
          router.push("/");
          break;
        case "r":
          e.preventDefault();
          router.push("/recipes");
          break;
        case "g":
          e.preventDefault();
          router.push("/grocery");
          break;
        case "n":
          e.preventDefault();
          router.push("/recipes/new");
          break;
        case "i":
          e.preventDefault();
          router.push("/import");
          break;
        case "?":
          e.preventDefault();
          setShowHelp(true);
          break;
        case "Escape":
          if (showHelp) {
            e.preventDefault();
            setShowHelp(false);
          }
          break;
      }
    },
    [router, showHelp]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return showHelp ? (
    <ShortcutHelpModal onClose={() => setShowHelp(false)} />
  ) : null;
}
