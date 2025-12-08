/**
 * Gantt Chart Scheduling Logic
 *
 * This module handles all task scheduling calculations for the Gantt view,
 * including ASAP scheduling, Pomodoro breaks, Flow breaks, and time block handling.
 */

import { TodoModel } from "@/models/TodoModel";
import {
  Priority,
  WorkHoursSettings,
  Gantt,
  DaySchedule,
  SchedulingTechnique,
  DEFAULT_BLOCK_TYPES,
} from "@/types/settings";

// ============================================================================
// Types
// ============================================================================

export interface TaskSegment {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  // Break info for the gap after this segment (if any)
  nextBreak: BreakInfo | null;
}

// Break type after a task
export type BreakType = "context" | "short" | "long" | "none";

// Break info to display after a task
export interface BreakInfo {
  type: BreakType;
  durationMinutes: number;
  icon: string; // 🍅, 🌊, or empty
  label: string; // "short break", "long break", "break", "context switch"
}

export interface ScheduledTask {
  todo: TodoModel;
  startTime: Date; // Overall start time (first segment)
  endTime: Date; // Overall end time (last segment)
  durationMinutes: number; // Total duration across all segments
  segments: TaskSegment[]; // Individual work segments (split by breaks)
  targetDate: Date;
  hasBuffer: boolean;
  bufferMinutes: number;
  isOverdue: boolean;
  // Break info for the gap after this task (if any)
  nextBreak: BreakInfo | null;
}

export interface BreakBlock {
  name: string;
  startTime: Date;
  endTime: Date;
  color: string;
  blockType?: string;
  icon?: string;
}

export interface SchedulingConfig {
  ganttSettings: Gantt;
  workHours: WorkHoursSettings;
  availablePriorities: Priority[];
  schedulingMode: "asap" | "dueDate";
}

