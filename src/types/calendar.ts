import { getWeekday, Weekday } from "./time";

// Calendar Tab Settings
const CALENDAR_VIEWS = ["month", "week", "agenda"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

const CALENDAR_DOT_COLOR_BY = ["state", "priority", "project"] as const;
export type CalendarDotColorBy = (typeof CALENDAR_DOT_COLOR_BY)[number];

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
