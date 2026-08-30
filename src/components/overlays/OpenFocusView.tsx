"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings } from "@/types/settings";
import { FocusMode, FocusModeId } from "@/types/focusMode";
import {
  completionCount,
  elapsedSeconds,
  findMode,
  modeSeconds,
  nextModeAfter,
  remainingSeconds,
  sortedModes,
  defaultStartMode,
} from "@/utils/focusModes";
import { useTimerTick } from "@/hooks/usePomodoroTimer";
import { UseFocusSessionResult } from "@/hooks/useFocusSession";
import { useDialogFocus, isTypingTarget, isActivationTarget } from "@/hooks/useDialogFocus";
import {
  playNotificationSound,
  clearSoundQueue,
  sendNotification,
  requestNotificationPermission,
  getNotificationPermission,
  playAmbientSound,
  stopAmbientSound,
  getAmbientSoundFile,
  SoundType,
} from "@/utils/notifications";
import {
  CloseIcon,
  VolumeOnIcon,
  VolumeOffIcon,
  BellIcon,
  PlayIcon,
  PauseIcon,
  SettingsIcon,
  StopSolidIcon,
} from "@/components/shared/Icons";
import { formatTime, formatClockTime } from "@/utils/formatters";
import { OpenFocusSetup } from "@/components/overlays/OpenFocusSetup";

/**
 * The ad-hoc timer: a session built from the user's own modes.
 *
 * It used to be a fixed work/break loop whose durations were read out of
 * settings.gantt, which meant the only way to change its length was to edit the
 * numbers that also reschedule the Gantt chart. It now runs on the mode list in
 * settings.focus, and the running time lives in a session of wall-clock
 * segments rather than in a set of counters -- so the totals survive a
 * throttled tab, a reload can pick the session back up, and a finished session
 * is something the reports can read.
 */

interface OpenFocusViewProps {
  settings: Settings;
  onClose: () => void;
  /** Persists edits made on the setup screen. */
  onUpdateFocusSettings: (focus: Settings["focus"]) => void;
  /**
   * The session store, owned by TodoApp.
   *
   * Deliberately passed in rather than called here: usePersistedViewOptions
   * keeps per-instance state, so a second useFocusSession() would load its own
   * copy at mount and never see this one's writes. That is exactly what
   * happened -- Statistics and Time Reports stayed empty however many sessions
   * the timer recorded.
   */
  session: UseFocusSessionResult;
}

