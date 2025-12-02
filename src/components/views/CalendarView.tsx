"use client";

import { Todo } from "@/types/todo";
import { MarkerColors } from "@/types/settings";
import { useState, useMemo } from "react";
import { TodoItem } from "../TodoItem";
import { GeneralSettings, Person, Project, Priority } from "@/types/settings";

interface CalendarViewProps {
  todos: Todo[];
  markerColors: MarkerColors;
  generalSettings: GeneralSettings;
  linkPatterns: any[];
  availablePeople: Person[];
  availableProjects: Project[];
  availablePriorities: Priority[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onEdit: (id: string, text: string, plainText: string, metadata: any) => void;
  onAddPerson: (name: string) => void;
  onAddProject: (name: string) => void;
  onAddPriority: (name: string) => void;
  onAddComment: (todoId: string, content: string) => void;
  onEditComment: (todoId: string, commentId: number, content: string) => void;
  onDeleteComment: (todoId: string, commentId: number) => void;
}

export function CalendarView({
  todos,
  markerColors,
  generalSettings,
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
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [sortField, setSortField] = useState<"priority" | "duration" | "created">("created");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showTasksWithoutDates, setShowTasksWithoutDates] = useState(true);

  // Get todos by date
  const todosByDate = useMemo(() => {
    const map = new Map<string, Todo[]>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().split("T")[0];

    // First, add todos without due dates to today (if toggle is on)
    if (showTasksWithoutDates) {
      const todosWithoutDates = todos.filter((todo) => !todo.metadata.dueDate && todo.state !== "deleted");
      if (todosWithoutDates.length > 0) {
        map.set(todayKey, [...todosWithoutDates]);
      }
    }

    // Then add todos with due dates
    todos
      .filter((todo) => todo.metadata.dueDate && todo.state !== "deleted")
      .forEach((todo) => {
        try {
          let dueDate: Date;
          const dueDateStr = todo.metadata.dueDate!;

          // Try to parse various date formats
          if (dueDateStr.includes("T") || dueDateStr.includes("Z")) {
            // ISO format
            dueDate = new Date(dueDateStr);
          } else if (dueDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // YYYY-MM-DD format - parse as local date
            const [year, month, day] = dueDateStr.split("-").map(Number);
            dueDate = new Date(year, month - 1, day);
          } else {
            // Try standard Date parsing
            dueDate = new Date(dueDateStr);
          }

          if (isNaN(dueDate.getTime())) {
            return; // Invalid date
          }

          const dateKey = dueDate.toISOString().split("T")[0];

          if (!map.has(dateKey)) {
            map.set(dateKey, []);
          }
          map.get(dateKey)!.push(todo);
        } catch {
          // Invalid date, skip
        }
      });

    return map;
  }, [todos, showTasksWithoutDates]);

  // Count todos without due dates
  const todosWithoutDates = useMemo(() => {
    return todos.filter((todo) => !todo.metadata.dueDate && todo.state !== "deleted").length;
  }, [todos]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateKey = current.toISOString().split("T")[0];
      const todosForDay = todosByDate.get(dateKey) || [];
      const isCurrentMonth = current.getMonth() === month;

      days.push({
        date: new Date(current),
        dateKey,
        todos: todosForDay,
        isCurrentMonth,
        isToday: current.toDateString() === new Date().toDateString(),
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth, todosByDate]);

  const navigateMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + delta);
      return newMonth;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date.toDateString() === selectedDate?.toDateString() ? null : date);
  };

  // Get todos for selected date
  const selectedDateTodos = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split("T")[0];
    const dayTodos = todosByDate.get(dateKey) || [];

    // Sort todos
    return [...dayTodos].sort((a, b) => {
      let comparison = 0;

      if (sortField === "priority") {
        const priorityOrder: Record<string, number> = { "0": 0, "1": 1, "2": 2, "3": 3, "4": 4 };
        const aPriority = priorityOrder[a.metadata.priority?.toLowerCase() || ""] ?? 999;
        const bPriority = priorityOrder[b.metadata.priority?.toLowerCase() || ""] ?? 999;
        comparison = aPriority - bPriority;
      } else if (sortField === "duration") {
        const aDuration = a.metadata.duration || "";
        const bDuration = b.metadata.duration || "";
        comparison = aDuration.localeCompare(bDuration);
      } else {
        comparison = b.createdAt - a.createdAt;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [selectedDate, todosByDate, sortField, sortDirection]);

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getStateColor = (state: Todo["state"]) => {
    switch (state) {
      case "completed":
        return "bg-green-500";
      case "archived":
        return "bg-zinc-400";
      case "active":
      default:
        return "bg-blue-500";
    }
  };

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
                {showTasksWithoutDates ? "Shown under today's date" : "Not shown in calendar"}
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

      {/* Calendar */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
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
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{formatMonthYear(currentMonth)}</h3>
          <button
            onClick={() => navigateMonth(1)}
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

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => (
            <button
              key={i}
              onClick={() => handleDateClick(day.date)}
              className={`h-10 p-0.5 rounded-lg border transition-colors relative ${
                day.isCurrentMonth
                  ? "border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600"
                  : "border-transparent bg-zinc-50 dark:bg-zinc-800/50"
              } ${day.isToday ? "ring-2 ring-blue-500" : ""} ${
                selectedDate?.toDateString() === day.date.toDateString()
                  ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500"
                  : day.todos.length > 0
                  ? "bg-white dark:bg-zinc-900"
                  : "bg-zinc-50 dark:bg-zinc-800/30"
              } cursor-pointer`}
            >
              {/* Day number in top right */}
              <div className="absolute top-0.5 right-0.5">
                <span
                  className={`text-xs font-medium ${
                    day.isCurrentMonth ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {day.date.getDate()}
                </span>
              </div>

              {/* Todo dots at bottom center */}
              {day.todos.length > 0 && (
                <div className="absolute bottom-0.5 left-0 right-0 flex justify-center gap-0.5">
                  {day.todos.slice(0, 4).map((todo, j) => (
                    <div
                      key={j}
                      className={`w-1.5 h-1.5 rounded-full ${getStateColor(todo.state)}`}
                      title={todo.plainText}
                    />
                  ))}
                  {day.todos.length > 4 && (
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600"
                      title={`+${day.todos.length - 4} more`}
                    />
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected date todos */}
      {selectedDate && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Tasks for {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>

            {/* Sort controls - only show when there are tasks */}
            {selectedDateTodos.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sort:</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="px-3 py-1 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created">Created</option>
                  <option value="priority">Priority</option>
                  <option value="duration">Duration</option>
                </select>
                <button
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  className="p-1 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  title={sortDirection === "asc" ? "Ascending" : "Descending"}
                >
                  <svg
                    className="w-4 h-4 text-zinc-700 dark:text-zinc-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {sortDirection === "asc" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                </button>
              </div>
            )}
          </div>

          {selectedDateTodos.length > 0 ? (
            <div className="space-y-2">
              {selectedDateTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onArchive={onArchive}
                  onUnarchive={onUnarchive}
                  onEdit={onEdit}
                  markerColors={markerColors}
                  generalSettings={generalSettings}
                  linkPatterns={linkPatterns}
                  availablePeople={availablePeople}
                  availableProjects={availableProjects}
                  availablePriorities={availablePriorities}
                  availableTodos={todos}
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
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">No tasks planned for this day</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
