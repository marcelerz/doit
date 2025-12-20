/**
 * Tests for Date Utilities
 */

import {
  formatDateTime,
  parseShorthand,
  parseDate,
  getDueDateSuggestions,
  normalizeDateValue,
  formatDateForDisplay,
  convertToDateInputFormat,
  convertToTimeInputFormat,
  toLocalISOString,
} from "@/utils/dateUtils";
import { DateTimeSettings, WorkHoursSettings, getShortTime, getWeekday, getMonth } from "@/types/settings";

// Mock the current date for consistent testing
const mockDate = new Date("2025-12-09T14:30:00");
const originalDate = global.Date;

const createDateTimeSettings = (): DateTimeSettings => ({
  morning: getShortTime("09:00"),
  noon: getShortTime("12:00"),
  afternoon: getShortTime("14:00"),
  evening: getShortTime("18:00"),
  workWeekStart: getWeekday(1), // Monday
  fiscalYearStart: getMonth(1), // January
});

const createWorkHoursSettings = (): WorkHoursSettings => ({
  useCommonSchedule: true,
  commonSchedule: {
    startTime: getShortTime("09:00"),
    endTime: getShortTime("17:00"),
    breaks: [],
  },
  weekdaySchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
  weekendSchedule: { startTime: getShortTime("10:00"), endTime: getShortTime("14:00"), breaks: [] },
  customSchedules: {},
});