export function OpenFocusView({
  settings,
  onClose,
  onUpdateFocusSettings,
  session: sessionStore,
}: OpenFocusViewProps) {
  const focusSettings = settings.focus;
  const modes = useMemo(() => sortedModes(focusSettings.modes ?? []), [focusSettings.modes]);

  const { session, activeSegment, isLoaded, start, switchTo, pause, resume, end, discard, totals } = sessionStore;

  const [now, setNow] = useState(() => Date.now());
  const [showSetup, setShowSetup] = useState(false);
  const [selectedModeId, setSelectedModeId] = useState<FocusModeId | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(focusSettings.soundEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(getNotificationPermission() === "granted");

  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(true, dialogRef);

  const currentMode = useMemo(
    () => (activeSegment ? findMode(modes, activeSegment.modeId) : null),
    [activeSegment, modes],
  );

  // Derived rather than seeded by an effect: until the user picks one, the
  // selection simply is the default, and storing that would only add a render.
  const effectiveSelectedId = useMemo(
    () => selectedModeId ?? defaultStartMode(modes)?.id ?? null,
    [selectedModeId, modes],
  );

  // Only a repaint driver now: every displayed number is derived from the
  // clock, so a throttled wake corrects itself instead of losing time. It runs
  // for the whole session rather than only while a segment is open, because the
  // idle total keeps growing while the timer is paused and would otherwise sit
  // frozen at whatever it read when the user hit pause.
  useTimerTick(session !== null, () => setNow(Date.now()));

  useEffect(() => {
    return () => {
      clearSoundQueue();
      stopAmbientSound();
    };
  }, []);

  // The ambient loop follows whichever mode is running. playAmbientSound stops
  // the previous track and no-ops when the id has not changed, so a switch
  // needs nothing more than this.
  useEffect(() => {
    const ambientAllowed = soundEnabled && (focusSettings.ambientSoundEnabled ?? false);
    if (!ambientAllowed || !currentMode || currentMode.ambientSound === "") {
      stopAmbientSound();
      return;
    }
    const file = getAmbientSoundFile(currentMode.ambientSound);
    if (file === "") {
      stopAmbientSound();
      return;
    }
    playAmbientSound(file, focusSettings.ambientVolume ?? 0.3);
  }, [currentMode, soundEnabled, focusSettings.ambientSoundEnabled, focusSettings.ambientVolume]);

  const notify = useCallback(
    (title: string, body: string) => {
      if (!notificationsEnabled || focusSettings.notificationsEnabled === false) return;
      sendNotification(title, { body, silent: true });
    },
    [notificationsEnabled, focusSettings.notificationsEnabled],
  );

  // Fires once per finished segment. Keyed on the segment rather than the mode,
  // so running the same mode twice is two completions.
  const completedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!session || !activeSegment || !currentMode) return;
    const total = modeSeconds(currentMode);
    if (total === undefined) return; // counts up: never completes on its own
    if (remainingSeconds(currentMode, activeSegment, now)! > 0) return;

    const key = `${activeSegment.modeId}-${activeSegment.startedAt}`;
    if (completedRef.current === key) return;
    completedRef.current = key;

    if (soundEnabled) playNotificationSound((currentMode.endSound || "break-end") as SoundType);

    // Hand over at the moment it was actually due, not whenever the browser got
    // round to waking us, so a throttled tab does not quietly stretch the day.
    const dueAt = activeSegment.startedAt + total * 1000;
    const next = nextModeAfter(currentMode, completionCount(session, currentMode.id) + 1, modes);

    if (!next) {
      notify(`${currentMode.name} finished`, "Nothing queued next -- pick a mode when you are ready.");
      pause(dueAt);
      return;
    }

    // If the user has been away long enough that the next mode would also be
    // over, stop rather than replaying hours of sessions nobody sat through.
    const nextTotal = modeSeconds(next);
    if (nextTotal !== undefined && now >= dueAt + nextTotal * 1000) {
      notify(`${currentMode.name} finished`, "You were away, so the timer stopped.");
      pause(dueAt);
      return;
    }

    notify(`${currentMode.name} finished`, `Starting ${next.name}.`);
    switchTo(next, dueAt);
  }, [session, activeSegment, currentMode, now, modes, soundEnabled, notify, pause, switchTo]);

  const enableNotifications = useCallback(async () => {
    const result = await requestNotificationPermission();
    setNotificationsEnabled(result === "granted");
  }, []);

  const handleStart = useCallback(() => {
    const mode = findMode(modes, effectiveSelectedId ?? undefined);
    if (!mode) return;
    completedRef.current = null;
    setShowSetup(false);
    setNow(Date.now());
    start(mode);
  }, [modes, effectiveSelectedId, start]);

  const handleSwitch = useCallback(
    (mode: FocusMode) => {
      completedRef.current = null;
      setNow(Date.now());
      if (activeSegment) {
        switchTo(mode);
      } else {
        resume(mode);
      }
    },
    [activeSegment, switchTo, resume],
  );

  const togglePause = useCallback(() => {
    if (activeSegment) {
      if (soundEnabled) playNotificationSound("pause");
      pause();
    } else if (currentMode ?? modes[0]) {
      const mode = currentMode ?? modes[0];
      completedRef.current = null;
      setNow(Date.now());
      resume(mode);
    }
  }, [activeSegment, currentMode, modes, pause, resume, soundEnabled]);

  const handleEnd = useCallback(() => {
    end();
    completedRef.current = null;
    setShowSetup(false);
  }, [end]);

  // The mode of the last segment, so a paused session still says what it was
  // doing and what Resume will pick back up.
  const pausedMode = useMemo(() => {
    if (activeSegment || !session) return null;
    const last = session.segments[session.segments.length - 1];
    return last ? findMode(modes, last.modeId) : null;
  }, [activeSegment, session, modes]);

  const running = session !== null && !showSetup;
  const sessionTotals = totals(now);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if ((e.key === " " || e.key === "Enter") && isActivationTarget(e.target)) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (!running) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePause();
          break;
        case "m":
        case "M":
          e.preventDefault();
          setSoundEnabled((previous) => !previous);
          break;
        case "e":
        case "E":
          e.preventDefault();
          setShowSetup(true);
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, running, togglePause]);

  const shell = (children: React.ReactNode) => (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Open focus timer"
      className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800"
    >
      {children}
    </div>
  );

  if (!isLoaded) {
    return shell(
      <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">Loading…</div>,
    );
  }

  if (!running) {
    const resumable =
      session !== null
        ? { workSeconds: sessionTotals.work, breakSeconds: sessionTotals.break }
        : null;
    return shell(
      <OpenFocusSetup
        modes={modes}
        selectedModeId={effectiveSelectedId}
        onSelectMode={setSelectedModeId}
        onChangeModes={(next) => onUpdateFocusSettings({ ...focusSettings, modes: next })}
        onStart={handleStart}
        onClose={onClose}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((previous) => !previous)}
        resumable={resumable}
        onResume={() => {
          setShowSetup(false);
          setNow(Date.now());
        }}
        onDiscardResumable={() => {
          discard();
          completedRef.current = null;
        }}
      />,
    );
  }

  const displayMode = currentMode ?? pausedMode;
  const remaining = displayMode && activeSegment ? remainingSeconds(displayMode, activeSegment, now) : undefined;
  const elapsed = activeSegment ? elapsedSeconds(activeSegment, now) : 0;
  const countsUp = displayMode !== null && modeSeconds(displayMode) === undefined;
  const total = displayMode ? modeSeconds(displayMode) : undefined;
  const progress =
    total === undefined || total === 0 || remaining === undefined
      ? 0
      : Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
  const endsAt = remaining !== undefined && remaining > 0 ? new Date(now + remaining * 1000) : null;

  return shell(
    <>
      <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Exit (Esc)"
            aria-label="Exit timer"
          >
            <CloseIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {displayMode?.name ?? "Timer"}
            {displayMode && (
              <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200">
                {displayMode.kind === "work" ? "Work" : "Break"}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSetup(true)}
            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
            title="Change modes (E)"
            aria-label="Change modes"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-400 dark:text-zinc-600"
            }`}
            title={soundEnabled ? "Mute sounds (M)" : "Enable sounds (M)"}
            aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {soundEnabled ? <VolumeOnIcon className="w-5 h-5" /> : <VolumeOffIcon className="w-5 h-5" />}
          </button>
          {!notificationsEnabled && (
            <button
              onClick={enableNotifications}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors"
              title="Enable notifications"
              aria-label="Enable notifications"
            >
              <BellIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div
          className="w-3 h-3 rounded-full mb-6"
          style={{ backgroundColor: displayMode?.color ?? "#71717a" }}
          aria-hidden="true"
        />

        <div className="text-center mb-8">
          <div
            className="text-8xl font-mono font-bold text-zinc-900 dark:text-zinc-100 mb-2"
            data-testid="focus-timer-display"
          >
            {countsUp ? formatTime(elapsed) : formatTime(remaining ?? 0)}
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">
            {activeSegment === null
              ? "Paused"
              : countsUp
                ? "Counting up"
                : endsAt
                  ? `Until ${formatClockTime(endsAt)}`
                  : "Overtime"}
          </p>
        </div>

        <div className="flex items-center gap-4 mb-8 flex-wrap justify-center">
          <button
            onClick={togglePause}
            className={`px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-3 ${
              activeSegment
                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {activeSegment ? (
              <>
                <PauseIcon className="w-6 h-6" />
                Pause
              </>
            ) : (
              <>
                <PlayIcon className="w-6 h-6" />
                Resume
              </>
            )}
          </button>
          <button
            onClick={handleEnd}
            className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <StopSolidIcon className="w-4 h-4" />
            End session
          </button>
        </div>

        {modes.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Switch to</span>
            {modes
              .filter((mode) => mode.id !== displayMode?.id)
              .map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleSwitch(mode)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors hover:bg-white/70 dark:hover:bg-zinc-700/70"
                  style={{ borderColor: mode.color, color: mode.color }}
                >
                  {mode.name}
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-center gap-6 text-sm text-zinc-600 dark:text-zinc-400 flex-wrap">
          <span>🎯 Work: {formatTime(sessionTotals.work)}</span>
          <span>☕ Break: {formatTime(sessionTotals.break)}</span>
          {sessionTotals.idle > 0 && <span>⏸️ Idle: {formatTime(sessionTotals.idle)}</span>}
        </div>
      </div>

      {(focusSettings.showKeyboardHints ?? true) && (
        <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
          <span className="inline-flex items-center gap-4 flex-wrap justify-center">
            <span>Space {activeSegment ? "Pause" : "Resume"}</span>
            <span>E Modes</span>
            <span>M Mute</span>
            <span>Esc Exit</span>
          </span>
        </div>
      )}

      <div className="h-2 bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full bg-blue-600 transition-all duration-1000"
          style={{ width: `${progress}%`, backgroundColor: displayMode?.color }}
        />
      </div>
    </>,
  );
}
