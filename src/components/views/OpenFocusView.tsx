"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Settings } from "@/types/settings";
import {
  playNotificationSound,
  queueSounds,
  clearSoundQueue,
  sendNotification,
  requestNotificationPermission,
  getNotificationPermission,
  playAmbientSound,
  stopAmbientSound,
  getAmbientSoundFile,
} from "@/utils/notifications";
import { CloseIcon, VolumeOnIcon, VolumeOffIcon, BellIcon, PlayIcon, PauseIcon } from "@/components/shared/Icons";

interface OpenFocusViewProps {
  settings: Settings;
  onClose: () => void;
}

type OpenFocusPhase = "work" | "short-break" | "long-break" | "pending-break" | "pending-work";

interface OpenFocusState {
  phase: OpenFocusPhase;
  workTimeRemaining: number; // seconds
  breakTimeRemaining: number; // seconds
  breakEndTime: Date | null;
  sessionCount: number; // Sessions completed
  breakSessionCount: number; // Break sessions completed
  totalWorkTime: number; // Total seconds worked
  totalBreakTime: number; // Total seconds on break
  totalIdleTime: number; // Total seconds idle (not working or breaking)
  isRunning: boolean;
  lastPauseTime: Date | null; // When timer was last paused (for idle tracking)
  // Confirmation state
  pendingPhase: "short-break" | "long-break" | "work" | null;
  confirmationRepeats: number;
}

