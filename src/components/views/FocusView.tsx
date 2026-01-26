"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { TodoModel } from "@/models/TodoModel";
import { Settings } from "@/types/settings";
import { MarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import { TodoMetadata, TodoId } from "@/types/todo";
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
import { ScheduledTask, BreakInfo } from "@/utils/ganttScheduler";
import { CloseIcon, VolumeOnIcon, VolumeOffIcon, BellIcon } from "@/components/shared/Icons";

interface FocusViewProps {
  todos: TodoModel[];
  scheduledTasks: ScheduledTask[];
  onToggle: (id: TodoId) => void;
  onDelete: (id: TodoId) => void;
  onEdit: (id: TodoId, text: string, plainText: string, metadata: TodoMetadata) => void;
  onArchive?: (id: TodoId) => void;
  markerColors: MarkerColors;
  settings: Settings;
  linkPatterns: LinkPattern[];
  onOpenDetails: (todo: TodoModel) => void;
  onClose: () => void;
  onStartTimeTracking?: (todoId: TodoId, note?: string) => void;
  onStopTimeTracking?: (todoId: TodoId) => void;
}

// A schedule item is either a task segment or a break
type ScheduleItemType = "task" | "break";

interface ScheduleItem {
  type: ScheduleItemType;
  task?: ScheduledTask;
  segmentIndex?: number; // Which segment of the task this is
  isLastSegment?: boolean; // Whether this is the last segment of the task
  breakInfo?: BreakInfo;
  durationSeconds: number;
}

type FocusPhase = "work" | "break" | "pending-work" | "pending-break" | "completed";

interface FocusState {
  phase: FocusPhase;
  currentItemIndex: number;
  timeRemaining: number;
  isRunning: boolean;
  totalWorkTime: number;
  totalBreakTime: number;
  tasksCompleted: number;
  breakEndTime: Date | null;
  pendingPhase: "work" | "break" | null;
  confirmationRepeats: number;
  taskStartTime: Date | null;
  actualTimeSpent: number;
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

export function FocusView({
  todos,
  scheduledTasks: preScheduledTasks,
  onToggle,
  onEdit,
  markerColors,
  settings,
  linkPatterns,
  onOpenDetails,
  onClose,
  onStartTimeTracking,
  onStopTimeTracking,
}: FocusViewProps) {
  const focusSettings = settings.focus ?? {};
  const ganttSettings = settings.gantt ?? {};
  const technique = ganttSettings.schedulingTechnique ?? "sequential";

  // Filter to only active, non-tracked-time tasks
  const scheduledTasks = useMemo(
    () => preScheduledTasks.filter((t) => !t.isActualTime && !t.todo.isCompleted && !t.todo.isArchived),
    [preScheduledTasks],
  );

  // Build a flat schedule from task segments: segment, break, segment, break...
  // This respects Pomodoro/Flow breaks that split tasks into multiple work sessions
  const schedule = useMemo((): ScheduleItem[] => {
    const items: ScheduleItem[] = [];

    scheduledTasks.forEach((task, taskIndex) => {
      const segments = task.segments;
      const isLastTask = taskIndex === scheduledTasks.length - 1;

      segments.forEach((segment, segmentIndex) => {
        const isLastSegment = segmentIndex === segments.length - 1;

        // Add the task segment
        items.push({
          type: "task",
          task,
          segmentIndex,
          isLastSegment,
          durationSeconds: segment.durationMinutes * 60,
        });

        // Add break after segment if there is one
        // Use segment's nextBreak (for intra-task breaks like Pomodoro)
        // For the last segment, use task's nextBreak (for inter-task breaks)
        const breakInfo = isLastSegment ? task.nextBreak : segment.nextBreak;

        if (breakInfo && breakInfo.durationMinutes > 0) {
          // Don't add break after the very last segment of the very last task
          if (!(isLastTask && isLastSegment)) {
            items.push({
              type: "break",
              breakInfo,
              durationSeconds: breakInfo.durationMinutes * 60,
            });
          }
        }
      });
    });

    return items;
  }, [scheduledTasks]);

  // Keep schedule in a ref so it's always fresh in timer callback
  const scheduleRef = useRef(schedule);
  useEffect(() => {
    scheduleRef.current = schedule;
  }, [schedule]);

  // Get current item (for use outside timer)
  const getCurrentItem = useCallback(
    (index: number): ScheduleItem | null => {
      return schedule[index] ?? null;
    },
    [schedule],
  );

  // State
  const [state, setState] = useState<FocusState>(() => {
    const firstItem = schedule[0];
    return {
      phase: firstItem?.type === "task" ? "work" : "break",
      currentItemIndex: 0,
      timeRemaining: firstItem?.durationSeconds ?? 0,
      isRunning: false,
      totalWorkTime: 0,
      totalBreakTime: 0,
      tasksCompleted: 0,
      breakEndTime: null,
      pendingPhase: null,
      confirmationRepeats: 0,
      taskStartTime: null,
      actualTimeSpent: 0,
    };
  });

  // UI state
  const [soundEnabled, setSoundEnabled] = useState(focusSettings.soundEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(getNotificationPermission() === "granted");
  const [showExtendMenu, setShowExtendMenu] = useState(false);
  const [pendingAutoComplete, setPendingAutoComplete] = useState<TodoId | null>(null);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const confirmationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeTrackingActiveRef = useRef<TodoId | null>(null);
  const onStopTimeTrackingRef = useRef(onStopTimeTracking);
  useEffect(() => {
    onStopTimeTrackingRef.current = onStopTimeTracking;
  }, [onStopTimeTracking]);

  // Current item helpers
  const currentItem = getCurrentItem(state.currentItemIndex);
  const currentTask = currentItem?.type === "task" ? currentItem.task : null;
  const currentTodo = currentTask?.todo;
  const currentBreakInfo = currentItem?.type === "break" ? currentItem.breakInfo : null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSoundQueue();
      stopAmbientSound();
      if (timerRef.current) clearInterval(timerRef.current);
      if (confirmationTimerRef.current) clearInterval(confirmationTimerRef.current);
      if (timeTrackingActiveRef.current && onStopTimeTrackingRef.current) {
        onStopTimeTrackingRef.current(timeTrackingActiveRef.current);
        timeTrackingActiveRef.current = null;
      }
    };
  }, []);

  // Handle auto-completion when last segment finishes
  // Note: We intentionally call setState within this effect to clear the pending state
  // after processing. This is a controlled cascading render that's necessary for the
  // auto-completion flow to work correctly.
  useEffect(() => {
    if (pendingAutoComplete) {
      console.log("[FocusView] Auto-completing todo:", pendingAutoComplete);
      // Stop time tracking if active
      if (timeTrackingActiveRef.current && onStopTimeTracking) {
        onStopTimeTracking(timeTrackingActiveRef.current);
        timeTrackingActiveRef.current = null;
      }
      // Mark the task as complete
      onToggle(pendingAutoComplete);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: clearing pending state after processing
      setPendingAutoComplete(null);
    }
  }, [pendingAutoComplete, onToggle, onStopTimeTracking]);

  // Ambient sound management
  useEffect(() => {
    if (!soundEnabled || !focusSettings.ambientSoundEnabled) {
      stopAmbientSound();
      return;
    }

    if (state.isRunning && state.phase === "work" && focusSettings.ambientWorkSound) {
      const soundFile = getAmbientSoundFile(focusSettings.ambientWorkSound);
      if (soundFile) {
        playAmbientSound(soundFile, focusSettings.ambientVolume ?? 0.3);
      }
    } else if (state.isRunning && state.phase === "break" && focusSettings.ambientBreakSound) {
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
    focusSettings.ambientSoundEnabled,
    focusSettings.ambientWorkSound,
    focusSettings.ambientBreakSound,
    focusSettings.ambientVolume,
  ]);

  // Time tracking management
  useEffect(() => {
    if (!focusSettings.autoTimeTracking || !currentTodo) return;

    if (state.phase === "work" && state.isRunning && !timeTrackingActiveRef.current) {
      if (onStartTimeTracking) {
        onStartTimeTracking(currentTodo.id, "Focus Mode session");
        timeTrackingActiveRef.current = currentTodo.id;
      }
    }

    if (timeTrackingActiveRef.current && (state.phase !== "work" || !state.isRunning)) {
      if (onStopTimeTracking) {
        onStopTimeTracking(timeTrackingActiveRef.current);
        timeTrackingActiveRef.current = null;
      }
    }
  }, [
    state.phase,
    state.isRunning,
    currentTodo,
    focusSettings.autoTimeTracking,
    onStartTimeTracking,
    onStopTimeTracking,
  ]);

  // Move to next item in schedule
  const moveToNextItem = useCallback(() => {
    const nextIndex = state.currentItemIndex + 1;
    const nextItem = getCurrentItem(nextIndex);

    if (!nextItem) {
      setState((s) => ({
        ...s,
        phase: "completed",
        isRunning: false,
      }));
      return;
    }

    const isTask = nextItem.type === "task";
    setState((s) => ({
      ...s,
      currentItemIndex: nextIndex,
      phase: isTask ? "work" : "break",
      timeRemaining: nextItem.durationSeconds,
      isRunning: true,
      breakEndTime: isTask
        ? null
        : (() => {
            const end = new Date();
            end.setSeconds(end.getSeconds() + nextItem.durationSeconds);
            return end;
          })(),
      taskStartTime: isTask ? new Date() : null,
      actualTimeSpent: 0,
      pendingPhase: null,
      confirmationRepeats: 0,
    }));
  }, [state.currentItemIndex, getCurrentItem]);

  // Confirm transition handler
  const confirmPhaseTransition = useCallback(
    (s: FocusState): FocusState => {
      const nextIndex = s.currentItemIndex + 1;
      const nextItem = getCurrentItem(nextIndex);

      if (!nextItem) {
        return { ...s, phase: "completed", isRunning: false, pendingPhase: null, confirmationRepeats: 0 };
      }

      const isTask = nextItem.type === "task";
      return {
        ...s,
        currentItemIndex: nextIndex,
        phase: isTask ? "work" : "break",
        timeRemaining: nextItem.durationSeconds,
        isRunning: true,
        breakEndTime: isTask
          ? null
          : (() => {
              const end = new Date();
              end.setSeconds(end.getSeconds() + nextItem.durationSeconds);
              return end;
            })(),
        taskStartTime: isTask ? new Date() : null,
        actualTimeSpent: 0,
        pendingPhase: null,
        confirmationRepeats: 0,
      };
    },
    [getCurrentItem],
  );

  // Confirm button handler
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

          if (soundEnabled) {
            if (s.pendingPhase === "break") {
              playNotificationSound("short-break");
            } else {
              playNotificationSound("break-end");
            }
          }

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
    if (!state.isRunning || state.pendingPhase) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setState((s) => {
        const newTime = s.timeRemaining - 1;

        const newTotalWork = s.phase === "work" ? s.totalWorkTime + 1 : s.totalWorkTime;
        const newTotalBreak = s.phase === "break" ? s.totalBreakTime + 1 : s.totalBreakTime;
        const newActualTime = s.phase === "work" ? s.actualTimeSpent + 1 : s.actualTimeSpent;

        // Item complete
        if (newTime <= 0) {
          const completingWorkSegment = s.phase === "work";
          // Use ref to get fresh schedule data
          const currentScheduleItem = scheduleRef.current[s.currentItemIndex] ?? null;
          const isLastSegmentOfTask = currentScheduleItem?.isLastSegment ?? true;
          const completingTask = completingWorkSegment && isLastSegmentOfTask;
          const todoToComplete = completingTask ? currentScheduleItem?.task?.todo.id : null;

          console.log("[FocusView] Timer hit zero:", {
            completingWorkSegment,
            isLastSegmentOfTask,
            completingTask,
            todoToComplete,
            currentScheduleItem: currentScheduleItem
              ? {
                  type: currentScheduleItem.type,
                  isLastSegment: currentScheduleItem.isLastSegment,
                  taskId: currentScheduleItem.task?.todo.id,
                }
              : null,
          });

          // Schedule auto-completion for last segment (use setTimeout to ensure it runs after state update)
          if (todoToComplete) {
            console.log("[FocusView] Scheduling auto-complete for:", todoToComplete);
            setTimeout(() => setPendingAutoComplete(todoToComplete), 0);
          }

          const nextIndex = s.currentItemIndex + 1;
          const nextItem = scheduleRef.current[nextIndex] ?? null;

          if (soundEnabled) {
            if (completingTask) {
              // Task fully complete
              playNotificationSound("task-complete");
            } else if (completingWorkSegment) {
              // Work segment done, but more segments remain for this task
              playNotificationSound("short-break");
            } else {
              // Break ending
              queueSounds(["break-end", "task-start"]);
            }
          }

          if (notificationsEnabled) {
            if (completingWorkSegment && nextItem?.type === "break") {
              const breakLabel = nextItem.breakInfo?.label || "break";
              sendNotification(`☕ Time for a ${breakLabel}!`, {
                body: completingTask
                  ? `Task complete! Take a ${Math.ceil((nextItem.durationSeconds ?? 0) / 60)} minute break.`
                  : `Session complete! Take a ${Math.ceil((nextItem.durationSeconds ?? 0) / 60)} minute break.`,
                silent: true,
              });
            } else if (!completingWorkSegment) {
              sendNotification("🎯 Break over - back to work!", {
                body: nextItem?.task?.todo.plainText ?? "Time to focus!",
                silent: true,
              });
            }
          }

          if (focusSettings.requireConfirmation) {
            return {
              ...s,
              phase: completingWorkSegment ? "pending-break" : "pending-work",
              pendingPhase: completingWorkSegment ? "break" : "work",
              timeRemaining: 0,
              totalWorkTime: newTotalWork,
              totalBreakTime: newTotalBreak,
              actualTimeSpent: newActualTime,
              tasksCompleted: completingTask ? s.tasksCompleted + 1 : s.tasksCompleted,
              isRunning: false,
              confirmationRepeats: 0,
            };
          }

          if (!nextItem) {
            return {
              ...s,
              phase: "completed",
              isRunning: false,
              timeRemaining: 0,
              totalWorkTime: newTotalWork,
              totalBreakTime: newTotalBreak,
              tasksCompleted: completingTask ? s.tasksCompleted + 1 : s.tasksCompleted,
            };
          }

          const isNextTask = nextItem.type === "task";
          return {
            ...s,
            currentItemIndex: nextIndex,
            phase: isNextTask ? "work" : "break",
            timeRemaining: nextItem.durationSeconds,
            totalWorkTime: newTotalWork,
            totalBreakTime: newTotalBreak,
            actualTimeSpent: 0,
            tasksCompleted: completingTask ? s.tasksCompleted + 1 : s.tasksCompleted,
            breakEndTime: isNextTask
              ? null
              : (() => {
                  const end = new Date();
                  end.setSeconds(end.getSeconds() + nextItem.durationSeconds);
                  return end;
                })(),
            taskStartTime: isNextTask ? new Date() : null,
          };
        }

        return {
          ...s,
          timeRemaining: newTime,
          totalWorkTime: newTotalWork,
          totalBreakTime: newTotalBreak,
          actualTimeSpent: newActualTime,
        };
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isRunning, state.pendingPhase, soundEnabled, notificationsEnabled, focusSettings.requireConfirmation]);

  // Toggle timer
  const toggleTimer = useCallback(() => {
    setState((s) => {
      if (!s.isRunning) {
        if (soundEnabled && s.phase === "work") {
          playNotificationSound("task-start");
        }

        return {
          ...s,
          isRunning: true,
          taskStartTime: s.phase === "work" && !s.taskStartTime ? new Date() : s.taskStartTime,
          breakEndTime:
            s.phase === "break"
              ? (() => {
                  const end = new Date();
                  end.setSeconds(end.getSeconds() + s.timeRemaining);
                  return end;
                })()
              : null,
        };
      } else {
        if (soundEnabled && s.phase === "work") {
          playNotificationSound("pause");
        }
        return {
          ...s,
          isRunning: false,
          breakEndTime: null,
        };
      }
    });
  }, [soundEnabled]);

  // Open details (pauses timer if running)
  const openDetails = useCallback(
    (todo: TodoModel) => {
      // Pause timer if running
      if (state.isRunning) {
        setState((s) => ({
          ...s,
          isRunning: false,
          breakEndTime: null,
        }));
        if (soundEnabled && state.phase === "work") {
          playNotificationSound("pause");
        }
      }
      onOpenDetails(todo);
    },
    [state.isRunning, state.phase, soundEnabled, onOpenDetails],
  );

  // Skip break
  const skipBreak = useCallback(() => {
    if (soundEnabled) {
      playNotificationSound("task-start");
    }
    moveToNextItem();
  }, [soundEnabled, moveToNextItem]);

  // Skip to next (end work early)
  const skipToNext = useCallback(() => {
    if (timeTrackingActiveRef.current && onStopTimeTracking) {
      onStopTimeTracking(timeTrackingActiveRef.current);
      timeTrackingActiveRef.current = null;
    }

    if (soundEnabled) {
      playNotificationSound("short-break");
    }

    // Only increment tasksCompleted if this is the last segment of the task
    const currentScheduleItem = getCurrentItem(state.currentItemIndex);
    if (currentScheduleItem?.isLastSegment) {
      setState((s) => ({
        ...s,
        tasksCompleted: s.tasksCompleted + 1,
      }));
    }

    moveToNextItem();
  }, [soundEnabled, moveToNextItem, onStopTimeTracking, getCurrentItem, state.currentItemIndex]);

  // Complete current task manually
  const completeTask = useCallback(() => {
    if (!currentTodo) return;

    if (timeTrackingActiveRef.current && onStopTimeTracking) {
      onStopTimeTracking(timeTrackingActiveRef.current);
      timeTrackingActiveRef.current = null;
    }

    if (soundEnabled) {
      playNotificationSound("task-complete");
    }

    // Toggle will handle duration update based on tracked time
    onToggle(currentTodo.id);

    // Only increment tasksCompleted if this is the last segment (or single segment)
    const currentScheduleItem = getCurrentItem(state.currentItemIndex);
    if (currentScheduleItem?.isLastSegment !== false) {
      setState((s) => ({
        ...s,
        tasksCompleted: s.tasksCompleted + 1,
      }));
    }

    moveToNextItem();
  }, [currentTodo, soundEnabled, onToggle, moveToNextItem, onStopTimeTracking, getCurrentItem, state.currentItemIndex]);

  // Skip task without completing
  const skipTask = useCallback(() => {
    if (timeTrackingActiveRef.current && onStopTimeTracking) {
      onStopTimeTracking(timeTrackingActiveRef.current);
      timeTrackingActiveRef.current = null;
    }

    if (soundEnabled) {
      playNotificationSound("task-start");
    }

    moveToNextItem();
  }, [soundEnabled, moveToNextItem, onStopTimeTracking]);

  // Extend time
  const extendTime = useCallback(
    (minutes: number) => {
      const freshTodo = currentTodo ? todos.find((t) => t.id === currentTodo.id) : null;
      if (!freshTodo) return;

      setState((s) => ({
        ...s,
        timeRemaining: s.timeRemaining + minutes * 60,
      }));

      const currentDurationMinutes = freshTodo.durationMinutes ?? 0;
      const newDurationMinutes = currentDurationMinutes + minutes;
      onEdit(freshTodo.id, freshTodo.text, freshTodo.plainText, {
        ...freshTodo.metadata,
        duration: `${newDurationMinutes}m`,
      });

      setShowExtendMenu(false);
    },
    [currentTodo, todos, onEdit],
  );

  // Enable notifications
  const enableNotifications = useCallback(async () => {
    const result = await requestNotificationPermission();
    setNotificationsEnabled(result === "granted");
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
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
          } else {
            toggleTimer();
          }
          break;
        case "Enter":
          e.preventDefault();
          if (state.phase === "pending-break" || state.phase === "pending-work") {
            confirmTransition();
          } else if (e.shiftKey && currentTodo) {
            completeTask();
          } else if (currentTodo) {
            openDetails(currentTodo);
          }
          break;
        case "s":
        case "S":
          e.preventDefault();
          if (state.phase === "break") {
            skipBreak();
          } else if (state.phase === "work") {
            skipToNext();
          }
          break;
        case "n":
        case "N":
          e.preventDefault();
          if (state.phase === "work") {
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
    confirmTransition,
    completeTask,
    skipBreak,
    skipToNext,
    skipTask,
    state.phase,
    currentTodo,
    openDetails,
    showExtendMenu,
    extendTime,
    focusSettings.defaultExtendMinutes,
  ]);

  // Progress calculation
  const progress = useMemo(() => {
    const currentItemData = getCurrentItem(state.currentItemIndex);
    if (!currentItemData) return 0;
    const total = currentItemData.durationSeconds;
    return ((total - state.timeRemaining) / total) * 100;
  }, [state.currentItemIndex, state.timeRemaining, getCurrentItem]);

  // Technique display
  const techniqueIcon = technique === "pomodoro" ? "🍅" : technique === "flow" ? "🌊" : "📋";
  const techniqueName = technique === "pomodoro" ? "Pomodoro" : technique === "flow" ? "Flow" : "Sequential";

  // Count unique tasks in schedule (not segments)
  const totalTasks = scheduledTasks.length;
  const currentTaskNumber = useMemo(() => {
    // Find the current task's todo id
    const currentItem = schedule[state.currentItemIndex];
    if (!currentItem || currentItem.type !== "task") {
      // If on a break, find the previous task
      for (let i = state.currentItemIndex - 1; i >= 0; i--) {
        if (schedule[i]?.type === "task") {
          const _taskTodoId = schedule[i].task?.todo.id;
          // Count unique tasks up to this one
          const seenTasks = new Set<string>();
          for (let j = 0; j <= i; j++) {
            const item = schedule[j];
            if (item?.type === "task" && item.task?.todo.id) {
              seenTasks.add(item.task.todo.id);
            }
          }
          return seenTasks.size;
        }
      }
      return 0;
    }

    // Count unique tasks up to and including current index
    const seenTasks = new Set<string>();
    for (let i = 0; i <= state.currentItemIndex; i++) {
      const item = schedule[i];
      if (item?.type === "task" && item.task?.todo.id) {
        seenTasks.add(item.task.todo.id);
      }
    }
    return seenTasks.size;
  }, [state.currentItemIndex, schedule]);

  // Count active todos for display
  const activeTodosCount = todos.filter((t) => t.isActive).length;

  // Empty state
  if (schedule.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">{activeTodosCount === 0 ? "🎉" : "⏰"}</div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {activeTodosCount === 0 ? "All caught up!" : "No tasks scheduled for today"}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            {activeTodosCount === 0
              ? "No active tasks to focus on."
              : `You have ${activeTodosCount} active task${activeTodosCount !== 1 ? "s" : ""}, but none are scheduled.`}
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
            You worked for {formatTime(state.totalWorkTime)} and took {formatTime(state.totalBreakTime)} in breaks.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">Completed {state.tasksCompleted} tasks.</p>
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

  // Pending confirmation state
  if (state.phase === "pending-break" || state.phase === "pending-work") {
    const isBreakPending = state.phase === "pending-break";
    const nextItem = getCurrentItem(state.currentItemIndex + 1);
    const nextBreakInfo = nextItem?.breakInfo;
    const maxRepeats = focusSettings.confirmationMaxRepeats ?? 5;
    const repeatInterval = focusSettings.confirmationRepeatInterval ?? 30;

    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col ${
          isBreakPending
            ? "bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-cyan-950 dark:to-zinc-900"
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
              {techniqueIcon} Focus Mode ({techniqueName})
            </h1>
          </div>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Task {currentTaskNumber} of {totalTasks}
          </span>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-8xl mb-6">{isBreakPending ? nextBreakInfo?.icon || "☕" : "🎯"}</div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {isBreakPending ? `Time for a ${nextBreakInfo?.label || "break"}!` : "Break complete!"}
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
              {isBreakPending ? "Great work! Click below to start your break." : "Ready to start the next task?"}
            </p>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Reminder {state.confirmationRepeats} of {maxRepeats} • Sound plays every {repeatInterval}s
            </p>

            <button
              onClick={confirmTransition}
              className={`px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl ${
                isBreakPending
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-orange-600 hover:bg-orange-700 text-white"
              }`}
            >
              {isBreakPending ? "Start Break" : "Start Working"} (Space/Enter)
            </button>

            {/* Next task preview */}
            {!isBreakPending && nextItem?.task && (
              <div className="mt-12 p-4 bg-white/50 dark:bg-zinc-800/50 rounded-xl max-w-md mx-auto">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Next task:</p>
                <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                  <MarkedText
                    text={nextItem.task.todo.plainText}
                    markerColors={markerColors}
                    linkPatterns={linkPatterns}
                    dateTimeSettings={settings.dateTime}
                    workHoursSettings={settings.workHours}
                  />
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Keyboard Hints */}
        <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <span>Space/Enter Confirm • Esc Exit</span>
        </div>
      </div>
    );
  }

  // Break phase
  if (state.phase === "break" && currentBreakInfo) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-cyan-950 dark:to-zinc-900">
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
              {currentBreakInfo.icon || "☕"} {currentBreakInfo.label || "Break"}
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
              title={soundEnabled ? "Mute (M)" : "Unmute (M)"}
            >
              {soundEnabled ? <VolumeOnIcon className="w-5 h-5" /> : <VolumeOffIcon className="w-5 h-5" />}
            </button>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Task {currentTaskNumber} of {totalTasks}
            </span>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-8xl mb-6">{currentBreakInfo.icon || "☕"}</div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {currentBreakInfo.label || "Take a break!"}
            </h2>

            <div className="text-7xl font-mono font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {formatTime(state.timeRemaining)}
            </div>

            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
              {state.breakEndTime ? (
                <>Continue at {formatClockTime(state.breakEndTime)}</>
              ) : (
                <span className="text-zinc-400">Paused</span>
              )}
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleTimer}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  state.isRunning
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {state.isRunning ? "Pause" : "Resume"}
              </button>
              <button
                onClick={skipBreak}
                className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
              >
                Skip Break
              </button>
            </div>

            {/* Next task preview */}
            {(() => {
              const nextItem = getCurrentItem(state.currentItemIndex + 1);
              if (nextItem?.task) {
                return (
                  <div className="mt-12 p-4 bg-white/50 dark:bg-zinc-800/50 rounded-xl max-w-md mx-auto">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Up next:</p>
                    <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                      <MarkedText
                        text={nextItem.task.todo.plainText}
                        markerColors={markerColors}
                        linkPatterns={linkPatterns}
                        dateTimeSettings={settings.dateTime}
                        workHoursSettings={settings.workHours}
                      />
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex justify-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <span>🎯 Work: {formatTime(state.totalWorkTime)}</span>
            <span>☕ Break: {formatTime(state.totalBreakTime)}</span>
            <span>✅ Completed: {state.tasksCompleted}</span>
          </div>
        </div>

        {/* Keyboard Hints */}
        <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <span>Space {state.isRunning ? "Pause" : "Resume"} • S Skip • M Mute • Esc Exit</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-zinc-200/50 dark:bg-zinc-700/50">
          <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
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
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>{techniqueIcon} Focus Mode</span>
            <span className="text-sm font-normal text-zinc-500">({techniqueName})</span>
            <InfoTooltip content={tooltipContent.focusMode} />
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <InfoTooltip content={tooltipContent.focusKeyboard} size="md" />
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-400 dark:text-zinc-600"
            }`}
            title={soundEnabled ? "Mute (M)" : "Unmute (M)"}
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
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Task {currentTaskNumber} of {totalTasks}
          </span>
        </div>
      </header>

      {/* Task Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {currentTodo && (
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-8 mb-8">
              {/* Priority Badge */}
              {currentTodo.priority && (
                <div className="mb-4">
                  <Badge variant="red" size="md">
                    {currentTodo.priority}
                  </Badge>
                </div>
              )}

              {/* Task Text */}
              <p className="text-2xl font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed mb-6">
                <MarkedText text={currentTodo.plainText} markerColors={markerColors} linkPatterns={linkPatterns} dateTimeSettings={settings.dateTime} workHoursSettings={settings.workHours} />
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-sm mb-6">
                {currentTodo.hasDueDate && (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <span>📅</span>
                    <span>{currentTodo.dueDateDisplay}</span>
                  </div>
                )}
                {currentTodo.hasDuration && (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <span>⏱️</span>
                    <span>{currentTodo.durationDisplay}</span>
                  </div>
                )}
                {currentTodo.assignedPeople.length > 0 && (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <span>👤</span>
                    <span>{currentTodo.assignedPeople.join(", ")}</span>
                  </div>
                )}
                {currentTodo.projects.length > 0 && (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <span>📁</span>
                    <span>{currentTodo.projects.join(", ")}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => openDetails(currentTodo)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  title="Details (Enter)"
                >
                  Details
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={skipTask}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Skip (N)"
                  >
                    Skip
                  </button>
                  <button
                    onClick={completeTask}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    title="Complete (Shift+Enter)"
                  >
                    ✓ Complete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Timer */}
          <div className="text-center mb-6">
            <div
              className={`text-6xl font-mono font-bold mb-2 ${
                state.timeRemaining < 0 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {formatTime(state.timeRemaining)}
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              {state.timeRemaining < 0 ? "⏱️ Overtime" : state.isRunning ? "Time remaining" : "Press Space to start"}
            </p>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={toggleTimer}
              className={`px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-3 ${
                state.isRunning
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {state.isRunning ? "⏸ Pause" : "▶ Start"}
            </button>

            {/* Extend Time */}
            <div className="relative">
              <button
                onClick={() => setShowExtendMenu((prev) => !prev)}
                className="px-6 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200"
                title="Extend (E)"
              >
                +{focusSettings.defaultExtendMinutes ?? 5}m
              </button>

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

            {/* Skip to Next */}
            <button
              onClick={skipToNext}
              className="px-6 py-4 rounded-full font-semibold text-lg transition-all bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200"
              title="Skip to Next"
            >
              Skip to Next
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
          <span>🎯 Work: {formatTime(state.totalWorkTime)}</span>
          <span>☕ Break: {formatTime(state.totalBreakTime)}</span>
          <span>✅ Completed: {state.tasksCompleted}</span>
        </div>
      </div>

      {/* Keyboard Hints */}
      {(focusSettings.showKeyboardHints ?? true) && (
        <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
          <span>
            Space {state.isRunning ? "Pause" : "Start"} • Shift+Enter Complete • E Extend • S Skip to Next • N Skip Task
            • M Mute • Esc Exit
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="h-2 bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full bg-blue-600 transition-all duration-1000"
          style={{ width: `${Math.max(0, progress)}%` }}
        />
      </div>
    </div>
  );
}
