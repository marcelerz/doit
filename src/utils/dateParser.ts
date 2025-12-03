import { DateTimeSettings, WorkHoursSettings } from "@/types/settings";

export interface ParsedDate {
  original: string;
  formatted: string; // "Wed, 5th Jan 2025 10:23am" format
  timestamp: number;
}

// Helper to get ordinal suffix
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

// Format date to "Wed, 5th Jan 2025 10:23am" or "Wed, 5th Jan 2025 14:23" (24hr)
export const formatDateTime = (date: Date, use24Hour: boolean = false): string => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours24 = date.getHours();
  const minutes = date.getMinutes();

  const ordinal = getOrdinalSuffix(day);
  const minutesStr = minutes.toString().padStart(2, "0");

  if (use24Hour) {
    const hoursStr = hours24.toString().padStart(2, "0");
    return `${dayName}, ${day}${ordinal} ${month} ${year} ${hoursStr}:${minutesStr}`;
  } else {
    const hours12 = hours24 % 12 || 12;
    const ampm = hours24 >= 12 ? "pm" : "am";
    return `${dayName}, ${day}${ordinal} ${month} ${year} ${hours12}:${minutesStr}${ampm}`;
  }
};

// Parse date with slashes or dots - tries both US (MM/DD/YYYY) and European (DD/MM/YYYY) formats
const parseSlashOrDotDate = (input: string): Date | null => {
  // Match formats: 12/25/2024, 25.12.2024, etc. with optional time
  const patterns = [
    // With seconds: XX/XX/XXXX HH:MM:SS
    /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/,
    // With minutes: XX/XX/XXXX HH:MM
    /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})\s+(\d{1,2}):(\d{2})$/,
    // Date only: XX/XX/XXXX
    /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      const hours = match[4] ? parseInt(match[4], 10) : 0;
      const minutes = match[5] ? parseInt(match[5], 10) : 0;
      const seconds = match[6] ? parseInt(match[6], 10) : 0;

      // Try US format first (MM/DD/YYYY) - month/day/year
      // This is the more common format with slashes
      if (first >= 1 && first <= 12 && second >= 1 && second <= 31) {
        const month = first - 1; // JS months are 0-indexed
        const day = second;
        const usDate = new Date(year, month, day, hours, minutes, seconds);
        // Verify it's a valid date
        if (usDate.getMonth() === month && usDate.getDate() === day) {
          return usDate;
        }
      }

      // If US format failed or is ambiguous, try European format (DD/MM/YYYY)
      // Especially for dots (.) which are more common in Europe
      if (second >= 1 && second <= 12 && first >= 1 && first <= 31) {
        const month = second - 1; // JS months are 0-indexed
        const day = first;
        const euDate = new Date(year, month, day, hours, minutes, seconds);
        // Verify it's a valid date
        if (euDate.getMonth() === month && euDate.getDate() === day) {
          // If using dots, prefer European format
          if (input.includes(".")) {
            return euDate;
          }
          // If first > 12, it must be European format (day is > 12)
          if (first > 12) {
            return euDate;
          }
        }
      }
    }
  }

  return null;
};

// Detect if input contains 24-hour time (HH:MM where HH >= 13)
const contains24HourTime = (input: string): boolean => {
  // Match HH:MM or HH:MM:SS where HH is 13-23
  return /\b([1][3-9]|[2][0-3]):[0-5][0-9]/.test(input);
};

// Get BOD/EOD times from work hours settings based on the date
const getBodEod = (date: Date, workHours: WorkHoursSettings): { bod: string; eod: string } => {
  const dayOfWeek = date.getDay();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const dayName = dayNames[dayOfWeek];

  let schedule;
  if (workHours.useCommonSchedule) {
    schedule = workHours.commonSchedule;
  } else if (workHours.customSchedules[dayName]) {
    schedule = workHours.customSchedules[dayName];
  } else {
    // Use weekday or weekend schedule
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    schedule = isWeekend ? workHours.weekendSchedule : workHours.weekdaySchedule;
  }

  return {
    bod: schedule?.startTime || "09:00",
    eod: schedule?.endTime || "17:00",
  };
};

