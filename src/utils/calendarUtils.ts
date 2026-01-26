/**
 * Calendar View Utility Functions
 *
 * Pure business logic extracted from CalendarView.tsx for better testability.
 */

import { TodoModel } from "@/models/TodoModel";
import { ProjectModel } from "@/models/ProjectModel";
import { Priority } from "@/types/priority";

/**
 * Day data for calendar grid
 */
export interface CalendarDay {
  date: Date;
  dateKey: string;
  todos: TodoModel[];
  isCurrentMonth: boolean;
  isToday: boolean;
  weekNumber: number;
  overdueTasks: TodoModel[];
  recurringTasks: TodoModel[];
}

/**
 * Week day data for week view
 */
export interface WeekDay {
  date: Date;
  dateKey: string;
  todos: TodoModel[];
  isToday: boolean;
}

/**
 * Agenda day data
 */
export interface AgendaDay {
  date: Date;
  dateKey: string;
  todos: TodoModel[];
}

/**
 * Dot color configuration
 */
export type DotColorBy = "state" | "priority" | "project";

/**
 * Calculate ISO 8601 week number for a date
 * @param date - The date to get week number for
 * @returns Week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get day headers based on week start day
 * @param weekStartDay - 0 for Sunday, 1 for Monday
 * @returns Array of day abbreviations
 */
export function getDayHeaders(weekStartDay: number): string[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (weekStartDay === 1) {
    return [...days.slice(1), days[0]];
  }
  return days;
}

/**
 * Format a date to YYYY-MM-DD key format
 * @param date - Date to format
 * @returns Date key string
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date key
 * @param now - Current date (for testing)
 * @returns Today's date key
 */
export function getTodayKey(now: Date = new Date()): string {
  return formatDateKey(now);
}

/**
 * Group todos by their due date
 * @param todos - Array of todos to group
 * @param showWithoutDates - Whether to show todos without dates under today
 * @param todayKey - Today's date key
 * @returns Map of date keys to todo arrays
 */
export function groupTodosByDate(
  todos: TodoModel[],
  showWithoutDates: boolean,
  todayKey: string
): Map<string, TodoModel[]> {
  const map = new Map<string, TodoModel[]>();

  // Add todos without due dates to today (if toggle is on)
  if (showWithoutDates) {
    const todosWithoutDates = todos.filter((todo) => !todo.hasDueDate && !todo.isDeleted);
    if (todosWithoutDates.length > 0) {
      map.set(todayKey, [...todosWithoutDates]);
    }
  }

  // Add todos with due dates using their dueDateKey
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
}

/**
 * Count todos without due dates
 * @param todos - Array of todos
 * @returns Count of todos without due dates
 */
export function countTodosWithoutDates(todos: TodoModel[]): number {
  return todos.filter((todo) => !todo.hasDueDate && !todo.isDeleted).length;
}

/**
 * Generate a 42-day calendar grid for a month
 * @param currentMonth - The month to generate grid for
 * @param todosByDate - Map of date keys to todos
 * @param weekStartDay - 0 for Sunday, 1 for Monday
 * @param today - Today's date (for testing)
 * @returns Array of calendar days
 */
