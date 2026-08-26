"use client";

import { RefObject, useEffect } from "react";

/**
 * Run a handler when a mousedown lands outside the referenced element.
 *
 * Five dropdowns across the two view toolbars and the reviews view carried an
 * identical effect for this.
 *
 * mousedown rather than click, so the menu closes before a click on whatever
 * is underneath it is dispatched.
 *
 * @param ref - the element to treat as inside
 * @param onOutside - called on a mousedown anywhere else
 * @param enabled - when false the listener is not attached
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, onOutside, enabled]);
}