// Parse shorthand dates
export const parseShorthand = (
  shorthand: string,
  dateTimeSettings: DateTimeSettings,
  workHours: WorkHoursSettings,
): Date | null => {
  const now = new Date();
  const lower = shorthand.toLowerCase().trim();

  // Helper to set time from HH:MM format
  const setTime = (date: Date, timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  };

  switch (lower) {
    case "today":
    case "tod":
      return now;

    case "tomorrow":
    case "tmr":
    case "tom": {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }

    case "bod": // Beginning of day
    case "startofday": {
      const bod = new Date(now);
      const times = getBodEod(bod, workHours);
      setTime(bod, times.bod);
      return bod;
    }

    case "eod": // End of day
    case "endofday": {
      const eod = new Date(now);
      const times = getBodEod(eod, workHours);
      setTime(eod, times.eod);
      return eod;
    }

    case "morning": {
      const morning = new Date(now);
      setTime(morning, dateTimeSettings.morning);
      return morning;
    }

    case "noon": {
      const noon = new Date(now);
      setTime(noon, dateTimeSettings.noon);
      return noon;
    }

    case "afternoon": {
      const afternoon = new Date(now);
      setTime(afternoon, dateTimeSettings.afternoon);
      return afternoon;
    }

    case "evening": {
      const evening = new Date(now);
      setTime(evening, dateTimeSettings.evening);
      return evening;
    }

    case "bow": // Beginning of week
    case "startofweek": {
      const bow = new Date(now);
      const day = bow.getDay();
      const diff = (day < dateTimeSettings.workWeekStart ? 7 : 0) + day - dateTimeSettings.workWeekStart;
      bow.setDate(bow.getDate() - diff);
      const times = getBodEod(bow, workHours);
      setTime(bow, times.bod);
      return bow;
    }

    case "eow": // End of week
    case "endofweek": {
      const eow = new Date(now);
      const day = eow.getDay();
      const diff = (dateTimeSettings.workWeekStart + 6 - day) % 7;
      eow.setDate(eow.getDate() + diff);
      const times = getBodEod(eow, workHours);
      setTime(eow, times.eod);
      return eow;
    }

    case "nextweek": {
      const nextWeek = new Date(now);
      const day = nextWeek.getDay();
      const daysToAdd = ((dateTimeSettings.workWeekStart + 7 - day) % 7) + 7;
      nextWeek.setDate(nextWeek.getDate() + daysToAdd);
      const times = getBodEod(nextWeek, workHours);
      setTime(nextWeek, times.bod);
      return nextWeek;
    }

    case "weekend":
    case "nextsaturday": {
      const weekend = new Date(now);
      const day = weekend.getDay();
      const daysToSaturday = (6 - day + 7) % 7 || 7;
      weekend.setDate(weekend.getDate() + daysToSaturday);
      return weekend;
    }

    case "bom": // Beginning of month
    case "startofmonth": {
      const bom = new Date(now.getFullYear(), now.getMonth(), 1);
      const times = getBodEod(bom, workHours);
      setTime(bom, times.bod);
      return bom;
    }

    case "eom": // End of month
    case "endofmonth": {
      const eom = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const times = getBodEod(eom, workHours);
      setTime(eom, times.eod);
      return eom;
    }

    case "nextmonth": {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const times = getBodEod(nextMonth, workHours);
      setTime(nextMonth, times.bod);
      return nextMonth;
    }

    case "boq": // Beginning of quarter
    case "startofquarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const boq = new Date(now.getFullYear(), quarter * 3, 1);
      const times = getBodEod(boq, workHours);
      setTime(boq, times.bod);
      return boq;
    }

    case "eoq": // End of quarter
    case "endofquarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const eoq = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      const times = getBodEod(eoq, workHours);
      setTime(eoq, times.eod);
      return eoq;
    }

    case "nextquarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const nextQ = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
      if (nextQ < now) nextQ.setFullYear(nextQ.getFullYear() + 1);
      const times = getBodEod(nextQ, workHours);
      setTime(nextQ, times.bod);
      return nextQ;
    }

    case "boh": // Beginning of half (H1/H2)
    case "startofhalf": {
      const half = now.getMonth() < 6 ? 0 : 6;
      const boh = new Date(now.getFullYear(), half, 1);
      const times = getBodEod(boh, workHours);
      setTime(boh, times.bod);
      return boh;
    }

    case "eoh": // End of half
    case "endofhalf": {
      const half = now.getMonth() < 6 ? 5 : 11;
      const eoh = new Date(now.getFullYear(), half + 1, 0);
      const times = getBodEod(eoh, workHours);
      setTime(eoh, times.eod);
      return eoh;
    }

    case "nexthalf": {
      const half = now.getMonth() < 6 ? 6 : 0;
      const nextH = new Date(now.getFullYear(), half, 1);
      if (nextH < now) nextH.setFullYear(nextH.getFullYear() + 1);
      const times = getBodEod(nextH, workHours);
      setTime(nextH, times.bod);
      return nextH;
    }

    case "boy": // Beginning of year
    case "startofyear": {
      const boy = new Date(now.getFullYear(), 0, 1);
      const times = getBodEod(boy, workHours);
      setTime(boy, times.bod);
      return boy;
    }

    case "eoy": // End of year
    case "endofyear": {
      const eoy = new Date(now.getFullYear(), 11, 31);
      const times = getBodEod(eoy, workHours);
      setTime(eoy, times.eod);
      return eoy;
    }

    case "nextyear": {
      const nextY = new Date(now.getFullYear() + 1, 0, 1);
      const times = getBodEod(nextY, workHours);
      setTime(nextY, times.bod);
      return nextY;
    }

    default:
      return null;
  }
};

