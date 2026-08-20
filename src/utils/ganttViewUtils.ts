/**
 * Gantt View Utility Functions
 *
 * Pure business logic extracted from GanttView.tsx for better testability.
 */

import { TodoModel } from "@/models/TodoModel";
import { TodoId } from "@/types/todo";

/**
 * Time statistics for a day
 */
export interface DayTimeStats {
  /** Total planned minutes for active tasks */
  totalPlannedMinutes: number;
  /** Total minutes from completed tasks */
  completedMinutes: number;
  /** Available work minutes (total - breaks) */
  availableMinutes: number;
  /** Utilization percentage (0-100+) */
  utilizationPercent: number;
  /** Number of tasks with time conflicts */
  conflictCount: number;
  /** Break minutes from scheduling technique */
  techniqueBreakMinutes: number;
}

/**
 * Time bounds for display
 */
export interface TimeBounds {
  startTime: Date;
  endTime: Date;
}

/**
 * Task segment with timing
 */
export interface TaskSegment {
  durationMinutes: number;
  nextBreak?: {
    durationMinutes: number;
  };
}

/**
 * Break info structure
 */
export interface BreakInfo {
  durationMinutes: number;
}

/**
 * Scheduled task structure (simplified)
 */
export interface ScheduledTaskInfo {
  todo: TodoModel;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  isActualTime?: boolean;
  segments: TaskSegment[];
  nextBreak?: BreakInfo;
}

/**
 * Break block structure
 */
export interface BreakBlock {
  name: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Parse a duration string into minutes
 * @param duration - Duration string like "2h30m", "45m", "1.5h"
 * @param defaultMinutes - Default minutes if parsing fails
 * @returns Duration in minutes
 */
export function parseDuration(duration: string | undefined, defaultMinutes: number): number {
  if (!duration) return defaultMinutes;

  const match = duration.match(/(\d+\.?\d*)([mhd])?/i);
  if (!match) return defaultMinutes;

  const value = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase() || "m";

  switch (unit) {
    case "h":
      return Math.round(value * 60);
    case "d":
      return Math.round(value * 8 * 60); // Assuming 8-hour days
    case "m":
    default:
      return Math.round(value);
  }
}

/**
 * Detect overlapping tasks (conflicts)
 * @param tasks - Array of scheduled tasks
 * @returns Set of task IDs that have conflicts
 */
export function detectTaskConflicts(tasks: ScheduledTaskInfo[]): Set<TodoId> {
  const conflicts = new Set<TodoId>();

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const taskA = tasks[i];
      const taskB = tasks[j];

      // Check if tasks overlap
      if (taskA.startTime < taskB.endTime && taskB.startTime < taskA.endTime) {
        conflicts.add(taskA.todo.id);
        conflicts.add(taskB.todo.id);
      }
    }
  }

  return conflicts;
}

/**
 * Calculate time statistics for a day
 * @param activeTasks - Active (not completed) scheduled tasks
 * @param completedTasks - Completed scheduled tasks
 * @param breakBlocks - Time block breaks (lunch, meetings, etc.)
 * @param dayStartTime - Start of the work day
 * @param dayEndTime - End of the work day
 * @param taskConflicts - Set of task IDs with conflicts
 * @returns Day time statistics
 */
export function calculateDayTimeStats(
  activeTasks: ScheduledTaskInfo[],
  completedTasks: ScheduledTaskInfo[],
  breakBlocks: BreakBlock[],
  dayStartTime: Date,
  dayEndTime: Date,
  taskConflicts: Set<TodoId>
): DayTimeStats {
  const totalPlannedMinutes = activeTasks.reduce(
    (sum, task) => sum + task.durationMinutes,
    0
  );
  const completedMinutes = completedTasks.reduce(
    (sum, task) => sum + task.durationMinutes,
    0
  );
  const totalWorkMinutes = (dayEndTime.getTime() - dayStartTime.getTime()) / 60000;

  // Calculate time block breaks (lunch, meetings, etc.)
  const timeBlockBreakMinutes = breakBlocks.reduce((sum, block) => {
    return sum + (block.endTime.getTime() - block.startTime.getTime()) / 60000;
  }, 0);

  // Calculate technique breaks (Pomodoro, Flow, context switching)
  const techniqueBreakMinutes = [...activeTasks, ...completedTasks].reduce(
    (sum, task) => {
      // Add break after this task
      let taskBreaks = task.nextBreak?.durationMinutes ?? 0;
      // Add breaks between segments within this task
      task.segments.forEach((segment) => {
        taskBreaks += segment.nextBreak?.durationMinutes ?? 0;
      });
      return sum + taskBreaks;
    },
    0
  );

  // Available = total work time - time blocks (lunch, meetings)
  const availableMinutes = totalWorkMinutes - timeBlockBreakMinutes;
  // Utilized = tasks + technique breaks between them
  const utilizedMinutes = totalPlannedMinutes + completedMinutes + techniqueBreakMinutes;
  const utilizationPercent =
    availableMinutes > 0 ? Math.round((utilizedMinutes / availableMinutes) * 100) : 0;

  return {
    totalPlannedMinutes,
    completedMinutes,
    availableMinutes,
    utilizationPercent,
    conflictCount: taskConflicts.size,
    techniqueBreakMinutes,
  };
}

