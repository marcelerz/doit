"use client";

import { useEffect, RefObject } from "react";

/**
 * Hook that detects clicks outside of a referenced element.
 * Commonly used for closing dropdowns, menus, and modals.
 *
 * @param ref - React ref attached to the element to monitor
 * @param callback - Function to call when a click outside is detected
 * @param enabled - Optional flag to enable/disable the listener (default: true)
 *
 * @example
 * // Close dropdown when clicking outside
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);
 *
 * return (
 *   <div ref={dropdownRef}>
 *     {isOpen && <DropdownContent />}
 *   </div>
 * );
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback, enabled]);
}

/**
 * Hook that detects clicks outside of multiple referenced elements.
 * Useful when a component has multiple disconnected parts (e.g., trigger + dropdown).
 *
 * @param refs - Array of React refs to monitor
 * @param callback - Function to call when a click outside all refs is detected
 * @param enabled - Optional flag to enable/disable the listener (default: true)
 *
 * @example
 * // Close dropdown when clicking outside trigger or content
 * const triggerRef = useRef<HTMLButtonElement>(null);
 * const contentRef = useRef<HTMLDivElement>(null);
 *
 * useClickOutsideMultiple([triggerRef, contentRef], () => setIsOpen(false), isOpen);
 */
export function useClickOutsideMultiple<T extends HTMLElement>(
  refs: RefObject<T | null>[],
  callback: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutsideAll = refs.every(
        (ref) => !ref.current || !ref.current.contains(event.target as Node)
      );
      if (clickedOutsideAll) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [refs, callback, enabled]);
}
