import { FocusModeId, FocusSession, FocusTotals } from "@/types/focusMode";

/**
 * Reading the ad-hoc timer's session log.
 *
 * Time spent in the timer used to go nowhere: Statistics and Time Reports both
 * read only todo.timeTracking, so a task-free session was invisible however
 * long it ran.
 *
 * Every total here clips segments to the period being asked about rather than
 * counting a session by its start. A session that runs from 23:40 to 00:20
 * belongs partly to each day, and attributing all forty minutes to whichever
 * day it began is the kind of quiet wrongness that makes a report untrustworthy.
 */

export interface FocusModeTotal {
  modeId: FocusModeId;
  /** The name as it was when the time was spent. */
  modeName: string;
  kind: "work" | "break";
  seconds: number;
}

/** Seconds of a span that fall inside [from, to). */
function overlapSeconds(startMs: number, endMs: number, fromMs: number, toMs: number): number {
  const start = Math.max(startMs, fromMs);
  const end = Math.min(endMs, toMs);
  return end <= start ? 0 : Math.floor((end - start) / 1000);
}

/** When a segment ended, treating an open one as running up to `nowMs`. */
function segmentEnd(endedAt: number | undefined, nowMs: number): number {
  return endedAt ?? nowMs;
}

/**
 * Work and break seconds across every session, clipped to the period.
 *
 * Idle is deliberately not reported here: a gap between two sessions is not
 * idle time in any meaningful sense, and summing per-session idle across a week
 * would invite exactly that reading.
 */
export function focusTotalsInPeriod(
  sessions: FocusSession[],
  fromMs: number,
  toMs: number,
  nowMs: number,
): Omit<FocusTotals, "idle"> {
  let work = 0;
  let rest = 0;
  for (const session of sessions) {
    for (const segment of session.segments) {
      const seconds = overlapSeconds(segment.startedAt, segmentEnd(segment.endedAt, nowMs), fromMs, toMs);
      if (seconds === 0) continue;
      if (segment.kind === "work") {
        work += seconds;
      } else {
        rest += seconds;
      }
    }
  }
  return { work, break: rest };
}

/**
 * Time per mode across the period, largest first.
 *
 * Keyed by mode id but carrying the name recorded on the segment, so a mode
 * that has since been renamed or deleted still reports the time it was given.
 * Where a mode was renamed mid-period, the most recent name wins.
 */
export function focusTotalsByMode(
  sessions: FocusSession[],
  fromMs: number,
  toMs: number,
  nowMs: number,
): FocusModeTotal[] {
  const byMode = new Map<FocusModeId, FocusModeTotal & { lastSeen: number }>();

  for (const session of sessions) {
    for (const segment of session.segments) {
      const seconds = overlapSeconds(segment.startedAt, segmentEnd(segment.endedAt, nowMs), fromMs, toMs);
      if (seconds === 0) continue;

      const existing = byMode.get(segment.modeId);
      if (!existing) {
        byMode.set(segment.modeId, {
          modeId: segment.modeId,
          modeName: segment.modeName,
          kind: segment.kind,
          seconds,
          lastSeen: segment.startedAt,
        });
        continue;
      }
      existing.seconds += seconds;
      if (segment.startedAt >= existing.lastSeen) {
        existing.lastSeen = segment.startedAt;
        existing.modeName = segment.modeName;
        existing.kind = segment.kind;
      }
    }
  }

  return [...byMode.values()]
    .map(({ lastSeen: _lastSeen, ...total }) => total)
    .sort((a, b) => b.seconds - a.seconds || a.modeName.localeCompare(b.modeName));
}

/** Sessions that overlap the period at all, newest first. */
export function focusSessionsInPeriod(
  sessions: FocusSession[],
  fromMs: number,
  toMs: number,
  nowMs: number,
): FocusSession[] {
  return sessions
    .filter((session) =>
      session.segments.some(
        (segment) => overlapSeconds(segment.startedAt, segmentEnd(segment.endedAt, nowMs), fromMs, toMs) > 0,
      ),
    )
    .sort((a, b) => b.startedAt - a.startedAt);
}
