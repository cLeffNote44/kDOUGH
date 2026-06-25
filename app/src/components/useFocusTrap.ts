"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog behavior for a modal container:
 * - moves focus into the dialog on open (unless something inside already has it,
 *   e.g. an autoFocus input)
 * - traps Tab / Shift+Tab within the dialog
 * - closes on Escape
 * - restores focus to the previously-focused element (the trigger) on unmount
 *
 * Pass the modal's container ref and its close handler. `active` lets a
 * component that stays mounted but toggles visibility (e.g. an onboarding modal)
 * engage the trap only while the dialog is actually shown; modals that mount on
 * open can leave it at the default `true`.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  onClose?: () => void,
  active: boolean = true
): void {
  // Keep the latest onClose without re-running the effect (which would re-restore
  // focus mid-interaction).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = () =>
      container
        ? Array.from(
            container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
          ).filter((el) => el.offsetParent !== null || el === document.activeElement)
        : [];

    // Move focus into the dialog if it isn't already there.
    if (container && !container.contains(document.activeElement)) {
      const first = focusable()[0];
      if (first) first.focus();
      else container.focus();
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !container) return;

      const items = focusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previouslyFocused?.focus?.();
    };
    // Re-run only when visibility toggles; refs/onClose are read live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
