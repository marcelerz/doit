"use client";

import { Todo } from "@/types/todo";
import { MarkerColors, WorkHoursSettings } from "@/types/settings";
import { useMemo, useState } from "react";

interface GanttViewProps {
  todos: Todo[];
  markerColors: MarkerColors;
  workHours: WorkHoursSettings;
}

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  todo: Todo | null;
  isBreak: boolean;
  breakName?: string;
}

export function GanttView({ todos, markerColors, workHours }: GanttViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [showTasksWithoutDates, setShowTasksWithoutDates] = useState(true);

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
        return value * 8 * 60; // 8 hour workday
      case "m":
      default:
        return value;
    }
  };

  // Get schedule for a specific date
  const getScheduleForDate = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
    const dayName = dayNames[dayOfWeek];

    if (workHours.useCommonSchedule) {
      return workHours.commonSchedule;
    }

    // Check for custom schedule
    const customSchedule = workHours.customSchedules[dayName];
    if (customSchedule) return customSchedule;

    // Use weekday/weekend schedule
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

  // Get todos for selected date
  const todosForDate = useMemo(() => {
    const dateKey = selectedDate.toISOString().split("T")[0];

    let filtered = todos.filter((todo) => {
      if (todo.state === "deleted" || todo.state === "completed" || todo.state === "archived") return false;

      if (!todo.metadata.dueDate) {
        return showTasksWithoutDates;
      }

      try {
        let dueDate: Date;
        const dueDateStr = todo.metadata.dueDate;

        if (dueDateStr.includes("T") || dueDateStr.includes("Z")) {
          dueDate = new Date(dueDateStr);
        } else if (dueDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dueDateStr.split("-").map(Number);
          dueDate = new Date(year, month - 1, day);
        } else {
          dueDate = new Date(dueDateStr);
        }

        if (isNaN(dueDate.getTime())) return false;

        const dueDateKey = dueDate.toISOString().split("T")[0];
        return dueDateKey === dateKey;
      } catch {
        return false;
      }
    });

    // Sort by priority
    const priorityOrder: Record<string, number> = { "0": 0, "1": 1, "2": 2, "3": 3, "4": 4 };
    filtered.sort((a, b) => {
      const aPriority = priorityOrder[a.metadata.priority?.toLowerCase() || ""] ?? 999;
      const bPriority = priorityOrder[b.metadata.priority?.toLowerCase() || ""] ?? 999;
      return aPriority - bPriority;
    });

    return filtered;
  }, [todos, selectedDate, showTasksWithoutDates]);

  // Count todos without due dates
  const todosWithoutDates = useMemo(() => {
    return todos.filter((todo) => !todo.metadata.dueDate && todo.state !== "deleted").length;
  }, [todos]);

  // Generate time slots for the day
  const timeSlots = useMemo(() => {
    const schedule = getScheduleForDate(selectedDate);
    const slots: TimeSlot[] = [];

    const startTime = parseTime(schedule.startTime, selectedDate);
    const endTime = parseTime(schedule.endTime, selectedDate);

    let currentTime = new Date(startTime);
    let todoIndex = 0;

    while (currentTime < endTime && todoIndex < todosForDate.length) {
      // Check if current time falls within a break
      const currentBreak = schedule.breaks.find((breakPeriod) => {
        const breakStart = parseTime(breakPeriod.startTime, selectedDate);
        const breakEnd = parseTime(breakPeriod.endTime, selectedDate);
        return currentTime >= breakStart && currentTime < breakEnd;
      });

      if (currentBreak) {
        const breakStart = parseTime(currentBreak.startTime, selectedDate);
        const breakEnd = parseTime(currentBreak.endTime, selectedDate);
        slots.push({
          startTime: breakStart,
          endTime: breakEnd,
          todo: null,
          isBreak: true,
          breakName: currentBreak.name,
        });
        currentTime = breakEnd;
        continue;
      }

      // Add task slot
      const todo = todosForDate[todoIndex];
      const duration = parseDuration(todo.metadata.duration);
      const taskEnd = new Date(currentTime.getTime() + duration * 60000);

      slots.push({
        startTime: new Date(currentTime),
        endTime: taskEnd,
        todo,
        isBreak: false,
      });

      // Add context switching time
      currentTime = new Date(taskEnd.getTime() + workHours.contextSwitchingTime * 60000);
      todoIndex++;
    }

    // Add remaining unscheduled tasks
    while (todoIndex < todosForDate.length) {
      const todo = todosForDate[todoIndex];
      slots.push({
        startTime: new Date(0),
        endTime: new Date(0),
        todo,
        isBreak: false,
      });
      todoIndex++;
    }

    return slots;
  }, [selectedDate, todosForDate, workHours]);

  const navigateDate = (delta: number) => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + delta);
      return newDate;
    });
  };

  const formatTime = (date: Date): string => {
    if (date.getTime() === 0) return "";
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
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

  const schedule = getScheduleForDate(selectedDate);
  const scheduledSlots = timeSlots.filter((slot) => slot.startTime.getTime() !== 0);
  const unscheduledSlots = timeSlots.filter((slot) => slot.startTime.getTime() === 0);
  const totalScheduledMinutes = scheduledSlots.reduce((sum, slot) => {
    if (slot.isBreak) return sum;
    return sum + Math.floor((slot.endTime.getTime() - slot.startTime.getTime()) / 60000);
  }, 0);

  return (
    <div className="space-y-4">
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
              aria-label="Show tasks without dates for today"
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
            title="Previous day"
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
              {schedule.startTime} - {schedule.endTime} • {scheduledSlots.length} tasks • {totalScheduledMinutes} min
              scheduled
            </p>
          </div>

          <button
            onClick={() => navigateDate(1)}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Next day"
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
            {/* Scheduled Tasks */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                Scheduled ({scheduledSlots.filter((s) => !s.isBreak).length})
              </h4>
              <div className="space-y-2">
                {scheduledSlots.map((slot, index) => {
                  if (slot.isBreak) {
                    return (
                      <div
                        key={`break-${index}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                      >
                        <div className="flex-shrink-0 w-20 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{slot.breakName}</span>
                        </div>
                      </div>
                    );
                  }

                  const todo = slot.todo!;
                  const duration = Math.floor((slot.endTime.getTime() - slot.startTime.getTime()) / 60000);

                  return (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex-shrink-0 w-20 text-sm font-mono text-zinc-900 dark:text-zinc-100 font-medium">
                        {formatTime(slot.startTime)}
                      </div>
                      <div className={`w-1 h-12 rounded-full ${getPriorityColor(todo.metadata.priority)}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{todo.plainText}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{duration} min</span>
                          {todo.metadata.priority && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              • Priority: {todo.metadata.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                        {formatTime(slot.endTime)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unscheduled Tasks */}
            {unscheduledSlots.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                  Can't Fit in Schedule ({unscheduledSlots.length})
                </h4>
                <div className="space-y-2">
                  {unscheduledSlots.map((slot) => {
                    const todo = slot.todo!;
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
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{duration} min</span>
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
    </div>
  );
}
