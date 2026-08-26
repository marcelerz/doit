"use client";

import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { playNotificationSound, SoundType } from "@/utils/notifications";

/**
 * The two timer loops FocusView and OpenFocusView both run.
 *
 * The two views differ by more than a thousand lines and should not be merged
 * -- one walks a planned schedule of tasks, the other counts open-ended
 * sessions -- but both drive a one-second tick and both nag the user when a
 * phase change is waiting on confirmation. Those two effects were written
 * twice, ref juggling and all, and the confirmation one differed only in which
 * sound it played.
 */

/**
 * Run `onTick` once a second while `active`.
 *
 * The interval is cleared whenever `active` goes false and on unmount, so a
 * view left mounted behind an overlay does not keep counting down.
 */
export function useTimerTick(active: boolean, onTick: () => void): void {
  // Held in a ref so a new callback identity each render does not restart the
  // interval. Assigned in an effect, not during render.
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  });

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => tick.current(), 1000);
    return () => clearInterval(id);
  }, [active]);
}

interface ConfirmationRepeatOptions<TState extends { confirmationRepeats: number }, TPhase> {
  /** The phase waiting to be confirmed, or null when nothing is pending. */
  pendingPhase: TPhase | null;
  /** From settings: whether a phase change waits for the user at all. */
  requireConfirmation: boolean;
  /** Seconds between reminders. */
  repeatIntervalSeconds: number;
  /** Reminders before proceeding anyway; 0 means never stop asking. */
  maxRepeats: number;
  soundEnabled: boolean;
  /** Which sound this pending phase should nag with. */
  soundFor: (pendingPhase: TPhase | null) => SoundType;
  setState: Dispatch<SetStateAction<TState>>;
  /** Apply the pending transition, returning the state that results. */
  confirmPhaseTransition: (state: TState) => TState;
}

/**
 * Nag until the user confirms a pending phase change, then proceed anyway.
 *
 * Reminds every `repeatIntervalSeconds` and, after `maxRepeats` reminders,
 * makes the transition without waiting. A `maxRepeats` of 0 keeps reminding
 * forever, which is what a user who never wants an unattended transition sets.
 */
export function useConfirmationRepeat<TState extends { confirmationRepeats: number }, TPhase>({
  pendingPhase,
  requireConfirmation,
  repeatIntervalSeconds,
  maxRepeats,
  soundEnabled,
  soundFor,
  setState,
  confirmPhaseTransition,
}: ConfirmationRepeatOptions<TState, TPhase>): void {
  // Same reason as above: soundFor is written inline at both call sites, so
  // its identity changes every render and depending on it would reset the
  // reminder clock each time.
  const sound = useRef(soundFor);
  const confirm = useRef(confirmPhaseTransition);
  useEffect(() => {
    sound.current = soundFor;
    confirm.current = confirmPhaseTransition;
  });

  useEffect(() => {
    if (!pendingPhase || !requireConfirmation) return;

    const id = setInterval(() => {
      setState((state) => {
        const repeats = state.confirmationRepeats + 1;
        if (soundEnabled) playNotificationSound(sound.current(pendingPhase));
        if (maxRepeats > 0 && repeats >= maxRepeats) {
          return confirm.current(state);
        }
        return { ...state, confirmationRepeats: repeats };
      });
    }, repeatIntervalSeconds * 1000);

    return () => clearInterval(id);
  }, [pendingPhase, requireConfirmation, repeatIntervalSeconds, maxRepeats, soundEnabled, setState]);
}
