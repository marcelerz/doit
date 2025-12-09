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

    it("should calculate next month for monthly pattern", () => {
      const pattern: RecurringPattern = {
        type: "monthly",
        monthDay: 15,
        raw: "monthly on 15th",
      };
      const next = calculateNextOccurrence(pattern, baseDate);
      expect(next.getMonth()).toBe(0); // January
      expect(next.getDate()).toBe(15);
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
});
