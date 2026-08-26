"use client";

import { useEffect, useId, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
  /**
   * What to call this dialog for assistive technology.
   *
   * Prefer `labelledBy` when the dialog already renders a visible heading;
   * this is the fallback for ones that do not.
   */
  label?: string;
  /** id of the element that titles this dialog. */
  labelledBy?: string;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  full: "max-w-full",
};

/** Elements that can hold focus, for the trap below. */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

/**
 * Reusable modal/overlay wrapper component.
 *
 * Before this carried dialog semantics, no overlay in the app had any: no
 * role, no aria-modal, no focus trap and no focus restore. A screen-reader
 * user could tab straight out of an open dialog into the page behind it, and
 * focus stayed wherever it had been when the dialog opened.
 */
export function Modal({ isOpen, onClose, children, maxWidth = "3xl", label, labelledBy }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const fallbackLabelId = useId();

  // Move focus in on open and put it back on close.
  useEffect(() => {
    if (!isOpen) return;
    restoreFocusTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialogRef.current)?.focus();

    return () => {
      restoreFocusTo.current?.focus();
    };
  }, [isOpen]);

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
  }, [isOpen]);

  if (!isOpen) return null;

  const close = () => {
    // Blur the active element first to trigger any pending onBlur handlers
    // (e.g., RichTextEditor saving content before modal closes)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Small delay to allow blur handlers to complete
    setTimeout(() => {
      onClose();
    }, 0);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`bg-white dark:bg-zinc-900 rounded-xl shadow-2xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Without a name, a dialog announces only as "dialog". */}
        {!label && !labelledBy && (
          <span id={fallbackLabelId} className="sr-only">
            Dialog
          </span>
        )}
        {children}
      </div>
    </div>
  );
}
