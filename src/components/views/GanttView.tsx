"use client";

import React from "react";
import { TodoMetadata } from "@/types/todo";
import { TodoModel } from "@/models/TodoModel";
import {
  MarkerColors,
  WorkHoursSettings,
  GanttZoomLevel,
  DEFAULT_BLOCK_TYPES,
  TimeBlockType,
  SchedulingTechnique,
} from "@/types/settings";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";
import { MarkedText } from "@/components/shared/MarkedText";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";
import { TodoDetailsOverlay } from "@/components/overlays/TodoDetailsOverlay";
import { getTextColor } from "@/utils/colors";
import {
  ScheduledTask,
  TaskSegment,
  BreakBlock as SchedulerBreakBlock,
  BreakInfo,
  parseTime,
  parseDuration,
  getScheduleForDate,
  getPomodoroBreakDuration,
  sortTodosForScheduling,
  createTaskSchedulingMap,
  scheduleDayTasks,
  scheduleWeekTasks,
  WeekDaySchedule,
} from "@/utils/ganttScheduler";

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
  // Focus mode handler
  onStartFocusMode?: (tasks: ScheduledTask[]) => void;
}

// Local BreakBlock interface extends the scheduler's with TimeBlockType
interface BreakBlock extends SchedulerBreakBlock {
  blockType?: TimeBlockType | string;
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
  onStartFocusMode,
}: GanttViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = previous week

  // View options state - initialized with defaults, loaded from storage in useEffect

  const [schedulingMode, setSchedulingMode] = useState<"asap" | "dueDate">("asap");
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

  // Update current time every minute for the now line
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Load persisted view options from storage
  useEffect(() => {
    waitForStorageInit()
      .then(() => {
        return loadFromStorage<{
          schedulingMode?: "asap" | "dueDate";
          completedCollapsed?: boolean;
        }>(STORAGE_KEYS.GANTT_VIEW_OPTIONS, {});
      })
      .then((saved) => {
        if (saved.schedulingMode !== undefined) setSchedulingMode(saved.schedulingMode);
        if (saved.completedCollapsed !== undefined) setCompletedCollapsed(saved.completedCollapsed);
        setGanttOptionsLoaded(true);
      });
  }, []);

  // Persist Gantt view options to storage (only after initial load)
  useEffect(() => {
    if (!ganttOptionsLoaded) return;
    const viewOptions = {
      schedulingMode,
      completedCollapsed,
    };
    saveToStorage(STORAGE_KEYS.GANTT_VIEW_OPTIONS, viewOptions);
  }, [ganttOptionsLoaded, schedulingMode, completedCollapsed]);

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

  // Get all todos (active, completed, archived - not deleted), sorted by mode
  const allActiveTodos = useMemo(() => {
    return sortTodosForScheduling(todos, availablePriorities, schedulingMode);
  }, [todos, availablePriorities, schedulingMode]);

  // Determine which day each task should be scheduled on (ASAP scheduling with different sort orders)
  const taskSchedulingMap = useMemo(() => {
    return createTaskSchedulingMap(allActiveTodos, {
      ganttSettings: settings.gantt,
      workHours,
      availablePriorities,
      schedulingMode,
    });
  }, [allActiveTodos, workHours, settings.gantt, availablePriorities, schedulingMode]);

  // Get todos for selected date based on scheduling map OR time tracking entries
  const { todosForDate, scheduledTodoIds } = useMemo(() => {
    const dateKey = selectedDate.toISOString().split("T")[0];
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const scheduled = new Set<string>();
    const todos = allActiveTodos.filter((todo) => {
      // Include if scheduled for this date
      if (taskSchedulingMap.get(todo.id) === dateKey) {
        scheduled.add(todo.id);
        return true;
      }
      // Also include if there are time tracking entries for this date
      if (todo.hasTimeTracking && todo.timeTracking) {
        const hasEntryForDate = todo.timeTracking.entries.some((entry) => {
          const entryStart = new Date(entry.startTime);
          const entryEnd = entry.endTime ? new Date(entry.endTime) : new Date();
          return entryStart <= dayEnd && entryEnd >= dayStart;
        });
        if (hasEntryForDate) {
          return true;
        }
      }
      return false;
    });
    return { todosForDate: todos, scheduledTodoIds: scheduled };
  }, [allActiveTodos, taskSchedulingMap, selectedDate]);

  // Get schedule and time bounds, dynamically expanded for completed tasks outside work hours
  const schedule = getScheduleForDate(selectedDate, workHours);
  const { expandedStartTime, expandedEndTime } = useMemo(() => {
    let minTime = parseTime(schedule.startTime, selectedDate);
    let maxTime = parseTime(schedule.endTime, selectedDate);

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Check if any completed/archived tasks fall outside work hours
    todosForDate.forEach((todo) => {
      if ((todo.isCompleted || todo.isArchived) && todo.completedAt) {
        const completionDate = new Date(todo.completedAt);
        const durationMinutes = parseDuration(todo.metadata.duration);
        const taskStartTime = new Date(completionDate.getTime() - durationMinutes * 60 * 1000);

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

      // Also expand bounds for time tracking entries (active or completed tasks)
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

  // Schedule tasks using the utility function
  const { tasks: scheduledTasks } = useMemo(() => {
    return scheduleDayTasks(
      todosForDate,
      dayStartTime,
      dayEndTime,
      breakBlocks,
      selectedDate,
      settings.gantt,
      scheduledTodoIds,
    );
  }, [todosForDate, dayStartTime, dayEndTime, breakBlocks, selectedDate, settings.gantt, scheduledTodoIds]);

  // Separate active and completed tasks for collapsible section
  const { activeTasks, completedTasks } = useMemo(() => {
    const active = scheduledTasks.filter((t) => !t.todo.isCompleted && !t.todo.isArchived);
    const completed = scheduledTasks.filter((t) => t.todo.isCompleted || t.todo.isArchived);
    return { activeTasks: active, completedTasks: completed };
  }, [scheduledTasks]);

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

    // Calculate time block breaks (lunch, meetings, etc.)
    const timeBlockBreakMinutes = breakBlocks.reduce((sum, block) => {
      return sum + (block.endTime.getTime() - block.startTime.getTime()) / 60000;
    }, 0);

    // Calculate technique breaks (Pomodoro, Flow, context switching)
    // Include breaks after tasks AND breaks between segments within tasks
    const techniqueBreakMinutes = [...activeTasks, ...completedTasks].reduce((sum, task) => {
      // Add break after this task
      let taskBreaks = task.nextBreak?.durationMinutes ?? 0;
      // Add breaks between segments within this task
      task.segments.forEach((segment) => {
        taskBreaks += segment.nextBreak?.durationMinutes ?? 0;
      });
      return sum + taskBreaks;
    }, 0);

    // Available = total work time - time blocks (lunch, meetings)
    const availableMinutes = totalWorkMinutes - timeBlockBreakMinutes;
    // Utilized = tasks + technique breaks between them
    const utilizedMinutes = totalPlannedMinutes + completedMinutes + techniqueBreakMinutes;
    const utilizationPercent = availableMinutes > 0 ? Math.round((utilizedMinutes / availableMinutes) * 100) : 0;

    return {
      totalPlannedMinutes,
      completedMinutes,
      availableMinutes,
      utilizationPercent,
      conflictCount: taskConflicts.size,
      techniqueBreakMinutes,
    };
  }, [activeTasks, completedTasks, dayStartTime, dayEndTime, breakBlocks, taskConflicts]);

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

  // Get color for a scheduled task (accounts for actual time tracking)
  const getTaskColor = useCallback(
    (task: ScheduledTask): string => {
      // Actual tracked time is always shown in gray with a distinct shade
      if (task.isActualTime) {
        return "#6b7280"; // gray-500 - distinct from completed gray
      }
      return getProjectColor(task.todo);
    },
    [getProjectColor],
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
    return scheduleWeekTasks(
      currentWeekDates,
      allActiveTodos,
      taskSchedulingMap,
      workHours,
      settings.gantt,
      getProjectColor,
    );
  }, [currentWeekDates, allActiveTodos, taskSchedulingMap, workHours, settings.gantt]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction * 7);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-4" role="region" aria-label="Gantt Chart Schedule">
      {/* Scheduling Mode Toggle */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 sm:p-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
              Prioritization:
              <InfoTooltip content={tooltipContent.prioritization} />
            </span>
            <div className="flex gap-1 sm:gap-2" role="group" aria-label="Prioritization mode">
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

            {/* Technique Toggle - Connected segmented control */}
            <div className="flex items-center gap-1 sm:gap-2 sm:ml-2 sm:pl-2 sm:border-l border-zinc-200 dark:border-zinc-700">
              <span className="hidden lg:inline text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mr-1">
                Technique:
              </span>
              <span className="hidden lg:inline">
                <InfoTooltip
                  content={
                    settings.gantt.schedulingTechnique === "sequential"
                      ? tooltipContent.sequential
                      : settings.gantt.schedulingTechnique === "pomodoro"
                      ? tooltipContent.pomodoro
                      : tooltipContent.flow
                  }
                />
              </span>
              <div className="flex" role="group" aria-label="Scheduling technique">
                <button
                  onClick={() => {
                    if (onUpdateGanttSettings) {
                      onUpdateGanttSettings({
                        ...settings.gantt,
                        schedulingTechnique: "sequential",
                      });
                    }
                  }}
                  aria-pressed={settings.gantt.schedulingTechnique === "sequential"}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 rounded-l-md border-y border-l ${
                    settings.gantt.schedulingTechnique === "sequential"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
                  }`}
                  title="Sequential: Simple context switching between tasks"
                >
                  <span>📋</span>
                  <span className="hidden sm:inline">Sequential</span>
                </button>
                <button
                  onClick={() => {
                    if (onUpdateGanttSettings) {
                      onUpdateGanttSettings({
                        ...settings.gantt,
                        schedulingTechnique: "pomodoro",
                      });
                    }
                  }}
                  aria-pressed={settings.gantt.schedulingTechnique === "pomodoro"}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 border ${
                    settings.gantt.schedulingTechnique === "pomodoro"
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
                  }`}
                  title="Pomodoro: Work sessions with short/long breaks"
                >
                  <span>🍅</span>
                  <span className="hidden sm:inline">Pomodoro</span>
                </button>
                <button
                  onClick={() => {
                    if (onUpdateGanttSettings) {
                      onUpdateGanttSettings({
                        ...settings.gantt,
                        schedulingTechnique: "flow",
                      });
                    }
                  }}
                  aria-pressed={settings.gantt.schedulingTechnique === "flow"}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 rounded-r-md border-y border-r ${
                    settings.gantt.schedulingTechnique === "flow"
                      ? "bg-cyan-500 text-white border-cyan-500"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
                  }`}
                  title="Flow: Work/break/context cycles (52/17, Ultradian)"
                >
                  <span>🌊</span>
                  <span className="hidden sm:inline">Flow</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Conflict indicator if any */}
            {timeStats.conflictCount > 0 && (
              <span
                className="text-red-600 dark:text-red-400 flex items-center gap-1 text-xs"
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

            {/* Focus Mode Button */}
            {onStartFocusMode && activeTasks.length > 0 && (
              <button
                onClick={() => onStartFocusMode(activeTasks)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-xs sm:text-sm flex items-center gap-1.5"
                title="Start focus mode with scheduled tasks for this date"
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
                <span className="hidden sm:inline">Focus</span>
              </button>
            )}

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
          {weekScheduledTasks.map(
            (
              {
                date,
                scheduled,
                segments,
                techniqueBreaks,
                breakBlocks: dayBreaks,
                dayStart,
                dayEnd,
                totalMinutes,
                techniqueBreakMinutes,
              },
              index,
            ) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = date.toDateString() === selectedDate.toDateString();

              // Calculate total break time from time blocks (lunch, meetings, etc.)
              const timeBlockBreakMinutes = dayBreaks.reduce((sum, b) => {
                const breakDur = (b.widthPercent * totalMinutes) / 100;
                return sum + breakDur;
              }, 0);

              // Calculate total task time
              const totalTaskMinutes = scheduled.reduce((sum, t) => {
                const dur = (t.widthPercent * totalMinutes) / 100;
                return sum + dur;
              }, 0);

              // Utilization = tasks + technique breaks (Pomodoro, Flow, etc.)
              // Time blocks (lunch, meetings) are already blocked out and not "available"
              // Available time = total - time blocks
              const availableMinutes = totalMinutes - timeBlockBreakMinutes;
              // Utilized = tasks + technique breaks between them
              const utilizedMinutes = totalTaskMinutes + techniqueBreakMinutes;
              const utilizationPercent =
                availableMinutes > 0 ? Math.round((utilizedMinutes / availableMinutes) * 100) : 0;

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
                    {/* Technique breaks (Pomodoro, Flow, context switching) - rendered first as background */}
                    {techniqueBreaks.map((tb, tbi) => (
                      <div
                        key={`tech-break-${tbi}`}
                        className="absolute top-0 bottom-0 bg-blue-400 dark:bg-blue-600"
                        style={{
                          left: `${tb.startPercent}%`,
                          width: `${tb.widthPercent}%`,
                          opacity: 0.6,
                        }}
                      />
                    ))}
                    {/* Time block breaks (lunch, meetings, etc.) - rendered on top with custom colors */}
                    {dayBreaks.map((breakBlock, bi) => (
                      <div
                        key={`break-${bi}`}
                        className="absolute top-0 bottom-0 opacity-70"
                        style={{
                          left: `${breakBlock.startPercent}%`,
                          width: `${breakBlock.widthPercent}%`,
                          backgroundColor: breakBlock.color,
                        }}
                        title={`${breakBlock.icon} ${breakBlock.name}`}
                      />
                    ))}
                    {/* Task segments (more accurate than whole tasks) */}
                    {segments.map((segment, i) => {
                      // Handle segments outside work hours
                      let clampedStart = segment.startPercent;
                      let clampedWidth = segment.widthPercent;

                      // If segment starts before work hours, clamp to start
                      if (segment.startPercent < 0) {
                        clampedStart = 0;
                        clampedWidth = Math.min(segment.widthPercent + segment.startPercent, 100);
                      }
                      // If segment starts after work hours, show at the end
                      else if (segment.startPercent >= 100) {
                        clampedStart = 95;
                        clampedWidth = 5;
                      }
                      // If segment extends beyond work hours
                      else if (segment.startPercent + segment.widthPercent > 100) {
                        clampedStart = segment.startPercent;
                        clampedWidth = 100 - segment.startPercent;
                      }

                      // Only render if there's valid width
                      if (clampedWidth <= 0) return null;

                      return (
                        <div
                          key={`seg-${i}`}
                          className="absolute top-0 bottom-0"
                          style={{
                            left: `${clampedStart}%`,
                            width: `${clampedWidth}%`,
                            backgroundColor: segment.color,
                          }}
                        />
                      );
                    })}
                    {isToday && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{
                          left: `${
                            ((new Date().getTime() - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime())) *
                            100
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
                    title={`${Math.round((totalTaskMinutes / 60) * 10) / 10}h tasks + ${
                      Math.round((techniqueBreakMinutes / 60) * 10) / 10
                    }h breaks = ${Math.round((utilizedMinutes / 60) * 10) / 10}h planned / ${
                      Math.round((availableMinutes / 60) * 10) / 10
                    }h available = ${utilizationPercent}%`}
                  />
                </div>
              );
            },
          )}
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
              <span className="sm:hidden">c</span>
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

                    {/* Active tasks */}
                    {activeTasks.map((task, index) => {
                      const isCompletedTask = task.todo.isCompleted || task.todo.isArchived;
                      const startPos = getTimePosition(task.startTime);
                      const endPos = getTimePosition(task.endTime);
                      const width = endPos - startPos;
                      const targetPos = getTimePosition(task.targetDate);
                      const isSelected = selectedTaskIndex === index;
                      const hasConflict = taskConflicts.has(task.todo.id);

                      // Use nextBreak from the scheduler (authoritative source)
                      const breakInfo = task.nextBreak;
                      const hasBreak = breakInfo !== null && !isCompletedTask;
                      const nextTask = index < activeTasks.length - 1 ? activeTasks[index + 1] : null;
                      const breakStartPos = endPos;
                      const breakEndPos = nextTask ? getTimePosition(nextTask.startTime) : 0;
                      const breakWidth = breakEndPos - breakStartPos;

                      const taskColor = getTaskColor(task);
                      const textColor = getTextColor(taskColor);

                      // Task row height based on settings
                      const rowHeight =
                        settings.gantt.taskRowHeight === "compact"
                          ? "h-8"
                          : settings.gantt.taskRowHeight === "comfortable"
                          ? "h-12"
                          : "h-10";
                      const showBufferZones = settings.gantt.showBufferZones !== false;

                      // Use unique key for actual time entries
                      const taskKey = task.isActualTime ? `${task.todo.id}-time-${task.timeEntryId}` : task.todo.id;

                      return (
                        <React.Fragment key={taskKey}>
                          <div
                            role="listitem"
                            aria-label={`Task: ${task.todo.plainText}, ${Math.round(task.durationMinutes)} minutes${
                              hasConflict ? ", has scheduling conflict" : ""
                            }`}
                            className={`relative ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 rounded-lg" : ""} ${
                              hasConflict ? "animate-pulse" : ""
                            }`}
                            style={{ marginBottom: "2px" }}
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

                              {/* Task bar segments */}
                              {task.segments.map((segment, segIdx) => {
                                const segStartPos = getTimePosition(segment.startTime);
                                const segEndPos = getTimePosition(segment.endTime);
                                const segWidth = segEndPos - segStartPos;
                                const isFirstSegment = segIdx === 0;
                                const isLastSegment = segIdx === task.segments.length - 1;
                                const hasMultipleSegments = task.segments.length > 1;
                                const isTrackedSegment = segment.isTrackedTime === true;

                                // For tracked segments, use gray; for scheduled, use task color
                                const segmentColor = isTrackedSegment ? "#9ca3af" : taskColor;
                                const segmentTextColor = isTrackedSegment ? "#ffffff" : textColor;

                                // Count scheduled vs tracked segments for proper numbering
                                const scheduledSegments = task.segments.filter((s) => !s.isTrackedTime);
                                const trackedSegments = task.segments.filter((s) => s.isTrackedTime);
                                const isFirstScheduledSegment = !isTrackedSegment && scheduledSegments[0] === segment;
                                const scheduledSegmentIndex = scheduledSegments.indexOf(segment);

                                // Calculate context switch gap between this segment and the next
                                const nextSegment =
                                  segIdx < task.segments.length - 1 ? task.segments[segIdx + 1] : null;

                                // Find the break block that overlaps with the gap between segments
                                // Break could start at segment end and extend into the gap
                                const breakInGap = nextSegment
                                  ? breakBlocks.find(
                                      (b) =>
                                        b.startTime.getTime() <= segment.endTime.getTime() &&
                                        b.endTime.getTime() > segment.endTime.getTime() &&
                                        b.endTime.getTime() <= nextSegment.startTime.getTime(),
                                    )
                                  : null;

                                // Context switch starts after the break block ends (or after segment ends if no break)
                                const contextSwitchStart = breakInGap ? breakInGap.endTime : segment.endTime;
                                const contextSwitchEnd = nextSegment ? nextSegment.startTime : segment.endTime;
                                const contextSwitchStartPos = getTimePosition(contextSwitchStart);
                                const contextSwitchEndPos = nextSegment ? getTimePosition(contextSwitchEnd) : 0;
                                const contextSwitchWidth = contextSwitchEndPos - contextSwitchStartPos;
                                const contextSwitchDuration = nextSegment
                                  ? Math.round((contextSwitchEnd.getTime() - contextSwitchStart.getTime()) / 60000)
                                  : 0;

                                return (
                                  <React.Fragment key={segIdx}>
                                    <div
                                      className={`absolute top-0.5 bottom-0.5 shadow-md flex items-center ${
                                        isFirstScheduledSegment || (isTrackedSegment && isFirstSegment)
                                          ? "justify-between px-2"
                                          : "justify-center px-1"
                                      } overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:z-20 transition-all duration-150 z-10 ${
                                        isSelected ? "ring-2 ring-blue-500" : ""
                                      }`}
                                      style={{
                                        left: `${Math.max(0, segStartPos)}%`,
                                        width: `${Math.min(segWidth, 100 - Math.max(0, segStartPos))}%`,
                                        backgroundColor: segmentColor,
                                        color: segmentTextColor,
                                        borderRadius: hasMultipleSegments
                                          ? isFirstSegment
                                            ? "0.375rem 0 0 0.375rem"
                                            : isLastSegment
                                            ? "0 0.375rem 0.375rem 0"
                                            : "0"
                                          : "0.375rem",
                                        // Add dashed right border for non-last segments to indicate continuation
                                        borderRight: !isLastSegment ? `2px dashed ${segmentTextColor}40` : undefined,
                                      }}
                                      onMouseEnter={(e) => handleTaskMouseEnter(e, task.todo.id)}
                                      onMouseLeave={handleTaskMouseLeave}
                                      onClick={() => {
                                        setShowClickHint(false);
                                        setDetailsOverlayTodo(task.todo);
                                      }}
                                      title={
                                        isTrackedSegment
                                          ? `⏱ Tracked: ${formatDuration(segment.durationMinutes)}${
                                              trackedSegments.length > 1
                                                ? ` (${trackedSegments.indexOf(segment) + 1}/${trackedSegments.length})`
                                                : ""
                                            }`
                                          : task.isActualTime
                                          ? `⏱ Actual time tracked: ${formatDuration(task.durationMinutes)}`
                                          : scheduledSegments.length > 1
                                          ? `Remaining ${scheduledSegmentIndex + 1}/${
                                              scheduledSegments.length
                                            }: ${formatDuration(
                                              segment.durationMinutes,
                                            )} (Total remaining: ${formatDuration(task.durationMinutes)})`
                                          : `Remaining: ${formatDuration(task.durationMinutes)}${
                                              task.trackedMinutes
                                                ? ` (${formatDuration(task.trackedMinutes)} tracked)`
                                                : ""
                                            }`
                                      }
                                    >
                                      {isTrackedSegment ? (
                                        // Tracked time segment content
                                        <div className="flex items-center gap-1 w-full">
                                          <span className="mr-1">⏱</span>
                                          <span className="text-xs font-medium truncate flex-1">
                                            {formatDuration(segment.durationMinutes)}
                                          </span>
                                        </div>
                                      ) : isFirstScheduledSegment ? (
                                        <>
                                          <span className="text-xs font-medium truncate">
                                            {task.isActualTime && <span className="mr-1">⏱</span>}
                                            {task.todo.plainText}
                                          </span>
                                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                            {/* Time tracking indicator */}
                                            {task.trackedMinutes && task.trackedMinutes > 0 && (
                                              <span
                                                className="text-[10px] opacity-70"
                                                title={`${formatDuration(task.trackedMinutes)} tracked`}
                                              >
                                                ⏱{formatDuration(task.trackedMinutes)}
                                              </span>
                                            )}
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
                                                    {task.todo.commentCount > 1 && (
                                                      <span>{task.todo.commentCount}</span>
                                                    )}
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
                                            {/* Segments indicator */}
                                            {scheduledSegments.length > 1 && (
                                              <span
                                                className="text-[10px] opacity-70"
                                                title={`Split across ${scheduledSegments.length} segments`}
                                              >
                                                📋{scheduledSegments.length}
                                              </span>
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
                                            {task.todo.metadata.dependencies &&
                                              task.todo.metadata.dependencies.length > 0 && (
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
                                        </>
                                      ) : (
                                        // For continuation segments, just show duration
                                        <span className="text-[10px] opacity-70">
                                          +{formatDuration(segment.durationMinutes)}
                                        </span>
                                      )}
                                    </div>

                                    {/* Break indicator between segments - shows the gap after break block */}
                                    {nextSegment && segment.nextBreak && contextSwitchWidth > 0 && (
                                      <div
                                        className="absolute top-0 bottom-0 flex items-center z-5"
                                        style={{
                                          left: `${contextSwitchStartPos}%`,
                                          width: `${contextSwitchWidth}%`,
                                        }}
                                        title={`${segment.nextBreak.icon} ${contextSwitchDuration}min ${segment.nextBreak.label}`.trim()}
                                      >
                                        <div className="flex items-center w-full">
                                          <svg
                                            className="w-2 h-2 flex-shrink-0 text-blue-500 dark:text-blue-400"
                                            fill="currentColor"
                                            viewBox="0 0 8 8"
                                          >
                                            <path d="M4 0 L0 4 L4 8 Z" />
                                          </svg>
                                          <div className="flex-1 h-px bg-blue-500 dark:bg-blue-400" />
                                          <svg
                                            className="w-2 h-2 flex-shrink-0 text-blue-500 dark:text-blue-400"
                                            fill="currentColor"
                                            viewBox="0 0 8 8"
                                          >
                                            <path d="M4 0 L8 4 L4 8 Z" />
                                          </svg>
                                        </div>
                                      </div>
                                    )}
                                  </React.Fragment>
                                );
                              })}

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
                                      left:
                                        100 - endPos < 15
                                          ? `${startPos}%`
                                          : `${(endPos + Math.min(targetPos, 100)) / 2}%`,
                                      transform: 100 - endPos < 15 ? "translate(-100%, -50%)" : "translate(-50%, -50%)",
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
                          </div>

                          {/* Break/context switch indicator between tasks - positioned on timeline */}
                          {hasBreak && breakInfo && breakWidth > 0 && (
                            <div className="relative h-3">
                              <div
                                className="absolute top-0 bottom-0 flex items-center justify-center"
                                style={{
                                  left: `${breakStartPos}%`,
                                  width: `${breakWidth}%`,
                                }}
                                title={`${breakInfo.icon} ${breakInfo.durationMinutes}min ${breakInfo.label}`.trim()}
                              >
                                <div className="flex items-center w-full">
                                  <svg
                                    className="w-2 h-2 flex-shrink-0 text-blue-500 dark:text-blue-400"
                                    fill="currentColor"
                                    viewBox="0 0 8 8"
                                  >
                                    <path d="M4 0 L0 4 L4 8 Z" />
                                  </svg>
                                  <div className="flex-1 h-px bg-blue-500 dark:bg-blue-400" />
                                  <svg
                                    className="w-2 h-2 flex-shrink-0 text-blue-500 dark:text-blue-400"
                                    fill="currentColor"
                                    viewBox="0 0 8 8"
                                  >
                                    <path d="M4 0 L8 4 L4 8 Z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
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
                            const taskColor = getTaskColor(task);
                            const textColor = getTextColor(taskColor);
                            const rowHeight =
                              settings.gantt.taskRowHeight === "compact"
                                ? "h-8"
                                : settings.gantt.taskRowHeight === "comfortable"
                                ? "h-12"
                                : "h-10";

                            // Use unique key for actual time entries
                            const taskKey = task.isActualTime
                              ? `${task.todo.id}-time-${task.timeEntryId}`
                              : task.todo.id;

                            return (
                              <div
                                key={taskKey}
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
                                    title={
                                      task.isActualTime
                                        ? `⏱ Actual time tracked: ${formatDuration(task.durationMinutes)}`
                                        : "Click to view details"
                                    }
                                  >
                                    <span className="text-xs font-medium truncate line-through">
                                      {task.isActualTime && <span className="mr-1">⏱</span>}
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