// Format seconds to MM:SS or HH:MM:SS
function formatTime(seconds: number): string {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const hrs = Math.floor(absSeconds / 3600);
  const mins = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  const timeStr =
    hrs > 0
      ? `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      : `${mins}:${secs.toString().padStart(2, "0")}`;

  return isNegative ? `-${timeStr}` : timeStr;
}

// Format Date to clock time (e.g., "9:53 PM")
function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function OpenFocusView({ settings, onClose }: OpenFocusViewProps) {
  // Get scheduling settings from gantt
  const ganttSettings = settings.gantt ?? {};
  const focusSettings = settings.focus ?? {};
  const technique = ganttSettings.schedulingTechnique ?? "pomodoro";

  // Technique-specific settings
  const pomodoroWorkMinutes = ganttSettings.pomodoroWorkDuration ?? 25;
  const pomodoroShortBreak = ganttSettings.pomodoroShortBreak ?? 5;
  const pomodoroLongBreak = ganttSettings.pomodoroLongBreak ?? 15;
  const pomodoroLongBreakInterval = ganttSettings.pomodoroLongBreakInterval ?? 4;

  // Flow settings
  const flowWorkMinutes = ganttSettings.flowWorkDuration ?? 52;
  const flowBreakMinutes = ganttSettings.flowBreakDuration ?? 17;

  // Sequential settings (use default task duration for work, context switch time for break)
  const sequentialWorkMinutes = ganttSettings.defaultTaskDuration ?? 30;
  const sequentialBreakMinutes = ganttSettings.contextSwitchingTime ?? 5;

  // Calculate work duration based on technique
  const getWorkDuration = useCallback(() => {
    switch (technique) {
      case "pomodoro":
        return pomodoroWorkMinutes * 60;
      case "flow":
        return flowWorkMinutes * 60;
      case "sequential":
      default:
        return sequentialWorkMinutes * 60;
    }
  }, [technique, pomodoroWorkMinutes, flowWorkMinutes, sequentialWorkMinutes]);

  // Calculate break duration based on technique and session count
  const getBreakDuration = useCallback(
    (sessionCount: number, isLongBreak: boolean) => {
      switch (technique) {
        case "pomodoro":
          return isLongBreak ? pomodoroLongBreak * 60 : pomodoroShortBreak * 60;
        case "flow":
          return flowBreakMinutes * 60;
        case "sequential":
        default:
          return sequentialBreakMinutes * 60;
      }
    },
    [technique, pomodoroShortBreak, pomodoroLongBreak, flowBreakMinutes, sequentialBreakMinutes],
  );

  // Focus state
  const [state, setState] = useState<OpenFocusState>(() => ({
    phase: "work",
    workTimeRemaining: getWorkDuration(),
    breakTimeRemaining: 0,
    breakEndTime: null,
    sessionCount: 0,
    breakSessionCount: 0,
    totalWorkTime: 0,
    totalBreakTime: 0,
    totalIdleTime: 0,
    isRunning: false,
    lastPauseTime: null,
    pendingPhase: null,
    confirmationRepeats: 0,
  }));

  // UI state
  const [soundEnabled, setSoundEnabled] = useState(focusSettings.soundEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(getNotificationPermission() === "granted");

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const confirmationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSoundQueue();
      stopAmbientSound();
      if (timerRef.current) clearInterval(timerRef.current);
      if (confirmationTimerRef.current) clearInterval(confirmationTimerRef.current);
    };
  }, []);

  // Ambient sound management
  useEffect(() => {
    if (!soundEnabled) {
      stopAmbientSound();
      return;
    }

    const isWorkPhase = state.phase === "work";
    const isBreakPhase = state.phase === "short-break" || state.phase === "long-break";

    if (state.isRunning && isWorkPhase && focusSettings.ambientWorkSound) {
      const soundFile = getAmbientSoundFile(focusSettings.ambientWorkSound);
      if (soundFile) {
        playAmbientSound(soundFile, focusSettings.ambientVolume ?? 0.3);
      }
    } else if (state.isRunning && isBreakPhase && focusSettings.ambientBreakSound) {
      const soundFile = getAmbientSoundFile(focusSettings.ambientBreakSound);
      if (soundFile) {
        playAmbientSound(soundFile, focusSettings.ambientVolume ?? 0.3);
      }
    } else {
      stopAmbientSound();
    }
  }, [
    state.phase,
    state.isRunning,
    soundEnabled,
    focusSettings.ambientWorkSound,
    focusSettings.ambientBreakSound,
    focusSettings.ambientVolume,
  ]);

  // Helper to complete phase transition
  const confirmPhaseTransition = useCallback(
    (s: OpenFocusState): OpenFocusState => {
      if (s.pendingPhase === "short-break" || s.pendingPhase === "long-break") {
        const isLongBreak = s.pendingPhase === "long-break";
        const breakDuration = getBreakDuration(s.sessionCount, isLongBreak);
        const breakEndTime = new Date();
        breakEndTime.setSeconds(breakEndTime.getSeconds() + breakDuration);

        return {
          ...s,
          phase: s.pendingPhase,
          pendingPhase: null,
          confirmationRepeats: 0,
          breakTimeRemaining: breakDuration,
          breakEndTime,
          isRunning: true,
        };
      } else if (s.pendingPhase === "work") {
        return {
          ...s,
          phase: "work",
          pendingPhase: null,
          confirmationRepeats: 0,
          workTimeRemaining: getWorkDuration(),
          breakTimeRemaining: 0,
          breakEndTime: null,
          isRunning: true,
          breakSessionCount: s.breakSessionCount + 1, // Count completed break
        };
      }
      return s;
    },
    [getWorkDuration, getBreakDuration],
  );

  // Confirm transition button handler
  const confirmTransition = useCallback(() => {
    if (confirmationTimerRef.current) {
      clearInterval(confirmationTimerRef.current);
      confirmationTimerRef.current = null;
    }
    setState((s) => confirmPhaseTransition(s));
  }, [confirmPhaseTransition]);

  // Confirmation repeat timer
  useEffect(() => {
    if (state.pendingPhase && focusSettings.requireConfirmation) {
      const maxRepeats = focusSettings.confirmationMaxRepeats ?? 5;
      const interval = (focusSettings.confirmationRepeatInterval ?? 30) * 1000;

      confirmationTimerRef.current = setInterval(() => {
        setState((s) => {
          const newRepeats = s.confirmationRepeats + 1;

          // Play reminder sound
          if (soundEnabled) {
            if (s.pendingPhase === "long-break") {
              playNotificationSound("long-break");
            } else if (s.pendingPhase === "short-break") {
              playNotificationSound("short-break");
            } else {
              playNotificationSound("break-end");
            }
          }

          // Auto-proceed after max repeats (if not 0 = infinite)
          if (maxRepeats > 0 && newRepeats >= maxRepeats) {
            return confirmPhaseTransition(s);
          }

          return { ...s, confirmationRepeats: newRepeats };
        });
      }, interval);

      return () => {
        if (confirmationTimerRef.current) {
          clearInterval(confirmationTimerRef.current);
          confirmationTimerRef.current = null;
        }
      };
    }
  }, [
    state.pendingPhase,
    focusSettings.requireConfirmation,
    focusSettings.confirmationRepeatInterval,
    focusSettings.confirmationMaxRepeats,
    soundEnabled,
    confirmPhaseTransition,
  ]);

  // Timer tick
  useEffect(() => {
    // Stop timer if not running or if pending
    if (!state.isRunning || state.pendingPhase) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setState((s) => {
        if (s.phase === "work") {
          const newWorkTime = s.workTimeRemaining - 1;
          const newTotalWorkTime = s.totalWorkTime + 1;

          // Work session complete
          if (newWorkTime <= 0) {
            const newSessionCount = s.sessionCount + 1;

            // Determine break type
            let isLongBreak = false;
            let pendingPhase: "short-break" | "long-break" = "short-break";

            if (technique === "pomodoro") {
              isLongBreak = newSessionCount > 0 && newSessionCount % pomodoroLongBreakInterval === 0;
              pendingPhase = isLongBreak ? "long-break" : "short-break";
            } else {
              // Flow and Sequential just use short break
              pendingPhase = "short-break";
            }

            const breakDuration = getBreakDuration(newSessionCount, isLongBreak);

            // Play sound
            if (soundEnabled) {
              queueSounds([isLongBreak ? "long-break" : "short-break"]);
            }
            if (notificationsEnabled) {
              sendNotification(isLongBreak ? "🍅 Time for a long break!" : "☕ Time for a break!", {
                body: `Session ${newSessionCount} complete! Take a ${Math.ceil(breakDuration / 60)} minute break.`,
                silent: true,
              });
            }

            // If confirmation required, go to pending state
            if (focusSettings.requireConfirmation) {
              return {
                ...s,
                phase: "pending-break",
                pendingPhase,
                workTimeRemaining: 0,
                sessionCount: newSessionCount,
                totalWorkTime: newTotalWorkTime,
                isRunning: false,
                confirmationRepeats: 0,
                lastPauseTime: new Date(), // Start tracking idle time
              };
            }

            // Otherwise transition immediately
            const breakEndTime = new Date();
            breakEndTime.setSeconds(breakEndTime.getSeconds() + breakDuration);

            return {
              ...s,
              phase: pendingPhase,
              workTimeRemaining: 0,
              breakTimeRemaining: breakDuration,
              breakEndTime,
              sessionCount: newSessionCount,
              totalWorkTime: newTotalWorkTime,
            };
          }

          return {
            ...s,
            workTimeRemaining: newWorkTime,
            totalWorkTime: newTotalWorkTime,
          };
        } else if (s.phase === "short-break" || s.phase === "long-break") {
          const newBreakTime = s.breakTimeRemaining - 1;
          const newTotalBreakTime = s.totalBreakTime + 1;

          // Break complete
          if (newBreakTime <= 0) {
            // Play sound
            if (soundEnabled) {
              queueSounds(["break-end", "task-start"]);
            }
            if (notificationsEnabled) {
              sendNotification("🍅 Break over - back to work!", {
                body: "Time to focus!",
                silent: true,
              });
            }

            // If confirmation required, go to pending state
            if (focusSettings.requireConfirmation) {
              return {
                ...s,
                phase: "pending-work",
                pendingPhase: "work",
                breakTimeRemaining: 0,
                breakEndTime: null,
                isRunning: false,
                confirmationRepeats: 0,
                totalBreakTime: newTotalBreakTime,
                lastPauseTime: new Date(), // Start tracking idle time
              };
            }

            // Otherwise transition immediately
            return {
              ...s,
              phase: "work",
              workTimeRemaining: getWorkDuration(),
              breakTimeRemaining: 0,
              breakEndTime: null,
              totalBreakTime: newTotalBreakTime,
              breakSessionCount: s.breakSessionCount + 1,
            };
          }

          return {
            ...s,
            breakTimeRemaining: newBreakTime,
            totalBreakTime: newTotalBreakTime,
          };
        }

        return s;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    state.isRunning,
    state.pendingPhase,
    technique,
    pomodoroLongBreakInterval,
    soundEnabled,
    notificationsEnabled,
    focusSettings.requireConfirmation,
    getWorkDuration,
    getBreakDuration,
  ]);

  // Toggle timer
  const toggleTimer = useCallback(() => {
    setState((s) => {
      // Calculate idle time if resuming from pause
      let idleTimeToAdd = 0;
      if (!s.isRunning && s.lastPauseTime) {
        idleTimeToAdd = Math.floor((Date.now() - s.lastPauseTime.getTime()) / 1000);
      }

      // Starting work
      if (!s.isRunning && s.phase === "work") {
        if (soundEnabled) {
          playNotificationSound("task-start");
        }
        return {
          ...s,
          isRunning: true,
          lastPauseTime: null,
          totalIdleTime: s.totalIdleTime + idleTimeToAdd,
        };
      }

      // Resuming break - recalculate breakEndTime
      if (!s.isRunning && (s.phase === "short-break" || s.phase === "long-break")) {
        const newBreakEndTime = new Date();
        newBreakEndTime.setSeconds(newBreakEndTime.getSeconds() + s.breakTimeRemaining);
        return {
          ...s,
          isRunning: true,
          breakEndTime: newBreakEndTime,
          lastPauseTime: null,
          totalIdleTime: s.totalIdleTime + idleTimeToAdd,
        };
      }

      // Pausing work
      if (s.isRunning && s.phase === "work") {
        if (soundEnabled) {
          playNotificationSound("pause");
        }
        return {
          ...s,
          isRunning: false,
          lastPauseTime: new Date(),
        };
      }

      // Pausing break - clear breakEndTime
      if (s.isRunning && (s.phase === "short-break" || s.phase === "long-break")) {
        return {
          ...s,
          isRunning: false,
          breakEndTime: null,
          lastPauseTime: new Date(),
        };
      }

      return { ...s, isRunning: !s.isRunning };
    });
  }, [soundEnabled]);

  // Skip break
  const skipBreak = useCallback(() => {
    if (soundEnabled) {
      playNotificationSound("task-start");
    }
    setState((s) => ({
      ...s,
      phase: "work",
      workTimeRemaining: getWorkDuration(),
      breakTimeRemaining: 0,
      breakEndTime: null,
      isRunning: true,
      breakSessionCount: s.breakSessionCount + 1, // Count skipped breaks too
      lastPauseTime: null,
    }));
  }, [soundEnabled, getWorkDuration]);

  // Skip to break (end work early)
  const skipToBreak = useCallback(() => {
    const newSessionCount = state.sessionCount + 1;

    // Determine break type
    let isLongBreak = false;
    let breakPhase: "short-break" | "long-break" = "short-break";

    if (technique === "pomodoro") {
      isLongBreak = newSessionCount > 0 && newSessionCount % pomodoroLongBreakInterval === 0;
      breakPhase = isLongBreak ? "long-break" : "short-break";
    }

    const breakDuration = getBreakDuration(newSessionCount, isLongBreak);

    if (soundEnabled) {
      playNotificationSound(isLongBreak ? "long-break" : "short-break");
    }

    const breakEndTime = new Date();
    breakEndTime.setSeconds(breakEndTime.getSeconds() + breakDuration);

    setState((s) => ({
      ...s,
      phase: breakPhase,
      workTimeRemaining: 0,
      breakTimeRemaining: breakDuration,
      breakEndTime,
      sessionCount: newSessionCount,
      isRunning: true,
      lastPauseTime: null,
    }));
  }, [state.sessionCount, technique, pomodoroLongBreakInterval, getBreakDuration, soundEnabled]);

  // Reset session
  const _resetSession = useCallback(() => {
    setState({
      phase: "work",
      workTimeRemaining: getWorkDuration(),
      breakTimeRemaining: 0,
      breakEndTime: null,
      sessionCount: 0,
      breakSessionCount: 0,
      totalWorkTime: 0,
      totalBreakTime: 0,
      totalIdleTime: 0,
      isRunning: false,
      lastPauseTime: null,
      pendingPhase: null,
      confirmationRepeats: 0,
    });
  }, [getWorkDuration]);

  // Enable notifications
  const enableNotifications = useCallback(async () => {
    const result = await requestNotificationPermission();
    setNotificationsEnabled(result === "granted");
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case " ":
          e.preventDefault();
          if (state.phase === "pending-break" || state.phase === "pending-work") {
            confirmTransition();
          } else {
            toggleTimer();
          }
          break;
        case "Enter":
          e.preventDefault();
          if (state.phase === "pending-break" || state.phase === "pending-work") {
            confirmTransition();
          }
          break;
        case "s":
        case "S":
          e.preventDefault();
          if (state.phase === "short-break" || state.phase === "long-break") {
            skipBreak();
          } else if (state.phase === "work") {
            skipToBreak();
          }
          break;
        case "m":
        case "M":
          e.preventDefault();
          setSoundEnabled((prev) => !prev);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, toggleTimer, confirmTransition, skipBreak, skipToBreak, state.phase]);

  // Calculate progress
  const progress = (() => {
    if (state.phase === "work") {
      const totalWork = getWorkDuration();
      return ((totalWork - state.workTimeRemaining) / totalWork) * 100;
    } else if (state.phase === "short-break" || state.phase === "long-break") {
      const isLongBreak = state.phase === "long-break";
      const totalBreak = getBreakDuration(state.sessionCount, isLongBreak);
      return ((totalBreak - state.breakTimeRemaining) / totalBreak) * 100;
    }
    return 0;
  })();

  // Technique display info
  const techniqueIcon = technique === "pomodoro" ? "🍅" : technique === "flow" ? "🌊" : "📋";
  const techniqueName = technique === "pomodoro" ? "Pomodoro" : technique === "flow" ? "Flow" : "Sequential";

  // Pending confirmation state
  if (state.phase === "pending-break" || state.phase === "pending-work") {
    const isBreakPending = state.phase === "pending-break";
    const isLongBreak = state.pendingPhase === "long-break";
    const maxRepeats = focusSettings.confirmationMaxRepeats ?? 5;
    const repeatInterval = focusSettings.confirmationRepeatInterval ?? 30;

    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col ${
          isBreakPending
            ? isLongBreak
              ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-emerald-950 dark:to-zinc-900"
              : "bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-cyan-950 dark:to-zinc-900"
            : "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-zinc-900"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-zinc-700/50 rounded-lg transition-colors"
              title="Exit (Esc)"
            >
              <CloseIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {techniqueIcon} Open Focus ({techniqueName})
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled
                  ? "bg-white/50 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400 dark:text-zinc-600"
              }`}
              title={soundEnabled ? "Mute sounds (M)" : "Enable sounds (M)"}
            >
              {soundEnabled ? <VolumeOnIcon className="w-5 h-5" /> : <VolumeOffIcon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-8xl mb-6">{isBreakPending ? (isLongBreak ? "☕" : "💆") : "🎯"}</div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {isBreakPending
                ? isLongBreak
                  ? "Time for a long break!"
                  : "Time for a short break!"
                : "Break complete!"}
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
              {isBreakPending
                ? `Session ${state.sessionCount} complete! Great work!`
                : "Ready to start the next session?"}
            </p>

            {/* Confirmation info */}
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              {maxRepeats > 0 ? (
                <>
                  Reminder {state.confirmationRepeats} of {maxRepeats}
                  {" • "}Sound plays every {repeatInterval}s
                </>
              ) : (
                <>Sound plays every {repeatInterval}s</>
              )}
            </p>

            {/* Confirm Button */}
            <button
              onClick={confirmTransition}
              className={`px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl ${
                isBreakPending
                  ? isLongBreak
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-orange-600 hover:bg-orange-700 text-white"
              }`}
            >
              {isBreakPending ? "Start Break" : "Start Working"} (Space/Enter)
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex justify-center gap-6 text-sm text-zinc-600 dark:text-zinc-400 flex-wrap">
            <span>
              🎯 Work: {state.sessionCount} sessions • {formatTime(state.totalWorkTime)}
            </span>
            <span>
              ☕ Break: {state.breakSessionCount} sessions • {formatTime(state.totalBreakTime)}
            </span>
            {state.totalIdleTime > 0 && <span>⏸️ Idle: {formatTime(state.totalIdleTime)}</span>}
          </div>
        </div>

        {/* Keyboard Hints */}
        <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <span className="inline-flex items-center gap-4 flex-wrap justify-center">
            <span>Space/Enter Confirm</span>
            <span>M Mute</span>
            <span>Esc Exit</span>
          </span>
        </div>
      </div>
    );
  }

  // Break phase
  if (state.phase === "short-break" || state.phase === "long-break") {
    const isLongBreak = state.phase === "long-break";

    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col ${
          isLongBreak
            ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-emerald-950 dark:to-zinc-900"
            : "bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-cyan-950 dark:to-zinc-900"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-zinc-700/50 rounded-lg transition-colors"
              title="Exit (Esc)"
            >
              <CloseIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {techniqueIcon} Open Focus ({techniqueName})
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled
                  ? "bg-white/50 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400 dark:text-zinc-600"
              }`}
              title={soundEnabled ? "Mute sounds (M)" : "Enable sounds (M)"}
            >
              {soundEnabled ? <VolumeOnIcon className="w-5 h-5" /> : <VolumeOffIcon className="w-5 h-5" />}
            </button>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Session {state.sessionCount}</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-8xl mb-6">{isLongBreak ? "☕" : "💆"}</div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {isLongBreak ? "Take a long break!" : "Take a short break!"}
            </h2>

            {/* Timer */}
            <div className="text-7xl font-mono font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {formatTime(state.breakTimeRemaining)}
            </div>

            {/* Continue time */}
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
              {state.breakEndTime ? (
                <>Continue at {formatClockTime(state.breakEndTime)}</>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500">Paused</span>
              )}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleTimer}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  state.isRunning
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {state.isRunning ? (
                  <>
                    <PauseIcon className="w-5 h-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5" />
                    Resume
                  </>
                )}
              </button>
              <button
                onClick={skipBreak}
                className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
              >
                Skip Break
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex justify-center gap-6 text-sm text-zinc-600 dark:text-zinc-400 flex-wrap">
            <span>
              🎯 Work: {state.sessionCount} sessions • {formatTime(state.totalWorkTime)}
            </span>
            <span>
              ☕ Break: {state.breakSessionCount} sessions • {formatTime(state.totalBreakTime)}
            </span>
            {state.totalIdleTime > 0 && <span>⏸️ Idle: {formatTime(state.totalIdleTime)}</span>}
          </div>
        </div>

        {/* Keyboard Hints */}
        <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <span className="inline-flex items-center gap-4 flex-wrap justify-center">
            <span>Space {state.isRunning ? "Pause" : "Resume"}</span>
            <span>S Skip</span>
            <span>M Mute</span>
            <span>Esc Exit</span>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-zinc-200/50 dark:bg-zinc-700/50">
          <div
            className={`h-full transition-all duration-1000 ${isLongBreak ? "bg-green-500" : "bg-blue-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // Work phase (default)
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Exit (Esc)"
          >
            <CloseIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {techniqueIcon} Open Focus ({techniqueName})
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-400 dark:text-zinc-600"
            }`}
            title={soundEnabled ? "Mute sounds (M)" : "Enable sounds (M)"}
          >
            {soundEnabled ? <VolumeOnIcon className="w-5 h-5" /> : <VolumeOffIcon className="w-5 h-5" />}
          </button>
          {!notificationsEnabled && (
            <button
              onClick={enableNotifications}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors"
              title="Enable notifications"
            >
              <BellIcon className="w-5 h-5" />
            </button>
          )}
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Session {state.sessionCount + 1}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Focus Icon */}
        <div className="text-8xl mb-6">🎯</div>

        {/* Timer */}
        <div className="text-center mb-8">
          <div className="text-8xl font-mono font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {formatTime(state.workTimeRemaining)}
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">
            {state.isRunning ? "Time remaining" : "Press Space to start"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTimer}
            className={`px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-3 ${
              state.isRunning
                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {state.isRunning ? (
              <>
                <PauseIcon className="w-6 h-6" />
                Pause
              </>
            ) : (
              <>
                <PlayIcon className="w-6 h-6" />
                Start
              </>
            )}
          </button>
          <button
            onClick={skipToBreak}
            className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
          >
            Skip to Break
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-center gap-6 text-sm text-zinc-600 dark:text-zinc-400 flex-wrap">
          <span>
            🎯 Work: {state.sessionCount} sessions • {formatTime(state.totalWorkTime)}
          </span>
          <span>
            ☕ Break: {state.breakSessionCount} sessions • {formatTime(state.totalBreakTime)}
          </span>
          {state.totalIdleTime > 0 && <span>⏸️ Idle: {formatTime(state.totalIdleTime)}</span>}
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
        <span className="inline-flex items-center gap-4 flex-wrap justify-center">
          <span>Space {state.isRunning ? "Pause" : "Start"}</span>
          <span>S Skip</span>
          <span>M Mute</span>
          <span>Esc Exit</span>
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-zinc-200 dark:bg-zinc-700">
        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
