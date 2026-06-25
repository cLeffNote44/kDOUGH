"use client";

import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/components/useFocusTrap";

const SHORTCUTS = [
  { key: "W", description: "Go to This Week" },
  { key: "R", description: "Go to Recipes" },
  { key: "G", description: "Go to Grocery List" },
  { key: "N", description: "New Recipe" },
  { key: "I", description: "Import Recipe" },
  { key: "?", description: "Show shortcuts" },
  { key: "Esc", description: "Close modal / dialog" },
];

export default function ShortcutHelpModal({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Focus trap + Escape-to-close (previously missing) + focus restore.
  useFocusTrap(modalRef, onClose);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-help-title"
        className="glass-strong rounded-xl shadow-lg w-full max-w-xs mx-4 border border-slate-200/60 dark:border-slate-700/40"
      >
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/40 flex items-center justify-between">
          <h2 id="shortcut-help-title" className="font-display font-semibold text-slate-900 dark:text-slate-100 text-sm">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            aria-label="Close shortcuts"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4 space-y-2.5">
          {SHORTCUTS.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {description}
              </span>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
