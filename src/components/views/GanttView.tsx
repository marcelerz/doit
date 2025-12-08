"use client";

import { TodoMetadata } from "@/types/todo";
import { TodoModel } from "@/models/TodoModel";
import { MarkerColors, WorkHoursSettings, GanttZoomLevel, DEFAULT_BLOCK_TYPES, TimeBlockType } from "@/types/settings";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";
import { MarkedText } from "@/components/shared/MarkedText";
import { TodoDetailsOverlay } from "@/components/overlays/TodoDetailsOverlay";
import { getTextColor } from "@/utils/colors";
import {
  notifyPomodoroBreak,
  notifyPomodoroWorkStart,
  playNotificationSound,
  getNotificationPermission,
  requestNotificationPermission,
} from "@/utils/notifications";

interface GanttViewProps {
  todos: TodoModel[];
  markerColors: MarkerColors;
  workHours: WorkHoursSettings;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTodo: (id: string, text: string, plainText: string, metadata: TodoMetadata) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  settings: import("@/types/settings").Settings;
  linkPatterns: import("@/types/settings").LinkPattern[];
  availablePeople: import("@/models/PersonModel").PersonModel[];
  availableProjects: import("@/models/ProjectModel").ProjectModel[];
  availablePriorities: import("@/types/settings").Priority[];
  onAddPerson: (person: string) => void;
  onAddProject: (project: string) => void;
  onAddPriority: (priority: string) => void;
  onAddComment?: (todoId: string, content: string) => void;
  onUpdateGanttSettings?: (gantt: import("@/types/settings").Gantt) => void;
  // Subtask handlers
  onAddSubtask?: (todoId: string, text: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
  onEditSubtask?: (todoId: string, subtaskId: string, text: string) => void;
  onDeleteSubtask?: (todoId: string, subtaskId: string) => void;
  // Time tracking handlers
  onStartTimeTracking?: (todoId: string, note?: string) => void;
  onStopTimeTracking?: (todoId: string) => void;
  onAddManualTimeEntry?: (todoId: string, minutes: number, note?: string) => void;
  onDeleteTimeEntry?: (todoId: string, entryId: string) => void;
  // Template handler
  onCreateTemplate?: (todoId: string) => void;
  // Duplicate handler
  onDuplicate?: (id: string) => string | undefined;
}

interface ScheduledTask {
  todo: TodoModel;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  targetDate: Date;
  hasBuffer: boolean;
  bufferMinutes: number;
  isOverdue: boolean;
}

interface BreakBlock {
  name: string;
  startTime: Date;
  endTime: Date;
  color: string;
  blockType?: TimeBlockType | string;
  icon?: string;
}

// Helper to get color for a block
function getBlockColor(block: { blockType?: TimeBlockType | string; color?: string }): string {
  // Use custom color if set
  if (block.color) return block.color;
  // Otherwise look up the block type color
  const blockTypeConfig = DEFAULT_BLOCK_TYPES.find((t) => t.id === block.blockType);
  return blockTypeConfig?.color || DEFAULT_BLOCK_TYPES[0].color;
}

// Helper to get icon for a block type
function getBlockIcon(blockType?: TimeBlockType | string): string {
  const config = DEFAULT_BLOCK_TYPES.find((t) => t.id === blockType);
  return config?.icon || "📅";
}

export function GanttView({
  todos,
  markerColors,
  workHours,
  onToggle,
  onDelete,
  onEditTodo,
  onArchive,
  onUnarchive,
  settings,
  linkPatterns,
  availablePeople,
  availableProjects,
  availablePriorities,
  onAddPerson,
  onAddProject,
  onAddPriority,
  onAddComment,
  onUpdateGanttSettings,
  onAddSubtask,
  onToggleSubtask,
  onEditSubtask,
  onDeleteSubtask,
  onStartTimeTracking,
  onStopTimeTracking,
  onAddManualTimeEntry,
  onDeleteTimeEntry,
  onCreateTemplate,
  onDuplicate,
}: GanttViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = previous week

  // View options state - initialized with defaults, loaded from storage in useEffect
  const [showTasksWithoutDates, setShowTasksWithoutDates] = useState(true);
  const [schedulingMode, setSchedulingMode] = useState<"asap" | "dueDate">("asap");
  const [groupByProject, setGroupByProject] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [detailsOverlayTodo, setDetailsOverlayTodo] = useState<TodoModel | null>(null);
  const [completedCollapsed, setCompletedCollapsed] = useState(settings.gantt.collapseCompleted ?? false);
  const [ganttOptionsLoaded, setGanttOptionsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(-1);
  const [showClickHint, setShowClickHint] = useState(true); // Shows "Click to edit" hint
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to handle mouse enter on tasks with position tracking for portal tooltip
  const handleTaskMouseEnter = useCallback((e: React.MouseEvent, taskId: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPosition({ x: rect.left + 16, y: rect.bottom + 8 });
    setHoveredTaskId(taskId);
  }, []);

  const handleTaskMouseLeave = useCallback(() => {
    setHoveredTaskId(null);
    setTooltipPosition(null);
  }, []);

  // Pomodoro state
  const [pomodoroNotifiedBreaks, setPomodoroNotifiedBreaks] = useState<Set<string>>(new Set());
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  // Update current time every minute for the now line
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  // Load persisted view options from storage
  useEffect(() => {
    waitForStorageInit()
      .then(() => {
        return loadFromStorage<{
          showTasksWithoutDates?: boolean;
          schedulingMode?: "asap" | "dueDate";
          groupByProject?: boolean;
          completedCollapsed?: boolean;
        }>(STORAGE_KEYS.GANTT_VIEW_OPTIONS, {});
      })
      .then((saved) => {
        if (saved.showTasksWithoutDates !== undefined) setShowTasksWithoutDates(saved.showTasksWithoutDates);
        if (saved.schedulingMode !== undefined) setSchedulingMode(saved.schedulingMode);
        if (saved.groupByProject !== undefined) setGroupByProject(saved.groupByProject);
        if (saved.completedCollapsed !== undefined) setCompletedCollapsed(saved.completedCollapsed);
        setGanttOptionsLoaded(true);
      });
  }, []);

  // Persist Gantt view options to storage (only after initial load)
  useEffect(() => {
    if (!ganttOptionsLoaded) return;
    const viewOptions = {
      showTasksWithoutDates,
      schedulingMode,
      groupByProject,
      completedCollapsed,
    };
    saveToStorage(STORAGE_KEYS.GANTT_VIEW_OPTIONS, viewOptions);
  }, [ganttOptionsLoaded, showTasksWithoutDates, schedulingMode, groupByProject, completedCollapsed]);

  // Update zoom level and persist to settings
  const handleZoomChange = useCallback(
    (level: GanttZoomLevel) => {
      if (onUpdateGanttSettings) {
        onUpdateGanttSettings({ ...settings.gantt, zoomLevel: level });
      }
    },
    [onUpdateGanttSettings, settings.gantt],
  );

  // Parse duration string to minutes
  const parseDuration = (duration: string | undefined): number => {
    if (!duration) return settings.gantt.defaultTaskDuration;

    const match = duration.match(/(\d+)([mhd])?/i);
    if (!match) return settings.gantt.defaultTaskDuration;

    const value = parseInt(match[1]);
    const unit = match[2]?.toLowerCase() || "m";

    switch (unit) {
      case "h":
        return value * 60;
      case "d":
        return value * 8 * 60;
      case "m":
      default:
        return value;
    }
  };

  // Calculate break duration based on Pomodoro settings or context switching time
  const getBreakDuration = (taskIndex: number): number => {
    const { pomodoroEnabled, pomodoroShortBreak, pomodoroLongBreak, pomodoroLongBreakInterval, contextSwitchingTime } =
      settings.gantt;

    if (!pomodoroEnabled) {
      return contextSwitchingTime;
    }

    // Pomodoro is enabled - check if this is a long break position
    // Long break after every N tasks (taskIndex is 0-indexed, so check if (taskIndex + 1) % N === 0)
    const taskNumber = taskIndex + 1;
    const tasksForLongBreak = pomodoroLongBreakInterval ?? 4;

    if (taskNumber > 0 && taskNumber % tasksForLongBreak === 0) {
      return pomodoroLongBreak ?? 15;
    }

    return pomodoroShortBreak ?? 5;
  };

  // Get break type label for display
  const getBreakType = (taskIndex: number): "context" | "short" | "long" => {
    const { pomodoroEnabled, pomodoroLongBreakInterval } = settings.gantt;

    if (!pomodoroEnabled) {
      return "context";
    }

    const taskNumber = taskIndex + 1;
    const tasksForLongBreak = pomodoroLongBreakInterval ?? 4;

    if (taskNumber > 0 && taskNumber % tasksForLongBreak === 0) {
      return "long";
    }

    return "short";
  };

  // Get schedule for a specific date
  const getScheduleForDate = (date: Date) => {
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
  };

  // Parse time string to Date
  const parseTime = (timeStr: string, baseDate: Date): Date => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Get all todos (active, completed, archived - not deleted), sorted by mode
  const allActiveTodos = useMemo(() => {
    let filtered = todos.filter((todo) => {
      return todo.state !== "deleted";
    });

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
  }, [todos, availablePriorities, schedulingMode]);

  // Determine which day each task should be scheduled on (ASAP scheduling with different sort orders)
  const taskSchedulingMap = useMemo(() => {
    const map = new Map<string, string>(); // todoId -> dateKey
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First, schedule all completed/archived tasks at their exact completion time
    const activeTodosOnly = allActiveTodos.filter((todo) => {
      if (todo.isCompleted && todo.completedAt) {
        const completionDate = new Date(todo.completedAt);

        // Assign to the day based on LOCAL date (not UTC date)
        const localYear = completionDate.getFullYear();
        const localMonth = String(completionDate.getMonth() + 1).padStart(2, "0");
        const localDay = String(completionDate.getDate()).padStart(2, "0");
        const completedDateKey = `${localYear}-${localMonth}-${localDay}`;

        map.set(todo.id, completedDateKey);
        return false; // Remove from active scheduling
      }

      if (todo.isArchived) {
        // Archived tasks use completedAt if available, otherwise skip scheduling
        if (todo.completedAt) {
          const completionDate = new Date(todo.completedAt);

          // Assign to the day based on LOCAL date (not UTC date)
          const localYear = completionDate.getFullYear();
          const localMonth = String(completionDate.getMonth() + 1).padStart(2, "0");
          const localDay = String(completionDate.getDate()).padStart(2, "0");
          const archivedDateKey = `${localYear}-${localMonth}-${localDay}`;

          map.set(todo.id, archivedDateKey);
        }
        return false; // Remove from active scheduling
      }

      return true; // Keep active tasks for ASAP scheduling
    });

    let currentDay = new Date(today);
    let remainingTodos = [...activeTodosOnly];

    // Schedule active tasks across days starting from today (sorted by priority or due date)
    while (remainingTodos.length > 0) {
      const daySchedule = getScheduleForDate(currentDay);
      const dayStart = parseTime(daySchedule.startTime, currentDay);
      const dayEnd = parseTime(daySchedule.endTime, currentDay);
      const dayBreaks = daySchedule.breaks.map((b) => ({
        startTime: parseTime(b.startTime, currentDay),
        endTime: parseTime(b.endTime, currentDay),
      }));
      const isCurrentDay = currentDay.toDateString() === today.toDateString();

      // Start from current time if today, otherwise start of work day
      let currentTime = new Date(dayStart);
      if (isCurrentDay && now > dayStart && now < dayEnd) {
        currentTime = new Date(now);
      }

      const scheduledToday: string[] = [];
      let dailyTaskIndex = 0; // Track task index for Pomodoro breaks

      for (const todo of remainingTodos) {
        // For active tasks, schedule ASAP
        // Ensure we're not in the past (for today)
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

        if (currentTime >= dayEnd) break; // No more time today

        const durationMinutes = parseDuration(todo.metadata.duration) * settings.gantt.durationMultiplier;
        const taskEnd = new Date(currentTime.getTime() + durationMinutes * 60000);

        if (taskEnd <= dayEnd) {
          // Task fits on this day - schedule it
          const dateKey = currentDay.toISOString().split("T")[0];
          map.set(todo.id, dateKey);
          scheduledToday.push(todo.id);
          // Use Pomodoro breaks if enabled, otherwise context switching time
          const breakDuration = getBreakDuration(dailyTaskIndex);
          currentTime = new Date(taskEnd.getTime() + breakDuration * 60000);
          dailyTaskIndex++;
        } else {
          // Task doesn't fit - stop scheduling for this day, will try next day
          break;
        }
      }

      // Remove scheduled tasks from remaining
      remainingTodos = remainingTodos.filter((t) => !scheduledToday.includes(t.id));

      // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);

      // Safety: don't schedule more than 30 days out
      if (currentDay.getTime() - today.getTime() > 30 * 24 * 60 * 60 * 1000) break;
    }

    return map;
  }, [allActiveTodos, workHours, settings.gantt]); // Get todos for selected date based on scheduling map
  const todosForDate = useMemo(() => {
    const dateKey = selectedDate.toISOString().split("T")[0];
    return allActiveTodos.filter((todo) => taskSchedulingMap.get(todo.id) === dateKey);
  }, [allActiveTodos, taskSchedulingMap, selectedDate]);

  // Count todos without due dates
  const todosWithoutDates = useMemo(() => {
    return todos.filter((todo) => !todo.metadata.dueDate && todo.state !== "deleted").length;
  }, [todos]);

  // Get schedule and time bounds, dynamically expanded for completed tasks outside work hours
  const schedule = getScheduleForDate(selectedDate);
  const { expandedStartTime, expandedEndTime } = useMemo(() => {
    let minTime = parseTime(schedule.startTime, selectedDate);
    let maxTime = parseTime(schedule.endTime, selectedDate);

    // Check if any completed/archived tasks fall outside work hours
    todosForDate.forEach((todo) => {
      if ((todo.isCompleted || todo.isArchived) && todo.completedAt) {
        const completionDate = new Date(todo.completedAt);
        const durationMinutes = parseDuration(todo.metadata.duration);
        const taskStartTime = new Date(completionDate.getTime() - durationMinutes * 60 * 1000);

        if (taskStartTime < minTime) {
          // Round down to the nearest hour
          const rounded = new Date(taskStartTime);
          rounded.setMinutes(0, 0, 0);
          minTime = rounded;
        }
        if (completionDate > maxTime) {
          // Round up to the next hour
          const rounded = new Date(completionDate);
          rounded.setMinutes(0, 0, 0);
          rounded.setHours(rounded.getHours() + 1);
          maxTime = rounded;
        }
      }
    });

    return { expandedStartTime: minTime, expandedEndTime: maxTime };
  }, [schedule, selectedDate, todosForDate]);

  const dayStartTime = expandedStartTime;
  const dayEndTime = expandedEndTime;
  const totalDayMinutes = (dayEndTime.getTime() - dayStartTime.getTime()) / 60000;

  // Get break blocks
  const breakBlocks: BreakBlock[] = useMemo(() => {
    return schedule.breaks.map((b) => ({
      name: b.name,
      startTime: parseTime(b.startTime, selectedDate),
      endTime: parseTime(b.endTime, selectedDate),
      color: getBlockColor(b),
      blockType: b.blockType,
      icon: getBlockIcon(b.blockType),
    }));
  }, [schedule, selectedDate]);

  // Schedule tasks
  const scheduledTasks: ScheduledTask[] = useMemo(() => {
    const tasks: ScheduledTask[] = [];
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    // Start from current time if today and we're past the start time, otherwise start of day
    let currentTime = new Date(dayStartTime);
    if (isToday && now > dayStartTime && now < dayEndTime) {
      currentTime = new Date(now);
    }

    let activeTaskIndex = 0; // Track active task index for Pomodoro breaks

    for (const todo of todosForDate) {
      // For completed/archived tasks, schedule based on their actual completion time
      if ((todo.isCompleted || todo.isArchived) && todo.completedAt) {
        const completionDate = new Date(todo.completedAt);
        const durationMinutes = parseDuration(todo.metadata.duration);

        // Calculate when task would have started (completion time - duration)
        const taskEndTime = completionDate;
        const taskStartTime = new Date(completionDate.getTime() - durationMinutes * 60 * 1000);

        // Calculate target date from the actual due date
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

        // Calculate buffer/overdue based on completion time vs due date
        const timeDiff = targetDate.getTime() - taskEndTime.getTime();
        const hasBuffer = timeDiff > 0;
        const isOverdue = timeDiff < 0;
        const bufferMinutes = Math.abs(Math.floor(timeDiff / 60000));

        tasks.push({
          todo,
          startTime: taskStartTime,
          endTime: taskEndTime,
          durationMinutes,
          targetDate,
          hasBuffer,
          bufferMinutes,
          isOverdue,
        });

        continue;
      }

      // For active tasks, use ASAP scheduling
      // If today, ensure currentTime is not in the past
      if (isToday && currentTime < now) {
        currentTime = new Date(now);
      }

      // Check if we're in a break
      let inBreak = true;
      while (inBreak && currentTime < dayEndTime) {
        inBreak = false;
        for (const breakBlock of breakBlocks) {
          if (currentTime >= breakBlock.startTime && currentTime < breakBlock.endTime) {
            currentTime = new Date(breakBlock.endTime);
            // After skipping break, check again if we're still not in the past
            if (isToday && currentTime < now) {
              currentTime = new Date(now);
            }
            inBreak = true;
            break;
          }
        }
      }

      if (currentTime >= dayEndTime) break;

      const durationMinutes = parseDuration(todo.metadata.duration) * settings.gantt.durationMultiplier;
      const taskEnd = new Date(currentTime.getTime() + durationMinutes * 60000);

      // Don't schedule if it would go past end of day
      if (taskEnd > dayEndTime) break;

      // Calculate target date from the actual due date
      let targetDate: Date;
      if (todo.metadata.dueDate) {
        const dueDateStr = todo.metadata.dueDate;
        if (dueDateStr.includes("T") || dueDateStr.includes("Z")) {
          targetDate = new Date(dueDateStr);
        } else if (dueDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dueDateStr.split("-").map(Number);
          targetDate = new Date(year, month - 1, day);
          targetDate.setHours(23, 59, 59, 999); // End of day if no time specified
        } else {
          targetDate = new Date(dueDateStr);
        }
      } else {
        // No due date - use end of selected day or now if today
        const isToday = selectedDate.toDateString() === new Date().toDateString();
        targetDate = isToday && now > dayStartTime && now < dayEndTime ? now : dayEndTime;
      }

      // Calculate buffer/overdue
      const timeDiff = targetDate.getTime() - taskEnd.getTime();
      const hasBuffer = timeDiff > 0;
      const isOverdue = timeDiff < 0;
      const bufferMinutes = Math.abs(Math.floor(timeDiff / 60000));

      tasks.push({
        todo,
        startTime: new Date(currentTime),
        endTime: taskEnd,
        durationMinutes,
        targetDate,
        hasBuffer,
        bufferMinutes,
        isOverdue,
      });

      // Add break time (Pomodoro or context switching)
      const breakDuration = getBreakDuration(activeTaskIndex);
      currentTime = new Date(taskEnd.getTime() + breakDuration * 60000);
      activeTaskIndex++;
    }

    return tasks;
  }, [todosForDate, dayStartTime, dayEndTime, breakBlocks, workHours, selectedDate, settings.gantt]);

  const unscheduledTasks = todosForDate.slice(scheduledTasks.length);

  // Separate active and completed tasks for collapsible section
  const { activeTasks, completedTasks } = useMemo(() => {
    const active = scheduledTasks.filter((t) => !t.todo.isCompleted && !t.todo.isArchived);
    const completed = scheduledTasks.filter((t) => t.todo.isCompleted || t.todo.isArchived);
    return { activeTasks: active, completedTasks: completed };
  }, [scheduledTasks]);

  // Pomodoro break notification effect
  useEffect(() => {
    const {
      pomodoroEnabled,
      pomodoroNotifications,
      pomodoroSound,
      pomodoroShortBreak,
      pomodoroLongBreak,
      pomodoroLongBreakInterval,
    } = settings.gantt;

    // Only check if Pomodoro is enabled and today is selected
    if (!pomodoroEnabled || selectedDate.toDateString() !== new Date().toDateString()) {
      return;
    }

    // Check every 10 seconds for upcoming breaks
    const checkBreaks = () => {
      const now = new Date();

      activeTasks.forEach((task, index) => {
        // Check if task just ended (within the last minute)
        const taskEndTime = task.endTime.getTime();
        const timeSinceEnd = now.getTime() - taskEndTime;

        // If task ended 0-60 seconds ago and we haven't notified for this task
        if (timeSinceEnd >= 0 && timeSinceEnd < 60000) {
          const breakKey = `${task.todo.id}-${task.endTime.toISOString()}`;

          if (!pomodoroNotifiedBreaks.has(breakKey)) {
            // Determine break type
            const taskNumber = index + 1;
            const isLongBreak = taskNumber > 0 && taskNumber % (pomodoroLongBreakInterval ?? 4) === 0;
            const breakDuration = isLongBreak ? pomodoroLongBreak ?? 15 : pomodoroShortBreak ?? 5;
            const breakType = isLongBreak ? "long" : "short";

            // Only notify/sound if the next task exists (not the last task)
            const hasNextTask = index < activeTasks.length - 1;

            if (hasNextTask) {
              // Play sound if enabled
              if (pomodoroSound) {
                playNotificationSound(isLongBreak ? "long-break" : "short-break");
              }

              // Show notification if enabled and permission granted
              if (pomodoroNotifications && notificationPermission === "granted") {
                notifyPomodoroBreak(breakType, breakDuration, taskNumber, false); // false = don't play sound (already played)
              }

              // Mark as notified
              setPomodoroNotifiedBreaks((prev) => new Set(prev).add(breakKey));
            }
          }
        }
      });
    };

    // Run immediately and then every 10 seconds
    checkBreaks();
    const interval = setInterval(checkBreaks, 10000);

    return () => clearInterval(interval);
  }, [activeTasks, selectedDate, settings.gantt, pomodoroNotifiedBreaks, notificationPermission]);

  // Group tasks by project
  const tasksByProject = useMemo(() => {
    const groups: { [projectName: string]: ScheduledTask[] } = {};
    const noProject: ScheduledTask[] = [];

    activeTasks.forEach((task) => {
      const projects = task.todo.metadata.projects;
      if (projects && projects.length > 0) {
        const projectName = projects[0]; // Use first project
        if (!groups[projectName]) {
          groups[projectName] = [];
        }
        groups[projectName].push(task);
      } else {
        noProject.push(task);
      }
    });

    // Sort projects by task count (most tasks first)
    const sortedGroups = Object.entries(groups)
      .sort(([, a], [, b]) => b.length - a.length)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as { [projectName: string]: ScheduledTask[] });

    if (noProject.length > 0) {
      sortedGroups["No Project"] = noProject;
    }

    return sortedGroups;
  }, [activeTasks]);

  // Detect task conflicts (overlapping time slots)
  const taskConflicts = useMemo(() => {
    const conflicts = new Set<string>();

    for (let i = 0; i < activeTasks.length; i++) {
      for (let j = i + 1; j < activeTasks.length; j++) {
        const taskA = activeTasks[i];
        const taskB = activeTasks[j];

        // Check if tasks overlap
        if (taskA.startTime < taskB.endTime && taskB.startTime < taskA.endTime) {
          conflicts.add(taskA.todo.id);
          conflicts.add(taskB.todo.id);
        }
      }
    }

    return conflicts;
  }, [activeTasks]);

  // Calculate time tracking stats for the day
  const timeStats = useMemo(() => {
    const totalPlannedMinutes = activeTasks.reduce((sum, task) => sum + task.durationMinutes, 0);
    const completedMinutes = completedTasks.reduce((sum, task) => sum + task.durationMinutes, 0);
    const totalWorkMinutes = (dayEndTime.getTime() - dayStartTime.getTime()) / 60000;

    // Calculate break time
    const breakMinutes = breakBlocks.reduce((sum, block) => {
      return sum + (block.endTime.getTime() - block.startTime.getTime()) / 60000;
    }, 0);

    const availableMinutes = totalWorkMinutes - breakMinutes;
    const utilizationPercent =
      availableMinutes > 0 ? Math.round(((totalPlannedMinutes + completedMinutes) / availableMinutes) * 100) : 0;

    return {
      totalPlannedMinutes,
      completedMinutes,
      availableMinutes,
      utilizationPercent,
      conflictCount: taskConflicts.size,
    };
  }, [activeTasks, completedTasks, dayStartTime, dayEndTime, breakBlocks, taskConflicts]);

  // Toggle project group collapse
  const toggleProjectCollapse = useCallback((projectName: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectName)) {
        next.delete(projectName);
      } else {
        next.add(projectName);
      }
      return next;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if overlay is open or user is typing
      if (detailsOverlayTodo || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const visibleTasks = completedCollapsed ? activeTasks : scheduledTasks;

      switch (e.key) {
        case "ArrowDown":
        case "j":
          e.preventDefault();
          setSelectedTaskIndex((prev) => Math.min(prev + 1, visibleTasks.length - 1));
          break;
        case "ArrowUp":
        case "k":
          e.preventDefault();
          setSelectedTaskIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedTaskIndex >= 0 && selectedTaskIndex < visibleTasks.length) {
            setDetailsOverlayTodo(visibleTasks[selectedTaskIndex].todo);
          }
          break;
        case "Escape":
          e.preventDefault();
          setSelectedTaskIndex(-1);
          break;
        case "ArrowLeft":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            navigateDate(-1);
          }
          break;
        case "ArrowRight":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            navigateDate(1);
          }
          break;
        case "t":
        case "T":
          e.preventDefault();
          // Go to today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          setSelectedDate(today);
          break;
        case "c":
        case "C":
          e.preventDefault();
          // Toggle completed collapse
          setCompletedCollapsed((prev: boolean) => !prev);
          break;
        case " ": // Space to toggle completion
          e.preventDefault();
          if (selectedTaskIndex >= 0 && selectedTaskIndex < visibleTasks.length) {
            onToggle(visibleTasks[selectedTaskIndex].todo.id);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailsOverlayTodo, selectedTaskIndex, scheduledTasks, activeTasks, completedCollapsed, onToggle]);

  // Reset selection when date changes
  useEffect(() => {
    setSelectedTaskIndex(-1);
  }, [selectedDate]);

  const navigateDate = (delta: number) => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + delta);
      return newDate;
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const formatDuration = (minutes: number): string => {
    const roundedMinutes = Math.round(minutes);
    const hours = Math.floor(roundedMinutes / 60);
    const mins = roundedMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const getTimePosition = (time: Date): number => {
    const minutes = (time.getTime() - dayStartTime.getTime()) / 60000;
    return (minutes / totalDayMinutes) * 100;
  };

  const getPriorityColor = useCallback((priority?: string) => {
    if (!priority) return "bg-zinc-400";
    const p = priority.toLowerCase();
    if (["0", "urgent", "asap", "critical"].includes(p)) return "bg-red-500";
    if (["1", "high"].includes(p)) return "bg-orange-500";
    if (["2", "medium", "med", "normal"].includes(p)) return "bg-yellow-500";
    if (["3", "low"].includes(p)) return "bg-green-500";
    return "bg-blue-500";
  }, []);

  // Memoized project color lookup
  const projectColorMap = useMemo(() => {
    const map = new Map<string, string>();
    availableProjects.forEach((p) => {
      if (p.color) {
        map.set(p.name, p.color);
        p.alternatives.forEach((alt) => map.set(alt, p.color!));
      }
    });
    return map;
  }, [availableProjects]);

  const getProjectColor = useCallback(
    (todo: TodoModel): string => {
      // Use gray for completed, light yellow for archived
      if (todo.isCompleted) return "#9ca3af"; // gray-400
      if (todo.isArchived) return "#fef08a"; // yellow-200

      // If todo has a project, look up the project entity and use its custom color
      if (todo.metadata.projects && todo.metadata.projects.length > 0) {
        const projectName = todo.metadata.projects[0];
        const color = projectColorMap.get(projectName);
        if (color) return color;
      }
      // Fall back to project marker color
      return markerColors.project;
    },
    [projectColorMap, markerColors.project],
  );

  // Calculate zoom scale factor - determines how wide the timeline is
  const zoomScale = useMemo(() => {
    const zoomLevel = settings.gantt.zoomLevel || "1hour";
    switch (zoomLevel) {
      case "15min":
        return 4; // 4x wider than default
      case "30min":
        return 2; // 2x wider than default
      case "2hour":
        return 0.5; // Half as wide
      case "1hour":
      default:
        return 1; // Default width
    }
  }, [settings.gantt.zoomLevel]);

  // Generate hour markers based on zoom level
  const hourMarkers = useMemo(() => {
    const markers = [];
    const zoomLevel = settings.gantt.zoomLevel || "1hour";

    // Determine interval based on zoom level
    let intervalMinutes: number;
    switch (zoomLevel) {
      case "15min":
        intervalMinutes = 15;
        break;
      case "30min":
        intervalMinutes = 30;
        break;
      case "2hour":
        intervalMinutes = 120;
        break;
      case "1hour":
      default:
        intervalMinutes = 60;
        break;
    }

    // Start from the first marker point after day start
    const startMarker = new Date(dayStartTime);
    const startMinutes = startMarker.getMinutes();
    const nextInterval = Math.ceil(startMinutes / intervalMinutes) * intervalMinutes;
    startMarker.setMinutes(nextInterval, 0, 0);

    let currentMarker = new Date(startMarker);

    // Generate markers at the specified interval until we exceed the end time
    while (currentMarker <= dayEndTime) {
      if (currentMarker >= dayStartTime) {
        markers.push({
          time: new Date(currentMarker),
          position: getTimePosition(currentMarker),
          isHour: currentMarker.getMinutes() === 0,
        });
      }
      currentMarker.setMinutes(currentMarker.getMinutes() + intervalMinutes);
    }

    return markers;
  }, [dayStartTime, dayEndTime, settings.gantt.zoomLevel]);

  // Get week's dates based on selected date (Monday to Sunday)
  const currentWeekDates = useMemo(() => {
    const baseDate = new Date(selectedDate);
    baseDate.setHours(0, 0, 0, 0);
    const dayOfWeek = baseDate.getDay();
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [selectedDate]);

  // Get tasks for the entire week using the scheduling map
  const weekTasks = useMemo(() => {
    return currentWeekDates.map((date) => {
      const dateStr = date.toISOString().split("T")[0];
      const tasksForDay = allActiveTodos.filter((todo) => taskSchedulingMap.get(todo.id) === dateStr);
      return { date, tasks: tasksForDay };
    });
  }, [currentWeekDates, allActiveTodos, taskSchedulingMap]);

  // Get scheduled tasks for each day of the week for mini Gantt
  const weekScheduledTasks = useMemo(() => {
    return currentWeekDates.map((date) => {
      const dateStr = date.toISOString().split("T")[0];
      const daySchedule = getScheduleForDate(date);
      const dayStart = parseTime(daySchedule.startTime, date);
      const dayEnd = parseTime(daySchedule.endTime, date);
      const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60000;
      const dayBreaks = daySchedule.breaks.map((b) => ({
        startTime: parseTime(b.startTime, date),
        endTime: parseTime(b.endTime, date),
      }));

      // Get tasks scheduled for this day from the map
      const tasksForDay = allActiveTodos.filter((todo) => taskSchedulingMap.get(todo.id) === dateStr);

      const now = new Date();
      const isCurrentDay = date.toDateString() === now.toDateString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Schedule tasks for this day
      const scheduled: Array<{
        todo: TodoModel;
        startPercent: number;
        widthPercent: number;
        color: string;
      }> = [];

      let currentTime = new Date(dayStart);
      if (isCurrentDay && now > dayStart && now < dayEnd) {
        currentTime = new Date(now);
      }

      let weekTaskIndex = 0; // Track task index for Pomodoro breaks

      for (const todo of tasksForDay) {
        // For completed/archived tasks, schedule based on their actual completion time
        if ((todo.isCompleted || todo.isArchived) && todo.completedAt) {
          const completionDate = new Date(todo.completedAt);
          const durationMinutes = parseDuration(todo.metadata.duration);

          // Calculate when task would have started (completion time - duration)
          const taskStartTime = new Date(completionDate.getTime() - durationMinutes * 60 * 1000);

          // Use work hours for positioning (same as active tasks)
          const startMinutes = (taskStartTime.getTime() - dayStart.getTime()) / 60000;
          const startPercent = (startMinutes / totalMinutes) * 100;
          const widthPercent = (durationMinutes / totalMinutes) * 100;

          scheduled.push({
            todo,
            startPercent,
            widthPercent,
            color: getProjectColor(todo),
          });

          continue;
        }

        // For active tasks, use ASAP scheduling
        // Ensure not in the past
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

        const durationMinutes = parseDuration(todo.metadata.duration) * settings.gantt.durationMultiplier;
        const taskEnd = new Date(currentTime.getTime() + durationMinutes * 60000);

        if (taskEnd > dayEnd) break;

        const startMinutes = (currentTime.getTime() - dayStart.getTime()) / 60000;
        const startPercent = (startMinutes / totalMinutes) * 100;
        const widthPercent = (durationMinutes / totalMinutes) * 100;

        scheduled.push({
          todo,
          startPercent,
          widthPercent,
          color: getProjectColor(todo),
        });

        // Add break time (Pomodoro or context switching)
        const breakDuration = getBreakDuration(weekTaskIndex);
        currentTime = new Date(taskEnd.getTime() + breakDuration * 60000);
        weekTaskIndex++;
      }

      return { date, scheduled, dayStart, dayEnd, totalMinutes };
    });
  }, [currentWeekDates, allActiveTodos, taskSchedulingMap, workHours, settings.gantt]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction * 7);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-4" role="region" aria-label="Gantt Chart Schedule">
      {/* Toggle for todos without dates */}
      {todosWithoutDates > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {todosWithoutDates} {todosWithoutDates === 1 ? "task" : "tasks"} without due dates
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                {showTasksWithoutDates ? "Included in today's schedule" : "Not shown in schedule"}
              </p>
            </div>
            <button
              onClick={() => setShowTasksWithoutDates(!showTasksWithoutDates)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
              style={{
                backgroundColor: showTasksWithoutDates ? "rgb(37, 99, 235)" : "rgb(209, 213, 219)",
              }}
              role="switch"
              aria-checked={showTasksWithoutDates}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                style={{
                  transform: showTasksWithoutDates ? "translateX(1.5rem)" : "translateX(0.25rem)",
                }}
              />
            </button>
            <span className="text-xs font-medium text-blue-900 dark:text-blue-100 whitespace-nowrap">
              Show for today
            </span>
          </div>
        </div>
      )}

      {/* Scheduling Mode Toggle */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 sm:p-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">Mode:</span>
            <div className="flex gap-1 sm:gap-2" role="group" aria-label="Scheduling mode">
              <button
                onClick={() => setSchedulingMode("asap")}
                aria-pressed={schedulingMode === "asap"}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${
                  schedulingMode === "asap"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                Priority
              </button>
              <button
                onClick={() => setSchedulingMode("dueDate")}
                aria-pressed={schedulingMode === "dueDate"}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${
                  schedulingMode === "dueDate"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                Due Date
              </button>
            </div>

            {/* Group by Project Toggle */}
            <div className="flex items-center gap-2 sm:ml-2 sm:pl-2 sm:border-l border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setGroupByProject(!groupByProject)}
                aria-pressed={groupByProject}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  groupByProject
                    ? "bg-purple-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
                title="Group tasks by project"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span className="hidden sm:inline">Group</span>
              </button>
            </div>

            {/* Pomodoro Status */}
            {settings.gantt.pomodoroEnabled && (
              <div className="flex items-center gap-1 sm:gap-2 sm:ml-2 sm:pl-2 sm:border-l border-zinc-200 dark:border-zinc-700">
                <span
                  className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1"
                  title="Pomodoro mode active"
                >
                  🍅
                </span>
                {settings.gantt.pomodoroNotifications && notificationPermission !== "granted" && (
                  <button
                    onClick={async () => {
                      const permission = await requestNotificationPermission();
                      setNotificationPermission(permission);
                    }}
                    className="p-1 sm:px-2 sm:py-1 text-xs rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors flex items-center gap-1"
                    title="Enable browser notifications for break reminders"
                  >
                    🔔<span className="hidden sm:inline">Alerts</span>
                  </button>
                )}
                {settings.gantt.pomodoroNotifications && notificationPermission === "granted" && (
                  <span className="text-xs text-green-600 dark:text-green-400" title="Notifications enabled">
                    🔔
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Time Stats */}
            <div
              className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs"
              role="status"
              aria-label="Daily statistics"
            >
              <span
                className="text-zinc-500 dark:text-zinc-400"
                title="Total duration of active tasks scheduled for today"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {Math.round((timeStats.totalPlannedMinutes / 60) * 10) / 10}h
                </span>{" "}
                <span className="hidden sm:inline">planned</span>
              </span>
              <span className="text-zinc-500 dark:text-zinc-400" title="Total duration of completed tasks today">
                <span className="font-medium text-green-600 dark:text-green-400">
                  {Math.round((timeStats.completedMinutes / 60) * 10) / 10}h
                </span>{" "}
                <span className="hidden sm:inline">done</span>
              </span>
              <span
                className={`font-medium ${
                  timeStats.utilizationPercent > 100
                    ? "text-red-600 dark:text-red-400"
                    : timeStats.utilizationPercent > 80
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
                title={`Capacity utilization: (${
                  Math.round((timeStats.totalPlannedMinutes / 60) * 10) / 10
                }h planned + ${Math.round((timeStats.completedMinutes / 60) * 10) / 10}h done) / ${
                  Math.round((timeStats.availableMinutes / 60) * 10) / 10
                }h available = ${timeStats.utilizationPercent}%`}
              >
                {timeStats.utilizationPercent}%
              </span>
              {timeStats.conflictCount > 0 && (
                <span
                  className="text-red-600 dark:text-red-400 flex items-center gap-1"
                  title={`${timeStats.conflictCount} overlapping tasks`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {timeStats.conflictCount}
                </span>
              )}
            </div>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
              title="Print schedule (Ctrl+P)"
              aria-label="Print schedule"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Week Overview */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 sm:p-4 print:hidden">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="hidden sm:inline">Week of </span>
            {currentWeekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Previous week"
            >
              <svg
                className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedDate(today);
              }}
              className="px-2 py-1 text-xs font-medium rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
              title="Go to today"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Next week"
            >
              <svg
                className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekTasks.map(({ date, tasks }, index) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const dayName = date.toLocaleDateString("en-US", { weekday: "narrow" });
            const dayNameLong = date.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = date.getDate();

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-1 sm:p-2 rounded-lg border transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : isToday
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10"
                    : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="text-[10px] sm:text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  <span className="sm:hidden">{dayName}</span>
                  <span className="hidden sm:inline">{dayNameLong}</span>
                </div>
                <div
                  className={`text-sm sm:text-lg font-semibold ${
                    isSelected ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {dayNum}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mini Gantt Timeline with Utilization */}
        <div className="mt-3 grid grid-cols-7 gap-2" role="img" aria-label="Weekly task distribution overview">
          {weekScheduledTasks.map(({ date, scheduled, dayStart, dayEnd, totalMinutes }, index) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();

            // Calculate daily utilization
            const totalTaskMinutes = scheduled.reduce((sum, t) => {
              const dur = (t.widthPercent * totalMinutes) / 100;
              return sum + dur;
            }, 0);
            const utilizationPercent = totalMinutes > 0 ? Math.round((totalTaskMinutes / totalMinutes) * 100) : 0;

            return (
              <div key={index} className="space-y-1">
                <div
                  className={`relative h-3 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden ${
                    isSelected ? "ring-1 ring-blue-500" : ""
                  }`}
                  aria-label={`${date.toLocaleDateString("en-US", { weekday: "short" })}: ${
                    scheduled.length
                  } tasks, ${utilizationPercent}% utilized`}
                >
                  {scheduled.map((task, i) => {
                    const isCompleted = task.todo.isCompleted || task.todo.isArchived;

                    // Handle tasks outside work hours
                    let clampedStart = task.startPercent;
                    let clampedWidth = task.widthPercent;

                    // If task starts before work hours, clamp to start
                    if (task.startPercent < 0) {
                      clampedStart = 0;
                      clampedWidth = Math.min(task.widthPercent + task.startPercent, 100);
                    }
                    // If task starts after work hours, show at the end
                    else if (task.startPercent >= 100) {
                      clampedStart = 95; // Show at 95% to indicate it's beyond
                      clampedWidth = 5; // Small indicator width
                    }
                    // If task extends beyond work hours
                    else if (task.startPercent + task.widthPercent > 100) {
                      clampedStart = task.startPercent;
                      clampedWidth = 100 - task.startPercent;
                    }

                    // Only render if there's valid width
                    if (clampedWidth <= 0) return null;

                    return (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0"
                        style={{
                          left: `${clampedStart}%`,
                          width: `${clampedWidth}%`,
                          backgroundColor: task.color,
                          opacity: isCompleted ? 0.5 : 1,
                        }}
                        title={`${task.todo.plainText}${
                          task.startPercent >= 100 ? " (after hours)" : task.startPercent < 0 ? " (before hours)" : ""
                        }`}
                      />
                    );
                  })}
                  {isToday && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{
                        left: `${
                          ((new Date().getTime() - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime())) * 100
                        }%`,
                      }}
                      title="Current time"
                    />
                  )}
                </div>
                {/* Utilization indicator */}
                <div
                  className={`h-1 rounded-full ${
                    utilizationPercent > 100
                      ? "bg-red-400 dark:bg-red-500"
                      : utilizationPercent > 80
                      ? "bg-amber-400 dark:bg-amber-500"
                      : "bg-green-400 dark:bg-green-500"
                  }`}
                  style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                  title={`${utilizationPercent}% capacity used`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div
        ref={containerRef}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:p-6 print:border-0 print:shadow-none"
      >
        {/* Date Navigation */}
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => navigateDate(-1)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors print:hidden flex-shrink-0"
            title="Previous day (←)"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 dark:text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center min-w-0 flex-1">
            <h3 className="text-base sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {formatDate(selectedDate)}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 sm:mt-1">
              <span className="hidden sm:inline">
                {schedule.startTime} - {schedule.endTime} •{" "}
              </span>
              {activeTasks.length} <span className="hidden sm:inline">active</span>
              <span className="sm:hidden">a</span> • {completedTasks.length}{" "}
              <span className="hidden sm:inline">completed</span>
              <span className="sm:hidden">c</span> • {unscheduledTasks.length}{" "}
              <span className="hidden sm:inline">overflow</span>
              <span className="sm:hidden">o</span>
            </p>
            {/* Keyboard shortcuts hint */}
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 print:hidden hidden sm:block">
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded">↑↓</kbd> navigate
                <kbd className="px-1.5 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded ml-2">Enter</kbd> open
                <kbd className="px-1.5 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded ml-2">Space</kbd> toggle
                <kbd className="px-1.5 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded ml-2">T</kbd> today
              </span>
            </p>
          </div>

          <button
            onClick={() => navigateDate(1)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors print:hidden flex-shrink-0"
            title="Next day (→)"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 dark:text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {todosForDate.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">No tasks scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timeline View */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Timeline
                  </h4>
                  {/* Click hint for first-time users */}
                  {showClickHint && activeTasks.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                        />
                      </svg>
                      Click tasks to edit
                    </span>
                  )}
                </div>
                {/* Zoom controls */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-2">Zoom:</span>
                  {(["15min", "30min", "1hour", "2hour"] as GanttZoomLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => handleZoomChange(level)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        (settings.gantt.zoomLevel || "1hour") === level
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                      title={
                        level === "15min"
                          ? "15 minutes"
                          : level === "30min"
                          ? "30 minutes"
                          : level === "1hour"
                          ? "1 hour"
                          : "2 hours"
                      }
                    >
                      {level === "15min" ? "15m" : level === "30min" ? "30m" : level === "1hour" ? "1h" : "2h"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable timeline container with zoom */}
              <div className="overflow-x-auto" style={{ maxWidth: "100%" }}>
                <div style={{ minWidth: `${100 * zoomScale}%`, width: `${100 * zoomScale}%` }}>
                  {/* Time markers */}
                  <div
                    ref={timelineRef}
                    className="relative h-6 bg-zinc-50 dark:bg-zinc-800 rounded mx-4"
                    style={{ overflow: "visible" }}
                  >
                    {hourMarkers.map((marker, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 flex flex-col items-center -translate-x-1/2"
                        style={{ left: `${marker.position}%` }}
                      >
                        <div
                          className={`w-px ${
                            marker.isHour ? "h-3 bg-zinc-400 dark:bg-zinc-500" : "h-2 bg-zinc-300 dark:bg-zinc-600"
                          }`}
                        />
                        <span
                          className={`mt-1 whitespace-nowrap ${
                            marker.isHour
                              ? "text-xs text-zinc-600 dark:text-zinc-300 font-medium"
                              : "text-[10px] text-zinc-400 dark:text-zinc-500"
                          }`}
                        >
                          {formatTime(marker.time)}
                        </span>
                      </div>
                    ))}

                    {/* Prominent Now Line in time markers */}
                    {settings.gantt.showNowLine !== false &&
                      selectedDate.toDateString() === new Date().toDateString() &&
                      (() => {
                        const nowPos = getTimePosition(currentTime);
                        if (nowPos >= 0 && nowPos <= 100) {
                          return (
                            <div
                              className="absolute top-0 bottom-0 z-20 pointer-events-none"
                              style={{ left: `${nowPos}%` }}
                            >
                              <div className="w-0.5 h-full bg-red-500" />
                              <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                            </div>
                          );
                        }
                        return null;
                      })()}
                  </div>

                  {/* Tasks timeline */}
                  <div className="relative space-y-0 mx-4 mt-4" style={{ overflow: "visible" }}>
                    {/* Now line across all tasks */}
                    {settings.gantt.showNowLine !== false &&
                      selectedDate.toDateString() === new Date().toDateString() &&
                      (() => {
                        const nowPos = getTimePosition(currentTime);
                        if (nowPos >= 0 && nowPos <= 100) {
                          return (
                            <div
                              className="absolute top-0 bottom-0 z-30 pointer-events-none"
                              style={{ left: `${nowPos}%` }}
                            >
                              <div className="w-0.5 h-full bg-red-500 opacity-50" />
                            </div>
                          );
                        }
                        return null;
                      })()}

                    {/* Active tasks - Grouped or Flat */}
                    {groupByProject
                      ? // Grouped by project
                        Object.entries(tasksByProject).map(([projectName, projectTasks]) => {
                          const isCollapsed = collapsedProjects.has(projectName);
                          const projectColor =
                            projectName !== "No Project"
                              ? availableProjects.find(
                                  (p) => p.name === projectName || p.alternatives?.includes(projectName),
                                )?.color
                              : undefined;

                          return (
                            <div key={projectName} className="mb-2">
                              {/* Project Group Header */}
                              <button
                                onClick={() => toggleProjectCollapse(projectName)}
                                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors mb-1"
                                aria-expanded={!isCollapsed}
                              >
                                <svg
                                  className={`w-4 h-4 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="flex items-center gap-2" style={{ color: projectColor || undefined }}>
                                  {projectName !== "No Project" && (
                                    <span
                                      className="w-3 h-3 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: projectColor || "#9ca3af" }}
                                    />
                                  )}
                                  {projectName}
                                </span>
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                  ({projectTasks.length} task{projectTasks.length !== 1 ? "s" : ""})
                                </span>
                              </button>

                              {/* Project Tasks */}
                              {!isCollapsed &&
                                projectTasks.map((task) => {
                                  const globalIndex = activeTasks.indexOf(task);
                                  const isCompletedTask = task.todo.isCompleted || task.todo.isArchived;
                                  const startPos = getTimePosition(task.startTime);
                                  const endPos = getTimePosition(task.endTime);
                                  const width = endPos - startPos;
                                  const targetPos = getTimePosition(task.targetDate);
                                  const isSelected = selectedTaskIndex === globalIndex;
                                  const hasConflict = taskConflicts.has(task.todo.id);

                                  // Check if there's a break after this task
                                  const taskIndexInProject = projectTasks.indexOf(task);
                                  const nextTask =
                                    taskIndexInProject < projectTasks.length - 1
                                      ? projectTasks[taskIndexInProject + 1]
                                      : null;
                                  const breakDuration = getBreakDuration(globalIndex);
                                  const breakType = getBreakType(globalIndex);
                                  const hasBreak = nextTask && breakDuration > 0 && !isCompletedTask;
                                  const breakStartPos = endPos;
                                  const breakEndPos = nextTask ? getTimePosition(nextTask.startTime) : 0;
                                  const breakWidth = breakEndPos - breakStartPos;

                                  const taskColor = getProjectColor(task.todo);
                                  const textColor = getTextColor(taskColor);

                                  // Task row height based on settings
                                  const rowHeight =
                                    settings.gantt.taskRowHeight === "compact"
                                      ? "h-8"
                                      : settings.gantt.taskRowHeight === "comfortable"
                                      ? "h-12"
                                      : "h-10";
                                  const showBufferZones = settings.gantt.showBufferZones !== false;

                                  return (
                                    <div
                                      key={task.todo.id}
                                      role="listitem"
                                      aria-label={`Task: ${task.todo.plainText}, ${Math.round(
                                        task.durationMinutes,
                                      )} minutes${hasConflict ? ", has scheduling conflict" : ""}`}
                                      className={`relative ${
                                        isSelected ? "ring-2 ring-blue-500 ring-offset-1 rounded-lg" : ""
                                      } ${hasConflict ? "animate-pulse" : ""}`}
                                      style={{ marginBottom: hasBreak ? "0" : "2px" }}
                                    >
                                      {/* Conflict indicator */}
                                      {hasConflict && (
                                        <div
                                          className="absolute -left-6 top-1/2 -translate-y-1/2 z-20"
                                          title="Scheduling conflict - overlaps with another task"
                                        >
                                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                              fillRule="evenodd"
                                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </div>
                                      )}
                                      {/* Task row */}
                                      <div
                                        className={`relative ${rowHeight} bg-zinc-50 dark:bg-zinc-800 rounded-lg ${
                                          hasConflict ? "ring-2 ring-red-400 ring-opacity-50" : ""
                                        }`}
                                      >
                                        {/* Break blocks */}
                                        {breakBlocks.map((breakBlock, bi) => {
                                          const breakStart = getTimePosition(breakBlock.startTime);
                                          const breakEnd = getTimePosition(breakBlock.endTime);
                                          return (
                                            <div
                                              key={bi}
                                              className="absolute top-0 bottom-0 opacity-70"
                                              style={{
                                                left: `${breakStart}%`,
                                                width: `${breakEnd - breakStart}%`,
                                                backgroundColor: breakBlock.color,
                                              }}
                                              title={`${breakBlock.icon} ${breakBlock.name}`}
                                            />
                                          );
                                        })}

                                        {/* Task bar */}
                                        <div
                                          className={`absolute top-0.5 bottom-0.5 shadow-md flex items-center justify-between px-2 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:z-20 transition-all duration-150 z-10 ${
                                            isSelected ? "ring-2 ring-blue-500" : ""
                                          }`}
                                          style={{
                                            left: `${Math.max(0, startPos)}%`,
                                            width: `${Math.min(width, 100 - Math.max(0, startPos))}%`,
                                            backgroundColor: taskColor,
                                            color: textColor,
                                            borderRadius:
                                              startPos < 0
                                                ? "0 0.375rem 0.375rem 0"
                                                : endPos > 100
                                                ? "0.375rem 0 0 0.375rem"
                                                : "0.375rem",
                                            clipPath:
                                              endPos > 100
                                                ? "polygon(0 0, calc(100% - 8px) 0, 100% 10%, 100% 30%, calc(100% - 8px) 50%, 100% 70%, 100% 90%, calc(100% - 8px) 100%, 0 100%)"
                                                : "none",
                                          }}
                                          onMouseEnter={(e) => handleTaskMouseEnter(e, task.todo.id)}
                                          onMouseLeave={handleTaskMouseLeave}
                                          onClick={() => {
                                            setShowClickHint(false);
                                            setDetailsOverlayTodo(task.todo);
                                          }}
                                          title="Click to view details"
                                        >
                                          <span className="text-xs font-medium truncate">{task.todo.plainText}</span>
                                          <span className="text-xs opacity-80 whitespace-nowrap ml-2">
                                            {formatDuration(task.durationMinutes)}
                                          </span>
                                        </div>

                                        {/* Due date target indicator */}
                                        {showBufferZones && targetPos >= 0 && targetPos <= 100 && (
                                          <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-orange-500 dark:bg-orange-400 z-15 opacity-70"
                                            style={{ left: `${targetPos}%` }}
                                            title={`Target: ${task.targetDate.toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}`}
                                          />
                                        )}
                                      </div>

                                      {/* Break indicator (Pomodoro or context switch) */}
                                      {hasBreak && breakWidth > 0 && (
                                        <div
                                          className={`h-2 rounded-b opacity-60 ${
                                            breakType === "long"
                                              ? "bg-gradient-to-r from-green-300 to-green-200 dark:from-green-700 dark:to-green-800"
                                              : breakType === "short"
                                              ? "bg-gradient-to-r from-blue-200 to-blue-100 dark:from-blue-700 dark:to-blue-800"
                                              : "bg-gradient-to-r from-zinc-200 to-zinc-100 dark:from-zinc-700 dark:to-zinc-800"
                                          }`}
                                          style={{
                                            marginLeft: `${breakStartPos}%`,
                                            width: `${breakWidth}%`,
                                          }}
                                          title={
                                            breakType === "long"
                                              ? `🍅 ${breakDuration}min long break`
                                              : breakType === "short"
                                              ? `🍅 ${breakDuration}min short break`
                                              : `${breakDuration}min context switch`
                                          }
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          );
                        })
                      : // Flat list (original behavior)
                        activeTasks.map((task, index) => {
                          const isCompletedTask = task.todo.isCompleted || task.todo.isArchived;
                          const startPos = getTimePosition(task.startTime);
                          const endPos = getTimePosition(task.endTime);
                          const width = endPos - startPos;
                          const targetPos = getTimePosition(task.targetDate);
                          const isSelected = selectedTaskIndex === index;
                          const hasConflict = taskConflicts.has(task.todo.id);

                          // Check if there's a break after this task
                          const nextTask = index < activeTasks.length - 1 ? activeTasks[index + 1] : null;
                          const breakDuration = getBreakDuration(index);
                          const breakType = getBreakType(index);
                          const hasBreak = nextTask && breakDuration > 0 && !isCompletedTask;
                          const breakStartPos = endPos;
                          const breakEndPos = nextTask ? getTimePosition(nextTask.startTime) : 0;
                          const breakWidth = breakEndPos - breakStartPos;

                          const taskColor = getProjectColor(task.todo);
                          const textColor = getTextColor(taskColor);

                          // Task row height based on settings
                          const rowHeight =
                            settings.gantt.taskRowHeight === "compact"
                              ? "h-8"
                              : settings.gantt.taskRowHeight === "comfortable"
                              ? "h-12"
                              : "h-10";
                          const showBufferZones = settings.gantt.showBufferZones !== false;

                          return (
                            <div
                              key={task.todo.id}
                              role="listitem"
                              aria-label={`Task: ${task.todo.plainText}, ${Math.round(task.durationMinutes)} minutes${
                                hasConflict ? ", has scheduling conflict" : ""
                              }`}
                              className={`relative ${
                                isSelected ? "ring-2 ring-blue-500 ring-offset-1 rounded-lg" : ""
                              } ${hasConflict ? "animate-pulse" : ""}`}
                              style={{ marginBottom: hasBreak ? "0" : "2px" }}
                            >
                              {/* Conflict indicator */}
                              {hasConflict && (
                                <div
                                  className="absolute -left-6 top-1/2 -translate-y-1/2 z-20"
                                  title="Scheduling conflict - overlaps with another task"
                                >
                                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                              {/* Task row */}
                              <div
                                className={`relative ${rowHeight} bg-zinc-50 dark:bg-zinc-800 rounded-lg ${
                                  hasConflict ? "ring-2 ring-red-400 ring-opacity-50" : ""
                                }`}
                              >
                                {/* Break blocks */}
                                {breakBlocks.map((breakBlock, bi) => {
                                  const breakStart = getTimePosition(breakBlock.startTime);
                                  const breakEnd = getTimePosition(breakBlock.endTime);
                                  return (
                                    <div
                                      key={bi}
                                      className="absolute top-0 bottom-0 opacity-70"
                                      style={{
                                        left: `${breakStart}%`,
                                        width: `${breakEnd - breakStart}%`,
                                        backgroundColor: breakBlock.color,
                                      }}
                                      title={`${breakBlock.icon} ${breakBlock.name}`}
                                    />
                                  );
                                })}

                                {/* Task bar */}
                                <div
                                  className={`absolute top-0.5 bottom-0.5 shadow-md flex items-center justify-between px-2 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:z-20 transition-all duration-150 z-10 ${
                                    isSelected ? "ring-2 ring-blue-500" : ""
                                  }`}
                                  style={{
                                    left: `${Math.max(0, startPos)}%`,
                                    width: `${Math.min(width, 100 - Math.max(0, startPos))}%`,
                                    backgroundColor: taskColor,
                                    color: textColor,
                                    borderRadius:
                                      startPos < 0
                                        ? "0 0.375rem 0.375rem 0"
                                        : endPos > 100
                                        ? "0.375rem 0 0 0.375rem"
                                        : "0.375rem",
                                    clipPath:
                                      endPos > 100
                                        ? "polygon(0 0, calc(100% - 8px) 0, 100% 10%, 100% 30%, calc(100% - 8px) 50%, 100% 70%, 100% 90%, calc(100% - 8px) 100%, 0 100%)"
                                        : "none",
                                  }}
                                  onMouseEnter={(e) => handleTaskMouseEnter(e, task.todo.id)}
                                  onMouseLeave={handleTaskMouseLeave}
                                  onClick={() => {
                                    setShowClickHint(false);
                                    setDetailsOverlayTodo(task.todo);
                                  }}
                                  title="Click to view details"
                                >
                                  <span className="text-xs font-medium truncate">{task.todo.plainText}</span>
                                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                    {/* Comment/activity indicators */}
                                    {(task.todo.hasComments || task.todo.hasActivity) && (
                                      <div className="flex items-center gap-0.5 opacity-70">
                                        {task.todo.hasComments && (
                                          <span
                                            className="flex items-center text-[10px]"
                                            title={`${task.todo.commentCount} comment${
                                              task.todo.commentCount !== 1 ? "s" : ""
                                            }`}
                                          >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                              <path
                                                fillRule="evenodd"
                                                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                            {task.todo.commentCount > 1 && <span>{task.todo.commentCount}</span>}
                                          </span>
                                        )}
                                        {task.todo.hasActivity && (
                                          <span
                                            className="flex items-center text-[10px]"
                                            title={`${task.todo.activityCount} activity entries`}
                                          >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                              <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {/* Recurring indicator */}
                                    {task.todo.metadata.recurring && (
                                      <span
                                        className="text-[10px] opacity-70"
                                        title={`Recurring: ${task.todo.metadata.recurring}`}
                                      >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path
                                            fillRule="evenodd"
                                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </span>
                                    )}
                                    {/* Dependencies indicator */}
                                    {task.todo.metadata.dependencies && task.todo.metadata.dependencies.length > 0 && (
                                      <span
                                        className="text-[10px] opacity-70"
                                        title={`Has ${task.todo.metadata.dependencies.length} dependency(ies)`}
                                      >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path
                                            fillRule="evenodd"
                                            d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </span>
                                    )}
                                    <span className="text-xs opacity-80 whitespace-nowrap">
                                      {formatDuration(task.durationMinutes)}
                                    </span>
                                  </div>
                                </div>

                                {/* Buffer indicator (green dotted line to the right) */}
                                {showBufferZones && task.hasBuffer && (
                                  <>
                                    <div
                                      className="absolute top-1/2 h-0.5 border-t-2 border-dotted border-green-500"
                                      style={{
                                        left: `${endPos}%`,
                                        width: `${Math.min(targetPos - endPos, 100 - endPos)}%`,
                                      }}
                                    />
                                    <div
                                      className="absolute top-1/2 -translate-y-1/2 text-xs font-medium text-green-600 dark:text-green-400 bg-white/80 dark:bg-zinc-900/80 px-1 whitespace-nowrap"
                                      style={{
                                        // If not enough space on right (< 15%), position on left of task
                                        left:
                                          100 - endPos < 15
                                            ? `${startPos}%`
                                            : `${(endPos + Math.min(targetPos, 100)) / 2}%`,
                                        transform:
                                          100 - endPos < 15 ? "translate(-100%, -50%)" : "translate(-50%, -50%)",
                                      }}
                                    >
                                      +{formatDuration(task.bufferMinutes)} buffer
                                    </div>
                                  </>
                                )}

                                {/* Overdue indicator (red dotted line to the left) */}
                                {showBufferZones && task.isOverdue && (
                                  <>
                                    <div
                                      className="absolute top-1/2 h-0.5 border-t-2 border-dotted border-red-500"
                                      style={{
                                        left: `${Math.max(targetPos, 0)}%`,
                                        width: `${Math.min(endPos - targetPos, endPos)}%`,
                                      }}
                                    />
                                    <div
                                      className="absolute top-1/2 -translate-y-1/2 text-xs font-medium text-red-600 dark:text-red-400 bg-white/80 dark:bg-zinc-900/80 px-1 whitespace-nowrap"
                                      style={{
                                        // If not enough space on left (< 15%), position on right of task
                                        left:
                                          startPos < 15 ? `${endPos}%` : `${(Math.max(targetPos, 0) + startPos) / 2}%`,
                                        transform: startPos < 15 ? "translate(0%, -50%)" : "translate(-50%, -50%)",
                                      }}
                                    >
                                      -{formatDuration(task.bufferMinutes)} overdue
                                    </div>
                                  </>
                                )}

                                {/* Target marker */}
                                {targetPos >= 0 && targetPos <= 100 && (
                                  <div
                                    className={`absolute top-0 bottom-0 w-0.5 ${
                                      task.isOverdue ? "bg-red-500" : "bg-green-500"
                                    } z-10`}
                                    style={{ left: `${targetPos}%` }}
                                    title={task.isOverdue ? "Overdue point" : "Target time"}
                                  />
                                )}
                              </div>

                              {/* Break indicator (Pomodoro or context switch) - line with arrows */}
                              {hasBreak && breakWidth > 0 && (
                                <div
                                  className="absolute flex items-center justify-center z-5"
                                  style={{
                                    top: "100%",
                                    left: `${breakStartPos}%`,
                                    width: `${breakWidth}%`,
                                    height: "8px",
                                  }}
                                  title={
                                    breakType === "long"
                                      ? `🍅 ${breakDuration}min long break`
                                      : breakType === "short"
                                      ? `🍅 ${breakDuration}min short break`
                                      : `${breakDuration}min context switch`
                                  }
                                >
                                  <div className="flex items-center w-full">
                                    <svg
                                      className={`w-2 h-2 flex-shrink-0 ${
                                        breakType === "long"
                                          ? "text-green-500 dark:text-green-400"
                                          : breakType === "short"
                                          ? "text-blue-500 dark:text-blue-400"
                                          : "text-zinc-400 dark:text-zinc-500"
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 8 8"
                                    >
                                      <path d="M4 0 L0 4 L4 8 Z" />
                                    </svg>
                                    <div
                                      className={`flex-1 h-px ${
                                        breakType === "long"
                                          ? "bg-green-500 dark:bg-green-400"
                                          : breakType === "short"
                                          ? "bg-blue-500 dark:bg-blue-400"
                                          : "bg-zinc-400 dark:bg-zinc-500"
                                      }`}
                                    />
                                    <svg
                                      className={`w-2 h-2 flex-shrink-0 ${
                                        breakType === "long"
                                          ? "text-green-500 dark:text-green-400"
                                          : breakType === "short"
                                          ? "text-blue-500 dark:text-blue-400"
                                          : "text-zinc-400 dark:text-zinc-500"
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 8 8"
                                    >
                                      <path d="M4 0 L8 4 L4 8 Z" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                    {/* Completed Tasks - Collapsible Section */}
                    {completedTasks.length > 0 && (
                      <div className="mt-4">
                        <button
                          onClick={() => setCompletedCollapsed(!completedCollapsed)}
                          className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-2"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${completedCollapsed ? "" : "rotate-90"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>Completed ({completedTasks.length})</span>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">(Press C to toggle)</span>
                        </button>

                        {!completedCollapsed &&
                          completedTasks.map((task, index) => {
                            const globalIndex = activeTasks.length + index;
                            const startPos = getTimePosition(task.startTime);
                            const endPos = getTimePosition(task.endTime);
                            const width = endPos - startPos;
                            const isSelected = selectedTaskIndex === globalIndex;
                            const taskColor = getProjectColor(task.todo);
                            const textColor = getTextColor(taskColor);
                            const rowHeight =
                              settings.gantt.taskRowHeight === "compact"
                                ? "h-8"
                                : settings.gantt.taskRowHeight === "comfortable"
                                ? "h-12"
                                : "h-10";

                            return (
                              <div
                                key={task.todo.id}
                                className={`relative opacity-60 ${
                                  isSelected ? "ring-2 ring-blue-500 ring-offset-1 rounded-lg" : ""
                                }`}
                                style={{ marginBottom: "2px" }}
                              >
                                <div className={`relative ${rowHeight} bg-zinc-50 dark:bg-zinc-800 rounded-lg`}>
                                  {breakBlocks.map((breakBlock, bi) => {
                                    const breakStart = getTimePosition(breakBlock.startTime);
                                    const breakEnd = getTimePosition(breakBlock.endTime);
                                    return (
                                      <div
                                        key={bi}
                                        className="absolute top-0 bottom-0 opacity-70"
                                        style={{
                                          left: `${breakStart}%`,
                                          width: `${breakEnd - breakStart}%`,
                                          backgroundColor: breakBlock.color,
                                        }}
                                        title={`${breakBlock.icon} ${breakBlock.name}`}
                                      />
                                    );
                                  })}
                                  <div
                                    className={`absolute top-0.5 bottom-0.5 shadow-md flex items-center justify-between px-2 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:z-20 transition-all duration-150 z-10 ${
                                      isSelected ? "ring-2 ring-blue-500" : ""
                                    }`}
                                    style={{
                                      left: `${Math.max(0, startPos)}%`,
                                      width: `${Math.min(width, 100 - Math.max(0, startPos))}%`,
                                      backgroundColor: taskColor,
                                      color: textColor,
                                      borderRadius: "0.375rem",
                                    }}
                                    onMouseEnter={(e) => handleTaskMouseEnter(e, task.todo.id)}
                                    onMouseLeave={handleTaskMouseLeave}
                                    onClick={() => setDetailsOverlayTodo(task.todo)}
                                    title="Click to view details"
                                  >
                                    <span className="text-xs font-medium truncate line-through">
                                      {task.todo.plainText}
                                    </span>
                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                      {/* Comment/activity indicators */}
                                      {(task.todo.hasComments || task.todo.hasActivity) && (
                                        <div className="flex items-center gap-0.5 opacity-70">
                                          {task.todo.hasComments && (
                                            <span
                                              className="flex items-center text-[10px]"
                                              title={`${task.todo.commentCount} comment${
                                                task.todo.commentCount !== 1 ? "s" : ""
                                              }`}
                                            >
                                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                  fillRule="evenodd"
                                                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                              {task.todo.commentCount > 1 && <span>{task.todo.commentCount}</span>}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      <span className="text-xs opacity-80 whitespace-nowrap">
                                        ✓ {formatDuration(task.durationMinutes)}
                                      </span>
                                      {hoveredTaskId === task.todo.id && (
                                        <svg
                                          className="w-3 h-3 opacity-70"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Dependency arrows overlay */}
                  {settings.gantt.showDependencies !== false && (
                    <svg className="absolute inset-0 pointer-events-none z-20 mx-4" style={{ overflow: "visible" }}>
                      <defs>
                        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                          <polygon
                            points="0 0, 8 3, 0 6"
                            fill="currentColor"
                            className="text-orange-500 dark:text-orange-400"
                          />
                        </marker>
                      </defs>
                      {activeTasks.map((task, taskIndex) => {
                        const deps = task.todo.metadata.dependencies || [];
                        return deps.map((depId) => {
                          const depTaskIndex = activeTasks.findIndex((t) => t.todo.id === depId);
                          if (depTaskIndex === -1) return null;

                          const depTask = activeTasks[depTaskIndex];
                          const depEndPos = getTimePosition(depTask.endTime);
                          const taskStartPos = getTimePosition(task.startTime);

                          // Calculate row heights
                          const rowHeightPx =
                            settings.gantt.taskRowHeight === "compact"
                              ? 32
                              : settings.gantt.taskRowHeight === "comfortable"
                              ? 48
                              : 40;
                          const depY = depTaskIndex * (rowHeightPx + 2) + rowHeightPx / 2;
                          const taskY = taskIndex * (rowHeightPx + 2) + rowHeightPx / 2;

                          // Only draw if the dependency ends before this task starts
                          if (depEndPos < taskStartPos) {
                            return (
                              <path
                                key={`${depId}-${task.todo.id}`}
                                d={`M ${depEndPos}% ${depY} C ${(depEndPos + taskStartPos) / 2}% ${depY}, ${
                                  (depEndPos + taskStartPos) / 2
                                }% ${taskY}, ${taskStartPos}% ${taskY}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                                markerEnd="url(#arrowhead)"
                                className="text-orange-500 dark:text-orange-400 opacity-60"
                              />
                            );
                          }
                          return null;
                        });
                      })}
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Unscheduled Tasks */}
            {unscheduledTasks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                  Can't Fit in Schedule ({unscheduledTasks.length})
                </h4>
                <div className="space-y-2">
                  {unscheduledTasks.map((todo) => {
                    const duration = parseDuration(todo.metadata.duration);

                    return (
                      <div
                        key={todo.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                      >
                        <svg
                          className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <div className={`w-1 h-12 rounded-full ${getPriorityColor(todo.metadata.priority)}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{todo.plainText}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDuration(duration)}</span>
                            {todo.metadata.priority && (
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                • Priority: {todo.metadata.priority}
                              </span>
                            )}
                            <span className="text-xs text-amber-700 dark:text-amber-300">• No available time slot</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Todo Details Overlay */}
      {detailsOverlayTodo &&
        (() => {
          // Find the current version of the todo from the todos array
          const currentTodo = todos.find((t) => t.id === detailsOverlayTodo.id);
          if (!currentTodo) return null;

          return (
            <TodoDetailsOverlay
              todo={currentTodo}
              todos={todos}
              isOpen={true}
              onClose={() => setDetailsOverlayTodo(null)}
              onToggle={onToggle}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onEdit={onEditTodo}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
              markerColors={markerColors}
              settings={settings}
              linkPatterns={linkPatterns}
              availablePeople={availablePeople}
              availableProjects={availableProjects}
              availablePriorities={availablePriorities}
              onAddPerson={onAddPerson}
              onAddProject={onAddProject}
              onAddPriority={onAddPriority}
              onAddComment={onAddComment}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onEditSubtask={onEditSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onStartTimeTracking={onStartTimeTracking}
              onStopTimeTracking={onStopTimeTracking}
              onAddManualTimeEntry={onAddManualTimeEntry}
              onDeleteTimeEntry={onDeleteTimeEntry}
              onCreateTemplate={onCreateTemplate}
            />
          );
        })()}

      {/* Portal-based floating tooltip for hovered tasks */}
      {hoveredTaskId &&
        tooltipPosition &&
        typeof document !== "undefined" &&
        (() => {
          const hoveredTodo = todos.find((t) => t.id === hoveredTaskId);
          if (!hoveredTodo) return null;

          // Helper to get colors
          const getPriorityColor = (priority: string) => {
            const p = availablePriorities.find(
              (pr) =>
                pr.name.toLowerCase() === priority.toLowerCase() ||
                pr.alternatives.some((a) => a.toLowerCase() === priority.toLowerCase()),
            );
            return p?.color || markerColors.priority;
          };
          const getPersonColor = (person: string) => {
            const p = availablePeople.find((pr) => pr.matchesAnyName([person]));
            return p?.raw.color || markerColors.assigned;
          };
          const getProjectColorForTooltip = (project: string) => {
            const p = availableProjects.find((pr) => pr.matchesAnyName([project]));
            return p?.raw.color || markerColors.project;
          };

          return createPortal(
            <div
              className="fixed z-[9999] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl p-3 min-w-[320px] max-w-[500px] pointer-events-none"
              style={{
                left: Math.min(tooltipPosition.x, window.innerWidth - 520),
                top: Math.min(tooltipPosition.y, window.innerHeight - 250),
              }}
            >
              {/* Task text */}
              <MarkedText
                text={hoveredTodo.text}
                markerColors={markerColors}
                availablePeople={availablePeople}
                availableProjects={availableProjects}
                availablePriorities={availablePriorities}
              />

              {/* Structured metadata grid */}
              <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-[70px_1fr] gap-x-3 gap-y-1.5 text-[10px]">
                {/* Status row */}
                <span className="text-zinc-500 dark:text-zinc-400">Status</span>
                <span
                  className={`px-1.5 py-0.5 rounded font-medium w-fit ${
                    hoveredTodo.isArchived
                      ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                      : hoveredTodo.isCompleted
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  }`}
                >
                  {hoveredTodo.isArchived ? "Archived" : hoveredTodo.isCompleted ? "Completed" : "Active"}
                </span>

                {/* Assigned row */}
                <span className="text-zinc-500 dark:text-zinc-400">Assigned</span>
                {hoveredTodo.metadata.assignedPeople.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {hoveredTodo.metadata.assignedPeople.map((person, idx) => {
                      const bgColor = getPersonColor(person);
                      return (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}
                        >
                          @{person}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-zinc-300 dark:text-zinc-600">—</span>
                )}

                {/* Project row */}
                <span className="text-zinc-500 dark:text-zinc-400">Project</span>
                {hoveredTodo.metadata.projects.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {hoveredTodo.metadata.projects.map((project, idx) => {
                      const bgColor = getProjectColorForTooltip(project);
                      return (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}
                        >
                          %{project}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-zinc-300 dark:text-zinc-600">—</span>
                )}

                {/* Due date + Duration row (time-related fields together) */}
                <span className="text-zinc-500 dark:text-zinc-400">Due</span>
                <div className="flex items-center gap-2">
                  {hoveredTodo.metadata.dueDate ? (
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        hoveredTodo.isOverdue
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          : hoveredTodo.isDueToday
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {hoveredTodo.dueDateDisplay}
                    </span>
                  ) : (
                    <span className="text-zinc-300 dark:text-zinc-600">—</span>
                  )}
                  {hoveredTodo.metadata.duration && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      ({hoveredTodo.durationDisplay})
                    </span>
                  )}
                </div>

                {/* Priority row */}
                <span className="text-zinc-500 dark:text-zinc-400">Priority</span>
                {hoveredTodo.metadata.priority ? (
                  <span
                    className="px-1.5 py-0.5 rounded font-medium w-fit"
                    style={{
                      backgroundColor: getPriorityColor(hoveredTodo.metadata.priority),
                      color: getTextColor(getPriorityColor(hoveredTodo.metadata.priority)),
                    }}
                  >
                    {hoveredTodo.metadata.priority}
                  </span>
                ) : (
                  <span className="text-zinc-300 dark:text-zinc-600">—</span>
                )}
              </div>
            </div>,
            document.body,
          );
        })()}
    </div>
  );
}
