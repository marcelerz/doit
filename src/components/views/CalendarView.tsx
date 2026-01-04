"use client";

import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { Settings } from "@/types/settings";
import { MarkerColors } from "@/types/markerColors";
import { CalendarView as CalendarViewType, Calendar } from "@/types/calendar";
import { CommentId } from "@/types/types";
import { TodoId, SubtaskId, TimeEntryId, TodoMetadata } from "@/types/todo";
import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { TodoItem } from "@/components/items/TodoItem";
import { TodoDetailsOverlay } from "@/components/overlays/TodoDetailsOverlay";
import { Priority } from "@/types/priority";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storage";
import { TutorialStep } from "@/components/overlays/TutorialOverlay";
import {
  RefreshIcon,
  WarningIcon,
  InfoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PrintIcon,
} from "@/components/shared/Icons";

// Calendar View Tutorial Steps
export const calendarViewTutorialSteps: TutorialStep[] = [
  {
    id: "calendar-intro",
    title: "Calendar View 🗓️",
    description: "The Calendar View shows your tasks on a monthly calendar. See at a glance what's due each day.",
    position: "center",
  },
  {
    id: "calendar-dots",
    title: "Task Indicators 🔵",
    description:
      "Each dot represents a task due that day. The color indicates:\n\n• Blue - Active task\n• Green - Completed\n• Gray - Archived\n\nMultiple dots = multiple tasks!",
    targetSelector: '[data-tutorial="calendar-grid"]',
    position: "top",
    spotlightPadding: 12,
    fallbackHint: "The calendar grid shows all days of the month with colored dots for tasks",
  },
  {
    id: "calendar-click",
    title: "Click to Expand 👆",
    description:
      "Click any day to see all tasks due on that date. From there you can:\n• View task details\n• Complete tasks\n• Edit due dates",
    position: "center",
    action: "Click on a day with tasks!",
  },
  {
    id: "calendar-navigation",
    title: "Navigate Months 📆",
    description: 'Use the arrow buttons to navigate between months. Click "Today" to jump back to the current date.',
    targetSelector: '[data-tutorial="calendar-nav"]',
    position: "bottom",
    spotlightPadding: 8,
    fallbackHint: "Navigation arrows and Today button are at the top of the calendar",
  },
  {
    id: "calendar-complete",
    title: "Stay on Schedule! 🎉",
    description:
      "You're ready to use the Calendar View! Add due dates to your tasks to see them appear on the calendar.",
    position: "center",
  },
];

interface CalendarViewProps {
  todos: TodoModel[];
  markerColors: MarkerColors;
  settings: Settings;
  linkPatterns: any[];
  availablePeople: PersonModel[];
  availableProjects: ProjectModel[];
  availablePriorities: Priority[];
  onToggle: (id: TodoId) => void;
  onDelete: (id: TodoId) => void;
  onArchive: (id: TodoId) => void;
  onUnarchive: (id: TodoId) => void;
  onEdit: (id: TodoId, text: string, plainText: string, metadata: TodoMetadata) => void;
  onAddPerson: (name: string) => void;
  onAddProject: (name: string) => void;
  onAddPriority: (name: string) => void;
  onAddComment: (todoId: TodoId, content: string) => void;
  onEditComment: (todoId: TodoId, commentId: CommentId, content: string) => void;
  onDeleteComment: (todoId: TodoId, commentId: CommentId) => void;
  onQuickAdd?: (dueDate: string) => void;
  // Subtask handlers
  onAddSubtask?: (todoId: TodoId, text: string) => void;
  onToggleSubtask?: (todoId: TodoId, subtaskId: SubtaskId) => void;
  onEditSubtask?: (todoId: TodoId, subtaskId: SubtaskId, text: string) => void;
  onDeleteSubtask?: (todoId: TodoId, subtaskId: SubtaskId) => void;
  // Time tracking handlers
  onStartTimeTracking?: (todoId: TodoId, note?: string) => void;
  onStopTimeTracking?: (todoId: TodoId) => void;
  onAddManualTimeEntry?: (todoId: TodoId, minutes: number, note?: string) => void;
  onDeleteTimeEntry?: (todoId: TodoId, entryId: TimeEntryId) => void;
  // Template handler
  onCreateTemplate?: (todoId: TodoId) => void;
  // Duplicate handler
  onDuplicate?: (id: TodoId) => TodoId | undefined;
}