export interface DayScheduleResult {
  tasks: ScheduledTask[];
  unscheduledTasks: TodoModel[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get icon for a block type (break, meeting, focus, etc.)
 */
function getBlockIcon(blockType?: string): string {
  const config = DEFAULT_BLOCK_TYPES.find((t) => t.id === blockType);
  return config?.icon || "☕";
}

/**
 * Parse a time string (HH:MM) into a Date object for a given base date
 */
export function parseTime(timeStr: string, baseDate: Date): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Parse duration string (e.g., "30m", "1h", "1.5h") into minutes
 */
export function parseDuration(duration: string | undefined): number {
  if (!duration) return 30; // Default 30 minutes

  const value = parseFloat(duration);
  if (isNaN(value)) return 30;

  const lower = duration.toLowerCase();
  if (lower.includes("h")) {
    return value * 60;
  } else if (lower.includes("m")) {
    return value;
  } else {
    // Default to minutes
    return value;
  }
}

/**
 * Get the schedule for a specific date based on work hours settings
 */
export function getScheduleForDate(date: Date, workHours: WorkHoursSettings): DaySchedule {
  const dayOfWeek = date.getDay();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const dayName = dayNames[dayOfWeek];

  if (workHours.useCommonSchedule) {
    return workHours.commonSchedule;
  }

  const customSchedule = workHours.customSchedules[dayName];
  if (customSchedule) return customSchedule;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return isWeekend ? workHours.weekendSchedule : workHours.weekdaySchedule;
}

// ============================================================================
// Pomodoro Functions
// ============================================================================

/**
 * Calculate Pomodoro break duration based on session count
 */
export function getPomodoroBreakDuration(sessionCount: number, ganttSettings: Gantt): number {
  const { pomodoroShortBreak, pomodoroLongBreak, pomodoroLongBreakInterval } = ganttSettings;

  const tasksForLongBreak = pomodoroLongBreakInterval ?? 4;

  // Long break after every N sessions
  if (sessionCount > 0 && sessionCount % tasksForLongBreak === 0) {
    return pomodoroLongBreak ?? 15;
  }

  return pomodoroShortBreak ?? 5;
}

/**
 * Get break type label for display based on session count
 */
export function getPomodoroBreakType(sessionCount: number, ganttSettings: Gantt): "short" | "long" {
  const { pomodoroLongBreakInterval } = ganttSettings;
  const tasksForLongBreak = pomodoroLongBreakInterval ?? 4;

  if (sessionCount > 0 && sessionCount % tasksForLongBreak === 0) {
    return "long";
  }

  return "short";
}

// ============================================================================
// Task Sorting
// ============================================================================

/**
 * Sort todos based on scheduling mode (ASAP or due date)
 */
export function sortTodosForScheduling(
  todos: TodoModel[],
  availablePriorities: Priority[],
  schedulingMode: "asap" | "dueDate",
): TodoModel[] {
  const filtered = todos.filter((todo) => todo.state !== "deleted");

  if (schedulingMode === "asap") {
    // Sort by state first (active before completed/archived), then priority, then due date
    filtered.sort((a, b) => {
      // Active tasks come first
      if (a.state === "active" && b.state !== "active") return -1;
      if (a.state !== "active" && b.state === "active") return 1;

      // For active tasks, sort by priority then due date
      if (a.state === "active" && b.state === "active") {
        const aPriorityObj = availablePriorities.find(
          (p) => p.name === a.metadata.priority || p.alternatives.includes(a.metadata.priority || ""),
        );
        const bPriorityObj = availablePriorities.find(
          (p) => p.name === b.metadata.priority || p.alternatives.includes(b.metadata.priority || ""),
        );

        const aOrder = aPriorityObj?.order ?? 999;
        const bOrder = bPriorityObj?.order ?? 999;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        // Secondary sort: due date (earliest first)
        if (!a.metadata.dueDate && !b.metadata.dueDate) return 0;
        if (!a.metadata.dueDate) return 1;
        if (!b.metadata.dueDate) return -1;

        const aDate = new Date(a.metadata.dueDate);
        const bDate = new Date(b.metadata.dueDate);

        return aDate.getTime() - bDate.getTime();
      }

      // For completed/archived, sort by completion/archive date
      const aDate = a.completedAt || a.archivedAt || 0;
      const bDate = b.completedAt || b.archivedAt || 0;
      return aDate - bDate;
    });
  } else {
    // Sort by state first, then due date
    filtered.sort((a, b) => {
      // Active tasks come first
      if (a.state === "active" && b.state !== "active") return -1;
      if (a.state !== "active" && b.state === "active") return 1;

      // For active tasks, sort by due date
      if (a.state === "active" && b.state === "active") {
        if (!a.metadata.dueDate && !b.metadata.dueDate) return 0;
        if (!a.metadata.dueDate) return 1;
        if (!b.metadata.dueDate) return -1;

        const aDate = new Date(a.metadata.dueDate);
        const bDate = new Date(b.metadata.dueDate);

        return aDate.getTime() - bDate.getTime();
      }

      // For completed/archived, sort by completion/archive date
      const aDate = a.completedAt || a.archivedAt || 0;
      const bDate = b.completedAt || b.archivedAt || 0;
      return aDate - bDate;
    });
  }

  return filtered;
}

// ============================================================================
// Task Scheduling Map (Multi-day allocation)
// ============================================================================

/**
 * Create a map of which day each task should be scheduled on
 * This handles ASAP scheduling across multiple days
 */
export function createTaskSchedulingMap(todos: TodoModel[], config: SchedulingConfig): Map<string, string> {
  const map = new Map<string, string>(); // todoId -> dateKey
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { ganttSettings, workHours } = config;

  // First, schedule all completed/archived tasks at their exact completion time
  const activeTodosOnly = todos.filter((todo) => {
    if (todo.isCompleted && todo.completedAt) {
      const completionDate = new Date(todo.completedAt);
      const localYear = completionDate.getFullYear();
      const localMonth = String(completionDate.getMonth() + 1).padStart(2, "0");
      const localDay = String(completionDate.getDate()).padStart(2, "0");
      const completedDateKey = `${localYear}-${localMonth}-${localDay}`;
      map.set(todo.id, completedDateKey);
      return false;
    }

    if (todo.isArchived) {
      if (todo.completedAt) {
        const completionDate = new Date(todo.completedAt);
        const localYear = completionDate.getFullYear();
        const localMonth = String(completionDate.getMonth() + 1).padStart(2, "0");
        const localDay = String(completionDate.getDate()).padStart(2, "0");
        const archivedDateKey = `${localYear}-${localMonth}-${localDay}`;
        map.set(todo.id, archivedDateKey);
      }
      return false;
    }

    return true;
  });

  let currentDay = new Date(today);
  let remainingTodos = [...activeTodosOnly];

  // Schedule active tasks across days starting from today
  while (remainingTodos.length > 0) {
    const daySchedule = getScheduleForDate(currentDay, workHours);
    const dayStart = parseTime(daySchedule.startTime, currentDay);
    const dayEnd = parseTime(daySchedule.endTime, currentDay);
    const dayBreaks = daySchedule.breaks.map((b) => ({
      startTime: parseTime(b.startTime, currentDay),
      endTime: parseTime(b.endTime, currentDay),
    }));
    const isCurrentDay = currentDay.toDateString() === today.toDateString();

    let currentTime = new Date(dayStart);
    if (isCurrentDay && now > dayStart && now < dayEnd) {
      currentTime = new Date(now);
    }

    const scheduledToday: string[] = [];
    let workTimeSinceBreak = 0;
    let pomodoroSessions = 0;

    for (const todo of remainingTodos) {
      if (isCurrentDay && currentTime < now) {
        currentTime = new Date(now);
      }

      // Skip breaks
      let inBreak = true;
      while (inBreak && currentTime < dayEnd) {
        inBreak = false;
        for (const breakBlock of dayBreaks) {
          if (currentTime >= breakBlock.startTime && currentTime < breakBlock.endTime) {
            currentTime = new Date(breakBlock.endTime);
            if (isCurrentDay && currentTime < now) {
              currentTime = new Date(now);
            }
            inBreak = true;
            break;
          }
        }
      }

      if (currentTime >= dayEnd) break;

      const durationMinutes = parseDuration(todo.metadata.duration) * ganttSettings.durationMultiplier;
      const taskEnd = new Date(currentTime.getTime() + durationMinutes * 60000);

      if (taskEnd <= dayEnd) {
        const dateKey = currentDay.toISOString().split("T")[0];
        map.set(todo.id, dateKey);
        scheduledToday.push(todo.id);

        const {
          schedulingTechnique,
          pomodoroWorkDuration,
          contextSwitchingTime,
          flowWorkDuration,
          flowBreakDuration,
          flowContextSwitchingTime,
        } = ganttSettings;
        let breakMinutes = contextSwitchingTime ?? 5;

        if (schedulingTechnique === "pomodoro") {
          workTimeSinceBreak += durationMinutes;
          const workDuration = pomodoroWorkDuration ?? 25;
          if (workTimeSinceBreak >= workDuration) {
            pomodoroSessions++;
            breakMinutes = getPomodoroBreakDuration(pomodoroSessions, ganttSettings);
            workTimeSinceBreak = 0;
          }
        } else if (schedulingTechnique === "flow") {
          workTimeSinceBreak += durationMinutes;
          const workDuration = flowWorkDuration ?? 52;
          if (workTimeSinceBreak >= workDuration) {
            // Flow break + context switching time
            breakMinutes = (flowBreakDuration ?? 17) + (flowContextSwitchingTime ?? 10);
            workTimeSinceBreak = 0;
          } else {
            breakMinutes = flowContextSwitchingTime ?? 10;
          }
        }

        currentTime = new Date(taskEnd.getTime() + breakMinutes * 60000);
      } else {
        break;
      }
    }

    remainingTodos = remainingTodos.filter((t) => !scheduledToday.includes(t.id));
    currentDay.setDate(currentDay.getDate() + 1);

    // Safety: don't schedule more than 30 days out
    if (currentDay.getTime() - today.getTime() > 30 * 24 * 60 * 60 * 1000) break;
  }

  return map;
}

// ============================================================================
// Daily Task Scheduling (with segments)
// ============================================================================

/**
 * Schedule tasks for a specific day with segment splitting
 */
export function scheduleDayTasks(
  todosForDate: TodoModel[],
  dayStartTime: Date,
  dayEndTime: Date,
  breakBlocks: BreakBlock[],
  selectedDate: Date,
  ganttSettings: Gantt,
): DayScheduleResult {
  const tasks: ScheduledTask[] = [];
  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();

  let currentTime = new Date(dayStartTime);
  if (isToday && now > dayStartTime && now < dayEndTime) {
    currentTime = new Date(now);
  }

  // Helper to find the next break that starts after or overlaps with a given time
  const findNextBreak = (fromTime: Date): BreakBlock | null => {
    const sorted = [...breakBlocks].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    for (const b of sorted) {
      if (b.endTime > fromTime) {
        return b;
      }
    }
    return null;
  };

  // Helper to skip past any break we're currently in
  const skipCurrentBreak = (time: Date): Date => {
    let result = new Date(time);
    let changed = true;
    while (changed) {
      changed = false;
      for (const breakBlock of breakBlocks) {
        if (result >= breakBlock.startTime && result < breakBlock.endTime) {
          result = new Date(breakBlock.endTime);
          changed = true;
          break;
        }
      }
    }
    return result;
  };

  // Pomodoro state tracking
  const {
    schedulingTechnique,
    pomodoroWorkDuration,
    contextSwitchingTime,
    pomodoroLongBreak,
    pomodoroLongBreakInterval,
    flowWorkDuration,
    flowBreakDuration,
    flowContextSwitchingTime,
  } = ganttSettings;
  const pomodoroWorkMinutes = pomodoroWorkDuration ?? 25;
  const contextSwitchMinutes = contextSwitchingTime ?? 5;
  const longBreakDuration = pomodoroLongBreak ?? 15;
  const longBreakInterval = pomodoroLongBreakInterval ?? 4;
  const flowWorkMinutes = flowWorkDuration ?? 52;
  const flowBreakMinutes = flowBreakDuration ?? 17;
  const flowContextMinutes = flowContextSwitchingTime ?? 10;

  let workTimeSinceLastPomodoroBreak = 0;
  let pomodoroSessionCount = 0;

  for (const todo of todosForDate) {
    // For completed/archived tasks, schedule based on their actual completion time
    if ((todo.isCompleted || todo.isArchived) && todo.completedAt) {
      const completionDate = new Date(todo.completedAt);
      const durationMinutes = parseDuration(todo.metadata.duration);

      const taskEndTime = completionDate;
      const taskStartTime = new Date(completionDate.getTime() - durationMinutes * 60 * 1000);

      let targetDate: Date;
      if (todo.metadata.dueDate) {
        const dueDateStr = todo.metadata.dueDate;
        if (dueDateStr.includes("T") || dueDateStr.includes("Z")) {
          targetDate = new Date(dueDateStr);
        } else if (dueDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dueDateStr.split("-").map(Number);
          targetDate = new Date(year, month - 1, day);
          targetDate.setHours(23, 59, 59, 999);
        } else {
          targetDate = new Date(dueDateStr);
        }
      } else {
        targetDate = completionDate;
      }

      const timeDiff = targetDate.getTime() - taskEndTime.getTime();
      const hasBuffer = timeDiff > 0;
      const isOverdue = timeDiff < 0;
      const bufferMinutes = Math.abs(Math.floor(timeDiff / 60000));

      // Completed tasks don't have breaks after them
      tasks.push({
        todo,
        startTime: taskStartTime,
        endTime: taskEndTime,
        durationMinutes,
        segments: [{ startTime: taskStartTime, endTime: taskEndTime, durationMinutes, nextBreak: null }],
        targetDate,
        hasBuffer,
        bufferMinutes,
        isOverdue,
        nextBreak: null,
      });

      continue;
    }

    // For active tasks, use ASAP scheduling with break splitting and Pomodoro
    if (isToday && currentTime < now) {
      currentTime = new Date(now);
    }

    currentTime = skipCurrentBreak(currentTime);

    if (currentTime >= dayEndTime) break;

    const totalDurationMinutes = parseDuration(todo.metadata.duration) * ganttSettings.durationMultiplier;
    let remainingMinutes = totalDurationMinutes;
    const segments: TaskSegment[] = [];

    // Schedule segments, splitting across breaks AND at Pomodoro work duration boundaries
    while (remainingMinutes > 0 && currentTime < dayEndTime) {
      currentTime = skipCurrentBreak(currentTime);
      if (currentTime >= dayEndTime) break;

      // If using Pomodoro or Flow and we've accumulated enough work time, take a break FIRST
      if (schedulingTechnique === "pomodoro" && workTimeSinceLastPomodoroBreak >= pomodoroWorkMinutes) {
        pomodoroSessionCount++;
        const pomodoroBreakDuration = getPomodoroBreakDuration(pomodoroSessionCount, ganttSettings);
        currentTime = new Date(currentTime.getTime() + pomodoroBreakDuration * 60000);
        currentTime = skipCurrentBreak(currentTime);
        workTimeSinceLastPomodoroBreak = 0;
        if (currentTime >= dayEndTime) break;
      } else if (schedulingTechnique === "flow" && workTimeSinceLastPomodoroBreak >= flowWorkMinutes) {
        // Flow: take break + context switch
        const flowTotalBreak = flowBreakMinutes + flowContextMinutes;
        currentTime = new Date(currentTime.getTime() + flowTotalBreak * 60000);
        currentTime = skipCurrentBreak(currentTime);
        workTimeSinceLastPomodoroBreak = 0;
        if (currentTime >= dayEndTime) break;
      }

      // Find how much time until the next break block or end of day
      let availableMinutes = (dayEndTime.getTime() - currentTime.getTime()) / 60000;
      const nextBreak = findNextBreak(currentTime);

      if (nextBreak && nextBreak.startTime > currentTime && nextBreak.startTime < dayEndTime) {
        const minutesToBreak = (nextBreak.startTime.getTime() - currentTime.getTime()) / 60000;
        availableMinutes = Math.min(availableMinutes, minutesToBreak);
      }

      // When Pomodoro or Flow is enabled, also limit by remaining work duration before next break
      if (schedulingTechnique === "pomodoro") {
        const minutesToPomodoroBreak = pomodoroWorkMinutes - workTimeSinceLastPomodoroBreak;
        availableMinutes = Math.min(availableMinutes, minutesToPomodoroBreak);
      } else if (schedulingTechnique === "flow") {
        const minutesToFlowBreak = flowWorkMinutes - workTimeSinceLastPomodoroBreak;
        availableMinutes = Math.min(availableMinutes, minutesToFlowBreak);
      }

      const segmentMinutes = Math.min(remainingMinutes, availableMinutes);

      if (segmentMinutes <= 0) break;

      const segmentEnd = new Date(currentTime.getTime() + segmentMinutes * 60000);

      // Determine if there will be a break after this segment
      // (there's more work remaining AND we're hitting a boundary)
      const willHaveMoreSegments = remainingMinutes - segmentMinutes > 0;
      let segmentBreakInfo: BreakInfo | null = null;

      if (willHaveMoreSegments) {
        // There's a break between segments - determine type based on technique
        if (schedulingTechnique === "pomodoro") {
          // Check if this segment completes a Pomodoro work session
          const workAfterSegment = workTimeSinceLastPomodoroBreak + segmentMinutes;
          if (workAfterSegment >= pomodoroWorkMinutes) {
            const nextSession = pomodoroSessionCount + 1;
            const isLong = nextSession > 0 && nextSession % longBreakInterval === 0;
            segmentBreakInfo = {
              type: isLong ? "long" : "short",
              durationMinutes: isLong ? longBreakDuration : ganttSettings.pomodoroShortBreak ?? 5,
              icon: "🍅",
              label: isLong ? "long break" : "short break",
            };
          } else {
            // Just a time block break, show as break
            segmentBreakInfo = {
              type: "short",
              durationMinutes: 0, // Will be computed from gap
              icon: "🍅",
              label: "break",
            };
          }
        } else if (schedulingTechnique === "flow") {
          const workAfterSegment = workTimeSinceLastPomodoroBreak + segmentMinutes;
          if (workAfterSegment >= flowWorkMinutes) {
            segmentBreakInfo = {
              type: "long",
              durationMinutes: flowBreakMinutes,
              icon: "🌊",
              label: "break",
            };
          } else {
            segmentBreakInfo = {
              type: "context",
              durationMinutes: 0,
              icon: "🌊",
              label: "break",
            };
          }
        } else {
          // Sequential - context switch
          segmentBreakInfo = {
            type: "context",
            durationMinutes: contextSwitchMinutes,
            icon: "",
            label: "context switch",
          };
        }
      }

      segments.push({
        startTime: new Date(currentTime),
        endTime: segmentEnd,
        durationMinutes: segmentMinutes,
        nextBreak: segmentBreakInfo,
      });

      remainingMinutes -= segmentMinutes;
      currentTime = new Date(segmentEnd);

      // Track work time for Pomodoro and Flow
      if (schedulingTechnique !== "sequential") {
        workTimeSinceLastPomodoroBreak += segmentMinutes;
      }

      // Check if we need to handle a time block break
      if (remainingMinutes > 0) {
        const wasAtTimeBlockBreak =
          currentTime < dayEndTime &&
          (breakBlocks.some((b) => currentTime >= b.startTime && currentTime < b.endTime) ||
            (nextBreak && segmentEnd.getTime() === nextBreak.startTime.getTime()));

        if (wasAtTimeBlockBreak) {
          const beforeSkip = new Date(currentTime);
          currentTime = skipCurrentBreak(currentTime);
          const timeBlockBreakDuration = (currentTime.getTime() - beforeSkip.getTime()) / 60000;

          if (schedulingTechnique === "pomodoro") {
            // If time block break is >= long break duration, reset session count entirely
            if (timeBlockBreakDuration >= longBreakDuration) {
              pomodoroSessionCount = 0;
              workTimeSinceLastPomodoroBreak = 0;
            } else if (workTimeSinceLastPomodoroBreak >= pomodoroWorkMinutes) {
              pomodoroSessionCount++;
              const requiredBreak = getPomodoroBreakDuration(pomodoroSessionCount, ganttSettings);
              const additionalBreakNeeded = Math.max(0, requiredBreak - timeBlockBreakDuration);
              if (additionalBreakNeeded > 0) {
                currentTime = new Date(currentTime.getTime() + additionalBreakNeeded * 60000);
                currentTime = skipCurrentBreak(currentTime);
              }
              workTimeSinceLastPomodoroBreak = 0;
            } else {
              workTimeSinceLastPomodoroBreak = 0;
            }
          } else if (schedulingTechnique === "flow") {
            // Flow: if time block break is >= flow break, reset
            if (timeBlockBreakDuration >= flowBreakMinutes) {
              workTimeSinceLastPomodoroBreak = 0;
            } else if (workTimeSinceLastPomodoroBreak >= flowWorkMinutes) {
              const additionalBreakNeeded = Math.max(0, flowBreakMinutes + flowContextMinutes - timeBlockBreakDuration);
              if (additionalBreakNeeded > 0) {
                currentTime = new Date(currentTime.getTime() + additionalBreakNeeded * 60000);
                currentTime = skipCurrentBreak(currentTime);
              }
              workTimeSinceLastPomodoroBreak = 0;
            } else {
              workTimeSinceLastPomodoroBreak = 0;
            }
          } else {
            // Pomodoro disabled - add context switch time after time block break
            currentTime = new Date(currentTime.getTime() + contextSwitchMinutes * 60000);
            currentTime = skipCurrentBreak(currentTime);
          }
        }
      }
    }

    if (segments.length === 0) continue;

    const overallStartTime = segments[0].startTime;
    const overallEndTime = segments[segments.length - 1].endTime;
    const scheduledMinutes = segments.reduce((sum, s) => sum + s.durationMinutes, 0);

    let targetDate: Date;
    if (todo.metadata.dueDate) {
      const dueDateStr = todo.metadata.dueDate;
      if (dueDateStr.includes("T") || dueDateStr.includes("Z")) {
        targetDate = new Date(dueDateStr);
      } else if (dueDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dueDateStr.split("-").map(Number);
        targetDate = new Date(year, month - 1, day);
        targetDate.setHours(23, 59, 59, 999);
      } else {
        targetDate = new Date(dueDateStr);
      }
    } else {
      targetDate = isToday && now > dayStartTime && now < dayEndTime ? now : dayEndTime;
    }

    const timeDiff = targetDate.getTime() - overallEndTime.getTime();
    const hasBuffer = timeDiff > 0;
    const isOverdue = timeDiff < 0;
    const bufferMinutes = Math.abs(Math.floor(timeDiff / 60000));

    tasks.push({
      todo,
      startTime: overallStartTime,
      endTime: overallEndTime,
      durationMinutes: scheduledMinutes,
      segments,
      targetDate,
      hasBuffer,
      bufferMinutes,
      isOverdue,
      nextBreak: null, // Will be computed after all tasks are scheduled
    });

    // Track Pomodoro session count for break computation
    if (schedulingTechnique === "pomodoro") {
      pomodoroSessionCount++;
    }

    // Add break time between tasks based on scheduling technique
    // AND compute nextBreak info at the same time (scheduler is authoritative source)
    if (schedulingTechnique === "pomodoro") {
      // Pomodoro adds short/long break after each task
      const breakDuration = getPomodoroBreakDuration(pomodoroSessionCount, ganttSettings);
      const isLongBreak = pomodoroSessionCount > 0 && pomodoroSessionCount % longBreakInterval === 0;

      tasks[tasks.length - 1].nextBreak = {
        type: isLongBreak ? "long" : "short",
        durationMinutes: breakDuration,
        icon: "🍅",
        label: isLongBreak ? "long break" : "short break",
      };

      currentTime = new Date(overallEndTime.getTime() + breakDuration * 60000);
    } else if (schedulingTechnique === "flow") {
      // Flow adds context switch between tasks
      if (flowContextMinutes > 0) {
        tasks[tasks.length - 1].nextBreak = {
          type: "context",
          durationMinutes: flowContextMinutes,
          icon: "🌊",
          label: "context switch",
        };
      }
      currentTime = new Date(overallEndTime.getTime() + flowContextMinutes * 60000);
    } else {
      // Sequential uses context switch time
      if (contextSwitchMinutes > 0) {
        tasks[tasks.length - 1].nextBreak = {
          type: "context",
          durationMinutes: contextSwitchMinutes,
          icon: "",
          label: "context switch",
        };
      }
      currentTime = new Date(overallEndTime.getTime() + contextSwitchMinutes * 60000);
    }
  }

  // Clear nextBreak for the last task (no break after final task)
  if (tasks.length > 0) {
    const lastActiveIndex = tasks.length - 1;
    // Find the last active (non-completed) task
    for (let i = tasks.length - 1; i >= 0; i--) {
      if (!tasks[i].todo.isCompleted && !tasks[i].todo.isArchived) {
        tasks[i].nextBreak = null; // No break after the last active task
        break;
      }
    }
  }

  const unscheduledTasks = todosForDate.slice(tasks.length);

  return { tasks, unscheduledTasks };
}

// ============================================================================
// Week View Scheduling
// ============================================================================

export interface WeekDaySchedule {
  date: Date;
  scheduled: Array<{
    todo: TodoModel;
    startPercent: number;
    widthPercent: number;
    color: string;
  }>;
  // Individual segments for more accurate visualization
  segments: Array<{
    todoId: string;
    startPercent: number;
    widthPercent: number;
    color: string;
  }>;
  // Technique breaks (Pomodoro, Flow, context switching) as visual blocks
  techniqueBreaks: Array<{
    startPercent: number;
    widthPercent: number;
    type: BreakType;
  }>;
  breakBlocks: Array<{
    startPercent: number;
    widthPercent: number;
    color: string;
    name: string;
    icon: string;
  }>;
  dayStart: Date;
  dayEnd: Date;
  totalMinutes: number;
  techniqueBreakMinutes: number; // Total break time from scheduling technique (Pomodoro, Flow, etc.)
}

/**
 * Schedule tasks for a week view - reuses scheduleDayTasks for consistency
 */
export function scheduleWeekTasks(
  dates: Date[],
  allTodos: TodoModel[],
  taskSchedulingMap: Map<string, string>,
  workHours: WorkHoursSettings,
  ganttSettings: Gantt,
  getProjectColor: (todo: TodoModel) => string,
): WeekDaySchedule[] {
  return dates.map((date) => {
    const dateStr = date.toISOString().split("T")[0];
    const daySchedule = getScheduleForDate(date, workHours);
    const dayStart = parseTime(daySchedule.startTime, date);
    const dayEnd = parseTime(daySchedule.endTime, date);
    const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60000;

    // Get tasks for this day
    const tasksForDay = allTodos.filter((todo) => taskSchedulingMap.get(todo.id) === dateStr);

    // Build break blocks from work hours settings
    const breakBlocks: BreakBlock[] = daySchedule.breaks.map((b) => ({
      name: b.name || "Break",
      startTime: parseTime(b.startTime, date),
      endTime: parseTime(b.endTime, date),
      color: b.color || "#9ca3af",
      icon: getBlockIcon(b.blockType),
    }));

    // Use the main scheduler for consistent scheduling
    const { tasks: scheduledTasks } = scheduleDayTasks(tasksForDay, dayStart, dayEnd, breakBlocks, date, ganttSettings);

    // Calculate total technique break time (Pomodoro, Flow, context switching)
    // Include breaks after tasks AND breaks between segments within tasks
    const techniqueBreakMinutes = scheduledTasks.reduce((sum, task) => {
      // Add break after this task
      let taskBreaks = task.nextBreak?.durationMinutes ?? 0;
      // Add breaks between segments within this task
      task.segments.forEach((segment) => {
        taskBreaks += segment.nextBreak?.durationMinutes ?? 0;
      });
      return sum + taskBreaks;
    }, 0);

    // Convert to percentage-based format for week view
    const scheduled = scheduledTasks.map((task) => {
      const startMinutes = (task.startTime.getTime() - dayStart.getTime()) / 60000;
      const startPercent = (startMinutes / totalMinutes) * 100;
      const widthPercent = (task.durationMinutes / totalMinutes) * 100;

      return {
        todo: task.todo,
        startPercent,
        widthPercent,
        color: getProjectColor(task.todo),
      };
    });

    // Convert segments to percentage-based format for accurate visualization
    const segments: WeekDaySchedule["segments"] = [];
    scheduledTasks.forEach((task) => {
      const color = getProjectColor(task.todo);
      task.segments.forEach((segment) => {
        const startMinutes = (segment.startTime.getTime() - dayStart.getTime()) / 60000;
        const startPercent = (startMinutes / totalMinutes) * 100;
        const widthPercent = (segment.durationMinutes / totalMinutes) * 100;
        segments.push({
          todoId: task.todo.id,
          startPercent,
          widthPercent,
          color,
        });
      });
    });

    // Collect technique breaks (between tasks and between segments) as visual blocks
    const techniqueBreaks: WeekDaySchedule["techniqueBreaks"] = [];
    scheduledTasks.forEach((task, taskIndex) => {
      // Add breaks between segments within this task
      task.segments.forEach((segment, segIndex) => {
        if (segment.nextBreak && segment.nextBreak.durationMinutes > 0) {
          const nextSegment = task.segments[segIndex + 1];
          if (nextSegment) {
            const startMinutes = (segment.endTime.getTime() - dayStart.getTime()) / 60000;
            const endMinutes = (nextSegment.startTime.getTime() - dayStart.getTime()) / 60000;
            const startPercent = (startMinutes / totalMinutes) * 100;
            const widthPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;
            if (widthPercent > 0) {
              techniqueBreaks.push({
                startPercent,
                widthPercent,
                type: segment.nextBreak.type,
              });
            }
          }
        }
      });

      // Add break after this task (between tasks)
      if (task.nextBreak && task.nextBreak.durationMinutes > 0) {
        const nextTask = scheduledTasks[taskIndex + 1];
        if (nextTask) {
          const startMinutes = (task.endTime.getTime() - dayStart.getTime()) / 60000;
          const endMinutes = (nextTask.startTime.getTime() - dayStart.getTime()) / 60000;
          const startPercent = (startMinutes / totalMinutes) * 100;
          const widthPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;
          if (widthPercent > 0) {
            techniqueBreaks.push({
              startPercent,
              widthPercent,
              type: task.nextBreak.type,
            });
          }
        }
      }
    });

    // Convert break blocks to percentage-based format
    const breakBlocksPercent = breakBlocks.map((b) => {
      const startMinutes = (b.startTime.getTime() - dayStart.getTime()) / 60000;
      const endMinutes = (b.endTime.getTime() - dayStart.getTime()) / 60000;
      const startPercent = (startMinutes / totalMinutes) * 100;
      const widthPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;

      return {
        startPercent,
        widthPercent,
        color: b.color,
        name: b.name,
        icon: b.icon || "☕",
      };
    });

    return {
      date,
      scheduled,
      segments,
      techniqueBreaks,
      breakBlocks: breakBlocksPercent,
      dayStart,
      dayEnd,
      totalMinutes,
      techniqueBreakMinutes,
    };
  });
}
