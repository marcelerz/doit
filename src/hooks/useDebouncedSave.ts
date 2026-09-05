import { DependencyList, useCallback, useEffect, useRef } from "react";

/** Long enough to coalesce typing, short enough that a save is never a surprise. */
const DEFAULT_DELAY_MS = 500;

/**
 * Save a beat after the last change -- and do not lose the beat.
 *
 * Every editable overlay grew its own copy of this: a setTimeout inside an
 * effect, with a clearTimeout cleanup. They all shared one flaw. Closing the
 * view inside the delay runs that cleanup, the cleanup cancels the timer, and
 * the edit is gone. Nothing could ask them to save now, either, so a view that
 * wanted to close cleanly had no way to say so.
 *
 * The cleanup here distinguishes its two reasons for running. A dependency
 * changed means a newer save is already on its way, so the pending one really
 * is obsolete. Unmounting means nothing else is coming, so it runs instead.
 *
 * `save` is read through a ref, so a debounce started three renders ago still
 * saves current values rather than the ones it closed over.
 */
export function useDebouncedSave(
  save: () => void,
  deps: DependencyList,
  options: { delayMs?: number; enabled?: boolean } = {},
): { flush: () => void; cancel: () => void } {
  const { delayMs = DEFAULT_DELAY_MS, enabled = true } = options;

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Save now, if there is anything waiting. */
  const flush = useCallback(() => {
    clearTimer();
    if (!pendingRef.current) return;
    pendingRef.current = false;
    saveRef.current();
  }, [clearTimer]);

  /** Throw the pending save away -- for a cancel, not for a close. */
  const cancel = useCallback(() => {
    clearTimer();
    pendingRef.current = false;
  }, [clearTimer]);

  useEffect(() => {
    if (!enabled) return;

    pendingRef.current = true;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      pendingRef.current = false;
      saveRef.current();
    }, delayMs);

    return clearTimer;
    // The caller's own dependencies decide when a save is due; this hook cannot
    // know them, so exhaustive-deps has nothing to check here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delayMs, enabled, clearTimer]);

  // Registered after the effect above, so it runs after that one's cleanup has
  // cleared the timer -- leaving exactly the "still owed a save" case to catch.
  useEffect(() => {
    return () => {
      if (!pendingRef.current) return;
      pendingRef.current = false;
      saveRef.current();
    };
  }, []);

  return { flush, cancel };
}