// Get week number for a date
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function CalendarView({
  todos,
  markerColors,
  settings,
  linkPatterns,
  availablePeople,
  availableProjects,
  availablePriorities,
  onToggle,
  onDelete,
  onArchive,
  onUnarchive,
  onEdit,
  onAddPerson,
  onAddProject,
  onAddPriority,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onQuickAdd,
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
}: CalendarViewProps) {
  const calendarSettings: Calendar = settings.calendar || {
    weekStartDay: 0,
    defaultView: "month",
    showWeekNumbers: false,
    taskDotLimit: 4,
    dotColorBy: "state",
    showOverdueBadge: true,
    showRecurringIndicator: true,
    showTaskCount: false,
  };

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [detailsOverlayTodo, setDetailsOverlayTodo] = useState<TodoModel | null>(null);

  // View options state - initialized with defaults, loaded from storage in useEffect
  const [viewMode, setViewMode] = useState<CalendarViewType>(calendarSettings.defaultView);
  const [sortField, setSortField] = useState<"priority" | "duration" | "created">("created");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showTasksWithoutDates, setShowTasksWithoutDates] = useState(true);
  const [calendarOptionsLoaded, setCalendarOptionsLoaded] = useState(false);
  const [focusedDateIndex, setFocusedDateIndex] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Load persisted view options from storage
  useEffect(() => {
    waitForStorageInit()
      .then(() => {
        return loadFromStorage<{
          viewMode?: CalendarViewType;
          sortField?: "priority" | "duration" | "created";
          sortDirection?: "asc" | "desc";
          showTasksWithoutDates?: boolean;
        }>(STORAGE_KEYS.CALENDAR_VIEW_OPTIONS, {});
      })
      .then((saved) => {
        if (saved.viewMode !== undefined) setViewMode(saved.viewMode);
        if (saved.sortField !== undefined) setSortField(saved.sortField);
        if (saved.sortDirection !== undefined) setSortDirection(saved.sortDirection);
        if (saved.showTasksWithoutDates !== undefined) setShowTasksWithoutDates(saved.showTasksWithoutDates);
        setCalendarOptionsLoaded(true);
      });
  }, []);

  // Persist Calendar view options to storage (only after initial load)
  useEffect(() => {
    if (!calendarOptionsLoaded) return;
    const viewOptions = {
      viewMode,
      sortField,
      sortDirection,
      showTasksWithoutDates,
    };
    saveToStorage(STORAGE_KEYS.CALENDAR_VIEW_OPTIONS, viewOptions);
  }, [calendarOptionsLoaded, viewMode, sortField, sortDirection, showTasksWithoutDates]);

  // Get day headers based on week start
  const dayHeaders = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (calendarSettings.weekStartDay === 1) {
      return [...days.slice(1), days[0]];
    }
    return days;
  }, [calendarSettings.weekStartDay]);

  // Get today's date key for todos without dates
  const todayKey = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Get todos by date - uses TodoModel.dueDateKey instead of parsing metadata
  const todosByDate = useMemo(() => {
    const map = new Map<string, TodoModel[]>();

    // First, add todos without due dates to today (if toggle is on)
    if (showTasksWithoutDates) {
      const todosWithoutDates = todos.filter((todo) => !todo.hasDueDate && !todo.isDeleted);
      if (todosWithoutDates.length > 0) {
        map.set(todayKey, [...todosWithoutDates]);
      }
    }

    // Then add todos with due dates using the model's dueDateKey
    todos
      .filter((todo) => todo.hasDueDate && !todo.isDeleted)
      .forEach((todo) => {
        const dateKey = todo.dueDateKey!;
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(todo);
      });

    return map;
  }, [todos, showTasksWithoutDates, todayKey]);

  // Count todos without due dates
  const todosWithoutDatesCount = useMemo(() => {
    return todos.filter((todo) => !todo.hasDueDate && !todo.isDeleted).length;
  }, [todos]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);

    // Adjust for week start day
    let startDayOffset = firstDay.getDay();
    if (calendarSettings.weekStartDay === 1) {
      startDayOffset = startDayOffset === 0 ? 6 : startDayOffset - 1;
    }
    startDate.setDate(startDate.getDate() - startDayOffset);

    const days = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const keyYear = current.getFullYear();
      const keyMonth = (current.getMonth() + 1).toString().padStart(2, "0");
      const keyDay = current.getDate().toString().padStart(2, "0");
      const dateKey = `${keyYear}-${keyMonth}-${keyDay}`;
      const todosForDay = todosByDate.get(dateKey) || [];
      const isCurrentMonth = current.getMonth() === month;

      // Check for overdue tasks
      const currentDate = new Date(current);
      currentDate.setHours(0, 0, 0, 0);
      const overdueTasks = todosForDay.filter((todo) => todo.state === "active" && currentDate < today);

      // Check for recurring tasks - use TodoModel.isRecurring
      const recurringTasks = todosForDay.filter((todo) => todo.isRecurring);

      days.push({
        date: new Date(current),
        dateKey,
        todos: todosForDay,
        isCurrentMonth,
        isToday: current.toDateString() === today.toDateString(),
        weekNumber: getWeekNumber(current),
        overdueTasks,
        recurringTasks,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth, todosByDate, calendarSettings.weekStartDay]);

  // Get week days for week view
  const weekDays = useMemo(() => {
    if (!selectedDate) return [];

    const startOfWeek = new Date(selectedDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = calendarSettings.weekStartDay === 1 ? (dayOfWeek === 0 ? -6 : 1 - dayOfWeek) : -dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const keyYear = date.getFullYear();
      const keyMonth = (date.getMonth() + 1).toString().padStart(2, "0");
      const keyDay = date.getDate().toString().padStart(2, "0");
      const dateKey = `${keyYear}-${keyMonth}-${keyDay}`;
      days.push({
        date,
        dateKey,
        todos: todosByDate.get(dateKey) || [],
        isToday: date.toDateString() === new Date().toDateString(),
      });
    }
    return days;
  }, [selectedDate, todosByDate, calendarSettings.weekStartDay]);

  // Agenda view - upcoming tasks
  const agendaTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get next 14 days
    const upcoming: { date: Date; dateKey: string; todos: TodoModel[] }[] = [];

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const keyYear = date.getFullYear();
      const keyMonth = (date.getMonth() + 1).toString().padStart(2, "0");
      const keyDay = date.getDate().toString().padStart(2, "0");
      const dateKey = `${keyYear}-${keyMonth}-${keyDay}`;
      const dayTodos = todosByDate.get(dateKey) || [];

      if (dayTodos.length > 0 || i === 0) {
        upcoming.push({ date, dateKey, todos: dayTodos });
      }
    }

    return upcoming;
  }, [todosByDate]);

  const navigateMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + delta);
      return newMonth;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date.toDateString() === selectedDate?.toDateString() ? null : date);
  };

  const handleQuickAdd = (date: Date) => {
    if (onQuickAdd) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      onQuickAdd(`${year}-${month}-${day}`);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!calendarRef.current?.contains(document.activeElement)) return;

      const daysInView = viewMode === "week" ? 7 : 42;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setFocusedDateIndex((prev) => (prev === null ? 0 : Math.max(0, prev - 1)));
          break;
        case "ArrowRight":
          e.preventDefault();
          setFocusedDateIndex((prev) => (prev === null ? 0 : Math.min(daysInView - 1, prev + 1)));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedDateIndex((prev) => (prev === null ? 0 : Math.max(0, prev - 7)));
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedDateIndex((prev) => (prev === null ? 0 : Math.min(daysInView - 1, prev + 7)));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedDateIndex !== null) {
            const days = viewMode === "week" ? weekDays : calendarDays;
            if (days[focusedDateIndex]) {
              handleDateClick(days[focusedDateIndex].date);
            }
          }
          break;
        case "t":
        case "T":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            goToToday();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusedDateIndex, viewMode, calendarDays, weekDays]);

  // Get todos for selected date
  const selectedDateTodos = useMemo(() => {
    if (!selectedDate) return [];
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
    const day = selectedDate.getDate().toString().padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;
    const dayTodos = todosByDate.get(dateKey) || [];

    return [...dayTodos].sort((a, b) => {
      let comparison = 0;

      if (sortField === "priority") {
        // Use TodoModel.priorityOrder for proper sorting (lower = higher priority)
        const aPriority = a.priorityOrder ?? 999;
        const bPriority = b.priorityOrder ?? 999;
        comparison = aPriority - bPriority;
      } else if (sortField === "duration") {
        const aDuration = a.durationMinutes ?? 0;
        const bDuration = b.durationMinutes ?? 0;
        comparison = aDuration - bDuration;
      } else {
        comparison = b.createdAt - a.createdAt;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [selectedDate, todosByDate, sortField, sortDirection]);

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Get dot color based on settings
  const getDotColor = (todo: TodoModel) => {
    switch (calendarSettings.dotColorBy) {
      case "priority": {
        // Use priorityOrder for comparison (lower order = higher priority)
        const order = todo.priorityOrder;
        if (order === 0) return "bg-red-500"; // urgent
        if (order === 1) return "bg-orange-500"; // high
        if (order === 2) return "bg-yellow-500"; // medium
        if (order === 3) return "bg-green-500"; // low
        return "bg-zinc-400";
      }
      case "project": {
        const projectName = todo.projects[0];
        if (projectName) {
          const project = availableProjects.find(
            (p) => p.name === projectName || p.alternatives?.includes(projectName),
          );
          if (project?.color) {
            return ""; // Will use style instead
          }
        }
        return "bg-purple-500";
      }
      case "state":
      default:
        switch (todo.state) {
          case "completed":
            return "bg-green-500";
          case "archived":
            return "bg-zinc-400";
          case "active":
          default:
            return "bg-blue-500";
        }
    }
  };

  const getProjectColor = (todo: TodoModel): string | undefined => {
    if (calendarSettings.dotColorBy !== "project") return undefined;
    const projectName = todo.projects[0];
    if (projectName) {
      const project = availableProjects.find((p) => p.name === projectName || p.alternatives?.includes(projectName));
      return project?.color;
    }
    return undefined;
  };

  // Render a day cell
  const renderDayCell = (day: (typeof calendarDays)[0], index: number) => {
    const isFocused = focusedDateIndex === index;

    return (
      <button
        key={day.dateKey}
        onClick={() => handleDateClick(day.date)}
        onDoubleClick={() => day.todos.length === 0 && handleQuickAdd(day.date)}
        tabIndex={isFocused ? 0 : -1}
        aria-label={`${day.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, ${
          day.todos.length
        } tasks`}
        aria-selected={selectedDate?.toDateString() === day.date.toDateString()}
        className={`h-12 p-0.5 rounded-lg border transition-colors relative ${
          day.isCurrentMonth
            ? "border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600"
            : "border-transparent bg-zinc-50 dark:bg-zinc-800/50"
        } ${day.isToday ? "ring-2 ring-blue-500" : ""} ${
          selectedDate?.toDateString() === day.date.toDateString()
            ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500"
            : day.todos.length > 0
            ? "bg-white dark:bg-zinc-900"
            : "bg-zinc-50 dark:bg-zinc-800/30"
        } ${isFocused ? "ring-2 ring-offset-1 ring-blue-400" : ""} cursor-pointer group`}
      >
        {/* Day number in top right */}
        <div className="absolute top-0.5 right-1 flex items-center gap-1">
          {/* Task count badge */}
          {calendarSettings.showTaskCount && day.todos.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full">
              {day.todos.length}
            </span>
          )}
          <span
            className={`text-xs font-medium ${
              day.isCurrentMonth ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600"
            }`}
          >
            {day.date.getDate()}
          </span>
        </div>

        {/* Overdue badge */}
        {calendarSettings.showOverdueBadge && day.overdueTasks.length > 0 && (
          <div className="absolute top-0.5 left-0.5">
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 dark:text-red-400"
              title={`${day.overdueTasks.length} overdue`}
            >
              <WarningIcon className="w-3 h-3" />
              {day.overdueTasks.length}
            </span>
          </div>
        )}

        {/* Recurring indicator */}
        {calendarSettings.showRecurringIndicator && day.recurringTasks.length > 0 && !day.overdueTasks.length && (
          <div className="absolute top-0.5 left-0.5">
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-600 dark:text-green-400"
              title={`${day.recurringTasks.length} recurring`}
            >
              <RefreshIcon className="w-3 h-3" />
              {day.recurringTasks.length}
            </span>
          </div>
        )}

        {/* Todo dots at bottom center */}
        {day.todos.length > 0 && (
          <div className="absolute bottom-0.5 left-0 right-0 flex justify-center items-center gap-0.5">
            {day.todos.slice(0, calendarSettings.taskDotLimit).map((todo) => {
              const projectColor = getProjectColor(todo);
              return (
                <div
                  key={todo.id}
                  className={`w-1.5 h-1.5 rounded-full ${getDotColor(todo)}`}
                  style={projectColor ? { backgroundColor: projectColor } : undefined}
                  title={todo.plainText}
                />
              );
            })}
            {day.todos.length > calendarSettings.taskDotLimit && (
              <span
                className="text-[8px] text-zinc-500 dark:text-zinc-400 ml-0.5"
                title={`+${day.todos.length - calendarSettings.taskDotLimit} more`}
              >
                +{day.todos.length - calendarSettings.taskDotLimit}
              </span>
            )}
          </div>
        )}

        {/* Quick add hint on hover for empty days */}
        {day.todos.length === 0 && onQuickAdd && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-zinc-400 dark:text-zinc-500 text-lg">+</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div
      className="space-y-4 print:space-y-2"
      ref={calendarRef}
      role="application"
      aria-label="Calendar"
      data-testid="calendar-view"
    >
      {/* Toggle for todos without dates */}
      {todosWithoutDatesCount > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800 print:hidden">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <InfoIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
                {todosWithoutDatesCount} {todosWithoutDatesCount === 1 ? "task" : "tasks"} without dates
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 hidden sm:block">
                {showTasksWithoutDates ? "Shown under today's date" : "Not shown in calendar"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowTasksWithoutDates(!showTasksWithoutDates)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showTasksWithoutDates ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
                role="switch"
                aria-checked={showTasksWithoutDates}
                aria-label="Show tasks without dates for today"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showTasksWithoutDates ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-xs font-medium text-blue-900 dark:text-blue-100 whitespace-nowrap hidden sm:inline">
                Show for today
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:p-6 print:p-2 print:border-0">
        {/* Header with navigation and controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 print:mb-2">
          {/* Month navigation */}
          <div className="flex items-center gap-1 sm:gap-2" data-tutorial="calendar-nav">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors print:hidden"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 min-w-[140px] sm:min-w-[180px] text-center">
              {formatMonthYear(currentMonth)}
            </h3>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors print:hidden"
              aria-label="Next month"
            >
              <ChevronRightIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-2 print:hidden">
            {/* Today button */}
            <button
              onClick={goToToday}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Go to today (T)"
            >
              Today
            </button>

            {/* View mode toggle */}
            <div
              className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden"
              role="group"
              aria-label="View mode"
            >
              {(["month", "week", "agenda"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  aria-pressed={viewMode === mode}
                  className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Print button */}
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
              title="Print calendar"
              aria-label="Print calendar"
            >
              <PrintIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="text-xs text-zinc-400 dark:text-zinc-500 mb-2 print:hidden">
          <span className="hidden md:inline">Use arrow keys to navigate, Enter to select, T for today</span>
        </div>

        {/* Month View */}
        {viewMode === "month" && (
          <>
            {/* Day headers */}
            <div className={`grid gap-1 mb-2 ${calendarSettings.showWeekNumbers ? "grid-cols-8" : "grid-cols-7"}`}>
              {calendarSettings.showWeekNumbers && (
                <div className="text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 py-2">Wk</div>
              )}
              {dayHeaders.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 py-1 sm:py-2"
                >
                  <span className="sm:hidden">{day.charAt(0)}</span>
                  <span className="hidden sm:inline">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div
              className={`grid gap-1 ${calendarSettings.showWeekNumbers ? "grid-cols-8" : "grid-cols-7"}`}
              role="grid"
              data-tutorial="calendar-grid"
            >
              {calendarDays.map((day, i) => (
                <Fragment key={day.dateKey}>
                  {calendarSettings.showWeekNumbers && i % 7 === 0 && (
                    <div className="flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
                      {day.weekNumber}
                    </div>
                  )}
                  {renderDayCell(day, i)}
                </Fragment>
              ))}
            </div>
          </>
        )}

        {/* Week View */}
        {viewMode === "week" && (
          <div className="space-y-4">
            {/* Week header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 overflow-x-auto">
              {weekDays.map((day, i) => (
                <button
                  key={day.dateKey}
                  onClick={() => handleDateClick(day.date)}
                  className={`p-1.5 sm:p-3 rounded-lg border transition-colors min-w-[40px] ${
                    day.isToday ? "ring-2 ring-blue-500" : ""
                  } ${
                    selectedDate?.toDateString() === day.date.toDateString()
                      ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-blue-400"
                  }`}
                >
                  <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="sm:hidden">{day.date.toLocaleDateString("en-US", { weekday: "narrow" })}</span>
                    <span className="hidden sm:inline">
                      {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                  </div>
                  <div className="text-sm sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {day.date.getDate()}
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="sm:hidden">{day.todos.length}</span>
                    <span className="hidden sm:inline">{day.todos.length} tasks</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Week tasks list */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekDays.map((day) => (
                <div key={day.dateKey} className="space-y-0.5 sm:space-y-1 min-h-[60px] sm:min-h-[100px]">
                  {day.todos.slice(0, 3).map((todo) => (
                    <div
                      key={todo.id}
                      className={`p-1 sm:p-1.5 rounded text-[10px] sm:text-xs truncate cursor-pointer hover:opacity-80 ${
                        todo.state === "completed" ? "line-through opacity-60" : ""
                      }`}
                      style={{
                        backgroundColor: getProjectColor(todo) || (todo.state === "active" ? "#dbeafe" : "#f3f4f6"),
                        color: "#1f2937",
                      }}
                      onClick={() => {
                        setSelectedDate(day.date);
                      }}
                      title={todo.plainText}
                    >
                      {todo.plainText}
                    </div>
                  ))}
                  {day.todos.length > 3 && (
                    <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 text-center">
                      +{day.todos.length - 3}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agenda View */}
        {viewMode === "agenda" && (
          <div className="space-y-4">
            {agendaTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">No upcoming tasks</p>
              </div>
            ) : (
              agendaTasks.map((day) => (
                <div key={day.dateKey} className="border-b border-zinc-100 dark:border-zinc-800 pb-4 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`text-sm font-medium ${
                        day.date.toDateString() === new Date().toDateString()
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {day.date.toDateString() === new Date().toDateString()
                        ? "Today"
                        : day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {day.todos.length} task{day.todos.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {day.todos.length > 0 ? (
                    <div className="space-y-2 ml-4">
                      {day.todos.map((todo) => (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          onToggle={onToggle}
                          onDelete={onDelete}
                          onArchive={onArchive}
                          onUnarchive={onUnarchive}
                          onEdit={onEdit}
                          markerColors={markerColors}
                          settings={settings}
                          linkPatterns={linkPatterns}
                          availablePeople={availablePeople}
                          availableProjects={availableProjects}
                          availablePriorities={availablePriorities}
                          onAddPerson={onAddPerson}
                          onAddProject={onAddProject}
                          onAddPriority={onAddPriority}
                          onMarkerClick={() => {}}
                          isExpanded={false}
                          onToggleExpand={() => {}}
                          onAddComment={onAddComment}
                          onEditComment={onEditComment}
                          onDeleteComment={onDeleteComment}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 ml-4">No tasks</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected date todos (only in month view) */}
      {viewMode === "month" && selectedDate && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:p-6 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Tasks for {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </h3>

            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {/* Quick add button */}
              {onQuickAdd && (
                <button
                  onClick={() => handleQuickAdd(selectedDate)}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  + Add
                </button>
              )}

              {/* Sort controls - only show when there are tasks */}
              {selectedDateTodos.length > 0 && (
                <>
                  <label className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:inline">
                    Sort:
                  </label>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as "priority" | "duration" | "created")}
                    className="px-2 sm:px-3 py-1.5 text-base sm:text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="created">Created</option>
                    <option value="priority">Priority</option>
                    <option value="duration">Duration</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                    className="p-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    title={sortDirection === "asc" ? "Ascending" : "Descending"}
                  >
                    {sortDirection === "asc" ? (
                      <ChevronUpIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {selectedDateTodos.length > 0 ? (
            <div className="space-y-2">
              {selectedDateTodos.map((todo) => (
                <div key={todo.id} onClick={() => setDetailsOverlayTodo(todo)} className="cursor-pointer">
                  <TodoItem
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onArchive={onArchive}
                    onUnarchive={onUnarchive}
                    onEdit={onEdit}
                    markerColors={markerColors}
                    settings={settings}
                    linkPatterns={linkPatterns}
                    availablePeople={availablePeople}
                    availableProjects={availableProjects}
                    availablePriorities={availablePriorities}
                    onAddPerson={onAddPerson}
                    onAddProject={onAddProject}
                    onAddPriority={onAddPriority}
                    onMarkerClick={() => {}}
                    isExpanded={false}
                    onToggleExpand={() => setDetailsOverlayTodo(todo)}
                    onAddComment={onAddComment}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">No tasks planned for this day</p>
              {onQuickAdd && (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
                  Double-click on a day or click &quot;Add Task&quot; to create one
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Todo Details Overlay */}
      {detailsOverlayTodo &&
        (() => {
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
              onEdit={onEdit}
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
    </div>
  );
}
