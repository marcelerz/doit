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

  // Tonight/tonite - evening of today
  tonight: (ref, dt) => setTime(ref, dt?.evening || "18:00"),
  tonite: (ref, dt) => setTime(ref, dt?.evening || "18:00"),

  // Urgency shorthands - map to today EOD
  asap: (ref, dt, wh) => setTime(ref, getBodEod(ref, wh).eod),
  urgent: (ref, dt, wh) => setTime(ref, getBodEod(ref, wh).eod),
  immediately: (ref, dt, wh) => setTime(ref, getBodEod(ref, wh).eod),
  now: (ref) => ref, // Current time

  // Someday/later - maps to 3 months from now (far future but not too far)
  someday: (ref) => {
    const d = new Date(ref);
    d.setMonth(d.getMonth() + 3);
    return d;
  },
  later: (ref) => {
    const d = new Date(ref);
    d.setMonth(d.getMonth() + 1);
    return d;
  },
  eventually: (ref) => {
    const d = new Date(ref);
    d.setMonth(d.getMonth() + 6);
    return d;
  },
  whenever: (ref) => {
    const d = new Date(ref);
    d.setMonth(d.getMonth() + 3);
    return d;
  },

  // Seasons (Northern hemisphere, approximate)
  spring: (ref) => getNextSeason(ref, 3, 20), // March 20
  summer: (ref) => getNextSeason(ref, 6, 21), // June 21
  fall: (ref) => getNextSeason(ref, 9, 22), // September 22
  autumn: (ref) => getNextSeason(ref, 9, 22), // September 22
  winter: (ref) => getNextSeason(ref, 12, 21), // December 21

  // Payday patterns (common: 15th and last day of month)
  payday: (ref) => getNextPayday(ref),
  nextpayday: (ref) => getNextPayday(ref),

  // Holidays (US-centric, but common)
  christmas: (ref) => getNextHoliday(ref, 12, 25),
  christmaseve: (ref) => getNextHoliday(ref, 12, 24),
  xmas: (ref) => getNextHoliday(ref, 12, 25),
  newyears: (ref) => getNextHoliday(ref, 1, 1),
  newyearseve: (ref) => getNextHoliday(ref, 12, 31),
  newyearsday: (ref) => getNextHoliday(ref, 1, 1),
  valentines: (ref) => getNextHoliday(ref, 2, 14),
  valentinesday: (ref) => getNextHoliday(ref, 2, 14),
  stpatricks: (ref) => getNextHoliday(ref, 3, 17),
  stpatricksday: (ref) => getNextHoliday(ref, 3, 17),
  easter: (ref) => getNextEaster(ref),
  mothersday: (ref) => getNthWeekdayOfMonth(ref, 5, 0, 2), // Second Sunday of May
  fathersday: (ref) => getNthWeekdayOfMonth(ref, 6, 0, 3), // Third Sunday of June
  halloween: (ref) => getNextHoliday(ref, 10, 31),
  independenceday: (ref) => getNextHoliday(ref, 7, 4),
  julyfourth: (ref) => getNextHoliday(ref, 7, 4),
  laborday: (ref) => getNthWeekdayOfMonth(ref, 9, 1, 1), // First Monday of September
  memorialday: (ref) => getLastWeekdayOfMonth(ref, 5, 1), // Last Monday of May
  thanksgiving: (ref) => getNthWeekdayOfMonth(ref, 11, 4, 4), // Fourth Thursday of November
  blackfriday: (ref) => getBlackFriday(ref), // Day after Thanksgiving
  cybermonday: (ref) => getCyberMonday(ref), // Monday after Thanksgiving
  mlkday: (ref) => getNthWeekdayOfMonth(ref, 1, 1, 3), // Third Monday of January
  presidentsday: (ref) => getNthWeekdayOfMonth(ref, 2, 1, 3), // Third Monday of February
  columbusday: (ref) => getNthWeekdayOfMonth(ref, 10, 1, 2), // Second Monday of October
  veteransday: (ref) => getNextHoliday(ref, 11, 11),
  taxday: (ref) => getNextHoliday(ref, 4, 15), // April 15 (US tax deadline)
  electionday: (ref) => getElectionDay(ref), // First Tuesday after first Monday in November
  groundhogday: (ref) => getNextHoliday(ref, 2, 2),
  cincodemayo: (ref) => getNextHoliday(ref, 5, 5),
  juneteenth: (ref) => getNextHoliday(ref, 6, 19),
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
 * Get the next occurrence of a season start date
 */
