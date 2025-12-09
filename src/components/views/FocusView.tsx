"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { TodoModel } from "@/models/TodoModel";
import { MarkerColors, Settings, LinkPattern } from "@/types/settings";
import { TodoMetadata } from "@/types/todo";
import { MarkedText } from "@/components/shared/MarkedText";
import { Badge } from "@/components/shared/Badge";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";
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
import { ScheduledTask, parseDuration } from "@/utils/ganttScheduler";

interface FocusViewProps {
  todos: TodoModel[];
  scheduledTasks: ScheduledTask[]; // Pre-scheduled tasks from Gantt view
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string, plainText: string, metadata: TodoMetadata) => void;
  onArchive?: (id: string) => void;
  markerColors: MarkerColors;
  settings: Settings;
  linkPatterns: LinkPattern[];
  onOpenDetails: (todo: TodoModel) => void;
  onClose: () => void;
  // Time tracking
  onStartTimeTracking?: (todoId: string, note?: string) => void;
  onStopTimeTracking?: (todoId: string) => void;
}

type FocusPhase = "work" | "short-break" | "long-break" | "paused" | "completed" | "pending-break" | "pending-work";

interface FocusState {
  phase: FocusPhase;
  currentTaskIndex: number;
  currentSegmentIndex: number;
  workTimeRemaining: number; // seconds - Pomodoro session time or task segment time
  breakTimeRemaining: number; // seconds
  breakEndTime: Date | null;
  sessionCount: number; // Pomodoro sessions completed
  totalWorkTime: number; // seconds worked today
  isRunning: boolean;
  // Confirmation state
  pendingPhase: "short-break" | "long-break" | "work" | null; // What phase we're transitioning to
  confirmationRepeats: number; // How many times we've played the reminder
  // Time tracking
  taskStartTime: Date | null; // When current task started
  actualTimeSpent: number; // Seconds spent on current task
  // Task-level time tracking (separate from Pomodoro sessions)
  taskTimeRemaining: number; // Total time remaining on current task (seconds)
  taskTotalDuration: number; // Original task duration (seconds) - for progress calculation
}