/**
 * Calculate dynamic time bounds that expand for tasks outside normal work hours
 * @param todos - Todos for the date (may include completed tasks)
 * @param scheduleStartTime - Normal work start time
 * @param scheduleEndTime - Normal work end time
 * @param selectedDate - The selected date
 * @returns Expanded time bounds
 */
export function calculateDynamicTimeBounds(
  todos: TodoModel[],
  scheduleStartTime: Date,
  scheduleEndTime: Date,
  selectedDate: Date
): TimeBounds {
  let minTime = new Date(scheduleStartTime);
  let maxTime = new Date(scheduleEndTime);

  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Check if any completed/archived tasks fall outside work hours
  todos.forEach((todo) => {
    if ((todo.isCompleted || todo.isArchived) && todo.completedAt) {
      const completionDate = new Date(todo.completedAt);
      const durationMinutes = todo.durationMinutes ?? 0;
      const taskStartTime = new Date(
        completionDate.getTime() - durationMinutes * 60 * 1000
      );

      if (taskStartTime < minTime) {
        const rounded = new Date(taskStartTime);
        rounded.setMinutes(0, 0, 0);
        minTime = rounded;
      }
      if (completionDate > maxTime) {
        const rounded = new Date(completionDate);
        rounded.setMinutes(0, 0, 0);
        rounded.setHours(rounded.getHours() + 1);
        maxTime = rounded;
      }
    }

    // Also expand bounds for time tracking entries
    if (todo.hasTimeTracking && todo.timeTracking) {
      todo.timeTracking.entries.forEach((entry) => {
        const entryStart = new Date(entry.startTime);
        const entryEnd = entry.endTime ? new Date(entry.endTime) : new Date();

        // Only consider entries that overlap with the selected date
        if (entryStart <= dayEnd && entryEnd >= dayStart) {
          if (entryStart < minTime) {
            const rounded = new Date(entryStart);
            rounded.setMinutes(0, 0, 0);
            minTime = rounded;
          }
          if (entryEnd > maxTime) {
            const rounded = new Date(entryEnd);
            rounded.setMinutes(0, 0, 0);
            rounded.setHours(rounded.getHours() + 1);
            maxTime = rounded;
          }
        }
      });
    }
  });

  return { startTime: minTime, endTime: maxTime };
}

/**
 * Generate hour markers for the timeline
 * @param startTime - Timeline start time
 * @param endTime - Timeline end time
 * @param interval - Interval in minutes between markers
 * @returns Array of marker times
 */
export function generateHourMarkers(
  startTime: Date,
  endTime: Date,
  interval: number = 60
): Date[] {
  const markers: Date[] = [];
  const current = new Date(startTime);

  // Round to nearest interval
  current.setMinutes(Math.ceil(current.getMinutes() / interval) * interval, 0, 0);

  while (current <= endTime) {
    markers.push(new Date(current));
    current.setMinutes(current.getMinutes() + interval);
  }

  return markers;
}

/**
 * Calculate time position as percentage of timeline
 * @param time - Time to position
 * @param startTime - Timeline start
 * @param totalMinutes - Total timeline minutes
 * @returns Percentage position (0-100)
 */
export function calculateTimePosition(
  time: Date,
  startTime: Date,
  totalMinutes: number
): number {
  const minutesFromStart = (time.getTime() - startTime.getTime()) / 60000;
  return Math.max(0, Math.min(100, (minutesFromStart / totalMinutes) * 100));
}

/**
 * Calculate zoom scale multiplier
 * @param zoomLevel - Current zoom level ("day" or "week")
 * @param baseWidth - Base width
 * @returns Scale multiplier
 */
export function calculateZoomScale(
  zoomLevel: "day" | "week",
  baseWidth: number = 100
): number {
  switch (zoomLevel) {
    case "week":
      return baseWidth * 0.2; // More compact for week view
    case "day":
    default:
      return baseWidth;
  }
}

/**
 * Get week dates (Monday to Sunday)
 * @param selectedDate - Any date in the week
 * @param weekStartDay - 0 for Sunday, 1 for Monday
 * @returns Array of 7 dates
 */
export function getWeekDates(selectedDate: Date, weekStartDay: number = 1): Date[] {
  const dates: Date[] = [];
  const startOfWeek = new Date(selectedDate);

  // Adjust to start of week
  const dayOfWeek = startOfWeek.getDay();
  const diff = weekStartDay === 1
    ? (dayOfWeek === 0 ? -6 : 1 - dayOfWeek)
    : -dayOfWeek;
  startOfWeek.setDate(startOfWeek.getDate() + diff);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  return dates;
}

/**
 * Format time for display (e.g., "9:00 AM")
 * @param date - Date to format
 * @returns Formatted time string
 */
export function formatTimeDisplay(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format duration for display (e.g., "1h 30m")
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatDurationDisplay(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}