function getNextSeason(ref: Date, month: number, day: number): Date {
  let year = ref.getFullYear();
  const season = new Date(year, month - 1, day);
  if (season <= ref) {
    season.setFullYear(year + 1);
  }
  return season;
}

/**
 * Get the next payday (15th or last day of month, whichever is next)
 */
function getNextPayday(ref: Date): Date {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const day = ref.getDate();

  // Check 15th of current month
  const fifteenth = new Date(year, month, 15);
  if (fifteenth > ref) {
    return fifteenth;
  }

  // Check last day of current month
  const lastDay = new Date(year, month + 1, 0);
  if (lastDay > ref) {
    return lastDay;
  }

  // Return 15th of next month
  return new Date(year, month + 1, 15);
}

/**
 * Calculate Easter Sunday (Western) using the Anonymous Gregorian algorithm
 */
function getNextEaster(ref: Date): Date {
  const year = ref.getFullYear();
  const easter = calculateEaster(year);
  if (easter <= ref) {
    return calculateEaster(year + 1);
  }
  return easter;
}

function calculateEaster(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Get Black Friday (day after Thanksgiving)
 */
function getBlackFriday(ref: Date): Date {
  const thanksgiving = getNthWeekdayOfMonth(ref, 11, 4, 4);
  const blackFriday = new Date(thanksgiving);
  blackFriday.setDate(blackFriday.getDate() + 1);
  return blackFriday;
}

/**
 * Get Cyber Monday (Monday after Thanksgiving)
 */
function getCyberMonday(ref: Date): Date {
  const thanksgiving = getNthWeekdayOfMonth(ref, 11, 4, 4);
  const cyberMonday = new Date(thanksgiving);
  cyberMonday.setDate(cyberMonday.getDate() + 4); // Thursday + 4 = Monday
  return cyberMonday;
}

/**
 * Get Election Day (First Tuesday after first Monday in November)
 */
function getElectionDay(ref: Date): Date {
  let year = ref.getFullYear();
  const electionDay = calculateElectionDay(year);
  if (electionDay <= ref) {
    return calculateElectionDay(year + 1);
  }
  return electionDay;
}

function calculateElectionDay(year: number): Date {
  // First Monday of November
  const firstOfNov = new Date(year, 10, 1);
  const dayOfWeek = firstOfNov.getDay();
  const daysToMonday = (1 - dayOfWeek + 7) % 7;
  const firstMonday = new Date(year, 10, 1 + daysToMonday);
  // Election Day is the Tuesday after
  const electionDay = new Date(firstMonday);
  electionDay.setDate(electionDay.getDate() + 1);
  return electionDay;
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
 * Create an ordinal day parser (e.g., "the 15th", "the 1st", "on the 23rd")
 * Assumes current month if date hasn't passed, next month otherwise
 */
function createOrdinalDayParser(): Parser {
  return {
    pattern: () => /\b(?:the|on\s+the)?\s*(\d{1,2})(?:st|nd|rd|th)\b/i,
    extract: (context: ParsingContext, match: RegExpMatchArray) => {
      const day = parseInt(match[1], 10);
      if (day < 1 || day > 31) return null;

      const refDate = context.refDate;
      let resultDate = new Date(refDate.getFullYear(), refDate.getMonth(), day);

      // If the day has passed this month, use next month
      if (resultDate <= refDate) {
        resultDate.setMonth(resultDate.getMonth() + 1);
      }

      // Validate the date is valid (e.g., Feb 30 becomes Mar 2)
      if (resultDate.getDate() !== day) {
        // Invalid date for that month, skip to next valid month
        resultDate = new Date(refDate.getFullYear(), refDate.getMonth() + 2, day);
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
 * Create a relative weekday parser (e.g., "2 mondays from now", "3 fridays from now")
 */
function createRelativeWeekdayParser(): Parser {
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const weekdayPattern = weekdays.join("|");

  return {
    pattern: () => new RegExp(`\\b(\\d+)\\s+(${weekdayPattern})s?\\s+from\\s+now\\b`, "i"),
    extract: (context: ParsingContext, match: RegExpMatchArray) => {
      const count = parseInt(match[1], 10);
      const targetWeekday = weekdays.indexOf(match[2].toLowerCase());
      if (targetWeekday === -1) return null;

      const refDate = context.refDate;
      const currentWeekday = refDate.getDay();

      // Calculate days to first occurrence of target weekday
      let daysToFirst = (targetWeekday - currentWeekday + 7) % 7;
      if (daysToFirst === 0) daysToFirst = 7; // If same day, go to next week

      // Add weeks for remaining occurrences
      const totalDays = daysToFirst + (count - 1) * 7;

      const resultDate = new Date(refDate);
      resultDate.setDate(resultDate.getDate() + totalDays);

      return context.createParsingComponents({
        year: resultDate.getFullYear(),
        month: resultDate.getMonth() + 1,
        day: resultDate.getDate(),
      });
    },
  };
}

/**
 * Create a sprint parser for agile teams (e.g., "sprint 1", "sprint 3")
 * Assumes 2-week sprints starting from beginning of year
 * Sprint 1 starts Jan 1 (or first Monday), Sprint 2 starts Jan 15, etc.
 */
function createSprintParser(): Parser {
  return {
    pattern: () => /\bsprint\s*(\d{1,2})\b/i,
    extract: (context: ParsingContext, match: RegExpMatchArray) => {
      const sprintNum = parseInt(match[1], 10);
      if (sprintNum < 1 || sprintNum > 26) return null; // Max 26 sprints per year

      const refDate = context.refDate;
      const year = refDate.getFullYear();

      // Find first Monday of the year
      const jan1 = new Date(year, 0, 1);
      const dayOfWeek = jan1.getDay();
      const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
      const firstMonday = new Date(year, 0, 1 + daysToMonday);

      // Calculate sprint end date (each sprint is 2 weeks)
      const sprintEndDate = new Date(firstMonday);
      sprintEndDate.setDate(sprintEndDate.getDate() + sprintNum * 14 - 1); // End of sprint

      // If sprint has passed, calculate for next year
      if (sprintEndDate < refDate) {
        const nextYear = year + 1;
        const nextJan1 = new Date(nextYear, 0, 1);
        const nextDayOfWeek = nextJan1.getDay();
        const nextDaysToMonday = nextDayOfWeek === 0 ? 1 : nextDayOfWeek === 1 ? 0 : 8 - nextDayOfWeek;
        const nextFirstMonday = new Date(nextYear, 0, 1 + nextDaysToMonday);
        const nextSprintEnd = new Date(nextFirstMonday);
        nextSprintEnd.setDate(nextSprintEnd.getDate() + sprintNum * 14 - 1);
        return context.createParsingComponents({
          year: nextSprintEnd.getFullYear(),
          month: nextSprintEnd.getMonth() + 1,
          day: nextSprintEnd.getDate(),
        });
      }

      return context.createParsingComponents({
        year: sprintEndDate.getFullYear(),
        month: sprintEndDate.getMonth() + 1,
        day: sprintEndDate.getDate(),
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
  custom.parsers.unshift(createRelativeWeekdayParser());
  custom.parsers.unshift(createOrdinalDayParser());
  custom.parsers.unshift(createSprintParser());
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
