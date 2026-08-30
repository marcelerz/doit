import { Gantt } from "@/types/gantt";
import {
  FocusMode,
  FocusModeId,
  FocusSegment,
  FocusSession,
  FocusTotals,
  FOCUS_MODE_MINUTE_LIMITS,
  getFocusModeId,
} from "@/types/focusMode";
import { getColor } from "@/types/types";
import { getDurationMin } from "@/types/time";

/**
 * The logic behind the ad-hoc timer's modes.
 *
 * Kept out of the view because the view had none worth testing: durations were
 * seven inline `settings.gantt.x ?? n` reads and the long-break rule was a
 * modulo expression written twice.
 */

/** Colors for the seeded modes, matching the technique colors in GanttView. */
const WORK_COLOR = "#2563eb";
const SHORT_BREAK_COLOR = "#0891b2";
const LONG_BREAK_COLOR = "#16a34a";

/**
 * Build the starting mode list from a user's Gantt scheduling settings.
 *
 * This is the migration path, so it reproduces what the timer did before it had
 * modes -- fallback for fallback. Several of those fallbacks disagree with
 * `defaultGantt` (technique fell back to "pomodoro" where the default is
 * "sequential"; the sequential break fell back to 5 where the default is 15).
 * They are copied as they were, because the point is that an existing user's
 * timer keeps behaving the way it behaves today.
 */
export function seedModesFromGantt(gantt: Partial<Gantt> | undefined): FocusMode[] {
  const technique = gantt?.schedulingTechnique ?? "pomodoro";

  if (technique === "flow") {
    return buildPair({
      workName: "Flow",
      workMinutes: gantt?.flowWorkDuration ?? 52,
      breakName: "Break",
      breakMinutes: gantt?.flowBreakDuration ?? 17,
    });
  }

  if (technique === "sequential") {
    return buildPair({
      workName: "Focus",
      workMinutes: gantt?.defaultTaskDuration ?? 30,
      breakName: "Break",
      breakMinutes: gantt?.contextSwitchingTime ?? 5,
    });
  }

  // Pomodoro is the only technique with two kinds of break, and the only one
  // whose work mode alternates between them.
  const work = getFocusModeId("focus-mode-seed-work");
  const shortBreak = getFocusModeId("focus-mode-seed-short-break");
  const longBreak = getFocusModeId("focus-mode-seed-long-break");
  return [
    {
      id: work,
      name: "Focus",
      kind: "work",
      durationMinutes: getDurationMin(gantt?.pomodoroWorkDuration ?? 25),
      ambientSound: "",
      endSound: "short-break",
      color: getColor(WORK_COLOR),
      order: 0,
      nextModeId: shortBreak,
      nextEvery: gantt?.pomodoroLongBreakInterval ?? 4,
      nextAltModeId: longBreak,
    },
    {
      id: shortBreak,
      name: "Short break",
      kind: "break",
      durationMinutes: getDurationMin(gantt?.pomodoroShortBreak ?? 5),
      ambientSound: "",
      endSound: "break-end",
      color: getColor(SHORT_BREAK_COLOR),
      order: 1,
      nextModeId: work,
      nextEvery: 0,
    },
    {
      id: longBreak,
      name: "Long break",
      kind: "break",
      durationMinutes: getDurationMin(gantt?.pomodoroLongBreak ?? 15),
      ambientSound: "",
      endSound: "break-end",
      color: getColor(LONG_BREAK_COLOR),
      order: 2,
      nextModeId: work,
      nextEvery: 0,
    },
  ];
}

function buildPair({
  workName,
  workMinutes,
  breakName,
  breakMinutes,
}: {
  workName: string;
  workMinutes: number;
  breakName: string;
  breakMinutes: number;
}): FocusMode[] {
  const work = getFocusModeId("focus-mode-seed-work");
  const rest = getFocusModeId("focus-mode-seed-short-break");
  return [
    {
      id: work,
      name: workName,
      kind: "work",
      durationMinutes: getDurationMin(workMinutes),
      ambientSound: "",
      endSound: "short-break",
      color: getColor(WORK_COLOR),
      order: 0,
      nextModeId: rest,
      nextEvery: 0,
    },
    {
      id: rest,
      name: breakName,
      kind: "break",
      durationMinutes: getDurationMin(breakMinutes),
      ambientSound: "",
      endSound: "break-end",
      color: getColor(SHORT_BREAK_COLOR),
      order: 1,
      nextModeId: work,
      nextEvery: 0,
    },
  ];
}