// Parse various date formats
export const parseDate = (
  input: string,
  dateTimeSettings: DateTimeSettings,
  workHours: WorkHoursSettings,
): ParsedDate | null => {
  const trimmedInput = input.trim();
  const use24Hour = contains24HourTime(trimmedInput);

  // Try shorthand first
  const shorthandDate = parseShorthand(trimmedInput, dateTimeSettings, workHours);
  if (shorthandDate) {
    return {
      original: trimmedInput,
      formatted: formatDateTime(shorthandDate, use24Hour),
      timestamp: shorthandDate.getTime(),
    };
  }

  // Try European date format (DD/MM/YYYY or DD.MM.YYYY)
  const slashDotDate = parseSlashOrDotDate(trimmedInput);
  if (slashDotDate) {
    return {
      original: trimmedInput,
      formatted: formatDateTime(slashDotDate, use24Hour),
      timestamp: slashDotDate.getTime(),
    };
  }

  // Try parsing as Date (handles many formats including ISO, US dates, etc.)
  const parsed = new Date(trimmedInput);
  if (!isNaN(parsed.getTime())) {
    return {
      original: trimmedInput,
      formatted: formatDateTime(parsed, use24Hour),
      timestamp: parsed.getTime(),
    };
  }

  return null;
};

// Get due date suggestions for autocomplete
export const getDueDateSuggestions = (search: string, dateTimeSettings: DateTimeSettings): string[] => {
  const suggestions = [
    { value: "today", label: "today - Today" },
    { value: "tomorrow", label: "tomorrow - Tomorrow" },
    { value: "morning", label: "morning - Morning" },
    { value: "noon", label: "noon - Noon (12:00)" },
    { value: "afternoon", label: "afternoon - Afternoon" },
    { value: "evening", label: "evening - Evening" },
    { value: "eod", label: "eod - End of day" },
    { value: "bod", label: "bod - Beginning of day" },
    { value: "eow", label: "eow - End of week" },
    { value: "bow", label: "bow - Beginning of week" },
    { value: "nextweek", label: "nextweek - Next week" },
    { value: "weekend", label: "weekend - Next Saturday" },
    { value: "eom", label: "eom - End of month" },
    { value: "bom", label: "bom - Beginning of month" },
    { value: "nextmonth", label: "nextmonth - Next month" },
    { value: "eoq", label: "eoq - End of quarter" },
    { value: "boq", label: "boq - Beginning of quarter" },
    { value: "nextquarter", label: "nextquarter - Next quarter" },
    { value: "eoh", label: "eoh - End of half year" },
    { value: "boh", label: "boh - Beginning of half year" },
    { value: "nexthalf", label: "nexthalf - Next half year" },
    { value: "eoy", label: "eoy - End of year" },
    { value: "boy", label: "boy - Beginning of year" },
    { value: "nextyear", label: "nextyear - Next year" },
  ];

  const lowerSearch = search.toLowerCase();

  if (!lowerSearch) {
    // Show top suggestions when no search
    return suggestions.slice(0, 8).map((s) => s.label);
  }

  // Filter based on search
  return suggestions
    .filter((s) => s.value.includes(lowerSearch) || s.label.toLowerCase().includes(lowerSearch))
    .map((s) => s.label);
};

