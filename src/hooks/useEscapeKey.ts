"use client";

import { useEffect } from "react";

/**
 * Run a handler when Escape is pressed.
 *
 * Four overlays carried a byte-identical effect for this.
 *
 * Deliberately not folded into Modal: Modal blurs the active element and
 * defers its own close by a tick so a RichTextEditor's onBlur commits first.
 * Escape here closes synchronously, and unifying the two would silently change
 * when edits are saved.
 *
 * @param onEscape - called on Escape
 * @param enabled - when false the listener is not attached
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onEscape, enabled]);
}
