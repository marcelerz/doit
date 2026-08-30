"use client";

import { useCallback, useMemo } from "react";
import { FocusMode, FocusSession, FocusSegment, FocusTotals, getFocusSessionId } from "@/types/focusMode";
import { getTimestamp } from "@/types/time";
import { createFocusSessionId } from "@/utils/idGenerator";
import { totalsByKind } from "@/utils/focusModes";
import { STORAGE_KEYS } from "@/storage/storage";
import { usePersistedViewOptions } from "@/hooks/usePersistedViewOptions";

/**
 * The ad-hoc timer's running session, and the log of finished ones.
 *
 * Closing the timer overlay used to discard everything: the session count, the
 * work total, the break total. Nothing was written anywhere, so a session was
 * also invisible to Statistics and Time Reports, both of which read only
 * todo.timeTracking.
 *
 * A session is a list of wall-clock segments. Switching mode closes the open
 * segment and opens a new one, and that single operation is what makes the
 * totals, the log and resume-after-reload all work -- there is no separate
 * counter to keep in step.
 */

/** How many finished sessions to keep. Enough for the reports, bounded. */
export const FOCUS_SESSION_LOG_LIMIT = 200;

interface SessionSlot {
  /** The session still open, or null when the timer is not running one. */
  current: FocusSession | null;
}

interface SessionLog {
  sessions: FocusSession[];
}

const NO_SESSION: SessionSlot = { current: null };
const NO_LOG: SessionLog = { sessions: [] };

export interface UseFocusSessionResult {
  /** The open session, or null. */
  session: FocusSession | null;
  /** The segment currently running, or null when paused or stopped. */
  activeSegment: FocusSegment | null;
  /** Finished sessions, newest first. */
  log: FocusSession[];
  /** False until the stored session has been read. */
  isLoaded: boolean;
  start: (mode: FocusMode, nowMs?: number) => void;
  switchTo: (mode: FocusMode, nowMs?: number) => void;
  pause: (nowMs?: number) => void;
  resume: (mode: FocusMode, nowMs?: number) => void;
  end: (nowMs?: number) => void;
  discard: () => void;
  totals: (nowMs: number) => FocusTotals;
}

/** The open segment of a session, if one is running. */
export function activeSegmentOf(session: FocusSession | null): FocusSegment | null {
  if (!session) return null;
  const last = session.segments[session.segments.length - 1];
  return last && last.endedAt === undefined ? last : null;
}

/** Close whichever segment is open, leaving finished ones untouched. */
function closeOpenSegment(session: FocusSession, nowMs: number): FocusSession {
  return {
    ...session,
    segments: session.segments.map((segment) =>
      segment.endedAt === undefined ? { ...segment, endedAt: getTimestamp(nowMs) } : segment,
    ),
  };
}

function openSegment(mode: FocusMode, nowMs: number): FocusSegment {
  return {
    modeId: mode.id,
    // Denormalized so the session still reports correctly after the mode has
    // been renamed or deleted.
    modeName: mode.name,
    kind: mode.kind,
    startedAt: getTimestamp(nowMs),
  };
}

export function useFocusSession(): UseFocusSessionResult {
  // Defaults are constants, never derived from settings: usePersistedViewOptions
  // freezes the first render's defaults in a ref, so a settings-derived default
  // would be pinned to whatever settings happened to be at mount.
  const [slot, setSlot, slotLoaded] = usePersistedViewOptions<SessionSlot>(STORAGE_KEYS.FOCUS_SESSION, NO_SESSION);
  const [logged, setLogged, logLoaded] = usePersistedViewOptions<SessionLog>(
    STORAGE_KEYS.FOCUS_SESSION_LOG,
    NO_LOG,
  );

  const session = slot.current;

  // setOptions takes a value, not an updater, so each of these reads the
  // current session from the closure and depends on it. That is safe here
  // because every one of them is driven by a user action, never by a tick.
  const start = useCallback(
    (mode: FocusMode, nowMs: number = Date.now()) => {
      setSlot({
        current: {
          id: getFocusSessionId(createFocusSessionId()),
          startedAt: getTimestamp(nowMs),
          segments: [openSegment(mode, nowMs)],
        },
      });
    },
    [setSlot],
  );

  const switchTo = useCallback(
    (mode: FocusMode, nowMs: number = Date.now()) => {
      if (!session) return;
      const closed = closeOpenSegment(session, nowMs);
      setSlot({ current: { ...closed, segments: [...closed.segments, openSegment(mode, nowMs)] } });
    },
    [session, setSlot],
  );

  const pause = useCallback(
    (nowMs: number = Date.now()) => {
      if (!session) return;
      setSlot({ current: closeOpenSegment(session, nowMs) });
    },
    [session, setSlot],
  );

  // Resuming opens a fresh segment rather than reopening the closed one, so the
  // paused stretch stays visible as the gap it was.
  const resume = useCallback(
    (mode: FocusMode, nowMs: number = Date.now()) => {
      if (!session || activeSegmentOf(session)) return;
      setSlot({ current: { ...session, segments: [...session.segments, openSegment(mode, nowMs)] } });
    },
    [session, setSlot],
  );

  const end = useCallback(
    (nowMs: number = Date.now()) => {
      if (!session) return;
      const finished: FocusSession = {
        ...closeOpenSegment(session, nowMs),
        endedAt: getTimestamp(nowMs),
      };
      setSlot(NO_SESSION);

      // A session nobody actually spent time in is noise in the reports.
      const total = totalsByKind(finished, nowMs);
      if (total.work === 0 && total.break === 0) return;
      setLogged({ sessions: [finished, ...logged.sessions].slice(0, FOCUS_SESSION_LOG_LIMIT) });
    },
    [session, logged.sessions, setSlot, setLogged],
  );

  const discard = useCallback(() => setSlot(NO_SESSION), [setSlot]);

  const totals = useCallback(
    (nowMs: number) => (session ? totalsByKind(session, nowMs) : { work: 0, break: 0, idle: 0 }),
    [session],
  );

  const activeSegment = useMemo(() => activeSegmentOf(session), [session]);

  return {
    session,
    activeSegment,
    log: logged.sessions,
    isLoaded: slotLoaded && logLoaded,
    start,
    switchTo,
    pause,
    resume,
    end,
    discard,
    totals,
  };
}