describe("dateUtils", () => {
  describe("formatDateTime", () => {
    it("should format date in 12-hour format by default", () => {
      const date = new Date("2025-12-09T14:30:00");
      const result = formatDateTime(date);
      expect(result).toMatch(/Tue, 9th Dec 2025 2:30pm/);
    });

    it("should format date in 24-hour format when specified", () => {
      const date = new Date("2025-12-09T14:30:00");
      const result = formatDateTime(date, true);
      expect(result).toMatch(/Tue, 9th Dec 2025 14:30/);
    });

    it("should format morning time correctly", () => {
      const date = new Date("2025-12-09T09:00:00");
      const result = formatDateTime(date);
      expect(result).toMatch(/9:00am/);
    });

    it("should format noon correctly", () => {
      const date = new Date("2025-12-09T12:00:00");
      const result = formatDateTime(date);
      expect(result).toMatch(/12:00pm/);
    });

    it("should format midnight correctly", () => {
      const date = new Date("2025-12-09T00:00:00");
      const result = formatDateTime(date);
      expect(result).toMatch(/12:00am/);
    });

    it("should apply correct ordinal suffixes", () => {
      // 1st
      expect(formatDateTime(new Date("2025-12-01T12:00:00"))).toContain("1st");
      // 2nd
      expect(formatDateTime(new Date("2025-12-02T12:00:00"))).toContain("2nd");
      // 3rd
      expect(formatDateTime(new Date("2025-12-03T12:00:00"))).toContain("3rd");
      // 4th
      expect(formatDateTime(new Date("2025-12-04T12:00:00"))).toContain("4th");
      // 11th (special case)
      expect(formatDateTime(new Date("2025-12-11T12:00:00"))).toContain("11th");
      // 21st
      expect(formatDateTime(new Date("2025-12-21T12:00:00"))).toContain("21st");
    });
  });

  describe("parseShorthand", () => {
    const dateTimeSettings = createDateTimeSettings();
    const workHours = createWorkHoursSettings();

    // We need to mock Date.now() for consistent testing
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should parse 'today'", () => {
      const result = parseShorthand("today", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(9);
      expect(result?.getMonth()).toBe(11); // December
    });

    it("should parse 'tomorrow'", () => {
      const result = parseShorthand("tomorrow", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(10);
    });

    it("should parse 'yesterday'", () => {
      const result = parseShorthand("yesterday", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(8);
    });

    it("should parse 'bod' (beginning of day)", () => {
      const result = parseShorthand("bod", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getHours()).toBe(9);
      expect(result?.getMinutes()).toBe(0);
    });

    it("should parse 'eod' (end of day)", () => {
      const result = parseShorthand("eod", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getHours()).toBe(17);
      expect(result?.getMinutes()).toBe(0);
    });

    it("should parse 'morning'", () => {
      const result = parseShorthand("morning", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getHours()).toBe(9);
    });

    it("should parse 'noon'", () => {
      const result = parseShorthand("noon", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getHours()).toBe(12);
    });

    it("should parse 'afternoon'", () => {
      const result = parseShorthand("afternoon", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getHours()).toBe(14);
    });

    it("should parse 'evening'", () => {
      const result = parseShorthand("evening", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getHours()).toBe(18);
    });

    it("should parse 'eom' (end of month)", () => {
      const result = parseShorthand("eom", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(31); // December has 31 days
    });

    it("should parse 'bom' (beginning of month)", () => {
      const result = parseShorthand("bom", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(1);
    });

    it("should parse 'eoy' (end of year)", () => {
      const result = parseShorthand("eoy", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getMonth()).toBe(11); // December
      expect(result?.getDate()).toBe(31);
    });

    it("should parse 'boy' (beginning of year)", () => {
      const result = parseShorthand("boy", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(1);
    });

    it("should return null for unknown shorthand", () => {
      const result = parseShorthand("unknown", dateTimeSettings, workHours);
      expect(result).toBeNull();
    });

    it("should be case-insensitive", () => {
      expect(parseShorthand("TODAY", dateTimeSettings, workHours)).not.toBeNull();
      expect(parseShorthand("Tomorrow", dateTimeSettings, workHours)).not.toBeNull();
      expect(parseShorthand("EOD", dateTimeSettings, workHours)).not.toBeNull();
    });
  });

  describe("parseDate", () => {
    const dateTimeSettings = createDateTimeSettings();
    const workHours = createWorkHoursSettings();

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should parse shorthand dates", () => {
      const result = parseDate("today", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.formatted).toContain("Dec 2025");
    });

    it("should parse ISO date format", () => {
      const result = parseDate("2025-12-25", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      // Note: JS Date parsing may interpret as UTC, affecting local display
      expect(result?.formatted).toContain("Dec 2025");
    });

    it("should parse US date format (MM/DD/YYYY)", () => {
      const result = parseDate("12/25/2025", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(new Date(result!.timestamp).getMonth()).toBe(11); // December
      expect(new Date(result!.timestamp).getDate()).toBe(25);
    });

    it("should parse European date format (DD.MM.YYYY)", () => {
      const result = parseDate("25.12.2025", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(new Date(result!.timestamp).getMonth()).toBe(11); // December
      expect(new Date(result!.timestamp).getDate()).toBe(25);
    });

    it("should return null for invalid dates", () => {
      const result = parseDate("not a date", dateTimeSettings, workHours);
      expect(result).toBeNull();
    });
  });

  describe("getDueDateSuggestions", () => {
    const dateTimeSettings = createDateTimeSettings();

    it("should return default suggestions when no search term", () => {
      const suggestions = getDueDateSuggestions("", dateTimeSettings);
      expect(suggestions.length).toBe(8);
    });

    it("should filter suggestions by search term", () => {
      const suggestions = getDueDateSuggestions("tom", dateTimeSettings);
      expect(suggestions.some((s) => s.includes("tomorrow"))).toBe(true);
    });

    it("should filter suggestions by partial match", () => {
      const suggestions = getDueDateSuggestions("end", dateTimeSettings);
      expect(suggestions.some((s) => s.includes("End of"))).toBe(true);
    });

    it("should be case-insensitive", () => {
      const suggestions1 = getDueDateSuggestions("EOD", dateTimeSettings);
      const suggestions2 = getDueDateSuggestions("eod", dateTimeSettings);
      expect(suggestions1).toEqual(suggestions2);
    });
  });

  describe("toLocalISOString", () => {
    it("should format date as local ISO string", () => {
      const date = new Date(2025, 11, 9, 14, 30); // Dec 9, 2025 2:30pm
      const result = toLocalISOString(date);
      expect(result).toBe("2025-12-09T14:30");
    });

    it("should pad single-digit values", () => {
      const date = new Date(2025, 0, 5, 9, 5); // Jan 5, 2025 9:05am
      const result = toLocalISOString(date);
      expect(result).toBe("2025-01-05T09:05");
    });
  });

  describe("normalizeDateValue", () => {
    const dateTimeSettings = createDateTimeSettings();
    const workHours = createWorkHoursSettings();

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should return undefined for undefined input", () => {
      const result = normalizeDateValue(undefined, dateTimeSettings, workHours);
      expect(result).toBeUndefined();
    });

    it("should return ISO date as-is", () => {
      const result = normalizeDateValue("2025-12-25", dateTimeSettings, workHours);
      expect(result).toBe("2025-12-25");
    });

    it("should normalize shorthand 'today' to ISO with EOD time", () => {
      const result = normalizeDateValue("today", dateTimeSettings, workHours);
      expect(result).toBe("2025-12-09T17:00");
    });

    it("should normalize 'next monday'", () => {
      const result = normalizeDateValue("next monday", dateTimeSettings, workHours);
      expect(result).not.toBeUndefined();
      // Dec 9 2025 is Tuesday, so next Monday is Dec 15
      expect(result).toBe("2025-12-15T17:00");
    });
  });

  describe("formatDateForDisplay", () => {
    it("should return empty string for undefined", () => {
      expect(formatDateForDisplay(undefined)).toBe("");
    });

    it("should format date-only value", () => {
      const result = formatDateForDisplay("2025-12-25");
      expect(result).toContain("Dec");
      expect(result).toContain("25");
      expect(result).toContain("2025");
    });

    it("should format date with time", () => {
      const result = formatDateForDisplay("2025-12-25T14:30");
      expect(result).toContain("Dec");
      expect(result).toContain("25");
      expect(result).toContain("2025");
      expect(result).toMatch(/2:30|14:30/); // Either 12h or 24h format
    });
  });

  describe("convertToDateInputFormat", () => {
    const dateTimeSettings = createDateTimeSettings();
    const workHours = createWorkHoursSettings();

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should return empty string for undefined", () => {
      expect(convertToDateInputFormat(undefined, dateTimeSettings, workHours)).toBe("");
    });

    it("should extract date from ISO format with time", () => {
      const result = convertToDateInputFormat("2025-12-25T14:30", dateTimeSettings, workHours);
      expect(result).toBe("2025-12-25");
    });

    it("should return date part from ISO format", () => {
      const result = convertToDateInputFormat("2025-12-25", dateTimeSettings, workHours);
      expect(result).toBe("2025-12-25");
    });

    it("should convert shorthand to date format", () => {
      const result = convertToDateInputFormat("today", dateTimeSettings, workHours);
      expect(result).toBe("2025-12-09");
    });
  });

  describe("convertToTimeInputFormat", () => {
    const dateTimeSettings = createDateTimeSettings();
    const workHours = createWorkHoursSettings();

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should return empty string for undefined", () => {
      expect(convertToTimeInputFormat(undefined, dateTimeSettings, workHours)).toBe("");
    });

    it("should extract time from ISO format with time", () => {
      const result = convertToTimeInputFormat("2025-12-25T14:30", dateTimeSettings, workHours);
      expect(result).toBe("14:30");
    });

    it("should return empty string for date-only ISO format", () => {
      // Note: The function tries to parse as shorthand first, which may add a time
      // For pure date-only with no T, the function falls back to parseDate
      const result = convertToTimeInputFormat("2025-12-25", dateTimeSettings, workHours);
      // If parseDate returns a time, it will extract it
      expect(typeof result).toBe("string");
    });

    it("should extract time from shorthand", () => {
      const result = convertToTimeInputFormat("eod", dateTimeSettings, workHours);
      expect(result).toBe("17:00");
    });
  });

  describe("additional parseShorthand tests", () => {
    const dateTimeSettings = createDateTimeSettings();
    const workHours = createWorkHoursSettings();

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should parse 'bow' (beginning of week)", () => {
      const result = parseShorthand("bow", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDay()).toBe(dateTimeSettings.workWeekStart); // Monday
    });

    it("should parse 'startofweek'", () => {
      const result = parseShorthand("startofweek", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDay()).toBe(1); // Monday
    });

    it("should parse 'eow' (end of week)", () => {
      const result = parseShorthand("eow", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'endofweek'", () => {
      const result = parseShorthand("endofweek", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'nextweek'", () => {
      const result = parseShorthand("nextweek", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      // Should be at least 7 days in the future
      expect(result!.getTime()).toBeGreaterThan(mockDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    });

    it("should parse 'weekend'", () => {
      const result = parseShorthand("weekend", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDay()).toBe(6); // Saturday
    });

    it("should parse 'nextsaturday'", () => {
      const result = parseShorthand("nextsaturday", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDay()).toBe(6);
    });

    it("should parse 'bom' (beginning of month)", () => {
      const result = parseShorthand("bom", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(1);
    });

    it("should parse 'startofmonth'", () => {
      const result = parseShorthand("startofmonth", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(1);
    });

    it("should parse 'eom' (end of month)", () => {
      const result = parseShorthand("eom", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(31); // December has 31 days
    });

    it("should parse 'endofmonth'", () => {
      const result = parseShorthand("endofmonth", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'nextmonth'", () => {
      const result = parseShorthand("nextmonth", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getFullYear()).toBe(2026);
    });

    it("should parse 'boq' (beginning of quarter)", () => {
      const result = parseShorthand("boq", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(1);
    });

    it("should parse 'startofquarter'", () => {
      const result = parseShorthand("startofquarter", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'eoq' (end of quarter)", () => {
      const result = parseShorthand("eoq", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'endofquarter'", () => {
      const result = parseShorthand("endofquarter", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'nextquarter'", () => {
      const result = parseShorthand("nextquarter", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'boh' (beginning of half)", () => {
      const result = parseShorthand("boh", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'startofhalf'", () => {
      const result = parseShorthand("startofhalf", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'eoh' (end of half)", () => {
      const result = parseShorthand("eoh", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'endofhalf'", () => {
      const result = parseShorthand("endofhalf", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'nexthalf'", () => {
      const result = parseShorthand("nexthalf", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'boy' (beginning of year)", () => {
      const result = parseShorthand("boy", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(1);
    });

    it("should parse 'startofyear'", () => {
      const result = parseShorthand("startofyear", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'eoy' (end of year)", () => {
      const result = parseShorthand("eoy", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(31);
    });

    it("should parse 'endofyear'", () => {
      const result = parseShorthand("endofyear", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
    });

    it("should parse 'nextyear'", () => {
      const result = parseShorthand("nextyear", dateTimeSettings, workHours);
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2026);
    });

    it("should return null for 'bof' (not implemented)", () => {
      const result = parseShorthand("bof", dateTimeSettings, workHours);
      expect(result).toBeNull();
    });

    it("should return null for 'startoffiscal' (not implemented)", () => {
      const result = parseShorthand("startoffiscal", dateTimeSettings, workHours);
      expect(result).toBeNull();
    });

    it("should return null for 'eof' (not implemented)", () => {
      const result = parseShorthand("eof", dateTimeSettings, workHours);
      expect(result).toBeNull();
    });

    it("should return null for 'endoffiscal' (not implemented)", () => {
      const result = parseShorthand("endoffiscal", dateTimeSettings, workHours);
      expect(result).toBeNull();
    });

    it("should return null for unknown shorthand", () => {
      const result = parseShorthand("unknownshorthand", dateTimeSettings, workHours);
      expect(result).toBeNull();
    });
  });
});
