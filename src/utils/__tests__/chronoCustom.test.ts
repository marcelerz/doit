/**
 * Tests for chronoCustom - Custom date parsing with chrono-node extensions
 */

import { createCustomChrono, parseWithCustomChrono, parseDateWithCustomChrono } from "@/utils/chronoCustom";
import { DateTimeSettings, WorkHoursSettings, getShortTime, getWeekday, getMonth } from "@/types/settings";

// Default test settings
const defaultDateTimeSettings: DateTimeSettings = {
  morning: getShortTime("09:00"),
  noon: getShortTime("12:00"),
  afternoon: getShortTime("14:00"),
  evening: getShortTime("18:00"),
  workWeekStart: getWeekday(1), // Monday
  fiscalYearStart: getMonth(1),
};

const defaultWorkHoursSettings: WorkHoursSettings = {
  useCommonSchedule: true,
  commonSchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
  weekdaySchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
  weekendSchedule: { startTime: getShortTime("10:00"), endTime: getShortTime("14:00"), breaks: [] },
  customSchedules: {},
};

describe("chronoCustom", () => {
  // Use a fixed reference date for consistent tests
  const referenceDate = new Date(2025, 5, 15, 10, 0, 0); // June 15, 2025, 10:00 AM (Sunday)

  describe("createCustomChrono", () => {
    it("should create a chrono instance", () => {
      const chrono = createCustomChrono();
      expect(chrono).toBeDefined();
      expect(typeof chrono.parse).toBe("function");
    });

    it("should create instance with settings", () => {
      const chrono = createCustomChrono(defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(chrono).toBeDefined();
    });
  });

  describe("parseWithCustomChrono", () => {
    it("should return array of parsed results", () => {
      const results = parseWithCustomChrono("tomorrow at 3pm", referenceDate);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it("should return empty array for no dates", () => {
      const results = parseWithCustomChrono("no dates here", referenceDate);
      expect(results).toEqual([]);
    });
  });

  describe("parseDateWithCustomChrono", () => {
    it("should return Date for valid input", () => {
      const result = parseDateWithCustomChrono("tomorrow", referenceDate);
      expect(result).toBeInstanceOf(Date);
    });

    it("should return null for no dates", () => {
      const result = parseDateWithCustomChrono("no dates", referenceDate);
      expect(result).toBeNull();
    });
  });

  describe("time of day shorthands", () => {
    it("should parse morning", () => {
      const result = parseDateWithCustomChrono("morning", referenceDate, defaultDateTimeSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(9);
      expect(result?.getMinutes()).toBe(0);
    });

    it("should parse noon", () => {
      const result = parseDateWithCustomChrono("noon", referenceDate, defaultDateTimeSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(12);
    });

    it("should parse afternoon", () => {
      const result = parseDateWithCustomChrono("afternoon", referenceDate, defaultDateTimeSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(14);
    });

    it("should parse evening", () => {
      const result = parseDateWithCustomChrono("evening", referenceDate, defaultDateTimeSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(18);
    });

    it("should parse midnight", () => {
      const result = parseDateWithCustomChrono("midnight", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(0);
    });

    it("should parse midday", () => {
      const result = parseDateWithCustomChrono("midday", referenceDate, defaultDateTimeSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(12);
    });
  });

  describe("day boundary shorthands", () => {
    it("should parse bod (beginning of day)", () => {
      const result = parseDateWithCustomChrono("bod", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(9); // workHours.startTime
    });

    it("should parse eod (end of day)", () => {
      const result = parseDateWithCustomChrono("eod", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(17); // workHours.endTime
    });

    it("should parse startofday", () => {
      const result = parseDateWithCustomChrono(
        "startofday",
        referenceDate,
        defaultDateTimeSettings,
        defaultWorkHoursSettings,
      );
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(9);
    });

    it("should parse endofday", () => {
      const result = parseDateWithCustomChrono(
        "endofday",
        referenceDate,
        defaultDateTimeSettings,
        defaultWorkHoursSettings,
      );
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(17);
    });
  });

  describe("week boundary shorthands", () => {
    it("should parse bow (beginning of week)", () => {
      const result = parseDateWithCustomChrono("bow", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      // Should be Monday (workWeekStart = 1)
      expect(result?.getDay()).toBe(1);
    });

    it("should parse eow (end of week)", () => {
      const result = parseDateWithCustomChrono("eow", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      // Should be Sunday (6 days after Monday)
      expect(result?.getDay()).toBe(0);
    });

    it("should parse nextweek", () => {
      const result = parseDateWithCustomChrono(
        "nextweek",
        referenceDate,
        defaultDateTimeSettings,
        defaultWorkHoursSettings,
      );
      expect(result).toBeInstanceOf(Date);
      // Should be next Monday
      expect(result?.getDay()).toBe(1);
      expect(result!.getTime()).toBeGreaterThan(referenceDate.getTime());
    });

    it("should parse weekend", () => {
      const result = parseDateWithCustomChrono("weekend", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // Should be Saturday
      expect(result?.getDay()).toBe(6);
    });
  });

  describe("month boundary shorthands", () => {
    it("should parse bom (beginning of month)", () => {
      const result = parseDateWithCustomChrono("bom", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(1);
      expect(result?.getMonth()).toBe(referenceDate.getMonth());
    });

    it("should parse eom (end of month)", () => {
      const result = parseDateWithCustomChrono("eom", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      // Last day of June is 30
      expect(result?.getDate()).toBe(30);
    });

    it("should parse nextmonth", () => {
      const result = parseDateWithCustomChrono(
        "nextmonth",
        referenceDate,
        defaultDateTimeSettings,
        defaultWorkHoursSettings,
      );
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(1);
      expect(result?.getMonth()).toBe(6); // July
    });
  });

  describe("quarter boundary shorthands", () => {
    it("should parse boq (beginning of quarter)", () => {
      const result = parseDateWithCustomChrono("boq", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      // June is Q2, starts April 1
      expect(result?.getMonth()).toBe(3); // April
      expect(result?.getDate()).toBe(1);
    });

    it("should parse eoq (end of quarter)", () => {
      const result = parseDateWithCustomChrono("eoq", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      // June is Q2, ends June 30
      expect(result?.getMonth()).toBe(5); // June
      expect(result?.getDate()).toBe(30);
    });

    it("should parse nextquarter", () => {
      const result = parseDateWithCustomChrono(
        "nextquarter",
        referenceDate,
        defaultDateTimeSettings,
        defaultWorkHoursSettings,
      );
      expect(result).toBeInstanceOf(Date);
      // Next quarter is Q3, starts July 1
      expect(result?.getMonth()).toBe(6); // July
      expect(result?.getDate()).toBe(1);
    });
  });

  describe("half-year boundary shorthands", () => {
    it("should parse boh (beginning of half)", () => {
      const result = parseDateWithCustomChrono("boh", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      // June is H1, starts January 1
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(1);
    });

    it("should parse eoh (end of half)", () => {
      const result = parseDateWithCustomChrono("eoh", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      // June is H1, ends June 30
      expect(result?.getMonth()).toBe(5); // June
      expect(result?.getDate()).toBe(30);
    });
  });

  describe("year boundary shorthands", () => {
    it("should parse boy (beginning of year)", () => {
      const result = parseDateWithCustomChrono("boy", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(1);
    });

    it("should parse eoy (end of year)", () => {
      const result = parseDateWithCustomChrono("eoy", referenceDate, defaultDateTimeSettings, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(31);
    });

    it("should parse nextyear", () => {
      const result = parseDateWithCustomChrono(
        "nextyear",
        referenceDate,
        defaultDateTimeSettings,
        defaultWorkHoursSettings,
      );
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(1);
    });
  });

  describe("tonight/tonite", () => {
    it("should parse tonight", () => {
      const result = parseDateWithCustomChrono("tonight", referenceDate, defaultDateTimeSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(18); // evening time
    });

    it("should parse tonite", () => {
      const result = parseDateWithCustomChrono("tonite", referenceDate, defaultDateTimeSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(18);
    });
  });

  describe("urgency shorthands", () => {
    it("should parse asap", () => {
      const result = parseDateWithCustomChrono(
        "asap",
        referenceDate,
        defaultDateTimeSettings,
        defaultWorkHoursSettings,
      );
      expect(result).toBeInstanceOf(Date);
      // Should be today at EOD
      expect(result?.getDate()).toBe(referenceDate.getDate());
    });

    it("should parse urgent", () => {
      const result = parseDateWithCustomChrono(
        "urgent",
        referenceDate,
        defaultDateTimeSettings,
        defaultWorkHoursSettings,
      );
      expect(result).toBeInstanceOf(Date);
    });

    it("should parse now", () => {
      const result = parseDateWithCustomChrono("now", referenceDate);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("someday/later shorthands", () => {
    it("should parse someday (3 months from now)", () => {
      const result = parseDateWithCustomChrono("someday", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(8); // September (June + 3)
    });

    it("should parse later (1 month from now)", () => {
      const result = parseDateWithCustomChrono("later", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(6); // July (June + 1)
    });

    it("should parse eventually (6 months from now)", () => {
      const result = parseDateWithCustomChrono("eventually", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(11); // December (June + 6)
    });
  });

  describe("seasons", () => {
    it("should parse spring", () => {
      const result = parseDateWithCustomChrono("spring", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // Spring is March 20, which is past June 15, so next year
      expect(result?.getMonth()).toBe(2); // March
      expect(result?.getDate()).toBe(20);
      expect(result?.getFullYear()).toBe(2026);
    });

    it("should parse summer", () => {
      const result = parseDateWithCustomChrono("summer", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // Summer is June 21, still coming up
      expect(result?.getMonth()).toBe(5); // June
      expect(result?.getDate()).toBe(21);
    });

    it("should parse fall/autumn", () => {
      const result = parseDateWithCustomChrono("fall", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(8); // September
      expect(result?.getDate()).toBe(22);
    });

    it("should parse winter", () => {
      const result = parseDateWithCustomChrono("winter", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(11); // December
      expect(result?.getDate()).toBe(21);
    });
  });

  describe("payday", () => {
    it("should parse payday", () => {
      const result = parseDateWithCustomChrono("payday", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // Reference is June 15, so next payday is June 30 (last day)
      expect(result?.getDate()).toBe(30);
    });
  });

  describe("holidays", () => {
    it("should parse christmas", () => {
      const result = parseDateWithCustomChrono("christmas", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(11); // December
      expect(result?.getDate()).toBe(25);
    });

    it("should parse xmas", () => {
      const result = parseDateWithCustomChrono("xmas", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(25);
    });

    it("should parse halloween", () => {
      const result = parseDateWithCustomChrono("halloween", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(9); // October
      expect(result?.getDate()).toBe(31);
    });

    it("should parse valentines", () => {
      const result = parseDateWithCustomChrono("valentines", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // Valentine's is Feb 14, past June 15, so next year
      expect(result?.getMonth()).toBe(1); // February
      expect(result?.getDate()).toBe(14);
      expect(result?.getFullYear()).toBe(2026);
    });

    it("should parse thanksgiving", () => {
      const result = parseDateWithCustomChrono("thanksgiving", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // 4th Thursday of November
      expect(result?.getMonth()).toBe(10); // November
      expect(result?.getDay()).toBe(4); // Thursday
    });

    it("should parse easter", () => {
      const result = parseDateWithCustomChrono("easter", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // Easter 2026 is April 5
      expect(result?.getFullYear()).toBe(2026);
    });

    it("should parse laborday", () => {
      const result = parseDateWithCustomChrono("laborday", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // First Monday of September
      expect(result?.getMonth()).toBe(8); // September
      expect(result?.getDay()).toBe(1); // Monday
    });

    it("should parse memorialday", () => {
      const result = parseDateWithCustomChrono("memorialday", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // Last Monday of May - past June 15, so next year
      expect(result?.getMonth()).toBe(4); // May
      expect(result?.getDay()).toBe(1); // Monday
      expect(result?.getFullYear()).toBe(2026);
    });
  });

  describe("relative date patterns", () => {
    it("should parse 'in 3 days'", () => {
      const result = parseDateWithCustomChrono("in 3 days", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(18); // June 15 + 3
    });

    it("should parse 'in 2 weeks'", () => {
      const result = parseDateWithCustomChrono("in 2 weeks", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(29); // June 15 + 14
    });

    it("should parse 'in 1 month'", () => {
      const result = parseDateWithCustomChrono("in 1 month", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(6); // July
    });

    it("should parse 'in 1 year'", () => {
      const result = parseDateWithCustomChrono("in 1 year", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });
  });

  describe("business days", () => {
    it("should parse 'in 3 business days'", () => {
      const result = parseDateWithCustomChrono("in 3 business days", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // June 15 is Sunday, so 3 business days = Wed June 18
      expect(result?.getDay()).not.toBe(0); // Not Sunday
      expect(result?.getDay()).not.toBe(6); // Not Saturday
    });

    it("should parse 'in 5 working days'", () => {
      const result = parseDateWithCustomChrono("in 5 working days", referenceDate);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("fiscal periods", () => {
    it("should parse Q1", () => {
      const result = parseDateWithCustomChrono("Q1", referenceDate, undefined, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      // Q1 ends March 31, past June 15, so next year
      expect(result?.getMonth()).toBe(2); // March
      expect(result?.getDate()).toBe(31);
      expect(result?.getFullYear()).toBe(2026);
    });

    it("should parse Q3", () => {
      const result = parseDateWithCustomChrono("Q3", referenceDate, undefined, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      // Q3 ends September 30
      expect(result?.getMonth()).toBe(8); // September
      expect(result?.getDate()).toBe(30);
    });

    it("should parse H1", () => {
      const result = parseDateWithCustomChrono("H1", referenceDate, undefined, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      // H1 ends June 30
      expect(result?.getMonth()).toBe(5); // June
      expect(result?.getDate()).toBe(30);
    });

    it("should parse H2", () => {
      const result = parseDateWithCustomChrono("H2", referenceDate, undefined, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      // H2 ends December 31
      expect(result?.getMonth()).toBe(11); // December
      expect(result?.getDate()).toBe(31);
    });

    it("should parse FY2025", () => {
      const result = parseDateWithCustomChrono("FY2025", referenceDate, undefined, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(11); // December
      expect(result?.getDate()).toBe(31);
    });

    it("should parse FY26 (2-digit year)", () => {
      const result = parseDateWithCustomChrono("FY26", referenceDate, undefined, defaultWorkHoursSettings);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });
  });

  describe("ordinal days", () => {
    it("should parse 'the 15th'", () => {
      const result = parseDateWithCustomChrono("the 15th", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // June 15 is today, so should be July 15
      expect(result?.getDate()).toBe(15);
      expect(result?.getMonth()).toBe(6); // July
    });

    it("should parse 'the 1st'", () => {
      const result = parseDateWithCustomChrono("the 1st", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(1);
      expect(result?.getMonth()).toBe(6); // July (past June 1)
    });

    it("should parse 'on the 23rd'", () => {
      const result = parseDateWithCustomChrono("on the 23rd", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(23);
      expect(result?.getMonth()).toBe(5); // Still June (23 > 15)
    });
  });

  describe("sprint parser", () => {
    it("should parse 'sprint 1'", () => {
      const result = parseDateWithCustomChrono("sprint 1", referenceDate);
      expect(result).toBeInstanceOf(Date);
      // Sprint 1 ends ~2 weeks after first Monday of year
    });

    it("should parse 'sprint 10'", () => {
      const result = parseDateWithCustomChrono("sprint 10", referenceDate);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("standard chrono patterns still work", () => {
    it("should parse tomorrow", () => {
      const result = parseDateWithCustomChrono("tomorrow", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(16);
    });

    it("should parse next monday", () => {
      const result = parseDateWithCustomChrono("next monday", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDay()).toBe(1); // Monday
    });

    it("should parse specific date", () => {
      const result = parseDateWithCustomChrono("July 4, 2025", referenceDate);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(6);
      expect(result?.getDate()).toBe(4);
    });
  });

  describe("duration patterns should be filtered", () => {
    it("should not parse 46m as time", () => {
      const results = parseWithCustomChrono("task takes 46m to complete", referenceDate);
      // Should not have a date result for "46m"
      const has46m = results.some((r) => r.text.includes("46m"));
      expect(has46m).toBe(false);
    });

    it("should not parse 2h as time", () => {
      const results = parseWithCustomChrono("meeting is 2h long", referenceDate);
      const has2h = results.some((r) => r.text === "2h");
      expect(has2h).toBe(false);
    });
  });
});
