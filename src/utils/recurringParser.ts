/**
 * Recurring pattern parser for todo tasks
 * Patterns are auto-detected (no explicit marker needed).
 * Supports patterns like:
 * - every 2 days
 * - every 3 weeks
 * - every monday
 * - every 1st monday
 * - every workday
 */

export interface RecurringPattern {
  type: "interval" | "weekday" | "monthly" | "quarterly" | "yearly" | "workday" | "nth-weekday";
  interval?: number; // for interval type (e.g., 2 for "every 2 days")
  unit?: "day" | "week" | "month" | "quarter" | "half" | "year"; // for interval type
  weekday?: number; // 0-6 for Sunday-Saturday
  monthDay?: number; // 1-31 for day of month
  month?: number; // 1-12 for month of year
  nthWeek?: number; // 1-5 for "1st monday", "2nd tuesday", etc.
  raw: string; // original pattern string
  // Time information (optional) - for patterns like "every monday at 9am"
  hour?: number; // 0-23
  minute?: number; // 0-59
  endHour?: number; // 0-23 for time ranges
  endMinute?: number; // 0-59 for time ranges
  durationMinutes?: number; // calculated duration for time ranges
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "last"];
const ORDINAL_WORDS = ["first", "second", "third", "fourth", "fifth", "last"];

// Helper to normalize ordinal words to numeric form
function normalizeOrdinal(ordinal: string): string {
  const lower = ordinal.toLowerCase();
  const wordIndex = ORDINAL_WORDS.indexOf(lower);
  if (wordIndex !== -1) {
    return ORDINALS[wordIndex];
  }
  return lower;
}

export function parseRecurringPattern(pattern: string): RecurringPattern | null {
  const normalized = pattern.toLowerCase().trim();

  // Workday pattern: workday or every workday
  if (normalized === "workday" || normalized === "every workday") {
    return {
      type: "workday",
      raw: pattern,
    };
  }

  // Simple interval pattern: every day/week/month (no number)
  const simpleIntervalMatch = normalized.match(/^every\s+(day|week|month|quarter|half|year)$/);
  if (simpleIntervalMatch) {
    const unit = simpleIntervalMatch[1] as "day" | "week" | "month" | "quarter" | "half" | "year";
    return {
      type: "interval",
      interval: 1,
      unit,
      raw: pattern,
    };
  }

  // Interval pattern: every X days/weeks/months/quarters/halfs/years
  const intervalMatch = normalized.match(/^every\s+(\d+)\s+(day|week|month|quarter|half|year)s?$/);
  if (intervalMatch) {
    const interval = parseInt(intervalMatch[1], 10);
    const unit = intervalMatch[2] as "day" | "week" | "month" | "quarter" | "half" | "year";
    return {
      type: "interval",
      interval,
      unit,
      raw: pattern,
    };
  }

  // Monthly pattern with "every": every month on the 15th, every month on 15
  const everyMonthMatch = normalized.match(/^every\s+month\s+on\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)?$/);
  if (everyMonthMatch) {
    const monthDay = parseInt(everyMonthMatch[1], 10);
    return {
      type: "monthly",
      monthDay,
      raw: pattern,
    };
  }

  // Simple weekday pattern: every monday
  const weekdayMatch = normalized.match(/^every\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (weekdayMatch) {
    const weekday = WEEKDAYS.indexOf(weekdayMatch[1]);
    return {
      type: "weekday",
      weekday,
      raw: pattern,
    };
  }

  // Nth weekday pattern: every 1st monday, every 2nd friday, every last tuesday
  // Also supports word forms: every first monday, every second friday
  const nthWeekdayMatch = normalized.match(
    /^every\s+(1st|2nd|3rd|4th|5th|last|first|second|third|fourth|fifth)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/,
  );
  if (nthWeekdayMatch) {
    const normalizedOrdinal = normalizeOrdinal(nthWeekdayMatch[1]);
    const nthWeek = ORDINALS.indexOf(normalizedOrdinal) + 1; // 1-6 (6 = last)
    const weekday = WEEKDAYS.indexOf(nthWeekdayMatch[2]);
    return {
      type: "nth-weekday",
      nthWeek,
      weekday,
      raw: pattern,
    };
  }

  // Monthly pattern: %monthly on 15th
  const monthlyMatch = normalized.match(/^monthly\s+on\s+(\d+)(st|nd|rd|th)?$/);
  if (monthlyMatch) {
    const monthDay = parseInt(monthlyMatch[1], 10);
    return {
      type: "monthly",
      monthDay,
      raw: pattern,
    };
  }

  // Quarterly pattern: %quarterly on 15th
  const quarterlyMatch = normalized.match(/^quarterly\s+on\s+(\d+)(st|nd|rd|th)?$/);
  if (quarterlyMatch) {
    const monthDay = parseInt(quarterlyMatch[1], 10);
    return {
      type: "quarterly",
      monthDay,
      raw: pattern,
    };
  }

  // Yearly pattern: %yearly on jan 15
  const yearlyMatch = normalized.match(/^yearly\s+on\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d+)$/);
  if (yearlyMatch) {
    const month = MONTHS.indexOf(yearlyMatch[1]) + 1;
    const monthDay = parseInt(yearlyMatch[2], 10);
    return {
      type: "yearly",
      month,
      monthDay,
      raw: pattern,
    };
  }

  return null;
}