// Convert a date to ISO format string (yyyy-MM-ddTHH:mm) using local time
export const toLocalISOString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Normalize a date value that might be shorthand (like "today") to ISO format
// Special handling: "today" without a time defaults to EOD
export const normalizeDateValue = (
  dateValue: string | undefined,
  dateTimeSettings: DateTimeSettings,
  workHours: WorkHoursSettings,
): string | undefined => {
  if (!dateValue) return undefined;

  // If it's already in ISO format, return as-is
  if (dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateValue;
  }

  // Preprocess certain formats to make them parseable
  let processedValue = dateValue.toLowerCase().trim();

  // Handle "next [day]" format by converting spaces to calculate the next occurrence
  const nextDayMatch = processedValue.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (nextDayMatch) {
    const targetDay = nextDayMatch[1];
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDayIndex = dayNames.indexOf(targetDay);

    const now = new Date();
    const currentDay = now.getDay();
    let daysToAdd = targetDayIndex - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Next week's occurrence
    }

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);
    const times = getBodEod(targetDate, workHours);
    const [hours, minutes] = times.eod.split(":").map(Number);
    targetDate.setHours(hours, minutes, 0, 0);

    return toLocalISOString(targetDate);
  }

  // Special case: "today" without a time should default to EOD
  if (processedValue === "today") {
    const eodParsed = parseDate("eod", dateTimeSettings, workHours);
    if (eodParsed) {
      return toLocalISOString(new Date(eodParsed.timestamp));
    }
  }

  // Parse other shorthand values
  const parsed = parseDate(dateValue, dateTimeSettings, workHours);
  if (parsed) {
    return toLocalISOString(new Date(parsed.timestamp));
  }

  return undefined;
};

// Format a date string (ISO format) for display in local time
// Returns a friendly format like "Dec 2, 2025 5:00 PM" or just "Dec 2, 2025" if no time
export const formatDateForDisplay = (dateValue: string | undefined): string => {
  if (!dateValue) return "";

  // Parse the ISO date string (yyyy-MM-dd or yyyy-MM-ddTHH:mm)
  let date: Date;
  if (dateValue.includes("T")) {
    // Has time component: yyyy-MM-ddTHH:mm
    const [datePart, timePart] = dateValue.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);
    date = new Date(year, month - 1, day, hours, minutes);
  } else {
    // Date only: yyyy-MM-dd
    const [year, month, day] = dateValue.split("-").map(Number);
    date = new Date(year, month - 1, day);
  }

  if (isNaN(date.getTime())) return dateValue; // Return original if parsing failed

  // Format with time if it was included
  if (dateValue.includes("T")) {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
};

// Convert a date value (which might be shorthand like "today") to yyyy-MM-dd format
export const convertToDateInputFormat = (
  dateValue: string | undefined,
  dateTimeSettings: DateTimeSettings,
  workHours: WorkHoursSettings,
): string => {
  if (!dateValue) return "";

  // If it's already in ISO format (yyyy-MM-dd or yyyy-MM-ddTHH:mm), extract the date part
  if (dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateValue.split("T")[0];
  }

  // Try to parse shorthand values like "today", "tomorrow", etc.
  const parsed = parseDate(dateValue, dateTimeSettings, workHours);
  if (parsed) {
    const date = new Date(parsed.timestamp);
    // Use local date methods to avoid UTC conversion
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Fallback: try to parse as a regular date
  const fallbackDate = new Date(dateValue);
  if (!isNaN(fallbackDate.getTime())) {
    const year = fallbackDate.getFullYear();
    const month = (fallbackDate.getMonth() + 1).toString().padStart(2, "0");
    const day = fallbackDate.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
};

// Convert a date value (which might be shorthand) to HH:mm format
export const convertToTimeInputFormat = (
  dateValue: string | undefined,
  dateTimeSettings: DateTimeSettings,
  workHours: WorkHoursSettings,
): string => {
  if (!dateValue) return "";

  // If it's in ISO format with time (yyyy-MM-ddTHH:mm), extract the time part
  if (dateValue.includes("T")) {
    const timePart = dateValue.split("T")[1];
    if (timePart) {
      return timePart.substring(0, 5); // Get HH:mm
    }
  }

  // Try to parse shorthand values like "today", "tomorrow", etc.
  const parsed = parseDate(dateValue, dateTimeSettings, workHours);
  if (parsed) {
    const date = new Date(parsed.timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  return "";
};