export function FocusView({
  todos,
  scheduledTasks: preScheduledTasks,
  onToggle,
  onDelete,
  onEdit,
  onArchive,
  markerColors,
  settings,
  linkPatterns,
  onOpenDetails,
  onClose,
  onStartTimeTracking,
  onStopTimeTracking,
}: FocusViewProps) {
  // Filter scheduled tasks to only include non-actual-time, non-completed tasks
  const scheduledTasks = useMemo(() => {
    return preScheduledTasks.filter((t) => !t.isActualTime && !t.todo.isCompleted && !t.todo.isArchived);
  }, [preScheduledTasks]);

  // Get scheduling settings
  const ganttSettings = settings.gantt ?? {};
  const focusSettings = settings.focus ?? {};
  const technique = ganttSettings.schedulingTechnique ?? "sequential";
  const pomodoroWorkMinutes = ganttSettings.pomodoroWorkDuration ?? 25;
  const pomodoroShortBreak = ganttSettings.pomodoroShortBreak ?? 5;
  const pomodoroLongBreak = ganttSettings.pomodoroLongBreak ?? 15;
  const pomodoroLongBreakInterval = ganttSettings.pomodoroLongBreakInterval ?? 4;

  // Focus state
  const [state, setState] = useState<FocusState>({
    phase: "work",
    currentTaskIndex: 0,
    currentSegmentIndex: 0,
    workTimeRemaining: pomodoroWorkMinutes * 60,
    breakTimeRemaining: 0,
    breakEndTime: null,
    sessionCount: 0,
    totalWorkTime: 0,
    isRunning: false,
    pendingPhase: null,
    taskTimeRemaining: 0, // Will be set when task loads
    taskTotalDuration: 0, // Will be set when task loads
    confirmationRepeats: 0,
    taskStartTime: null,
    actualTimeSpent: 0,
  });

  // UI state
  const [showExtendMenu, setShowExtendMenu] = useState(false);

  // Sound settings - use from focus settings
  const [soundEnabled, setSoundEnabled] = useState(focusSettings.soundEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(getNotificationPermission() === "granted");

  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Confirmation repeat timer ref
  const confirmationTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Track previous phase for time tracking transitions
  const prevPhaseRef = useRef<FocusPhase>(state.phase);
  // Track if time tracking is active for current task
  const timeTrackingActiveRef = useRef<string | null>(null);

  // Track previous running state for time tracking transitions
  const prevIsRunningRef = useRef<boolean>(state.isRunning);

  // Current task - defined early for use in effects
  const currentTask = scheduledTasks[state.currentTaskIndex];
  const currentTodo = currentTask?.todo;

  // Cleanup sound queue and ambient sounds on unmount
  useEffect(() => {
    // Stop any active time tracking when unmounting
    if (timeTrackingActiveRef.current && onStopTimeTracking) {
      onStopTimeTracking(timeTrackingActiveRef.current);
      timeTrackingActiveRef.current = null;
    }
    return () => {
      clearSoundQueue();
      stopAmbientSound();
    };
  }, [onStopTimeTracking]);

  // Handle time tracking based on phase transitions
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const prevIsRunning = prevIsRunningRef.current;
    const currentPhase = state.phase;
    const currentIsRunning = state.isRunning;

    // Update refs for next comparison
    prevPhaseRef.current = currentPhase;
    prevIsRunningRef.current = currentIsRunning;

    if (!focusSettings.autoTimeTracking || !currentTodo) return;

    // Start tracking when: work phase becomes running (either by phase change or play button)
    const shouldStartTracking =
      currentPhase === "work" &&
      currentIsRunning &&
      !timeTrackingActiveRef.current &&
      (prevPhase !== "work" || !prevIsRunning);

    if (shouldStartTracking && onStartTimeTracking) {
      onStartTimeTracking(currentTodo.id, "Focus Mode session");
      timeTrackingActiveRef.current = currentTodo.id;
    }

    // Stop tracking when: leaving work phase OR stopping timer while in work
    const shouldStopTracking =
      timeTrackingActiveRef.current &&
      ((prevPhase === "work" && currentPhase !== "work") ||
        (currentPhase === "work" && prevIsRunning && !currentIsRunning));

    if (shouldStopTracking && onStopTimeTracking && timeTrackingActiveRef.current) {
      onStopTimeTracking(timeTrackingActiveRef.current);
      timeTrackingActiveRef.current = null;
    }
  }, [
    state.phase,
    state.isRunning,
    currentTodo,
    focusSettings.autoTimeTracking,
    onStartTimeTracking,
    onStopTimeTracking,
  ]);

  // Manage ambient sounds based on phase and settings
  useEffect(() => {
    if (!focusSettings.ambientSoundEnabled || !state.isRunning) {
      stopAmbientSound();
      return;
    }

    const isWorkPhase = state.phase === "work";
    const isBreakPhase = state.phase === "short-break" || state.phase === "long-break";

    if (isWorkPhase && focusSettings.ambientWorkSound) {
      const soundFile = getAmbientSoundFile(focusSettings.ambientWorkSound);
      if (soundFile) {
        playAmbientSound(soundFile, focusSettings.ambientVolume);
      }
    } else if (isBreakPhase && focusSettings.ambientBreakSound) {
      const soundFile = getAmbientSoundFile(focusSettings.ambientBreakSound);
      if (soundFile) {
        playAmbientSound(soundFile, focusSettings.ambientVolume);
      }
    } else {
      stopAmbientSound();
    }
  }, [
    state.phase,
    state.isRunning,
    focusSettings.ambientSoundEnabled,
    focusSettings.ambientWorkSound,
    focusSettings.ambientBreakSound,
    focusSettings.ambientVolume,
  ]);

  // Calculate already-tracked time for current task (from previous sessions)
  const alreadyTrackedSeconds = useMemo(() => {
    if (!currentTodo || !currentTodo.hasTimeTracking || !currentTodo.timeTracking) return 0;
    // Sum up all completed time entries (with endTime)
    return currentTodo.timeTracking.entries.reduce((sum, entry) => {
      if (entry.endTime && entry.duration) {
        return sum + entry.duration * 60; // Convert minutes to seconds
      }
      return sum;
    }, 0);
  }, [currentTodo]);

  // Calculate work time for current task (considering already-tracked time if enabled)
  const currentTaskDuration = useMemo(() => {
    if (!currentTodo) return pomodoroWorkMinutes * 60;
    const originalDuration = parseDuration(currentTodo.metadata.duration) * 60; // Convert to seconds

    // If useTrackedTimeForDuration is enabled, subtract already-tracked time
    if (focusSettings.useTrackedTimeForDuration !== false && alreadyTrackedSeconds > 0) {
      const remaining = originalDuration - alreadyTrackedSeconds;
      // Allow negative time to show overtime
      return remaining;
    }

    return originalDuration;
  }, [currentTodo, pomodoroWorkMinutes, alreadyTrackedSeconds, focusSettings.useTrackedTimeForDuration]);

  // Original task duration (without subtracting tracked time) - for display
  const originalTaskDuration = useMemo(() => {
    if (!currentTodo) return pomodoroWorkMinutes * 60;
    return parseDuration(currentTodo.metadata.duration) * 60;
  }, [currentTodo, pomodoroWorkMinutes]);

  // Initialize work time when task changes
  useEffect(() => {
    // Calculate the initial session time (Pomodoro session or task duration for sequential/flow)
    const sessionTime = technique === "pomodoro" ? pomodoroWorkMinutes * 60 : currentTaskDuration;
    // For Pomodoro, start with min of session time and task duration remaining
    // If task duration is negative (overtime), still allow work to continue
    const effectiveTaskDuration = Math.max(0, currentTaskDuration);
    const initialWorkTime =
      technique === "pomodoro" ? Math.min(sessionTime, Math.max(0, currentTaskDuration)) : effectiveTaskDuration;

    setState((s) => ({
      ...s,
      workTimeRemaining: initialWorkTime > 0 ? initialWorkTime : 0,
      taskTimeRemaining: currentTaskDuration, // Can be negative for overtime display
      taskTotalDuration: originalTaskDuration, // Original duration for progress calculation
      taskStartTime: null,
      actualTimeSpent: 0,
    }));
  }, [state.currentTaskIndex, technique, pomodoroWorkMinutes, currentTaskDuration, originalTaskDuration]);

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
  ]);

  // Helper to complete phase transition after confirmation
  const confirmPhaseTransition = useCallback(
    (s: FocusState): FocusState => {
      if (s.pendingPhase === "short-break" || s.pendingPhase === "long-break") {
        const isLongBreak = s.pendingPhase === "long-break";
        const breakDuration =
          technique === "pomodoro"
            ? isLongBreak
              ? pomodoroLongBreak
              : pomodoroShortBreak
            : ganttSettings.flowBreakDuration ?? 17;

        const breakEndTime = new Date();
        breakEndTime.setSeconds(breakEndTime.getSeconds() + breakDuration * 60);

        return {
          ...s,
          phase: s.pendingPhase,
          pendingPhase: null,
          confirmationRepeats: 0,
          breakTimeRemaining: breakDuration * 60,
          breakEndTime,
          isRunning: true,
        };
      } else if (s.pendingPhase === "work") {
        // Calculate next session time based on remaining task time
        const nextSessionDuration =
          technique === "pomodoro" ? Math.min(pomodoroWorkMinutes * 60, s.taskTimeRemaining) : s.taskTimeRemaining;
        return {
          ...s,
          phase: "work",
          pendingPhase: null,
          confirmationRepeats: 0,
          workTimeRemaining: nextSessionDuration,
          breakTimeRemaining: 0,
          breakEndTime: null,
          taskStartTime: focusSettings.autoTimeTracking ? new Date() : null,
          isRunning: true,
        };
      }
      return s;
    },
    [
      technique,
      pomodoroLongBreak,
      pomodoroShortBreak,
      pomodoroWorkMinutes,
      ganttSettings.flowBreakDuration,
      focusSettings.autoTimeTracking,
    ],
  );

  // Confirm button handler
  const confirmTransition = useCallback(() => {
    if (confirmationTimerRef.current) {
      clearInterval(confirmationTimerRef.current);
      confirmationTimerRef.current = null;
    }
    setState((s) => confirmPhaseTransition(s));
  }, [confirmPhaseTransition]);

  // Timer tick
  useEffect(() => {
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
          const newTaskTime = s.taskTimeRemaining - 1;
          const newTotalWorkTime = s.totalWorkTime + 1;
          const newActualTime = s.actualTimeSpent + 1;

          // Task is complete (task time ran out)
          if (newTaskTime <= 0) {
            // Play task complete sound
            if (soundEnabled) {
              playNotificationSound("task-complete");
            }
            // Don't transition here - let the user click Complete or it will auto-complete
            // Just stop the timer and show task as done
            return {
              ...s,
              workTimeRemaining: 0,
              taskTimeRemaining: 0,
              totalWorkTime: newTotalWorkTime,
              actualTimeSpent: newActualTime,
              isRunning: false, // Stop timer when task time is up
            };
          }

          // Pomodoro session complete but task has more time
          if (newWorkTime <= 0 && technique === "pomodoro") {
            const newSessionCount = s.sessionCount + 1;
            const isLongBreak = newSessionCount > 0 && newSessionCount % pomodoroLongBreakInterval === 0;

            const pendingPhase = isLongBreak ? "long-break" : "short-break";
            const breakDuration = isLongBreak ? pomodoroLongBreak : pomodoroShortBreak;

            // Play sounds: session complete sound, then break sound after 3s delay
            if (soundEnabled) {
              queueSounds([isLongBreak ? "long-break" : "short-break"]);
            }
            if (notificationsEnabled) {
              sendNotification(isLongBreak ? "🍅 Time for a long break!" : "🍅 Time for a short break!", {
                body: `Session complete! Take a ${breakDuration} minute break. Task has ${Math.ceil(
                  newTaskTime / 60,
                )} min remaining.`,
                silent: true,
              });
            }

            // If confirmation required, go to pending state
            if (focusSettings.requireConfirmation) {
              return {
                ...s,
                phase: "pending-break",
                pendingPhase: pendingPhase as "short-break" | "long-break",
                workTimeRemaining: 0,
                taskTimeRemaining: newTaskTime,
                sessionCount: newSessionCount,
                totalWorkTime: newTotalWorkTime,
                actualTimeSpent: newActualTime,
                isRunning: false,
                confirmationRepeats: 0,
              };
            }

            // Otherwise transition immediately
            const breakEndTime = new Date();
            breakEndTime.setSeconds(breakEndTime.getSeconds() + breakDuration * 60);

            return {
              ...s,
              phase: pendingPhase as "short-break" | "long-break",
              workTimeRemaining: 0,
              taskTimeRemaining: newTaskTime,
              breakTimeRemaining: breakDuration * 60,
              breakEndTime,
              sessionCount: newSessionCount,
              totalWorkTime: newTotalWorkTime,
              actualTimeSpent: newActualTime,
            };
          }

          // Sequential/Flow: session complete = task complete (handled above)
          if (newWorkTime <= 0 && technique !== "pomodoro") {
            // For non-Pomodoro, work time = task time, so this shouldn't happen
            // but handle it gracefully
            return {
              ...s,
              workTimeRemaining: 0,
              taskTimeRemaining: newTaskTime,
              totalWorkTime: newTotalWorkTime,
              actualTimeSpent: newActualTime,
              isRunning: false,
            };
          }

          return {
            ...s,
            workTimeRemaining: newWorkTime,
            taskTimeRemaining: newTaskTime,
            totalWorkTime: newTotalWorkTime,
            actualTimeSpent: newActualTime,
          };
        } else if (s.phase === "short-break" || s.phase === "long-break") {
          const newBreakTime = s.breakTimeRemaining - 1;

          if (newBreakTime <= 0) {
            // Break complete - back to work
            // Calculate next session duration: min of pomodoro session and remaining task time
            const nextSessionDuration =
              technique === "pomodoro" ? Math.min(pomodoroWorkMinutes * 60, s.taskTimeRemaining) : s.taskTimeRemaining;

            // Play sounds: break-end, then task-start after 3s delay
            if (soundEnabled) {
              queueSounds(["break-end", "task-start"]);
            }
            if (notificationsEnabled) {
              sendNotification("🍅 Break over - back to work!", {
                body: currentTodo?.plainText ?? "Time to focus!",
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
              };
            }

            return {
              ...s,
              phase: "work",
              workTimeRemaining: nextSessionDuration,
              breakTimeRemaining: 0,
              breakEndTime: null,
              taskStartTime: focusSettings.autoTimeTracking ? new Date() : null,
            };
          }

          return {
            ...s,
            breakTimeRemaining: newBreakTime,
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
    pomodoroWorkMinutes,
    pomodoroShortBreak,
    pomodoroLongBreak,
    pomodoroLongBreakInterval,
    soundEnabled,
    notificationsEnabled,
    currentTodo?.plainText,
    focusSettings.requireConfirmation,
    focusSettings.autoTimeTracking,
  ]);

  // Start/pause timer
  const toggleTimer = useCallback(() => {
    setState((s) => {
      if (!s.isRunning && s.phase === "work") {
        if (soundEnabled) {
          playNotificationSound("task-start");
        }
        // Time tracking is handled by the phase transition effect
        return {
          ...s,
          isRunning: true,
          taskStartTime: focusSettings.autoTimeTracking && !s.taskStartTime ? new Date() : s.taskStartTime,
        };
      }

      // When pausing, check if we need to auto-extend
      // Auto-extend if: autoExtendOnOvertime is enabled AND task time remaining would be <= 0
      if (s.isRunning && s.phase === "work" && focusSettings.autoExtendOnOvertime !== false) {
        // If task time remaining is 0 or negative, auto-extend to give at least 1 minute of wrap-up
        if (s.taskTimeRemaining <= 0) {
          // Extend by the actual time spent in this session (rounded up to next minute)
          const extensionMinutes = Math.ceil(s.actualTimeSpent / 60);
          const additionalTimeSeconds = Math.max(60, extensionMinutes * 60); // At least 1 minute
          const additionalMinutes = Math.ceil(additionalTimeSeconds / 60);

          // Update the actual todo's duration - get fresh todo from todos array
          const freshTodo = currentTodo ? todos.find((t) => t.id === currentTodo.id) : null;
          if (freshTodo) {
            const currentDurationMinutes = parseDuration(freshTodo.metadata.duration);
            const newDurationMinutes = currentDurationMinutes + additionalMinutes;
            const newDurationStr = `${newDurationMinutes}m`;

            // Schedule the todo update for after setState (use setTimeout to escape setState)
            setTimeout(() => {
              onEdit(freshTodo.id, freshTodo.text, freshTodo.plainText, {
                ...freshTodo.metadata,
                duration: newDurationStr,
              });
            }, 0);
          }

          return {
            ...s,
            isRunning: false,
            taskTimeRemaining: additionalTimeSeconds,
            taskTotalDuration: s.taskTotalDuration + additionalTimeSeconds,
          };
        }
      }

      // Time tracking stop is handled by the phase transition effect
      return { ...s, isRunning: !s.isRunning };
    });
  }, [soundEnabled, focusSettings.autoTimeTracking, focusSettings.autoExtendOnOvertime, currentTodo, todos, onEdit]);

  // Extend current task time (extends both local state AND the actual todo duration)
  const extendTime = useCallback(
    (minutes: number) => {
      // Get fresh todo from todos array to avoid stale closure
      const freshTodo = currentTodo ? todos.find((t) => t.id === currentTodo.id) : null;
      if (!freshTodo) return;

      // Update local state
      setState((s) => {
        const additionalTime = minutes * 60;
        const newTaskTimeRemaining = s.taskTimeRemaining + additionalTime;
        const newTaskTotalDuration = s.taskTotalDuration + additionalTime;

        // If in work phase and timer stopped (task time was up), restart with new time
        if (s.phase === "work" && !s.isRunning && s.workTimeRemaining === 0) {
          // Calculate new work session time
          const newWorkTime =
            technique === "pomodoro" ? Math.min(pomodoroWorkMinutes * 60, newTaskTimeRemaining) : newTaskTimeRemaining;
          return {
            ...s,
            taskTimeRemaining: newTaskTimeRemaining,
            taskTotalDuration: newTaskTotalDuration,
            workTimeRemaining: newWorkTime,
          };
        }

        // Otherwise just add to task time (current session continues as-is)
        return {
          ...s,
          taskTimeRemaining: newTaskTimeRemaining,
          taskTotalDuration: newTaskTotalDuration,
        };
      });

      // Update the actual todo's duration using fresh data
      const currentDurationMinutes = parseDuration(freshTodo.metadata.duration);
      const newDurationMinutes = currentDurationMinutes + minutes;
      const newDurationStr = `${newDurationMinutes}m`;

      onEdit(freshTodo.id, freshTodo.text, freshTodo.plainText, {
        ...freshTodo.metadata,
        duration: newDurationStr,
      });

      setShowExtendMenu(false);
    },
    [technique, pomodoroWorkMinutes, currentTodo, todos, onEdit],
  );

  // Complete current task
  const completeTask = useCallback(() => {
    if (!currentTodo) return;

    // Stop time tracking before completing (using ref to get active tracking ID)
    if (timeTrackingActiveRef.current && onStopTimeTracking) {
      onStopTimeTracking(timeTrackingActiveRef.current);
      timeTrackingActiveRef.current = null;
    }

    if (soundEnabled) {
      playNotificationSound("task-complete");
    }

    onToggle(currentTodo.id);

    // Move to next task
    if (state.currentTaskIndex < scheduledTasks.length - 1) {
      setState((s) => ({
        ...s,
        currentTaskIndex: s.currentTaskIndex + 1,
        currentSegmentIndex: 0,
        phase: "work",
        // Note: workTimeRemaining, taskTimeRemaining, taskTotalDuration will be properly
        // initialized by the useEffect that watches currentTaskIndex changes
        taskStartTime: null,
        actualTimeSpent: 0,
      }));
    } else {
      setState((s) => ({
        ...s,
        phase: "completed",
        isRunning: false,
      }));
    }
  }, [currentTodo, soundEnabled, onToggle, state.currentTaskIndex, scheduledTasks.length, onStopTimeTracking]);

  // Skip to next task
  const skipTask = useCallback(() => {
    // Stop time tracking for current task when skipping (using ref to get active tracking ID)
    if (timeTrackingActiveRef.current && onStopTimeTracking) {
      onStopTimeTracking(timeTrackingActiveRef.current);
      timeTrackingActiveRef.current = null;
    }

    if (state.currentTaskIndex < scheduledTasks.length - 1) {
      if (soundEnabled) {
        playNotificationSound("task-start");
      }
      setState((s) => ({
        ...s,
        currentTaskIndex: s.currentTaskIndex + 1,
        currentSegmentIndex: 0,
        phase: "work",
        // Note: workTimeRemaining, taskTimeRemaining, taskTotalDuration will be properly
        // initialized by the useEffect that watches currentTaskIndex changes
        breakTimeRemaining: 0,
        breakEndTime: null,
      }));
    }
  }, [state.currentTaskIndex, scheduledTasks.length, soundEnabled, onStopTimeTracking]);

  // Skip break
  const skipBreak = useCallback(() => {
    if (soundEnabled) {
      queueSounds(["break-end", "task-start"]);
    }
    setState((s) => {
      // Calculate next session time based on remaining task time
      const nextSessionDuration =
        technique === "pomodoro" ? Math.min(pomodoroWorkMinutes * 60, s.taskTimeRemaining) : s.taskTimeRemaining;
      return {
        ...s,
        phase: "work",
        workTimeRemaining: nextSessionDuration,
        breakTimeRemaining: 0,
        breakEndTime: null,
      };
    });
  }, [soundEnabled, technique, pomodoroWorkMinutes]);

  // Request notification permission
  const enableNotifications = useCallback(async () => {
    const permission = await requestNotificationPermission();
    setNotificationsEnabled(permission === "granted");
  }, []);

  // Format time as MM:SS (with negative sign for overtime)
  const formatTime = (seconds: number): string => {
    const isNegative = seconds < 0;
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return isNegative ? `-${timeStr}` : timeStr;
  };

  // Format time as HH:MM AM/PM
  const formatClockTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          if (showExtendMenu) {
            setShowExtendMenu(false);
          } else {
            onClose();
          }
          break;
        case " ":
          e.preventDefault();
          if (state.phase === "pending-break" || state.phase === "pending-work") {
            confirmTransition();
          } else if (state.phase === "work" || state.phase === "short-break" || state.phase === "long-break") {
            toggleTimer();
          }
          break;
        case "Enter":
          e.preventDefault();
          if (state.phase === "pending-break" || state.phase === "pending-work") {
            confirmTransition();
          } else if (currentTodo) {
            if (e.shiftKey) {
              completeTask();
            } else {
              onOpenDetails(currentTodo);
            }
          }
          break;
        case "s":
        case "S":
          e.preventDefault();
          if (state.phase === "short-break" || state.phase === "long-break") {
            skipBreak();
          } else {
            skipTask();
          }
          break;
        case "m":
        case "M":
          e.preventDefault();
          setSoundEnabled((prev) => !prev);
          break;
        case "e":
        case "E":
          e.preventDefault();
          if (state.phase === "work") {
            setShowExtendMenu((prev) => !prev);
          }
          break;
        case "+":
        case "=":
          e.preventDefault();
          if (state.phase === "work") {
            extendTime(focusSettings.defaultExtendMinutes ?? 5);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    onClose,
    toggleTimer,
    currentTodo,
    onOpenDetails,
    completeTask,
    state.phase,
    skipBreak,
    skipTask,
    confirmTransition,
    showExtendMenu,
    extendTime,
    focusSettings.defaultExtendMinutes,
  ]);

  // Progress percentage
  const progress = useMemo(() => {
    if (state.phase === "work") {
      const totalWork = technique === "pomodoro" ? pomodoroWorkMinutes * 60 : currentTaskDuration;
      return ((totalWork - state.workTimeRemaining) / totalWork) * 100;
    } else if (state.phase === "short-break" || state.phase === "long-break") {
      const totalBreak = state.phase === "long-break" ? pomodoroLongBreak * 60 : pomodoroShortBreak * 60;
      return ((totalBreak - state.breakTimeRemaining) / totalBreak) * 100;
    }
    return 0;
  }, [
    state.phase,
    state.workTimeRemaining,
    state.breakTimeRemaining,
    technique,
    pomodoroWorkMinutes,
    pomodoroShortBreak,
    pomodoroLongBreak,
    currentTaskDuration,
  ]);

  // Technique icon
  const techniqueIcon = technique === "pomodoro" ? "🍅" : technique === "flow" ? "🌊" : "📋";
  const techniqueName = technique === "pomodoro" ? "Pomodoro" : technique === "flow" ? "Flow" : "Sequential";

  // Count active todos for display
  const activeTodosCount = todos.filter((t) => t.isActive).length;

  // Empty state - no scheduled tasks
  if (scheduledTasks.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">{activeTodosCount === 0 ? "🎉" : "⏰"}</div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {activeTodosCount === 0 ? "All caught up!" : "No tasks scheduled for today"}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">
            {activeTodosCount === 0
              ? "No active tasks to focus on."
              : `You have ${activeTodosCount} active task${
                  activeTodosCount !== 1 ? "s" : ""
                }, but none are scheduled for today.`}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
            {activeTodosCount === 0
              ? "Create some tasks to use Focus Mode."
              : "Set due dates on your tasks or check your scheduling settings."}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Exit Focus Mode
          </button>
        </div>
      </div>
    );
  }

  // Completed state
  if (state.phase === "completed") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">All tasks completed!</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">
            You worked for {formatTime(state.totalWorkTime)} today.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
            Completed {state.sessionCount} {technique === "pomodoro" ? "pomodoro sessions" : "work sessions"}.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Exit Focus Mode
          </button>
        </div>
      </div>
    );
  }

  // Pending confirmation state - waiting for user to confirm break or work start
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
              title="Exit focus mode (Esc)"
            >
              <svg
                className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {techniqueIcon} {isBreakPending ? "Confirm Break" : "Confirm Work Start"}
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
              {soundEnabled ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              )}
            </button>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Session {state.sessionCount}</span>
          </div>
        </header>

        {/* Main Content - Pending Confirmation */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-8xl mb-6 animate-pulse">{isBreakPending ? (isLongBreak ? "☕" : "💆") : "🔔"}</div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {isBreakPending
                ? isLongBreak
                  ? "Time for a long break!"
                  : "Time for a short break!"
                : "Break's over - Ready to work?"}
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-2">
              {isBreakPending
                ? "Great work! Click below to start your break."
                : "Click below to start your next work session."}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-8">
              {soundEnabled && (
                <>
                  Reminder {state.confirmationRepeats + 1}
                  {maxRepeats > 0 && ` of ${maxRepeats}`}
                  {" • "}Sound plays every {repeatInterval}s
                </>
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

            {/* Next task preview */}
            {!isBreakPending && currentTodo && (
              <div className="mt-12 p-4 bg-white/50 dark:bg-zinc-800/50 rounded-xl">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Next task:</p>
                <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                  <MarkedText text={currentTodo.plainText} markerColors={markerColors} linkPatterns={linkPatterns} />
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Keyboard Hints */}
        <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <span>Space or Enter to confirm • Esc to exit</span>
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
              title="Exit focus mode (Esc)"
            >
              <svg
                className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {techniqueIcon} {isLongBreak ? "Long Break" : "Short Break"}
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
              {soundEnabled ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              )}
            </button>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Session {state.sessionCount}</span>
          </div>
        </header>

        {/* Main Content - Break */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-8xl mb-6">{isLongBreak ? "☕" : "💆"}</div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {isLongBreak ? "Take a long break!" : "Take a short break!"}
            </h2>

            {/* Countdown Timer */}
            <div className="text-7xl font-mono font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {formatTime(state.breakTimeRemaining)}
            </div>

            {/* Continue time */}
            {state.breakEndTime && (
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
                Continue at {formatClockTime(state.breakEndTime)}
              </p>
            )}

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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Resume
                  </>
                )}
              </button>

              <button
                onClick={skipBreak}
                className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
              >
                Skip Break (S)
              </button>
            </div>

            {/* Next task preview */}
            {currentTodo && (
              <div className="mt-12 p-4 bg-white/50 dark:bg-zinc-800/50 rounded-xl max-w-md mx-auto">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Up next:</p>
                <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                  <MarkedText text={currentTodo.plainText} markerColors={markerColors} linkPatterns={linkPatterns} />
                </p>
                {/* Task progress during break */}
                {technique === "pomodoro" && state.taskTotalDuration > 0 && state.taskTimeRemaining > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-700/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Task progress:</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {formatTime(state.taskTotalDuration - state.taskTimeRemaining)} /{" "}
                        {formatTime(state.taskTotalDuration)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${Math.min(
                            100,
                            ((state.taskTotalDuration - state.taskTimeRemaining) / state.taskTotalDuration) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                      {formatTime(state.taskTimeRemaining)} remaining
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
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

  // Work phase
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Exit focus mode (Esc)"
          >
            <svg
              className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>{techniqueIcon} Focus Mode</span>
            <span className="text-sm font-normal text-zinc-500">({techniqueName})</span>
            <InfoTooltip content={tooltipContent.focusMode} />
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
            {soundEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            )}
          </button>
          {!notificationsEnabled && (
            <button
              onClick={enableNotifications}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors"
              title="Enable notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
          )}
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Task {state.currentTaskIndex + 1} of {scheduledTasks.length}
          </span>
        </div>
      </header>

      {/* Main Content - Work */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Task Card */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-8 mb-8">
            {/* Priority Badge */}
            {currentTodo?.metadata.priority && (
              <div className="mb-4">
                <Badge variant="red" size="md">
                  {currentTodo.metadata.priority}
                </Badge>
              </div>
            )}

            {/* Task Text */}
            <div className="mb-6">
              <p className="text-2xl font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                {currentTodo && (
                  <MarkedText text={currentTodo.plainText} markerColors={markerColors} linkPatterns={linkPatterns} />
                )}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-3 text-sm mb-6">
              {currentTodo?.metadata.dueDate && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{currentTodo.dueDateDisplay || currentTodo.metadata.dueDate}</span>
                </div>
              )}
              {currentTodo?.metadata.duration && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{currentTodo.durationDisplay}</span>
                </div>
              )}
              {currentTodo && currentTodo.metadata.assignedPeople.length > 0 && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>{currentTodo.metadata.assignedPeople.join(", ")}</span>
                </div>
              )}
              {currentTodo && currentTodo.metadata.projects.length > 0 && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <span>{currentTodo.metadata.projects.join(", ")}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => currentTodo && onOpenDetails(currentTodo)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2"
                title="Open details (Enter)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Details
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={skipTask}
                  disabled={state.currentTaskIndex >= scheduledTasks.length - 1}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Skip task (S)"
                >
                  Skip
                </button>

                <button
                  onClick={completeTask}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  title="Complete (Shift+Enter)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Complete
                </button>
              </div>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center mb-6">
            {/* Main Timer - Time remaining on task */}
            <div
              className={`text-6xl font-mono font-bold mb-2 ${
                state.taskTimeRemaining < 0 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {formatTime(state.taskTimeRemaining)}
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 mb-2">
              {state.taskTimeRemaining < 0 ? "⏱️ Overtime" : "Time remaining"}
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-md mx-auto h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 ${
                  state.taskTimeRemaining < 0 ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    state.taskTotalDuration > 0
                      ? ((state.taskTotalDuration - state.taskTimeRemaining) / state.taskTotalDuration) * 100
                      : 0,
                  )}%`,
                }}
              />
            </div>

            {/* Time worked this session + total estimate */}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {formatTime(state.actualTimeSpent)} worked this session
              {alreadyTrackedSeconds > 0 && (
                <span> • {formatTime(alreadyTrackedSeconds + state.actualTimeSpent)} total tracked</span>
              )}
            </p>

            {/* Pomodoro session info */}
            {technique === "pomodoro" && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                🍅 Session {state.sessionCount + 1} • {formatTime(state.workTimeRemaining)} until break
              </p>
            )}
          </div>

          {/* Play/Pause Button */}
          <div className="flex justify-center gap-4">
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Start
                </>
              )}
            </button>

            {/* Extend Time Button */}
            <div className="relative">
              <button
                onClick={() => setShowExtendMenu((prev) => !prev)}
                className="px-6 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 flex items-center gap-2"
                title="Extend time (E)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6l4 2m4 0a8 8 0 11-16 0 8 8 0 0116 0z"
                  />
                </svg>
                +{focusSettings.defaultExtendMinutes ?? 5}m
              </button>

              {/* Extend Menu Dropdown */}
              {showExtendMenu && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 min-w-[140px]">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 px-2">Extend by:</div>
                  {(focusSettings.extendOptions ?? [5, 10, 15, 30]).map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => extendTime(minutes)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                    >
                      +{minutes} minutes
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Keyboard Hints */}
          {(focusSettings.showKeyboardHints ?? true) && (
            <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-4 flex-wrap justify-center">
                <span>Space {state.isRunning ? "Pause" : "Start"}</span>
                <span>Shift+Enter Complete</span>
                <span>E Extend</span>
                <span>+ Quick extend</span>
                <span>S Skip</span>
                <span>M Mute</span>
                <span>Esc Exit</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-zinc-200 dark:bg-zinc-700">
        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