export function calculateNextOccurrence(pattern: RecurringPattern, fromDate: Date = new Date()): Date {
  const next = new Date(fromDate);

  switch (pattern.type) {
    case "interval":
      if (pattern.unit === "day") {
        next.setDate(next.getDate() + (pattern.interval || 1));
      } else if (pattern.unit === "week") {
        next.setDate(next.getDate() + (pattern.interval || 1) * 7);
      } else if (pattern.unit === "month") {
        next.setMonth(next.getMonth() + (pattern.interval || 1));
      } else if (pattern.unit === "quarter") {
        next.setMonth(next.getMonth() + (pattern.interval || 1) * 3);
      } else if (pattern.unit === "half") {
        next.setMonth(next.getMonth() + (pattern.interval || 1) * 6);
      } else if (pattern.unit === "year") {
        next.setFullYear(next.getFullYear() + (pattern.interval || 1));
      }
      break;

    case "workday":
      // Find next workday (Monday-Friday)
      next.setDate(next.getDate() + 1);
      while (next.getDay() === 0 || next.getDay() === 6) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case "weekday":
      // Find next occurrence of this weekday
      next.setDate(next.getDate() + 1);
      while (next.getDay() !== pattern.weekday) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case "nth-weekday":
      // Find nth occurrence of weekday in next month (or later months if needed)
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);

      if (pattern.nthWeek === 6) {
        // "last" weekday of month
        next.setMonth(next.getMonth() + 1);
        next.setDate(0); // Last day of previous month
        while (next.getDay() !== pattern.weekday) {
          next.setDate(next.getDate() - 1);
        }
      } else {
        // Find first occurrence of the weekday
        while (next.getDay() !== pattern.weekday) {
          next.setDate(next.getDate() + 1);
        }
        // Add weeks to get to nth occurrence
        next.setDate(next.getDate() + ((pattern.nthWeek || 1) - 1) * 7);
      }
      break;

    case "monthly":
      // Next month on the specified day
      next.setMonth(next.getMonth() + 1);
      next.setDate(Math.min(pattern.monthDay || 1, getLastDayOfMonth(next)));
      break;

    case "quarterly":
      // Next quarter on the specified day
      const currentMonth = next.getMonth();
      const nextQuarterMonth = Math.floor(currentMonth / 3) * 3 + 3;
      next.setMonth(nextQuarterMonth);
      next.setDate(Math.min(pattern.monthDay || 1, getLastDayOfMonth(next)));
      break;

    case "yearly":
      // Next year on the specified month and day
      next.setFullYear(next.getFullYear() + 1);
      next.setMonth((pattern.month || 1) - 1);
      next.setDate(Math.min(pattern.monthDay || 1, getLastDayOfMonth(next)));
      break;
  }

  // Apply time from pattern AFTER calculating the date
  if (pattern.hour !== undefined) {
    next.setHours(pattern.hour);
    next.setMinutes(pattern.minute ?? 0);
    next.setSeconds(0);
    next.setMilliseconds(0);
  }

  return next;
}

function getLastDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function formatRecurringPattern(pattern: RecurringPattern): string {
  switch (pattern.type) {
    case "interval":
      const pluralUnit = pattern.interval === 1 ? pattern.unit : `${pattern.unit}s`;
      return `Every ${pattern.interval} ${pluralUnit}`;

    case "workday":
      return "Every workday";

    case "weekday":
      return `Every ${WEEKDAYS[pattern.weekday || 0]}`;

    case "nth-weekday":
      const ordinal = pattern.nthWeek === 6 ? "last" : ORDINALS[pattern.nthWeek! - 1];
      return `Every ${ordinal} ${WEEKDAYS[pattern.weekday || 0]}`;

    case "monthly":
      return `Monthly on ${pattern.monthDay}${getOrdinalSuffix(pattern.monthDay || 1)}`;

    case "quarterly":
      return `Quarterly on ${pattern.monthDay}${getOrdinalSuffix(pattern.monthDay || 1)}`;

    case "yearly":
      return `Yearly on ${MONTHS[(pattern.month || 1) - 1]} ${pattern.monthDay}`;

    default:
      return pattern.raw;
  }
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  const lastDigit = day % 10;
  if (lastDigit === 1) return "st";
  if (lastDigit === 2) return "nd";
  if (lastDigit === 3) return "rd";
  return "th";
}

export function getRecurringSuggestions(): string[] {
  return [
    "every day",
    "every 2 days",
    "every week",
    "every 2 weeks",
    "every month",
    "every month on the 1st",
    "every month on the 15th",
    "every workday",
    "every monday",
    "every tuesday",
    "every wednesday",
    "every thursday",
    "every friday",
    "every 1st monday",
    "every 2nd tuesday",
    "every last friday",
    "monthly on 1st",
    "monthly on 15th",
    "quarterly on 1st",
    "yearly on jan 1",
  ];
}
