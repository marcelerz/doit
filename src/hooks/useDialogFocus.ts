"use client";

import { RefObject, useEffect } from "react";

/** Elements that can hold focus, for the trap below. */
export const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

/**
 * Move focus into a dialog, keep Tab inside it, and put focus back on close.
 *
 * Commit 72 gave the shared Modal these semantics, but the two full-screen
 * focus views are not Modals -- they render their own `fixed inset-0` surface
 * as a sibling of the whole app, so the view behind stayed in the tab order and
 * a keyboard user could tab out of a running timer into the Gantt toolbar with
 * no announcement. Rather than copy the trap a third time, it lives here and
 * Modal reads it too.
 */
export function useDialogFocus(isOpen: boolean, dialogRef: RefObject<HTMLElement | null>): void {
  // Move focus in on open and put it back on close.
  useEffect(() => {
    if (!isOpen) return;
    const restoreFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialogRef.current)?.focus();

    return () => {
      restoreFocusTo?.focus();
    };
    // dialogRef is a ref object, stable across renders.
  }, [isOpen, dialogRef]);

  // Keep Tab inside the dialog.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (element) => element.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dialogRef]);
}

/**
 * Whether a keyboard event came from somewhere that owns the keystroke.
 *
 * The focus views exempted only inputs and textareas, then called
 * preventDefault on Space and Enter unconditionally -- and those are the two
 * keys that activate a button. Tabbing to the timer's own Close button and
 * pressing Space started the timer instead of closing it. TodoApp already
 * guards the same way for contenteditable; buttons and selects need it too.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }
  return target.isContentEditable || target.closest('[contenteditable="true"]') !== null;
}

/**
 * Whether a Space or Enter press should be left alone because it is activating
 * a control rather than driving the timer.
 */
export function isActivationTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("button, a[href], select, [role='button']") !== null;
}
