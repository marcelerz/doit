import { getWeekday, Weekday } from "./time";

// Calendar Tab Settings
export type CalendarView = "month" | "week" | "agenda";
export type CalendarDotColorBy = "state" | "priority" | "project";

export interface Calendar {
  weekStartDay: Weekday; // 0 = Sunday, 1 = Monday
  defaultView: CalendarView;
  showWeekNumbers: boolean;
  taskDotLimit: number; // How many dots to show per day (1-10)
  dotColorBy: CalendarDotColorBy;
  showOverdueBadge: boolean; // Highlight overdue tasks
  showRecurringIndicator: boolean; // Show indicator for recurring tasks
  showTaskCount: boolean; // Show task count badge on days
}

export const defaultCalendar: Calendar = {
  weekStartDay: getWeekday(0), // Sunday
  defaultView: "month",
  showWeekNumbers: false,
  taskDotLimit: 4,
  dotColorBy: "state",
  showOverdueBadge: true,
  showRecurringIndicator: true,
  showTaskCount: false,
};
