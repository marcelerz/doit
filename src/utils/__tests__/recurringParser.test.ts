/**
 * Tests for Recurring Pattern Parser
 */

import {
  parseRecurringPattern,
  calculateNextOccurrence,
  formatRecurringPattern,
  getRecurringSuggestions,
  RecurringPattern,
} from "@/utils/recurringParser";

describe("recurringParser", () => {
  describe("parseRecurringPattern", () => {
    describe("interval patterns", () => {
      it("should parse 'daily' shortcut", () => {
        const result = parseRecurringPattern("daily");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("interval");
        expect(result?.interval).toBe(1);
        expect(result?.unit).toBe("day");
      });

      it("should parse 'weekly' shortcut", () => {
        const result = parseRecurringPattern("weekly");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("interval");
        expect(result?.interval).toBe(1);
        expect(result?.unit).toBe("week");
      });

      it("should parse 'monthly' shortcut", () => {
        const result = parseRecurringPattern("monthly");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("interval");
        expect(result?.interval).toBe(1);
        expect(result?.unit).toBe("month");
      });

      it("should parse 'yearly' shortcut", () => {
        const result = parseRecurringPattern("yearly");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("interval");
        expect(result?.interval).toBe(1);
        expect(result?.unit).toBe("year");
      });

      it("should parse 'biweekly' (every 2 weeks)", () => {
        const result = parseRecurringPattern("biweekly");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("interval");
        expect(result?.interval).toBe(2);
        expect(result?.unit).toBe("week");
      });

      it("should parse 'quarterly'", () => {
        const result = parseRecurringPattern("quarterly");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("interval");
        expect(result?.interval).toBe(1);
        expect(result?.unit).toBe("quarter");
      });

      it("should parse 'every 2 days'", () => {
        const result = parseRecurringPattern("every 2 days");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("interval");
        expect(result?.interval).toBe(2);
        expect(result?.unit).toBe("day");
      });

      it("should parse 'every 3 weeks'", () => {
        const result = parseRecurringPattern("every 3 weeks");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("interval");
        expect(result?.interval).toBe(3);
        expect(result?.unit).toBe("week");
      });

      it("should parse 'every other week'", () => {
        const result = parseRecurringPattern("every other week");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("interval");
        expect(result?.interval).toBe(2);
        expect(result?.unit).toBe("week");
      });

      it("should parse 'every day' (simple interval)", () => {
        const result = parseRecurringPattern("every day");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("interval");
        expect(result?.interval).toBe(1);
        expect(result?.unit).toBe("day");
      });

      it("should parse 'each week' (with 'each' prefix)", () => {
        const result = parseRecurringPattern("each week");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("interval");
        expect(result?.interval).toBe(1);
        expect(result?.unit).toBe("week");
      });
    });

    describe("workday patterns", () => {
      it("should parse 'workday'", () => {
        const result = parseRecurringPattern("workday");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("workday");
      });

      it("should parse 'every workday'", () => {
        const result = parseRecurringPattern("every workday");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("workday");
      });

      it("should parse 'every weekday'", () => {
        const result = parseRecurringPattern("every weekday");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("workday");
      });
    });

    describe("weekday patterns", () => {
      it("should parse 'every monday'", () => {
        const result = parseRecurringPattern("every monday");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("weekday");
        expect(result?.weekday).toBe(1); // Monday = 1
      });

      it("should parse 'every friday'", () => {
        const result = parseRecurringPattern("every friday");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("weekday");
        expect(result?.weekday).toBe(5); // Friday = 5
      });

      it("should parse 'every sunday'", () => {
        const result = parseRecurringPattern("every sunday");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("weekday");
        expect(result?.weekday).toBe(0); // Sunday = 0
      });
    });

    describe("nth weekday patterns", () => {
      it("should parse 'every 1st monday'", () => {
        const result = parseRecurringPattern("every 1st monday");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("nth-weekday");
        expect(result?.nthWeek).toBe(1);
        expect(result?.weekday).toBe(1);
      });

      it("should parse 'every 2nd tuesday'", () => {
        const result = parseRecurringPattern("every 2nd tuesday");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("nth-weekday");
        expect(result?.nthWeek).toBe(2);
        expect(result?.weekday).toBe(2);
      });

      it("should parse 'every last friday'", () => {
        const result = parseRecurringPattern("every last friday");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("nth-weekday");
        expect(result?.nthWeek).toBe(6); // 6 represents 'last'
        expect(result?.weekday).toBe(5);
      });

      it("should parse 'every first monday' (word form)", () => {
        const result = parseRecurringPattern("every first monday");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("nth-weekday");
        expect(result?.nthWeek).toBe(1);
        expect(result?.weekday).toBe(1);
      });

      it("should parse 'every third wednesday' (word form)", () => {
        const result = parseRecurringPattern("every third wednesday");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("nth-weekday");
        expect(result?.nthWeek).toBe(3);
        expect(result?.weekday).toBe(3);
      });
    });

    describe("monthly patterns", () => {
      it("should parse 'every month on the 15th'", () => {
        const result = parseRecurringPattern("every month on the 15th");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("monthly");
        expect(result?.monthDay).toBe(15);
      });

      it("should parse 'monthly on 1st'", () => {
        const result = parseRecurringPattern("monthly on 1st");
        expect(result).not.toBeNull();
        expect(result?.type).toBe("monthly");
        expect(result?.monthDay).toBe(1);
      });
    });

    describe("invalid patterns", () => {
      it("should return null for invalid patterns", () => {
        expect(parseRecurringPattern("random text")).toBeNull();
        expect(parseRecurringPattern("")).toBeNull();
        expect(parseRecurringPattern("every")).toBeNull();
        expect(parseRecurringPattern("sometimes")).toBeNull();
      });
    });
  });

  describe("calculateNextOccurrence", () => {
    const baseDate = new Date("2025-12-09T10:00:00"); // Tuesday

    it("should calculate next occurrence for daily interval", () => {
      const pattern: RecurringPattern = {
        type: "interval",
        interval: 1,
        unit: "day",
        raw: "daily",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getDate()).toBe(10);
      expect(next.getMonth()).toBe(11); // December
    });

    it("should calculate next occurrence for weekly interval", () => {
      const pattern: RecurringPattern = {
        type: "interval",
        interval: 1,
        unit: "week",
        raw: "weekly",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getDate()).toBe(16); // 7 days later
    });

    it("should calculate next occurrence for 2-day interval", () => {
      const pattern: RecurringPattern = {
        type: "interval",
        interval: 2,
        unit: "day",
        raw: "every 2 days",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getDate()).toBe(11); // 2 days later
    });

    it("should calculate next workday (skip weekend)", () => {
      const pattern: RecurringPattern = {
        type: "workday",
        raw: "every workday",
      };
      const friday = new Date("2025-12-12T10:00:00"); // Friday
      const next = calculateNextOccurrence(pattern, friday);
      expect(next.getDate()).toBe(15); // Should be Monday
      expect(next.getDay()).toBe(1); // Monday = 1
    });

    it("should calculate next specific weekday", () => {
      const pattern: RecurringPattern = {
        type: "weekday",
        weekday: 5, // Friday
        raw: "every friday",
      };
      // Starting from Tuesday Dec 9
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getDate()).toBe(12); // Should be Friday Dec 12
      expect(next.getDay()).toBe(5);
    });

    it("uses this month for a monthly pattern whose day is still ahead", () => {
      // baseDate is 2025-12-09, so the next 15th is 2025-12-15. This used to
      // advance a month unconditionally and return January, skipping an
      // occurrence -- quarterly has always reused the current period this way.
      const pattern: RecurringPattern = {
        type: "monthly",
        monthDay: 15,
        raw: "monthly on 15th",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getMonth()).toBe(11); // December
      expect(next.getDate()).toBe(15);
      expect(next.getFullYear()).toBe(2025);
    });

    it("advances to next month once the day has passed", () => {
      const pattern: RecurringPattern = {
        type: "monthly",
        monthDay: 5,
        raw: "monthly on 5th",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getMonth()).toBe(0); // January
      expect(next.getDate()).toBe(5);
      expect(next.getFullYear()).toBe(2026);
    });

    it("advances when completing on the target day itself", () => {
      // The usual path: the base date is the completed instance's due date, so
      // the next occurrence must be the following period, not the same one.
      const pattern: RecurringPattern = {
        type: "monthly",
        monthDay: 15,
        raw: "monthly on 15th",
      };
      const next = calculateNextOccurrence(pattern, new Date(2025, 11, 15, 10, 0));
      expect(next.getMonth()).toBe(0); // January
      expect(next.getFullYear()).toBe(2026);
    });
  });

  describe("formatRecurringPattern", () => {
    it("should format daily interval", () => {
      const pattern: RecurringPattern = {
        type: "interval",
        interval: 1,
        unit: "day",
        raw: "daily",
      };
      expect(formatRecurringPattern(pattern)).toBe("Every 1 day");
    });

    it("should format plural intervals correctly", () => {
      const pattern: RecurringPattern = {
        type: "interval",
        interval: 2,
        unit: "week",
        raw: "every 2 weeks",
      };
      expect(formatRecurringPattern(pattern)).toBe("Every 2 weeks");
    });

    it("should format workday pattern", () => {
      const pattern: RecurringPattern = {
        type: "workday",
        raw: "every workday",
      };
      expect(formatRecurringPattern(pattern)).toBe("Every workday");
    });

    it("should format weekday pattern", () => {
      const pattern: RecurringPattern = {
        type: "weekday",
        weekday: 1,
        raw: "every monday",
      };
      expect(formatRecurringPattern(pattern)).toBe("Every monday");
    });

    it("should format nth weekday pattern", () => {
      const pattern: RecurringPattern = {
        type: "nth-weekday",
        nthWeek: 2,
        weekday: 2,
        raw: "every 2nd tuesday",
      };
      expect(formatRecurringPattern(pattern)).toBe("Every 2nd tuesday");
    });

    it("should format last weekday pattern", () => {
      const pattern: RecurringPattern = {
        type: "nth-weekday",
        nthWeek: 6,
        weekday: 5,
        raw: "every last friday",
      };
      expect(formatRecurringPattern(pattern)).toBe("Every last friday");
    });

    it("should format monthly pattern", () => {
      const pattern: RecurringPattern = {
        type: "monthly",
        monthDay: 15,
        raw: "monthly on 15th",
      };
      expect(formatRecurringPattern(pattern)).toBe("Monthly on 15th");
    });
  });

  describe("getRecurringSuggestions", () => {
    it("should return a list of suggestions", () => {
      const suggestions = getRecurringSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it("should include common patterns", () => {
      const suggestions = getRecurringSuggestions();
      expect(suggestions).toContain("daily");
      expect(suggestions).toContain("weekly");
      expect(suggestions).toContain("monthly");
      expect(suggestions).toContain("every monday");
      expect(suggestions).toContain("every workday");
    });
  });

  describe("additional parseRecurringPattern tests", () => {
    it("should parse 'fortnightly' (bi-weekly variant)", () => {
      const result = parseRecurringPattern("fortnightly");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("interval");
      expect(result?.interval).toBe(2);
      expect(result?.unit).toBe("week");
    });

    it("should parse 'annually' (yearly variant)", () => {
      const result = parseRecurringPattern("annually");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("interval");
      expect(result?.interval).toBe(1);
      expect(result?.unit).toBe("year");
    });

    it("should parse 'semiannually' (half year)", () => {
      const result = parseRecurringPattern("semiannually");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("interval");
      expect(result?.interval).toBe(1);
      expect(result?.unit).toBe("half");
    });

    it("should parse 'bimonthly' (every 2 months)", () => {
      const result = parseRecurringPattern("bimonthly");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("interval");
      expect(result?.interval).toBe(2);
      expect(result?.unit).toBe("month");
    });

    it("should parse 'repeat daily'", () => {
      const result = parseRecurringPattern("repeat daily");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("interval");
      expect(result?.interval).toBe(1);
      expect(result?.unit).toBe("day");
    });

    it("should parse 'repeat weekly'", () => {
      const result = parseRecurringPattern("repeat weekly");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("interval");
      expect(result?.unit).toBe("week");
    });

    it("should parse 'weekdays' (multiple weekdays)", () => {
      const result = parseRecurringPattern("weekdays");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("workday");
    });

    it("should parse 'each workday'", () => {
      const result = parseRecurringPattern("each workday");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("workday");
    });

    it("should parse 'on the 15th' (monthly implicit)", () => {
      const result = parseRecurringPattern("on the 15th");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("monthly");
      expect(result?.monthDay).toBe(15);
    });

    it("should parse 'on the 1st'", () => {
      const result = parseRecurringPattern("on the 1st");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("monthly");
      expect(result?.monthDay).toBe(1);
    });

    it("should parse 'each monday' (with 'each' prefix)", () => {
      const result = parseRecurringPattern("each monday");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("weekday");
      expect(result?.weekday).toBe(1);
    });

    it("should parse 'each 1st monday' (nth weekday with 'each')", () => {
      const result = parseRecurringPattern("each 1st monday");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("nth-weekday");
      expect(result?.nthWeek).toBe(1);
      expect(result?.weekday).toBe(1);
    });

    it("should parse 'quarterly on 1st'", () => {
      const result = parseRecurringPattern("quarterly on 1st");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("quarterly");
      expect(result?.monthDay).toBe(1);
    });

    it("should parse 'yearly on jan 15'", () => {
      const result = parseRecurringPattern("yearly on jan 15");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("yearly");
      expect(result?.month).toBe(1);
      expect(result?.monthDay).toBe(15);
    });

    it("should parse 'yearly on dec 25'", () => {
      const result = parseRecurringPattern("yearly on dec 25");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("yearly");
      expect(result?.month).toBe(12);
      expect(result?.monthDay).toBe(25);
    });

    it("should keep every weekday in 'every mon and wed'", () => {
      const result = parseRecurringPattern("every mon and wed");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("weekday");
      expect(result?.weekdays).toEqual([1, 3]);
      // weekday stays populated so consumers reading a single day still work
      expect(result?.weekday).toBe(1);
    });

    it("should keep every weekday in 'every tue, thu'", () => {
      const result = parseRecurringPattern("every tue, thu");
      expect(result).not.toBeNull();
      expect(result?.type).toBe("weekday");
      expect(result?.weekdays).toEqual([2, 4]);
    });

    it("should parse full day names, which the old alternation could not match", () => {
      // "wed" + an optional "day" cannot spell "wednesday", so this used to
      // return null and the recurrence was dropped entirely.
      expect(parseRecurringPattern("every monday and wednesday")?.weekdays).toEqual([1, 3]);
      expect(parseRecurringPattern("every tuesday and thursday")?.weekdays).toEqual([2, 4]);
      // the order the user named them is preserved
      expect(parseRecurringPattern("every saturday and sunday")?.weekdays).toEqual([6, 0]);
    });

    it("should parse three or more days with mixed separators", () => {
      expect(parseRecurringPattern("every monday, wednesday and friday")?.weekdays).toEqual([1, 3, 5]);
    });

    it("should still parse a single weekday without a weekdays list", () => {
      const result = parseRecurringPattern("every monday");
      expect(result?.type).toBe("weekday");
      expect(result?.weekday).toBe(1);
      expect(result?.weekdays).toBeUndefined();
    });

    it("should advance to whichever of the days comes next", () => {
      const pattern = parseRecurringPattern("every monday and wednesday");
      // 2025-12-09 is a Tuesday, so the next occurrence is Wednesday the 10th
      const fromTuesday = calculateNextOccurrence(pattern!, new Date("2025-12-09T10:00:00").getTime());
      expect(new Date(fromTuesday).getDay()).toBe(3);
      // ...and from that Wednesday the next is the following Monday
      const fromWednesday = calculateNextOccurrence(pattern!, fromTuesday);
      expect(new Date(fromWednesday).getDay()).toBe(1);
    });

    it("should format every named day", () => {
      expect(formatRecurringPattern(parseRecurringPattern("every monday and wednesday")!)).toBe(
        "Every Monday and Wednesday",
      );
      expect(formatRecurringPattern(parseRecurringPattern("every monday, wednesday and friday")!)).toBe(
        "Every Monday, Wednesday and Friday",
      );
    });
  });

  describe("additional calculateNextOccurrence tests", () => {
    const baseDate = new Date("2025-12-09T10:00:00"); // Tuesday

    it("should calculate next occurrence for monthly interval", () => {
      const pattern: RecurringPattern = {
        type: "interval",
        interval: 1,
        unit: "month",
        raw: "monthly",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getMonth()).toBe(0); // January
      expect(next.getFullYear()).toBe(2026);
    });

    it("should calculate next occurrence for quarterly interval", () => {
      const pattern: RecurringPattern = {
        type: "interval",
        interval: 1,
        unit: "quarter",
        raw: "quarterly",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getMonth()).toBe(2); // March (3 months later)
      expect(next.getFullYear()).toBe(2026);
    });

    it("should calculate next occurrence for half year interval", () => {
      const pattern: RecurringPattern = {
        type: "interval",
        interval: 1,
        unit: "half",
        raw: "semiannually",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getMonth()).toBe(5); // June (6 months later)
      expect(next.getFullYear()).toBe(2026);
    });

    it("should calculate next occurrence for yearly interval", () => {
      const pattern: RecurringPattern = {
        type: "interval",
        interval: 1,
        unit: "year",
        raw: "yearly",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getFullYear()).toBe(2026);
      expect(next.getMonth()).toBe(11); // December
    });

    it("should calculate next nth-weekday (1st monday of month)", () => {
      const pattern: RecurringPattern = {
        type: "nth-weekday",
        nthWeek: 1,
        weekday: 1, // Monday
        raw: "every 1st monday",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getDay()).toBe(1); // Monday
      // Should be first Monday of January 2026 (Jan 5)
      expect(next.getMonth()).toBe(0);
      expect(next.getDate()).toBe(5);
    });

    it("should calculate next nth-weekday (last friday of month)", () => {
      const pattern: RecurringPattern = {
        type: "nth-weekday",
        nthWeek: 6, // last
        weekday: 5, // Friday
        raw: "every last friday",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getDay()).toBe(5); // Friday
      expect(next.getMonth()).toBe(0); // January
    });

    it("should calculate next quarterly occurrence", () => {
      const pattern: RecurringPattern = {
        type: "quarterly",
        monthDay: 15,
        raw: "quarterly on 15th",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      // Next quarter starts in January
      expect(next.getDate()).toBe(15);
    });

    it("should calculate next yearly occurrence", () => {
      const pattern: RecurringPattern = {
        type: "yearly",
        month: 6, // June
        monthDay: 1,
        raw: "yearly on jun 1",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getMonth()).toBe(5); // June (0-indexed)
      expect(next.getDate()).toBe(1);
      expect(next.getFullYear()).toBe(2026);
    });

    it("should apply time from pattern", () => {
      const pattern: RecurringPattern = {
        type: "interval",
        interval: 1,
        unit: "day",
        raw: "daily at 9am",
        hour: 9,
        minute: 0,
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getHours()).toBe(9);
      expect(next.getMinutes()).toBe(0);
    });

    it("should handle workday from Saturday (skip to Monday)", () => {
      const pattern: RecurringPattern = {
        type: "workday",
        raw: "every workday",
      };
      const saturday = new Date("2025-12-13T10:00:00");
      const next = calculateNextOccurrence(pattern, saturday);
      expect(next.getDay()).toBe(1); // Monday
      expect(next.getDate()).toBe(15);
    });

    it("should handle workday from Sunday (skip to Monday)", () => {
      const pattern: RecurringPattern = {
        type: "workday",
        raw: "every workday",
      };
      const sunday = new Date("2025-12-14T10:00:00");
      const next = calculateNextOccurrence(pattern, sunday);
      expect(next.getDay()).toBe(1); // Monday
      expect(next.getDate()).toBe(15);
    });
  });

  describe("additional formatRecurringPattern tests", () => {
    it("should format quarterly pattern", () => {
      const pattern: RecurringPattern = {
        type: "quarterly",
        monthDay: 1,
        raw: "quarterly on 1st",
      };
      expect(formatRecurringPattern(pattern)).toBe("Quarterly on 1st");
    });

    it("should format yearly pattern", () => {
      const pattern: RecurringPattern = {
        type: "yearly",
        month: 12,
        monthDay: 25,
        raw: "yearly on dec 25",
      };
      expect(formatRecurringPattern(pattern)).toBe("Yearly on dec 25");
    });

    it("should handle ordinal suffixes correctly", () => {
      // 2nd
      const pattern2: RecurringPattern = { type: "monthly", monthDay: 2, raw: "on the 2nd" };
      expect(formatRecurringPattern(pattern2)).toBe("Monthly on 2nd");

      // 3rd
      const pattern3: RecurringPattern = { type: "monthly", monthDay: 3, raw: "on the 3rd" };
      expect(formatRecurringPattern(pattern3)).toBe("Monthly on 3rd");

      // 11th (special case)
      const pattern11: RecurringPattern = { type: "monthly", monthDay: 11, raw: "on the 11th" };
      expect(formatRecurringPattern(pattern11)).toBe("Monthly on 11th");

      // 21st
      const pattern21: RecurringPattern = { type: "monthly", monthDay: 21, raw: "on the 21st" };
      expect(formatRecurringPattern(pattern21)).toBe("Monthly on 21st");

      // 22nd
      const pattern22: RecurringPattern = { type: "monthly", monthDay: 22, raw: "on the 22nd" };
      expect(formatRecurringPattern(pattern22)).toBe("Monthly on 22nd");

      // 23rd
      const pattern23: RecurringPattern = { type: "monthly", monthDay: 23, raw: "on the 23rd" };
      expect(formatRecurringPattern(pattern23)).toBe("Monthly on 23rd");
    });

    it("should return raw for unknown types", () => {
      const pattern: RecurringPattern = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing unknown type handling
        type: "unknown" as any,
        raw: "custom pattern",
      };
      expect(formatRecurringPattern(pattern)).toBe("custom pattern");
    });
  });
});

describe("calculateNextOccurrence - month overflow from a month-end reference", () => {
  // Regression: setMonth() was called while the day-of-month was still 29-31,
  // so the date rolled into the month *after* the intended one, skipping a
  // whole cycle. Every pre-existing test used a base date of the 9th.
  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  it("monthly from Jan 31 lands in February", () => {
    const pattern: RecurringPattern = { type: "monthly", monthDay: 15, raw: "every month on the 15th" };
    expect(key(calculateNextOccurrence(pattern, new Date(2025, 0, 31)))).toBe("2025-02-15");
  });

  it("quarterly from Mar 31 lands in April", () => {
    const pattern: RecurringPattern = { type: "quarterly", monthDay: 15, raw: "every quarter on the 15th" };
    expect(key(calculateNextOccurrence(pattern, new Date(2025, 2, 31)))).toBe("2025-04-15");
  });

  it("yearly from Jan 31 lands on the target month without overflowing", () => {
    // The point of this case is that setMonth from a 31st must not spill into
    // March. Feb 15 2025 is still ahead of Jan 31 2025, so that is the next
    // occurrence; it used to skip a whole year.
    const pattern: RecurringPattern = { type: "yearly", month: 2, monthDay: 15, raw: "every year on feb 15" };
    expect(key(calculateNextOccurrence(pattern, new Date(2025, 0, 31)))).toBe("2025-02-15");
  });

  it("yearly advances once the target has passed", () => {
    const pattern: RecurringPattern = { type: "yearly", month: 2, monthDay: 15, raw: "every year on feb 15" };
    expect(key(calculateNextOccurrence(pattern, new Date(2025, 5, 1)))).toBe("2026-02-15");
  });

  it("nth-weekday from Jan 31 lands on the 2nd Tuesday of February", () => {
    const pattern: RecurringPattern = { type: "nth-weekday", nthWeek: 2, weekday: 2, raw: "every 2nd tuesday" };
    expect(key(calculateNextOccurrence(pattern, new Date(2025, 0, 31)))).toBe("2025-02-11");
  });

  it("still works from a mid-month reference", () => {
    const pattern: RecurringPattern = { type: "monthly", monthDay: 15, raw: "every month on the 15th" };
    expect(key(calculateNextOccurrence(pattern, new Date(2025, 0, 9)))).toBe("2025-01-15");
  });
});
