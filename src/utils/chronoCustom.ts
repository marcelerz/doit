/**
 * Custom Chrono Configuration
 *
 * Extends chrono-node with custom parsers and refiners for:
 * - Custom shorthand dates (eod, morning, bow, bom, eoq, etc.)
 * - Relative date patterns (in 3 days, in 2 weeks)
 * - Time-only patterns (2pm, 3:30pm, 14:00)
 * - Work hours context (BOD/EOD based on user settings)
 *
 * This consolidates all date parsing into a single chrono instance.
 */

import * as chrono from "chrono-node";
import { ParsingContext, ParsingComponents, Refiner, Parser } from "chrono-node";
import { DateTimeSettings, WorkHoursSettings } from "@/types/settings";

// Re-export chrono types for convenience
export type { ParsingContext, ParsingComponents };

/**
 * Custom shorthand patterns and their mappings
 */
const SHORTHAND_PATTERNS: Record<
  string,
  (ref: Date, dateTime?: DateTimeSettings, workHours?: WorkHoursSettings) => Date
> = {
  // Time of day
  morning: (ref, dt) => setTime(ref, dt?.morning || "09:00"),
  noon: (ref, dt) => setTime(ref, dt?.noon || "12:00"),
  afternoon: (ref, dt) => setTime(ref, dt?.afternoon || "14:00"),
  evening: (ref, dt) => setTime(ref, dt?.evening || "18:00"),
  midnight: (ref) => setTime(ref, "00:00"),
  midday: (ref, dt) => setTime(ref, dt?.noon || "12:00"),

  // Day boundaries - multiple phrasings
  bod: (ref, dt, wh) => setTime(ref, getBodEod(ref, wh).bod),
  eod: (ref, dt, wh) => setTime(ref, getBodEod(ref, wh).eod),
  startofday: (ref, dt, wh) => setTime(ref, getBodEod(ref, wh).bod),
  endofday: (ref, dt, wh) => setTime(ref, getBodEod(ref, wh).eod),
  beginningofday: (ref, dt, wh) => setTime(ref, getBodEod(ref, wh).bod),
  beginningoftheday: (ref, dt, wh) => setTime(ref, getBodEod(ref, wh).bod),
  endoftheday: (ref, dt, wh) => setTime(ref, getBodEod(ref, wh).eod),
  startoftheday: (ref, dt, wh) => setTime(ref, getBodEod(ref, wh).bod),

  // Week boundaries - multiple phrasings
  bow: (ref, dt, wh) => getStartOfWeek(ref, dt?.workWeekStart || 1, wh),
  eow: (ref, dt, wh) => getEndOfWeek(ref, dt?.workWeekStart || 1, wh),
  startofweek: (ref, dt, wh) => getStartOfWeek(ref, dt?.workWeekStart || 1, wh),
  endofweek: (ref, dt, wh) => getEndOfWeek(ref, dt?.workWeekStart || 1, wh),
  beginningofweek: (ref, dt, wh) => getStartOfWeek(ref, dt?.workWeekStart || 1, wh),
  beginningoftheweek: (ref, dt, wh) => getStartOfWeek(ref, dt?.workWeekStart || 1, wh),
  endoftheweek: (ref, dt, wh) => getEndOfWeek(ref, dt?.workWeekStart || 1, wh),
  startoftheweek: (ref, dt, wh) => getStartOfWeek(ref, dt?.workWeekStart || 1, wh),
  nextweek: (ref, dt, wh) => {
    const next = new Date(ref);
    const day = next.getDay();
    const workWeekStart = dt?.workWeekStart || 1;
    const daysToAdd = ((workWeekStart + 7 - day) % 7) + 7;
    next.setDate(next.getDate() + daysToAdd);
    return setTime(next, getBodEod(next, wh).bod);
  },
  weekend: (ref) => {
    const next = new Date(ref);
    const day = next.getDay();
    const daysToSaturday = (6 - day + 7) % 7 || 7;
    next.setDate(next.getDate() + daysToSaturday);
    return next;
  },

  // Month boundaries - multiple phrasings
  bom: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), ref.getMonth(), 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  eom: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return setTime(d, getBodEod(d, wh).eod);
  },
  startofmonth: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), ref.getMonth(), 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  endofmonth: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return setTime(d, getBodEod(d, wh).eod);
  },
  beginningofmonth: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), ref.getMonth(), 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  beginningofthemonth: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), ref.getMonth(), 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  endofthemonth: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return setTime(d, getBodEod(d, wh).eod);
  },
  startofthemonth: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), ref.getMonth(), 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  nextmonth: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },

  // Quarter boundaries - multiple phrasings
  boq: (ref, dt, wh) => {
    const quarter = Math.floor(ref.getMonth() / 3);
    const d = new Date(ref.getFullYear(), quarter * 3, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  eoq: (ref, dt, wh) => {
    const quarter = Math.floor(ref.getMonth() / 3);
    const d = new Date(ref.getFullYear(), quarter * 3 + 3, 0);
    return setTime(d, getBodEod(d, wh).eod);
  },
  startofquarter: (ref, dt, wh) => {
    const quarter = Math.floor(ref.getMonth() / 3);
    const d = new Date(ref.getFullYear(), quarter * 3, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  endofquarter: (ref, dt, wh) => {
    const quarter = Math.floor(ref.getMonth() / 3);
    const d = new Date(ref.getFullYear(), quarter * 3 + 3, 0);
    return setTime(d, getBodEod(d, wh).eod);
  },
  beginningofquarter: (ref, dt, wh) => {
    const quarter = Math.floor(ref.getMonth() / 3);
    const d = new Date(ref.getFullYear(), quarter * 3, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  beginningofthequarter: (ref, dt, wh) => {
    const quarter = Math.floor(ref.getMonth() / 3);
    const d = new Date(ref.getFullYear(), quarter * 3, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  endofthequarter: (ref, dt, wh) => {
    const quarter = Math.floor(ref.getMonth() / 3);
    const d = new Date(ref.getFullYear(), quarter * 3 + 3, 0);
    return setTime(d, getBodEod(d, wh).eod);
  },
  startofthequarter: (ref, dt, wh) => {
    const quarter = Math.floor(ref.getMonth() / 3);
    const d = new Date(ref.getFullYear(), quarter * 3, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  nextquarter: (ref, dt, wh) => {
    const quarter = Math.floor(ref.getMonth() / 3);
    const d = new Date(ref.getFullYear(), (quarter + 1) * 3, 1);
    if (d <= ref) d.setFullYear(d.getFullYear() + 1);
    return setTime(d, getBodEod(d, wh).bod);
  },

  // Half-year boundaries - multiple phrasings
  boh: (ref, dt, wh) => {
    const half = ref.getMonth() < 6 ? 0 : 6;
    const d = new Date(ref.getFullYear(), half, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  eoh: (ref, dt, wh) => {
    const half = ref.getMonth() < 6 ? 5 : 11;
    const d = new Date(ref.getFullYear(), half + 1, 0);
    return setTime(d, getBodEod(d, wh).eod);
  },
  startofhalf: (ref, dt, wh) => {
    const half = ref.getMonth() < 6 ? 0 : 6;
    const d = new Date(ref.getFullYear(), half, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  endofhalf: (ref, dt, wh) => {
    const half = ref.getMonth() < 6 ? 5 : 11;
    const d = new Date(ref.getFullYear(), half + 1, 0);
    return setTime(d, getBodEod(d, wh).eod);
  },
  nexthalf: (ref, dt, wh) => {
    const half = ref.getMonth() < 6 ? 6 : 0;
    const d = new Date(ref.getFullYear(), half, 1);
    if (d <= ref) d.setFullYear(d.getFullYear() + 1);
    return setTime(d, getBodEod(d, wh).bod);
  },

  // Year boundaries - multiple phrasings
  boy: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), 0, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  eoy: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), 11, 31);
    return setTime(d, getBodEod(d, wh).eod);
  },
  startofyear: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), 0, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  endofyear: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), 11, 31);
    return setTime(d, getBodEod(d, wh).eod);
  },
  beginningofyear: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), 0, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  beginningoftheyear: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), 0, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  endoftheyear: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), 11, 31);
    return setTime(d, getBodEod(d, wh).eod);
  },
  startoftheyear: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear(), 0, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },
  nextyear: (ref, dt, wh) => {
    const d = new Date(ref.getFullYear() + 1, 0, 1);
    return setTime(d, getBodEod(d, wh).bod);
  },

  // Holidays (US-centric, but common)
  christmas: (ref) => getNextHoliday(ref, 12, 25),
  christmaseve: (ref) => getNextHoliday(ref, 12, 24),
  newyears: (ref) => getNextHoliday(ref, 1, 1),
  newyearseve: (ref) => getNextHoliday(ref, 12, 31),
  newyearsday: (ref) => getNextHoliday(ref, 1, 1),
  valentines: (ref) => getNextHoliday(ref, 2, 14),
  valentinesday: (ref) => getNextHoliday(ref, 2, 14),
  stpatricks: (ref) => getNextHoliday(ref, 3, 17),
  stpatricksday: (ref) => getNextHoliday(ref, 3, 17),
  halloween: (ref) => getNextHoliday(ref, 10, 31),
  independenceday: (ref) => getNextHoliday(ref, 7, 4),
  julyfourth: (ref) => getNextHoliday(ref, 7, 4),
  laborday: (ref) => getNthWeekdayOfMonth(ref, 9, 1, 1), // First Monday of September
  memorialday: (ref) => getLastWeekdayOfMonth(ref, 5, 1), // Last Monday of May
  thanksgiving: (ref) => getNthWeekdayOfMonth(ref, 11, 4, 4), // Fourth Thursday of November
  mlkday: (ref) => getNthWeekdayOfMonth(ref, 1, 1, 3), // Third Monday of January
  presidentsday: (ref) => getNthWeekdayOfMonth(ref, 2, 1, 3), // Third Monday of February
  columbusday: (ref) => getNthWeekdayOfMonth(ref, 10, 1, 2), // Second Monday of October
};