export function generateCalendarGrid(
  currentMonth: Date,
  todosByDate: Map<string, TodoModel[]>,
  weekStartDay: number,
  today: Date = new Date()
): CalendarDay[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);

  // Adjust for week start day
  let startDayOffset = firstDay.getDay();
  if (weekStartDay === 1) {
    startDayOffset = startDayOffset === 0 ? 6 : startDayOffset - 1;
  }
  startDate.setDate(startDate.getDate() - startDayOffset);

  const days: CalendarDay[] = [];
  const current = new Date(startDate);
  const todayNormalized = new Date(today);
  todayNormalized.setHours(0, 0, 0, 0);

  for (let i = 0; i < 42; i++) {
    const dateKey = formatDateKey(current);
    const todosForDay = todosByDate.get(dateKey) || [];
    const isCurrentMonth = current.getMonth() === month;

    // Check for overdue tasks
    const currentDate = new Date(current);
    currentDate.setHours(0, 0, 0, 0);
    const overdueTasks = todosForDay.filter(
      (todo) => todo.state === "active" && currentDate < todayNormalized
    );

    // Check for recurring tasks
    const recurringTasks = todosForDay.filter((todo) => todo.isRecurring);

    days.push({
      date: new Date(current),
      dateKey,
      todos: todosForDay,
      isCurrentMonth,
      isToday: current.toDateString() === todayNormalized.toDateString(),
      weekNumber: getWeekNumber(current),
      overdueTasks,
      recurringTasks,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Get week days for week view
 * @param selectedDate - The selected date (determines which week)
 * @param weekStartDay - 0 for Sunday, 1 for Monday
 * @param todosByDate - Map of date keys to todos
 * @param today - Today's date (for testing)
 * @returns Array of week days
 */
export function getWeekDays(
  selectedDate: Date,
  weekStartDay: number,
  todosByDate: Map<string, TodoModel[]>,
  today: Date = new Date()
): WeekDay[] {
  const startOfWeek = new Date(selectedDate);
  const dayOfWeek = startOfWeek.getDay();
  const diff = weekStartDay === 1
    ? (dayOfWeek === 0 ? -6 : 1 - dayOfWeek)
    : -dayOfWeek;
  startOfWeek.setDate(startOfWeek.getDate() + diff);

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    const dateKey = formatDateKey(date);
    days.push({
      date,
      dateKey,
      todos: todosByDate.get(dateKey) || [],
      isToday: date.toDateString() === today.toDateString(),
    });
  }
  return days;
}

/**
 * Get upcoming tasks for agenda view
 * @param todosByDate - Map of date keys to todos
 * @param days - Number of days to look ahead
 * @param today - Starting date (for testing)
 * @returns Array of agenda days
 */
export function getUpcomingAgendaTasks(
  todosByDate: Map<string, TodoModel[]>,
  days: number = 14,
  today: Date = new Date()
): AgendaDay[] {
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);

  const upcoming: AgendaDay[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = formatDateKey(date);
    const dayTodos = todosByDate.get(dateKey) || [];

    // Include day if it has todos OR if it's today
    if (dayTodos.length > 0 || i === 0) {
      upcoming.push({ date, dateKey, todos: dayTodos });
    }
  }

  return upcoming;
}

/**
 * Sort field options for calendar view
 */
export type CalendarSortField = "priority" | "duration" | "created";

/**
 * Sort todos for calendar display
 * @param todos - Array of todos to sort
 * @param sortField - Field to sort by
 * @param direction - Sort direction
 * @returns Sorted array of todos
 */
export function sortTodosByField(
  todos: TodoModel[],
  sortField: CalendarSortField,
  direction: "asc" | "desc"
): TodoModel[] {
  const sorted = [...todos];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "priority": {
        const aPriority = a.priorityOrder ?? 999;
        const bPriority = b.priorityOrder ?? 999;
        comparison = aPriority - bPriority;
        break;
      }
      case "duration": {
        const aDuration = a.durationMinutes ?? 0;
        const bDuration = b.durationMinutes ?? 0;
        comparison = aDuration - bDuration;
        break;
      }
      case "created":
      default:
        // Use ascending (oldest first) as base, direction modifier will flip if needed
        comparison = a.createdAt - b.createdAt;
        break;
    }

    return direction === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Get dot color class based on settings and todo
 * @param todo - The todo to get color for
 * @param colorBy - Color determination method
 * @returns Tailwind CSS class or empty string if using custom color
 */
export function getCalendarDotColorClass(
  todo: TodoModel,
  colorBy: DotColorBy
): string {
  switch (colorBy) {
    case "priority": {
      const order = todo.priorityOrder;
      // Priority orders start at 1: urgent=1, high=2, medium=3, low=4
      if (order === 1) return "bg-red-500";
      if (order === 2) return "bg-orange-500";
      if (order === 3) return "bg-yellow-500";
      if (order === 4) return "bg-green-500";
      return "bg-zinc-400";
    }
    case "project":
      // Will use style instead for custom project colors
      return "bg-purple-500";
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
}

/**
 * Get project color for a todo (for dot coloring)
 * @param todo - The todo
 * @param colorBy - Color determination method
 * @param projects - Available projects
 * @returns Custom color string or undefined
 */
export function getProjectColorForTodo(
  todo: TodoModel,
  colorBy: DotColorBy,
  projects: ProjectModel[]
): string | undefined {
  if (colorBy !== "project") return undefined;

  const projectName = todo.projects[0];
  if (projectName) {
    const project = projects.find(
      (p) => p.name === projectName || p.alternatives?.includes(projectName)
    );
    return project?.color;
  }
  return undefined;
}

/**
 * Format month and year for display
 * @param date - Date to format
 * @returns Formatted string like "January 2024"
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Navigate to adjacent month
 * @param currentMonth - Current month date
 * @param delta - Number of months to move (positive or negative)
 * @returns New month date
 */
export function navigateMonth(currentMonth: Date, delta: number): Date {
  const newMonth = new Date(currentMonth);
  newMonth.setMonth(newMonth.getMonth() + delta);
  return newMonth;
}

/**
 * Check if a date is today
 * @param date - Date to check
 * @param today - Reference today date (for testing)
 * @returns True if date is today
 */
export function isToday(date: Date, today: Date = new Date()): boolean {
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the current month
 * @param date - Date to check
 * @param currentMonth - Reference month
 * @returns True if date is in the same month
 */
export function isCurrentMonth(date: Date, currentMonth: Date): boolean {
  return date.getMonth() === currentMonth.getMonth() &&
         date.getFullYear() === currentMonth.getFullYear();
}
