"use client";

import { Todo, TodoMetadata } from "@/types/todo";
import { MarkerColors, WorkHoursSettings } from "@/types/settings";
import { useMemo, useState, useRef } from "react";
import { MarkedText } from "@/components/MarkedText";
import SmartEditableInput, { SmartEditableInputHandle, TokenMatch } from "@/components/SmartInput";
import { MarkerReference } from "@/components/MarkerReference";
import { TodoDetailsOverlay } from "@/components/TodoDetailsOverlay";

interface GanttViewProps {
  todos: Todo[];
  markerColors: MarkerColors;
  workHours: WorkHoursSettings;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTodo: (id: string, text: string, plainText: string, metadata: TodoMetadata) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  generalSettings: import("@/types/settings").GeneralSettings;
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
  generalSettings,
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
  const [showTasksWithoutDates, setShowTasksWithoutDates] = useState(true);
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
    let currentTime = new Date(dayStartTime);
    const now = new Date();

    for (const todo of todosForDate) {
      // Check if we're in a break
      let inBreak = true;
      while (inBreak && currentTime < dayEndTime) {
        inBreak = false;
        for (const breakBlock of breakBlocks) {
          if (currentTime >= breakBlock.startTime && currentTime < breakBlock.endTime) {
            currentTime = new Date(breakBlock.endTime);
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

      // Calculate target date (end of selected day by default, or now if today)
      const isToday = selectedDate.toDateString() === new Date().toDateString();
      const targetDate = isToday && now > dayStartTime && now < dayEndTime ? now : dayEndTime;

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
              <div className="relative h-6 bg-zinc-50 dark:bg-zinc-800 rounded">
                {hourMarkers.map((marker, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 flex flex-col items-center"
                    style={{ left: `${marker.position}%` }}
                  >
                    <div className="w-px h-2 bg-zinc-300 dark:bg-zinc-600" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{formatTime(marker.time)}</span>
                  </div>
                ))}
              </div>

              {/* Tasks timeline */}
              <div className="relative space-y-0">
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
                                left: `${(endPos + Math.min(targetPos, 100)) / 2}%`,
                                transform: "translate(-50%, -50%)",
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
                                left: `${(Math.max(targetPos, 0) + endPos) / 2}%`,
                                transform: "translate(-50%, -50%)",
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

                      {/* Context switching buffer - spans between this task and next */}
                      {hasContextSwitch && contextSwitchWidth > 0 && (
                        <div
                          className="absolute left-0 right-0 bg-blue-400 dark:bg-blue-600 opacity-40 border-l-2 border-r-2 border-blue-500 dark:border-blue-400 border-dashed z-5"
                          style={{
                            top: "100%",
                            left: `${contextSwitchStartPos}%`,
                            width: `${contextSwitchWidth}%`,
                            height: "10px",
                          }}
                        />
                      )}

                      {/* Hover tooltip - positioned outside task bar */}
                      {hoveredTaskId === task.todo.id && (
                        <div className="absolute left-4 top-full mt-2 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl p-3 min-w-[300px] max-w-[500px] pointer-events-none">
                          <MarkedText text={task.todo.text} markerColors={markerColors} />
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
              generalSettings={generalSettings}
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