// Helper functions
function setTime(date: Date, timeStr: string): Date {
  const result = new Date(date);
  const [hours, minutes] = timeStr.split(":").map(Number);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function getBodEod(date: Date, workHours?: WorkHoursSettings): { bod: string; eod: string } {
  if (!workHours) return { bod: "09:00", eod: "17:00" };

  const dayOfWeek = date.getDay();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const dayName = dayNames[dayOfWeek];

  let schedule;
  if (workHours.useCommonSchedule) {
    schedule = workHours.commonSchedule;
  } else if (workHours.customSchedules[dayName]) {
    schedule = workHours.customSchedules[dayName];
  } else {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    schedule = isWeekend ? workHours.weekendSchedule : workHours.weekdaySchedule;
  }

  return {
    bod: schedule?.startTime || "09:00",
    eod: schedule?.endTime || "17:00",
  };
}

function getStartOfWeek(ref: Date, workWeekStart: number, workHours?: WorkHoursSettings): Date {
  const result = new Date(ref);
  const day = result.getDay();
  const diff = (day < workWeekStart ? 7 : 0) + day - workWeekStart;
  result.setDate(result.getDate() - diff);
  return setTime(result, getBodEod(result, workHours).bod);
}

function getEndOfWeek(ref: Date, workWeekStart: number, workHours?: WorkHoursSettings): Date {
  const result = new Date(ref);
  const day = result.getDay();
  const diff = (workWeekStart + 6 - day) % 7;
  result.setDate(result.getDate() + diff);
  return setTime(result, getBodEod(result, workHours).eod);
}

/**
 * Get the next occurrence of a fixed-date holiday
 * If the date has passed this year, returns next year's date
 */
function getNextHoliday(ref: Date, month: number, day: number): Date {
  let year = ref.getFullYear();
  const holiday = new Date(year, month - 1, day);
  if (holiday < ref) {
    holiday.setFullYear(year + 1);
  }
  return holiday;
}

/**
 * Get the Nth weekday of a specific month
 * e.g., 4th Thursday of November (Thanksgiving)
 * @param ref Reference date
 * @param month Month (1-12)
 * @param weekday Day of week (0=Sunday, 1=Monday, etc.)
 * @param nth Which occurrence (1-5)
 */
function getNthWeekdayOfMonth(ref: Date, month: number, weekday: number, nth: number): Date {
  let year = ref.getFullYear();

  // Start at the first of the month
  const firstOfMonth = new Date(year, month - 1, 1);

  // Find the first occurrence of the weekday
  const firstWeekday = firstOfMonth.getDay();
  const daysToAdd = (weekday - firstWeekday + 7) % 7;
  const firstOccurrence = new Date(year, month - 1, 1 + daysToAdd);

  // Add weeks to get to the Nth occurrence
  const result = new Date(firstOccurrence);
  result.setDate(result.getDate() + (nth - 1) * 7);

  // If the holiday has passed this year, get next year's
  if (result < ref) {
    return getNthWeekdayOfMonth(new Date(year + 1, 0, 1), month, weekday, nth);
  }

  return result;
}

/**
 * Get the last weekday of a specific month
 * e.g., Last Monday of May (Memorial Day)
 * @param ref Reference date
 * @param month Month (1-12)
 * @param weekday Day of week (0=Sunday, 1=Monday, etc.)
 */
function getLastWeekdayOfMonth(ref: Date, month: number, weekday: number): Date {
  let year = ref.getFullYear();

  // Start at the last day of the month
  const lastOfMonth = new Date(year, month, 0); // Day 0 of next month = last day of this month

  // Find the last occurrence of the weekday
  const lastWeekday = lastOfMonth.getDay();
  const daysToSubtract = (lastWeekday - weekday + 7) % 7;
  const result = new Date(lastOfMonth);
  result.setDate(result.getDate() - daysToSubtract);

  // If the holiday has passed this year, get next year's
  if (result < ref) {
    return getLastWeekdayOfMonth(new Date(year + 1, 0, 1), month, weekday);
  }

  return result;
}

/**
 * Get the end of a fiscal quarter (Q1, Q2, Q3, Q4)
 * Q1: Jan-Mar (ends March 31)
 * Q2: Apr-Jun (ends June 30)
 * Q3: Jul-Sep (ends September 30)
 * Q4: Oct-Dec (ends December 31)
 */
function getEndOfFiscalQuarter(ref: Date, quarter: number, workHours?: WorkHoursSettings): Date {
  let year = ref.getFullYear();

  // Quarter end months: Q1=March(2), Q2=June(5), Q3=September(8), Q4=December(11)
  const endMonth = quarter * 3 - 1;

  // Get last day of the quarter
  const result = new Date(year, endMonth + 1, 0);

  // If the quarter has passed, get next year's
  if (result < ref) {
    result.setFullYear(year + 1);
  }

  return setTime(result, getBodEod(result, workHours).eod);
}

/**
 * Get the end of a fiscal half (H1, H2)
 * H1: Jan-Jun (ends June 30)
 * H2: Jul-Dec (ends December 31)
 */
function getEndOfFiscalHalf(ref: Date, half: number, workHours?: WorkHoursSettings): Date {
  let year = ref.getFullYear();

  // Half end months: H1=June(5), H2=December(11)
  const endMonth = half === 1 ? 5 : 11;

  // Get last day of the half
  const result = new Date(year, endMonth + 1, 0);

  // If the half has passed, get next year's
  if (result < ref) {
    result.setFullYear(year + 1);
  }

  return setTime(result, getBodEod(result, workHours).eod);
}

/**
 * Get the end of a fiscal year
 * Default: December 31
 */
function getEndOfFiscalYear(ref: Date, year: number, workHours?: WorkHoursSettings): Date {
  // Get December 31 of the specified year
  const result = new Date(year, 11, 31);
  return setTime(result, getBodEod(result, workHours).eod);
}

/**
 * Create a custom shorthand parser for chrono
 */
function createShorthandParser(dateTimeSettings?: DateTimeSettings, workHoursSettings?: WorkHoursSettings): Parser {
  // Build regex pattern from all shorthand keys
  const patterns = Object.keys(SHORTHAND_PATTERNS).join("|");
  const patternRegex = new RegExp(`\\b(${patterns})\\b`, "i");

  return {
    pattern: () => patternRegex,
    extract: (context: ParsingContext, match: RegExpMatchArray) => {
      const shorthand = match[1].toLowerCase();
      const handler = SHORTHAND_PATTERNS[shorthand];

      if (!handler) return null;

      const refDate = context.refDate;
      const resultDate = handler(refDate, dateTimeSettings, workHoursSettings);

      return context.createParsingComponents({
        year: resultDate.getFullYear(),
        month: resultDate.getMonth() + 1,
        day: resultDate.getDate(),
        hour: resultDate.getHours(),
        minute: resultDate.getMinutes(),
        second: 0,
      });
    },
  };
}

/**
 * Create a relative date parser (e.g., "in 3 days", "in 2 weeks")
 */
function createRelativeDateParser(): Parser {
  return {
    pattern: () => /\bin\s+(\d+)\s+(day|week|month|year)s?\b/i,
    extract: (context: ParsingContext, match: RegExpMatchArray) => {
      const amount = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      const refDate = context.refDate;
      const resultDate = new Date(refDate);

      switch (unit) {
        case "day":
          resultDate.setDate(resultDate.getDate() + amount);
          break;
        case "week":
          resultDate.setDate(resultDate.getDate() + amount * 7);
          break;
        case "month":
          resultDate.setMonth(resultDate.getMonth() + amount);
          break;
        case "year":
          resultDate.setFullYear(resultDate.getFullYear() + amount);
          break;
      }

      return context.createParsingComponents({
        year: resultDate.getFullYear(),
        month: resultDate.getMonth() + 1,
        day: resultDate.getDate(),
      });
    },
  };
}

/**
 * Create a time-only parser (e.g., "2pm", "3:30pm", "14:00")
 * Defaults to today (or tomorrow if time has passed)
 */
function createTimeOnlyParser(): Parser {
  return {
    pattern: () => /\b(1[0-2]|[1-9])(?::([0-5][0-9]))?\s*(am|pm)\b/i,
    extract: (context: ParsingContext, match: RegExpMatchArray) => {
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const meridiem = match[3].toLowerCase();

      // Convert to 24-hour format
      if (meridiem === "pm" && hours !== 12) {
        hours += 12;
      } else if (meridiem === "am" && hours === 12) {
        hours = 0;
      }

      const refDate = context.refDate;
      const resultDate = new Date(refDate);
      resultDate.setHours(hours, minutes, 0, 0);

      // If time is in the past today, assume tomorrow
      if (resultDate < refDate) {
        resultDate.setDate(resultDate.getDate() + 1);
      }

      return context.createParsingComponents({
        year: resultDate.getFullYear(),
        month: resultDate.getMonth() + 1,
        day: resultDate.getDate(),
        hour: hours,
        minute: minutes,
      });
    },
  };
}

/**
 * Create a refiner to filter out duration patterns from being parsed as times
 * Duration patterns like "46m", "2h" should not be interpreted as times
 */
function createDurationFilterRefiner(): Refiner {
  return {
    refine: (context: ParsingContext, results) => {
      const text = context.text;

      return results.filter((result) => {
        // Check if this result overlaps with a duration pattern
        const beforeText = text.slice(Math.max(0, result.index - 5), result.index);
        const matchText = text.slice(result.index, result.index + result.text.length);
        const afterText = text.slice(result.index + result.text.length, result.index + result.text.length + 5);

        // Duration patterns: number + m/h/d/w (standalone)
        const durationPattern = /^\d+(?:\.\d+)?\s*(m|min|h|hr|d|w)\b/i;
        if (durationPattern.test(matchText)) {
          return false; // Filter out duration patterns
        }

        // Also filter if the match is part of a larger duration (e.g., "46m" parsed as time)
        if (/\d$/.test(beforeText) && /^(m|min|h|hr|d|w)\b/i.test(matchText)) {
          return false;
        }

        return true;
      });
    },
  };
}

/**
 * Create a refiner to apply EOD time to "today" without specific time
 */
function createTodayEodRefiner(workHoursSettings?: WorkHoursSettings): Refiner {
  return {
    refine: (context: ParsingContext, results) => {
      return results.map((result) => {
        // If the text is "today" and no time is specified, set to EOD
        if (result.text.toLowerCase() === "today" && !result.start.isCertain("hour")) {
          const { eod } = getBodEod(context.refDate, workHoursSettings);
          const [hours, minutes] = eod.split(":").map(Number);
          result.start.assign("hour", hours);
          result.start.assign("minute", minutes);
        }
        return result;
      });
    },
  };
}

/**
 * Create a fiscal period parser (Q1, Q2, Q3, Q4, H1, H2, FY2025, FY25)
 * These default to the END of the period as that's typically when things are due
 */
function createFiscalPeriodParser(workHoursSettings?: WorkHoursSettings): Parser {
  return {
    // Match Q1-Q4, H1-H2, FY2025/FY25 patterns
    pattern: () => /\b(Q[1-4]|H[1-2]|FY\d{2,4})(\s+\d{4})?\b/i,
    extract: (context: ParsingContext, match: RegExpMatchArray) => {
      const period = match[1].toUpperCase();
      const explicitYear = match[2] ? parseInt(match[2].trim(), 10) : null;
      const refDate = context.refDate;
      let resultDate: Date;

      if (period.startsWith("Q")) {
        // Quarter: Q1, Q2, Q3, Q4
        const quarter = parseInt(period[1], 10);
        resultDate = getEndOfFiscalQuarter(refDate, quarter, workHoursSettings);
        if (explicitYear) {
          resultDate.setFullYear(explicitYear);
        }
      } else if (period.startsWith("H")) {
        // Half: H1, H2
        const half = parseInt(period[1], 10);
        resultDate = getEndOfFiscalHalf(refDate, half, workHoursSettings);
        if (explicitYear) {
          resultDate.setFullYear(explicitYear);
        }
      } else if (period.startsWith("FY")) {
        // Fiscal Year: FY2025, FY25
        let year = parseInt(period.slice(2), 10);
        // Handle 2-digit years
        if (year < 100) {
          year = year > 50 ? 1900 + year : 2000 + year;
        }
        resultDate = getEndOfFiscalYear(refDate, year, workHoursSettings);
      } else {
        return null;
      }

      return context.createParsingComponents({
        year: resultDate.getFullYear(),
        month: resultDate.getMonth() + 1,
        day: resultDate.getDate(),
        hour: resultDate.getHours(),
        minute: resultDate.getMinutes(),
      });
    },
  };
}

/**
 * Helper to check if a date is a weekend
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Add business days to a date (skips weekends)
 */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) {
      remaining--;
    }
  }

  return result;
}