/** Look a mode up by id, or null when it is gone. */
export function findMode(modes: FocusMode[], id: FocusModeId | undefined): FocusMode | null {
  if (!id) return null;
  return modes.find((mode) => mode.id === id) ?? null;
}

/** Seconds a mode runs for, or undefined when it counts up instead. */
export function modeSeconds(mode: FocusMode): number | undefined {
  if (mode.durationMinutes === undefined) return undefined;
  return mode.durationMinutes * 60;
}

/** How long a segment ran, in seconds, counting an open one up to `nowMs`. */
export function segmentSeconds(segment: FocusSegment, nowMs: number): number {
  const end = segment.endedAt ?? nowMs;
  return Math.max(0, Math.floor((end - segment.startedAt) / 1000));
}

/**
 * Seconds left on a countdown, or undefined when the mode counts up.
 *
 * Derived from the segment's start rather than a counter, which is what makes
 * it immune to a throttled tab: however long the browser slept, the answer is
 * whatever the clock says.
 */
export function remainingSeconds(mode: FocusMode, segment: FocusSegment, nowMs: number): number | undefined {
  const total = modeSeconds(mode);
  if (total === undefined) return undefined;
  return total - segmentSeconds(segment, nowMs);
}

/** Seconds elapsed in a count-up mode. */
export function elapsedSeconds(segment: FocusSegment, nowMs: number): number {
  return segmentSeconds(segment, nowMs);
}

/**
 * Work, break and idle totals for a session.
 *
 * Idle is the time inside the session that no segment covered -- the stretches
 * the user paused. It is derived rather than accumulated, so pausing and
 * resuming cannot drift away from the wall clock.
 */
export function totalsByKind(session: FocusSession, nowMs: number): FocusTotals {
  let work = 0;
  let rest = 0;
  for (const segment of session.segments) {
    const seconds = segmentSeconds(segment, nowMs);
    if (segment.kind === "work") {
      work += seconds;
    } else {
      rest += seconds;
    }
  }
  const end = session.endedAt ?? nowMs;
  const span = Math.max(0, Math.floor((end - session.startedAt) / 1000));
  return { work, break: rest, idle: Math.max(0, span - work - rest) };
}

/**
 * How many times a session has completed a given mode.
 *
 * Counts segments rather than tracking a separate counter, so it survives a
 * reload along with everything else.
 */
export function completionCount(session: FocusSession, modeId: FocusModeId): number {
  return session.segments.filter((segment) => segment.modeId === modeId && segment.endedAt !== undefined).length;
}

/**
 * Where a mode goes when its countdown runs out, or null to stop and wait.
 *
 * `nextEvery` is what preserves "a long break every fourth pomodoro" now that
 * the timer no longer reads the Gantt settings. The guard on it is not
 * theoretical: the old expression was `count % interval === 0`, and an interval
 * of 0 makes that NaN, which is never equal to 0 -- so a 0 silently meant
 * "never take a long break" rather than failing.
 */
export function nextModeAfter(mode: FocusMode, completionsIncludingThis: number, modes: FocusMode[]): FocusMode | null {
  if (mode.nextEvery > 0 && mode.nextAltModeId && completionsIncludingThis % mode.nextEvery === 0) {
    const alt = findMode(modes, mode.nextAltModeId);
    if (alt) return alt;
  }
  return findMode(modes, mode.nextModeId);
}

/**
 * Read a typed minute value, holding it inside the allowed range.
 *
 * Deliberately not the `parseInt(x) || 25` idiom used elsewhere: that treats a
 * legitimate 0 as "missing", and CLAUDE.md asks for explicit zero checks.
 */
export function clampModeMinutes(
  raw: number,
  limits: { min: number; max: number } = FOCUS_MODE_MINUTE_LIMITS,
): number {
  if (Number.isNaN(raw)) return limits.min;
  return Math.min(limits.max, Math.max(limits.min, Math.round(raw)));
}

/** Modes in the order they should be offered. */
export function sortedModes(modes: FocusMode[]): FocusMode[] {
  return [...modes].sort((a, b) => a.order - b.order);
}

/** The mode a fresh session should start in: the first work mode, else the first. */
export function defaultStartMode(modes: FocusMode[]): FocusMode | null {
  const ordered = sortedModes(modes);
  return ordered.find((mode) => mode.kind === "work") ?? ordered[0] ?? null;
}
