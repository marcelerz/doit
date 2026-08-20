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

// Constant for "last" weekday of month (6th index in ORDINALS array, representing "last")
const NTH_WEEK_LAST = 6;

// Helper to normalize ordinal words to numeric form
function normalizeOrdinal(ordinal: string): string {
  const lower = ordinal.toLowerCase();
  const wordIndex = ORDINAL_WORDS.indexOf(lower);
  if (wordIndex !== -1) {
    return ORDINALS[wordIndex];
  }
  return lower;
}

// Helper to validate monthDay is between 1-31
function isValidMonthDay(day: number): boolean {
  return day >= 1 && day <= 31;
}

// Helper to validate month is between 1-12
function isValidMonth(month: number): boolean {
  return month >= 1 && month <= 12;
}

export function parseRecurringPattern(pattern: string): RecurringPattern | null {
  const normalized = pattern.toLowerCase().trim();

  // Workday patterns: workday, every workday, each workday
  if (/^(?:every\s+|each\s+)?workday$/.test(normalized)) {
    return {
      type: "workday",
      raw: pattern,
    };
  }

  // Weekday (M-F) patterns: weekday, every weekday, weekdays
  if (/^(?:every\s+|each\s+)?weekdays?$/.test(normalized)) {
    return {
      type: "workday", // Same as workday (M-F)
      raw: pattern,
    };
  }

  // Single-word shortcuts: daily, weekly, monthly, yearly, biweekly, bimonthly
  const shortcutMap: Record<string, { interval: number; unit: RecurringPattern["unit"] }> = {
    daily: { interval: 1, unit: "day" },
    weekly: { interval: 1, unit: "week" },
    biweekly: { interval: 2, unit: "week" },
    fortnightly: { interval: 2, unit: "week" },
    monthly: { interval: 1, unit: "month" },
    bimonthly: { interval: 2, unit: "month" },
    quarterly: { interval: 1, unit: "quarter" },
    yearly: { interval: 1, unit: "year" },
    annually: { interval: 1, unit: "year" },
    semiannually: { interval: 1, unit: "half" },
  };

  if (shortcutMap[normalized]) {
    const { interval, unit } = shortcutMap[normalized];
    return {
      type: "interval",
      interval,
      unit,
      raw: pattern,
    };
  }

  // "repeat" prefix: repeat daily, repeat weekly, etc.
  const repeatShortcutMatch = normalized.match(
    /^repeat\s+(daily|weekly|biweekly|fortnightly|monthly|bimonthly|quarterly|yearly|annually|semiannually)$/,
  );
  if (repeatShortcutMatch && shortcutMap[repeatShortcutMatch[1]]) {
    const { interval, unit } = shortcutMap[repeatShortcutMatch[1]];
    return {
      type: "interval",
      interval,
      unit,
      raw: pattern,
    };
  }

  // Simple interval pattern: every/each day/week/month (no number)
  const simpleIntervalMatch = normalized.match(/^(?:every|each|repeat)\s+(day|week|month|quarter|half|year)$/);
  if (simpleIntervalMatch) {
    const unit = simpleIntervalMatch[1] as "day" | "week" | "month" | "quarter" | "half" | "year";
    return {
      type: "interval",
      interval: 1,
      unit,
      raw: pattern,
    };
  }

  // Interval pattern: every/each X days/weeks/months/quarters/halfs/years
  const intervalMatch = normalized.match(/^(?:every|each|repeat)\s+(\d+)\s+(day|week|month|quarter|half|year)s?$/);
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

  // Other interval: every other day/week/month (= every 2)
  const everyOtherMatch = normalized.match(/^every\s+other\s+(day|week|month|quarter|half|year)$/);
  if (everyOtherMatch) {
    const unit = everyOtherMatch[1] as "day" | "week" | "month" | "quarter" | "half" | "year";
    return {
      type: "interval",
      interval: 2,
      unit,
      raw: pattern,
    };
  }

  // Monthly pattern with "every/each": every month on the 15th, every month on 15
  const everyMonthMatch = normalized.match(/^(?:every|each)\s+month\s+on\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)?$/);
  if (everyMonthMatch) {
    const monthDay = parseInt(everyMonthMatch[1], 10);
    if (!isValidMonthDay(monthDay)) {
      return null; // Invalid day of month
    }
    return {
      type: "monthly",
      monthDay,
      raw: pattern,
    };
  }

  // Simple "on the Xth" pattern (implies monthly): on the 15th, on the 1st
  const onTheDayMatch = normalized.match(/^on\s+the\s+(\d+)(?:st|nd|rd|th)$/);
  if (onTheDayMatch) {
    const monthDay = parseInt(onTheDayMatch[1], 10);
    if (!isValidMonthDay(monthDay)) {
      return null; // Invalid day of month
    }
    return {
      type: "monthly",
      monthDay,
      raw: pattern,
    };
  }

  // Simple weekday pattern: every/each monday
  const weekdayMatch = normalized.match(
    /^(?:every|each)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/,
  );
  if (weekdayMatch) {
    const weekday = WEEKDAYS.indexOf(weekdayMatch[1]);
    return {
      type: "weekday",
      weekday,
      raw: pattern,
    };
  }

  // Nth weekday pattern: every/each 1st monday, every 2nd friday, every last tuesday
  // Also supports word forms: every first monday, every second friday
  const nthWeekdayMatch = normalized.match(
    /^(?:every|each)\s+(1st|2nd|3rd|4th|5th|last|first|second|third|fourth|fifth)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/,
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

  // Multiple weekdays: every monday and wednesday, every tue and thu
  const multiWeekdayMatch = normalized.match(
    /^(?:every|each)\s+((?:sun|mon|tue|wed|thu|fri|sat)(?:day)?(?:\s*(?:,|and)\s*(?:sun|mon|tue|wed|thu|fri|sat)(?:day)?)+)$/,
  );
  if (multiWeekdayMatch) {
    // Store as raw - this would need special handling for multiple weekdays
    // For now, treat as first weekday mentioned
    const daysStr = multiWeekdayMatch[1];
    const dayMatches = daysStr.match(/sun|mon|tue|wed|thu|fri|sat/gi);
    if (dayMatches && dayMatches.length > 0) {
      const firstDay = dayMatches[0].toLowerCase();
      const weekdayIndex = WEEKDAYS.findIndex((w) => w.startsWith(firstDay));
      if (weekdayIndex !== -1) {
        return {
          type: "weekday",
          weekday: weekdayIndex,
          raw: pattern,
        };
      }
    }
  }

  // Monthly pattern: %monthly on 15th
  const monthlyMatch = normalized.match(/^monthly\s+on\s+(\d+)(st|nd|rd|th)?$/);
  if (monthlyMatch) {
    const monthDay = parseInt(monthlyMatch[1], 10);
    if (!isValidMonthDay(monthDay)) {
      return null; // Invalid day of month
    }
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
    if (!isValidMonthDay(monthDay)) {
      return null; // Invalid day of month
    }
    return {
      type: "quarterly",
      monthDay,
      raw: pattern,
    };
  }

  // Yearly pattern: %yearly on jan 15
  const yearlyMatch = normalized.match(/^yearly\s+on\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d+)$/);
  if (yearlyMatch) {
    const monthIndex = MONTHS.indexOf(yearlyMatch[1]);
    if (monthIndex === -1) {
      return null; // Invalid month (shouldn't happen with this regex, but defensive)
    }
    const month = monthIndex + 1;
    const monthDay = parseInt(yearlyMatch[2], 10);
    if (!isValidMonth(month) || !isValidMonthDay(monthDay)) {
      return null; // Invalid month or day
    }
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
      // Find nth occurrence of weekday in the next available month that has it
      // For example, "5th Monday" only exists in months that start on specific days
      {
        let currentMonth = next.getMonth() + 1;
        let currentYear = next.getFullYear();
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }

        if (pattern.nthWeek === NTH_WEEK_LAST) {
          // "last" weekday of month - always exists in every month
          next.setFullYear(currentYear);
          next.setMonth(currentMonth);
          const lastDay = getLastDayOfMonth(next);
          next.setDate(lastDay);
          while (next.getDay() !== pattern.weekday) {
            next.setDate(next.getDate() - 1);
          }
        } else {
          // Search forward to find a month that has the nth occurrence
          // Most months have 4 occurrences of each weekday; only some have 5
          const nthWeek = pattern.nthWeek || 1;
          const maxAttempts = 12; // At most 12 months to find a valid one

          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            next.setFullYear(currentYear);
            next.setMonth(currentMonth);
            next.setDate(1);

            // Find first occurrence of the weekday in this month
            while (next.getDay() !== pattern.weekday) {
              next.setDate(next.getDate() + 1);
            }

            // Add weeks to get to nth occurrence
            const nthWeekOffset = (nthWeek - 1) * 7;
            next.setDate(next.getDate() + nthWeekOffset);

            // Check if this date is still in the target month
            if (next.getMonth() === currentMonth) {
              // Found a valid month with the nth occurrence
              break;
            }

            // This month doesn't have the nth occurrence, try next month
            currentMonth++;
            if (currentMonth > 11) {
              currentMonth = 0;
              currentYear++;
            }
          }
        }
      }
      break;

    case "monthly":
      // Next month on the specified day
      next.setMonth(next.getMonth() + 1);
      next.setDate(Math.min(pattern.monthDay || 1, getLastDayOfMonth(next)));
      break;

    case "quarterly":
      // Next quarter on the specified day (or current quarter if day hasn't passed)
      {
        const currentMonth = next.getMonth();
        const currentQuarterMonth = Math.floor(currentMonth / 3) * 3; // First month of current quarter
        const targetDay = pattern.monthDay || 1;

        // Check if we can use the current quarter
        // Create a date for the target day in the current quarter's first month
        const currentQuarterTarget = new Date(next);
        currentQuarterTarget.setMonth(currentQuarterMonth);
        currentQuarterTarget.setDate(Math.min(targetDay, getLastDayOfMonth(currentQuarterTarget)));

        // If current quarter's target date is still in the future, use it
        if (currentQuarterTarget > fromDate) {
          next.setMonth(currentQuarterMonth);
          next.setDate(Math.min(targetDay, getLastDayOfMonth(next)));
        } else {
          // Move to next quarter
          const nextQuarterMonth = currentQuarterMonth + 3;
          if (nextQuarterMonth > 11) {
            next.setFullYear(next.getFullYear() + 1);
            next.setMonth(nextQuarterMonth - 12);
          } else {
            next.setMonth(nextQuarterMonth);
          }
          next.setDate(Math.min(targetDay, getLastDayOfMonth(next)));
        }
      }
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
      const ordinal = pattern.nthWeek === NTH_WEEK_LAST ? "last" : ORDINALS[pattern.nthWeek! - 1];
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
    // Simple shortcuts
    "daily",
    "weekly",
    "biweekly",
    "monthly",
    "quarterly",
    "yearly",
    // Every patterns
    "every day",
    "every 2 days",
    "every week",
    "every 2 weeks",
    "every other week",
    "every month",
    "every month on the 1st",
    "every month on the 15th",
    "every other month",
    "every quarter",
    "every year",
    // Workday patterns
    "every workday",
    "every weekday",
    // Weekday patterns
    "every monday",
    "every tuesday",
    "every wednesday",
    "every thursday",
    "every friday",
    "every saturday",
    "every sunday",
    // Nth weekday patterns
    "every 1st monday",
    "every 2nd tuesday",
    "every 3rd wednesday",
    "every last friday",
    // Legacy/alternative
    "monthly on 1st",
    "monthly on 15th",
    "quarterly on 1st",
    "yearly on jan 1",
  ];
}