/**
 * Create a business days parser (e.g., "in 3 business days", "in 5 working days")
 */
function createBusinessDaysParser(): Parser {
  return {
    pattern: () => /\bin\s+(\d+)\s+(business|working|work)\s*days?\b/i,
    extract: (context: ParsingContext, match: RegExpMatchArray) => {
      const amount = parseInt(match[1], 10);
      const refDate = context.refDate;
      const resultDate = addBusinessDays(refDate, amount);

      return context.createParsingComponents({
        year: resultDate.getFullYear(),
        month: resultDate.getMonth() + 1,
        day: resultDate.getDate(),
      });
    },
  };
}

/**
 * Create a custom chrono instance with all our extensions
 */
export function createCustomChrono(
  dateTimeSettings?: DateTimeSettings,
  workHoursSettings?: WorkHoursSettings,
): chrono.Chrono {
  // Clone the casual parser as our base
  const custom = chrono.casual.clone();

  // Add our custom parsers (in priority order - first added = higher priority)
  custom.parsers.unshift(createShorthandParser(dateTimeSettings, workHoursSettings));
  custom.parsers.unshift(createRelativeDateParser());
  custom.parsers.unshift(createBusinessDaysParser());
  custom.parsers.unshift(createFiscalPeriodParser(workHoursSettings));
  custom.parsers.push(createTimeOnlyParser()); // Lower priority than chrono's defaults

  // Add our custom refiners
  custom.refiners.unshift(createDurationFilterRefiner());
  custom.refiners.push(createTodayEodRefiner(workHoursSettings));

  return custom;
}

/**
 * Parse dates using our custom chrono instance
 * This is the main entry point for date parsing
 */
export function parseWithCustomChrono(
  text: string,
  referenceDate: Date = new Date(),
  dateTimeSettings?: DateTimeSettings,
  workHoursSettings?: WorkHoursSettings,
): chrono.ParsedResult[] {
  const customChrono = createCustomChrono(dateTimeSettings, workHoursSettings);
  return customChrono.parse(text, referenceDate, { forwardDate: true });
}

/**
 * Get the first parsed date from text
 */
export function parseDateWithCustomChrono(
  text: string,
  referenceDate: Date = new Date(),
  dateTimeSettings?: DateTimeSettings,
  workHoursSettings?: WorkHoursSettings,
): Date | null {
  const results = parseWithCustomChrono(text, referenceDate, dateTimeSettings, workHoursSettings);
  return results.length > 0 ? results[0].start.date() : null;
}
