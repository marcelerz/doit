/**
 * Focus View Utility Functions
 *
 * Pure business logic extracted from FocusView.tsx for better testability.
 */

import { ScheduledTask, BreakInfo } from "@/utils/ganttScheduler";
import { TodoId } from "@/types/todo";

/**
 * Schedule item type
 */
export type ScheduleItemType = "task" | "break";

/**
 * A schedule item is either a task segment or a break
 */
export interface ScheduleItem {
  type: ScheduleItemType;
  task?: ScheduledTask;
  segmentIndex?: number;
  isLastSegment?: boolean;
  breakInfo?: BreakInfo;
  durationSeconds: number;
}

/**
 * Focus phase types
 */
export type FocusPhase = "work" | "break" | "pending-work" | "pending-break" | "completed";

/**
 * Focus state structure
 */
export interface FocusState {
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

/**
 * Format seconds to MM:SS or HH:MM:SS string
 * @param seconds - Number of seconds (can be negative)
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
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

/**
 * Format Date to clock time (e.g., "9:53 PM")
 * @param date - Date to format
 * @returns Formatted clock time string
 */
export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Filter active scheduled tasks (not completed, not archived, not actual time entries)
 * @param tasks - Array of scheduled tasks
 * @returns Filtered array of active tasks
 */
export function filterActiveScheduledTasks(tasks: ScheduledTask[]): ScheduledTask[] {
  return tasks.filter(
    (t) => !t.isActualTime && !t.todo.isCompleted && !t.todo.isArchived
  );
}

/**
 * Build a flat schedule from task segments with breaks
 * Creates a sequential list: segment, break, segment, break...
 * @param scheduledTasks - Array of scheduled tasks
 * @returns Flat array of schedule items
 */
export function buildFlatSchedule(scheduledTasks: ScheduledTask[]): ScheduleItem[] {
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
}

/**
 * Get current schedule item safely
 * @param schedule - The schedule array
 * @param index - Current item index
 * @returns The schedule item or null if out of bounds
 */
export function getCurrentItem(
  schedule: ScheduleItem[],
  index: number
): ScheduleItem | null {
  return schedule[index] ?? null;
}

/**
 * Count unique tasks completed up to a given index
 * @param schedule - The schedule array
 * @param currentIndex - Current index in schedule
 * @returns Number of unique tasks completed or in progress
 */
export function calculateCurrentTaskNumber(
  schedule: ScheduleItem[],
  currentIndex: number
): number {
  const currentItem = schedule[currentIndex];

  // If on a break, find the previous task
  if (!currentItem || currentItem.type !== "task") {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (schedule[i]?.type === "task") {
        // Count unique tasks up to this one
        const seenTasks = new Set<TodoId>();
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
  const seenTasks = new Set<TodoId>();
  for (let i = 0; i <= currentIndex; i++) {
    const item = schedule[i];
    if (item?.type === "task" && item.task?.todo.id) {
      seenTasks.add(item.task.todo.id);
    }
  }
  return seenTasks.size;
}

/**
 * Calculate progress percentage for current item
 * @param currentItem - The current schedule item
 * @param timeRemaining - Time remaining in seconds
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
  currentItem: ScheduleItem | null,
  timeRemaining: number
): number {
  if (!currentItem) return 0;
  const total = currentItem.durationSeconds;
  return ((total - timeRemaining) / total) * 100;
}

/**
 * Create initial focus state
 * @param schedule - The schedule array
 * @returns Initial focus state
 */
export function createInitialFocusState(schedule: ScheduleItem[]): FocusState {
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
}

/**
 * Determine next state after current item completes
 * @param currentState - Current focus state
 * @param schedule - The schedule array
 * @returns Object with next state info or completion flag
 */
export function determineNextState(
  currentState: FocusState,
  schedule: ScheduleItem[]
): {
  isComplete: boolean;
  nextIndex?: number;
  nextPhase?: FocusPhase;
  nextDuration?: number;
} {
  const nextIndex = currentState.currentItemIndex + 1;
  const nextItem = schedule[nextIndex];

  if (!nextItem) {
    return { isComplete: true };
  }

  return {
    isComplete: false,
    nextIndex,
    nextPhase: nextItem.type === "task" ? "work" : "break",
    nextDuration: nextItem.durationSeconds,
  };
}

/**
 * Get technique display info
 * @param technique - Scheduling technique name
 * @returns Icon and display name
 */
export function getTechniqueInfo(
  technique: "sequential" | "pomodoro" | "flow"
): { icon: string; name: string } {
  switch (technique) {
    case "pomodoro":
      return { icon: "🍅", name: "Pomodoro" };
    case "flow":
      return { icon: "🌊", name: "Flow" };
    case "sequential":
    default:
      return { icon: "📋", name: "Sequential" };
  }
}

/**
 * Calculate break end time
 * @param durationSeconds - Break duration in seconds
 * @param now - Current time (for testing)
 * @returns Break end time
 */
export function calculateBreakEndTime(
  durationSeconds: number,
  now: Date = new Date()
): Date {
  const end = new Date(now);
  end.setSeconds(end.getSeconds() + durationSeconds);
  return end;
}

/**
 * Count total unique tasks in schedule
 * @param scheduledTasks - Array of scheduled tasks
 * @returns Number of unique tasks
 */
export function countTotalTasks(scheduledTasks: ScheduledTask[]): number {
  return scheduledTasks.length;
}

/**
 * Check if should auto-complete task
 * @param scheduleItem - Current schedule item
 * @returns Todo ID to complete or null
 */
export function shouldAutoComplete(
  scheduleItem: ScheduleItem | null
): TodoId | null {
  if (!scheduleItem) return null;
  if (scheduleItem.type !== "task") return null;
  if (!scheduleItem.isLastSegment) return null;
  return scheduleItem.task?.todo.id ?? null;
}
