"use client";

import { Todo, TodoMetadata } from "@/types/todo";
import { MarkerColors, WorkHoursSettings } from "@/types/settings";
import { useMemo, useState, useRef } from "react";
import { MarkedText } from "@/components/shared/MarkedText";
import { TodoDetailsOverlay } from "@/components/overlays/TodoDetailsOverlay";

interface GanttViewProps {
  todos: Todo[];
  markerColors: MarkerColors;
  workHours: WorkHoursSettings;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTodo: (id: string, text: string, plainText: string, metadata: TodoMetadata) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  settings: import("@/types/settings").Settings;
  linkPatterns: import("@/types/settings").LinkPattern[];
  availablePeople: import("@/types/settings").Person[];
  availableProjects: import("@/types/settings").Project[];
  availablePriorities: import("@/types/settings").Priority[];
  onAddPerson: (person: string) => void;
  onAddProject: (project: string) => void;
  onAddPriority: (priority: string) => void;
  onAddComment?: (todoId: string, content: string) => void;
  onEditComment?: (todoId: string, commentId: number, content: string) => void;
  onDeleteComment?: (todoId: string, commentId: number) => void;
}

interface ScheduledTask {
  todo: Todo;
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
  onEditComment,
  onDeleteComment,
}: GanttViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = previous week
  const [showTasksWithoutDates, setShowTasksWithoutDates] = useState(true);
  const [schedulingMode, setSchedulingMode] = useState<"asap" | "dueDate">("asap");
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [detailsOverlayTodo, setDetailsOverlayTodo] = useState<Todo | null>(null);

  // Parse duration string to minutes
  const parseDuration = (duration: string | undefined): number => {
    if (!duration) return workHours.defaultTaskDuration;

    const match = duration.match(/(\d+)([mhd])?/i);
    if (!match) return workHours.defaultTaskDuration;

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

  // Get all active todos (not completed, archived, or deleted), sorted by mode
  const allActiveTodos = useMemo(() => {
    let filtered = todos.filter((todo) => {
      return todo.state === "active";
    });

    if (schedulingMode === "asap") {
      // Sort by priority order first, then by due date as secondary sort
      filtered.sort((a, b) => {
        // Find priority objects
        const aPriorityObj = availablePriorities.find(
          (p) => p.name === a.metadata.priority || p.alternatives.includes(a.metadata.priority || ""),
        );
        const bPriorityObj = availablePriorities.find(
          (p) => p.name === b.metadata.priority || p.alternatives.includes(b.metadata.priority || ""),
        );

        const aOrder = aPriorityObj?.order ?? 999;
        const bOrder = bPriorityObj?.order ?? 999;

        // Primary sort: priority order (lower order first)
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        // Secondary sort: due date (earliest first)
        if (!a.metadata.dueDate && !b.metadata.dueDate) return 0;
        if (!a.metadata.dueDate) return 1; // No due date goes last
        if (!b.metadata.dueDate) return -1;

        const aDate = new Date(a.metadata.dueDate);
        const bDate = new Date(b.metadata.dueDate);

        return aDate.getTime() - bDate.getTime(); // Earliest first
      });
    } else {
      // Sort by due date (earliest first)
      filtered.sort((a, b) => {
        if (!a.metadata.dueDate && !b.metadata.dueDate) return 0;
        if (!a.metadata.dueDate) return 1; // No due date goes last
        if (!b.metadata.dueDate) return -1;

        const aDate = new Date(a.metadata.dueDate);
        const bDate = new Date(b.metadata.dueDate);

        return aDate.getTime() - bDate.getTime(); // Earliest first
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

    let currentDay = new Date(today);
    let remainingTodos = [...allActiveTodos];

    // Schedule tasks across days starting from today (sorted by priority or due date)
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

      for (const todo of remainingTodos) {
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

        const durationMinutes = parseDuration(todo.metadata.duration);
        const taskEnd = new Date(currentTime.getTime() + durationMinutes * 60000);

        if (taskEnd <= dayEnd) {
          // Task fits on this day - schedule it
          const dateKey = currentDay.toISOString().split("T")[0];
          map.set(todo.id, dateKey);
          scheduledToday.push(todo.id);
          currentTime = new Date(taskEnd.getTime() + workHours.contextSwitchingTime * 60000);
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
  }, [allActiveTodos, workHours]); // Get todos for selected date based on scheduling map
  const todosForDate = useMemo(() => {
    const dateKey = selectedDate.toISOString().split("T")[0];
    return allActiveTodos.filter((todo) => taskSchedulingMap.get(todo.id) === dateKey);
  }, [allActiveTodos, taskSchedulingMap, selectedDate]);

  // Count todos without due dates
  const todosWithoutDates = useMemo(() => {
    return todos.filter((todo) => !todo.metadata.dueDate && todo.state !== "deleted").length;
  }, [todos]);

  // Get schedule and time bounds
  const schedule = getScheduleForDate(selectedDate);
  const dayStartTime = useMemo(() => parseTime(schedule.startTime, selectedDate), [schedule, selectedDate]);
  const dayEndTime = useMemo(() => parseTime(schedule.endTime, selectedDate), [schedule, selectedDate]);
  const totalDayMinutes = (dayEndTime.getTime() - dayStartTime.getTime()) / 60000;

  // Get break blocks
  const breakBlocks: BreakBlock[] = useMemo(() => {
    return schedule.breaks.map((b) => ({
      name: b.name,
      startTime: parseTime(b.startTime, selectedDate),
      endTime: parseTime(b.endTime, selectedDate),
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

    for (const todo of todosForDate) {
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

      const durationMinutes = parseDuration(todo.metadata.duration);
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

      // Add context switching time
      currentTime = new Date(taskEnd.getTime() + workHours.contextSwitchingTime * 60000);
    }

    return tasks;
  }, [todosForDate, dayStartTime, dayEndTime, breakBlocks, workHours, selectedDate]);

  const unscheduledTasks = todosForDate.slice(scheduledTasks.length);

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
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const getTimePosition = (time: Date): number => {
    const minutes = (time.getTime() - dayStartTime.getTime()) / 60000;
    return (minutes / totalDayMinutes) * 100;
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return "bg-zinc-400";
    const p = priority.toLowerCase();
    if (["0", "urgent", "asap", "critical"].includes(p)) return "bg-red-500";
    if (["1", "high"].includes(p)) return "bg-orange-500";
    if (["2", "medium", "med", "normal"].includes(p)) return "bg-yellow-500";
    if (["3", "low"].includes(p)) return "bg-green-500";
    return "bg-blue-500";
  };

  const getProjectColor = (todo: Todo): string => {
    // If todo has a project, use marker color for that project
    if (todo.metadata.projects && todo.metadata.projects.length > 0) {
      const projectName = todo.metadata.projects[0];
      const projectColor = markerColors[projectName];
      if (projectColor) {
        return projectColor;
      }
    }
    // Fall back to default Gantt color from settings
    return workHours.defaultGanttColor;
  };

  const getProjectColorClass = (color: string): string => {
    // Convert hex color to inline style since it's dynamic
    return "";
  };

  // Generate hour markers
  const hourMarkers = useMemo(() => {
    const markers = [];
    const startHour = dayStartTime.getHours();
    const endHour = dayEndTime.getHours();

    for (let hour = startHour; hour <= endHour; hour++) {
      const markerTime = new Date(selectedDate);
      markerTime.setHours(hour, 0, 0, 0);
      if (markerTime >= dayStartTime && markerTime <= dayEndTime) {
        markers.push({
          time: markerTime,
          position: getTimePosition(markerTime),
        });
      }
    }
    return markers;
  }, [dayStartTime, dayEndTime, selectedDate]);

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
        todo: Todo;
        startPercent: number;
        widthPercent: number;
        color: string;
      }> = [];

      let currentTime = new Date(dayStart);
      if (isCurrentDay && now > dayStart && now < dayEnd) {
        currentTime = new Date(now);
      }

      for (const todo of tasksForDay) {
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

        const durationMinutes = parseDuration(todo.metadata.duration);
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

        currentTime = new Date(taskEnd.getTime() + workHours.contextSwitchingTime * 60000);
      }

      return { date, scheduled, dayStart, dayEnd, totalMinutes };
    });
  }, [currentWeekDates, allActiveTodos, taskSchedulingMap, workHours]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction * 7);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-4">
      {/* Scheduling Mode Toggle */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Scheduling Mode:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSchedulingMode("asap")}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                schedulingMode === "asap"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              ASAP (Priority-based)
            </button>
            <button
              onClick={() => setSchedulingMode("dueDate")}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                schedulingMode === "dueDate"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              Due Date
            </button>
          </div>
        </div>
      </div>

      {/* Mini Week Overview */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Week of {currentWeekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
        <div className="grid grid-cols-7 gap-2">
          {weekTasks.map(({ date, tasks }, index) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = date.getDate();

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-2 rounded-lg border transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : isToday
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10"
                    : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{dayName}</div>
                <div
                  className={`text-lg font-semibold ${
                    isSelected ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {dayNum}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mini Gantt Timeline */}
        <div className="mt-3 grid grid-cols-7 gap-2">
          {weekScheduledTasks.map(({ date, scheduled, dayStart, dayEnd }, index) => {
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div key={index} className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
                {scheduled.map((task, i) => {
                  const isCompleted = task.todo.state === "completed" || task.todo.state === "archived";
                  return (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0"
                      style={{
                        left: `${task.startPercent}%`,
                        width: `${task.widthPercent}%`,
                        backgroundColor: task.color,
                        opacity: isCompleted ? 0.5 : 1,
                      }}
                      title={task.todo.plainText}
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
            );
          })}
        </div>
      </div>

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

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg
              className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{formatDate(selectedDate)}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {schedule.startTime} - {schedule.endTime} • {scheduledTasks.length} scheduled • {unscheduledTasks.length}{" "}
              can't fit
            </p>
          </div>

          <button
            onClick={() => navigateDate(1)}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg
              className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
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
              <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Timeline
              </h4>

              {/* Time markers */}
              <div className="relative h-6 bg-zinc-50 dark:bg-zinc-800 rounded mx-4" style={{ overflow: "visible" }}>
                {hourMarkers.map((marker, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 flex flex-col items-center -translate-x-1/2"
                    style={{ left: `${marker.position}%` }}
                  >
                    <div className="w-px h-2 bg-zinc-300 dark:bg-zinc-600" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 whitespace-nowrap">
                      {formatTime(marker.time)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tasks timeline */}
              <div className="relative space-y-0 mx-4" style={{ overflow: "visible" }}>
                {scheduledTasks.map((task, index) => {
                  const startPos = getTimePosition(task.startTime);
                  const endPos = getTimePosition(task.endTime);
                  const width = endPos - startPos;
                  const targetPos = getTimePosition(task.targetDate);

                  // Check if there's a context switch buffer after this task
                  const nextTask = index < scheduledTasks.length - 1 ? scheduledTasks[index + 1] : null;
                  const hasContextSwitch = nextTask && workHours.contextSwitchingTime > 0;
                  const contextSwitchStartPos = endPos;
                  const contextSwitchEndPos = nextTask ? getTimePosition(nextTask.startTime) : 0;
                  const contextSwitchWidth = contextSwitchEndPos - contextSwitchStartPos;

                  const taskColor = getProjectColor(task.todo);

                  return (
                    <div
                      key={task.todo.id}
                      className="relative"
                      style={{ marginBottom: hasContextSwitch ? "0" : "2px" }}
                    >
                      {/* Task row */}
                      <div className="relative h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        {/* Break blocks */}
                        {breakBlocks.map((breakBlock, bi) => {
                          const breakStart = getTimePosition(breakBlock.startTime);
                          const breakEnd = getTimePosition(breakBlock.endTime);
                          return (
                            <div
                              key={bi}
                              className="absolute top-0 bottom-0 bg-zinc-300 dark:bg-zinc-700 opacity-50"
                              style={{
                                left: `${breakStart}%`,
                                width: `${breakEnd - breakStart}%`,
                              }}
                            />
                          );
                        })}

                        {/* Task bar */}
                        <div
                          className="absolute top-0.5 bottom-0.5 shadow-md flex items-center justify-between px-2 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow z-10"
                          style={{
                            left: `${Math.max(0, startPos)}%`,
                            width: `${Math.min(width, 100 - Math.max(0, startPos))}%`,
                            backgroundColor: taskColor,
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
                          onMouseEnter={() => setHoveredTaskId(task.todo.id)}
                          onMouseLeave={() => setHoveredTaskId(null)}
                          onClick={() => {
                            setDetailsOverlayTodo(task.todo);
                          }}
                        >
                          <span className="text-xs font-medium text-white truncate">{task.todo.plainText}</span>
                          <span className="text-xs text-white/80 ml-2 whitespace-nowrap">
                            {formatDuration(task.durationMinutes)}
                          </span>
                        </div>

                        {/* Buffer indicator (green dotted line to the right) */}
                        {task.hasBuffer && (
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
                                  100 - endPos < 15 ? `${startPos}%` : `${(endPos + Math.min(targetPos, 100)) / 2}%`,
                                transform: 100 - endPos < 15 ? "translate(-100%, -50%)" : "translate(-50%, -50%)",
                              }}
                            >
                              +{formatDuration(task.bufferMinutes)} buffer
                            </div>
                          </>
                        )}

                        {/* Overdue indicator (red dotted line to the left) */}
                        {task.isOverdue && (
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
                                left: startPos < 15 ? `${endPos}%` : `${(Math.max(targetPos, 0) + startPos) / 2}%`,
                                transform: startPos < 15 ? "translate(0%, -50%)" : "translate(-50%, -50%)",
                              }}
                            >
                              -{formatDuration(task.bufferMinutes)} overdue
                            </div>
                          </>
                        )}

                        {/* Target marker */}
                        <div
                          className={`absolute top-0 bottom-0 w-0.5 ${
                            task.isOverdue ? "bg-red-500" : "bg-green-500"
                          } z-10`}
                          style={{ left: `${targetPos}%` }}
                          title={task.isOverdue ? "Overdue point" : "Target time"}
                        />
                      </div>

                      {/* Context switching buffer - line with arrows */}
                      {hasContextSwitch && contextSwitchWidth > 0 && (
                        <div
                          className="absolute flex items-center justify-center z-5"
                          style={{
                            top: "100%",
                            left: `${contextSwitchStartPos}%`,
                            width: `${contextSwitchWidth}%`,
                            height: "8px",
                          }}
                        >
                          <div className="flex items-center w-full">
                            <svg
                              className="w-2 h-2 text-blue-500 dark:text-blue-400 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 8 8"
                            >
                              <path d="M4 0 L0 4 L4 8 Z" />
                            </svg>
                            <div className="flex-1 h-px bg-blue-500 dark:bg-blue-400" />
                            <svg
                              className="w-2 h-2 text-blue-500 dark:text-blue-400 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 8 8"
                            >
                              <path d="M4 0 L8 4 L4 8 Z" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Hover tooltip - positioned outside task bar */}
                      {hoveredTaskId === task.todo.id && (
                        <div className="absolute left-4 top-full mt-2 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl p-3 min-w-[300px] max-w-[500px] pointer-events-none">
                          <MarkedText
                            text={task.todo.text}
                            markerColors={markerColors}
                            availablePeople={availablePeople}
                            availableProjects={availableProjects}
                            availablePriorities={availablePriorities}
                            dateTimeSettings={settings.dateTime}
                            workHoursSettings={settings.workHours}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
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
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
            />
          );
        })()}
    </div>
  );
}
