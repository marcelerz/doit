import { Color } from "./types";
import { DurationMin, Timestamp } from "./time";
import { TodoId } from "./todo";

/**
 * The ad-hoc timer's vocabulary.
 *
 * The timer used to read its durations straight out of `settings.gantt`, so
 * running a 45 minute session meant editing the number that also reschedules
 * every task in the Gantt chart -- and the technique control that drove it sits
 * in the same toolbar row as the button that opens the timer. A mode list makes
 * the timer own its own time: the Gantt scheduler keeps its numbers, and the
 * two no longer share a knob.
 *
 * Sound ids are plain strings rather than the branded `AmbientSoundId` and
 * `SoundType`, both of which live in `utils/notifications`. `src/types`
 * importing from `src/utils` is the layer inversion commit 24 removed, and
 * `FocusSettings.ambientWorkSound` already stores a sound this way.
 */

// Unique branded type for FocusMode IDs
export type FocusModeId = string & { readonly __brand: unique symbol };

// Converts string id to FocusModeId type
export function getFocusModeId(id: string): FocusModeId {
  return id as FocusModeId;
}

// Unique branded type for FocusSession IDs
export type FocusSessionId = string & { readonly __brand: unique symbol };

// Converts string id to FocusSessionId type
export function getFocusSessionId(id: string): FocusSessionId {
  return id as FocusSessionId;
}

/**
 * Which running total a mode feeds.
 *
 * Every mode is one or the other, so "how long did I actually work" stays
 * answerable however many modes the user invents.
 */
const _FOCUS_MODE_KINDS = ["work", "break"] as const;
export type FocusModeKind = (typeof _FOCUS_MODE_KINDS)[number];

/** One named stretch of time the ad-hoc timer can run. */
export interface FocusMode {
  id: FocusModeId;
  name: string; // "Deep work", "Email", "Break"
  kind: FocusModeKind; // which total this mode's time accrues to
  /** Countdown length. Absent means the mode counts up with no end. */
  durationMinutes?: DurationMin;
  /** Ambient loop while this mode runs; "" is silence. An AMBIENT_SOUNDS id. */
  ambientSound: string;
  /** Chime when this mode's countdown reaches zero. A SoundType. */
  endSound: string;
  color: Color;
  order: number;
  /** Where a completed countdown goes next. Absent means stop and wait. */
  nextModeId?: FocusModeId;
  /**
   * Every Nth completion of this mode, go to `nextAltModeId` instead of
   * `nextModeId`. 0 means never -- this is how "a long break every fourth
   * pomodoro" survives the move off the Gantt settings.
   */
  nextEvery: number;
  nextAltModeId?: FocusModeId;
}

/**
 * One stretch actually spent in a mode.
 *
 * The name and kind are denormalized so a session still reports correctly
 * after the mode it used has been renamed or deleted.
 */
export interface FocusSegment {
  modeId: FocusModeId;
  modeName: string;
  kind: FocusModeKind;
  startedAt: Timestamp;
  /** Absent while this segment is the one currently running. */
  endedAt?: Timestamp;
}

/**
 * A run of the ad-hoc timer, as a list of wall-clock stretches.
 *
 * Storing timestamps rather than counters is what makes the totals immune to a
 * throttled background tab, lets a reload resume mid-session, and gives
 * Statistics and Time Reports something to read. Before this, closing the
 * overlay silently discarded the whole session.
 */
export interface FocusSession {
  id: FocusSessionId;
  startedAt: Timestamp;
  /** Absent while the session is still open. */
  endedAt?: Timestamp;
  segments: FocusSegment[];
  /** Set when the session is also logged as time against a task. */
  todoId?: TodoId;
}

/** Totals for a session, in seconds, split by what the time was spent on. */
export interface FocusTotals {
  work: number;
  break: number;
  /** Time inside the session that no segment covered, i.e. paused. */
  idle: number;
}

/** Bounds for the minute fields, so a typo cannot produce a 0 second phase. */
export const FOCUS_MODE_MINUTE_LIMITS = { min: 1, max: 480 } as const;
