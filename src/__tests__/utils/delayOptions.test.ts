/**
 * Tests for Delay Options
 */

import { DELAY_OPTIONS, DelayOption } from "@/utils/delayOptions";

describe("delayOptions", () => {
  describe("DELAY_OPTIONS", () => {
    it("should be an array of delay options", () => {
      expect(Array.isArray(DELAY_OPTIONS)).toBe(true);
      expect(DELAY_OPTIONS.length).toBeGreaterThan(0);
    });

    it("should have correct structure for each option", () => {
      DELAY_OPTIONS.forEach((option: DelayOption) => {
        expect(option).toHaveProperty("label");
        expect(option).toHaveProperty("value");
        expect(typeof option.label).toBe("string");
        expect(typeof option.value).toBe("string");
        expect(option.label.length).toBeGreaterThan(0);
        expect(option.value.length).toBeGreaterThan(0);
      });
    });

    it("should include today and tomorrow options", () => {
      const labels = DELAY_OPTIONS.map((o) => o.label);
      expect(labels).toContain("Today");
      expect(labels).toContain("Tomorrow");
    });

    it("should include next week and next month options", () => {
      const labels = DELAY_OPTIONS.map((o) => o.label);
      expect(labels).toContain("Next Week");
      expect(labels).toContain("Next Month");
    });

    it("should include all weekday options", () => {
      const labels = DELAY_OPTIONS.map((o) => o.label);
      expect(labels).toContain("Next Monday");
      expect(labels).toContain("Next Tuesday");
      expect(labels).toContain("Next Wednesday");
      expect(labels).toContain("Next Thursday");
      expect(labels).toContain("Next Friday");
      expect(labels).toContain("Next Saturday");
      expect(labels).toContain("Next Sunday");
    });

    it("should include 'in X days' options", () => {
      const labels = DELAY_OPTIONS.map((o) => o.label);
      expect(labels).toContain("In 2 Days");
      expect(labels).toContain("In 3 Days");
      expect(labels).toContain("In 5 Days");
    });

    it("should include 'in X weeks' options", () => {
      const labels = DELAY_OPTIONS.map((o) => o.label);
      expect(labels).toContain("In 1 Week");
      expect(labels).toContain("In 2 Weeks");
      expect(labels).toContain("In 3 Weeks");
    });

    it("should include 'in X months' options", () => {
      const labels = DELAY_OPTIONS.map((o) => o.label);
      expect(labels).toContain("In 1 Month");
      expect(labels).toContain("In 2 Months");
      expect(labels).toContain("In 3 Months");
      expect(labels).toContain("In 6 Months");
    });

    it("should have lowercase values for natural language parsing", () => {
      DELAY_OPTIONS.forEach((option) => {
        expect(option.value).toBe(option.value.toLowerCase());
      });
    });

    it("should have unique labels", () => {
      const labels = DELAY_OPTIONS.map((o) => o.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });

    it("should have unique values", () => {
      const values = DELAY_OPTIONS.map((o) => o.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it("should have values that match chrono-parseable patterns", () => {
      // Values should be natural language strings that chrono can parse
      const values = DELAY_OPTIONS.map((o) => o.value);

      // Today/tomorrow
      expect(values).toContain("today");
      expect(values).toContain("tomorrow");

      // Next X patterns
      expect(values).toContain("next week");
      expect(values).toContain("next month");
      expect(values).toContain("next monday");

      // In X Y patterns
      expect(values).toContain("in 2 days");
      expect(values).toContain("in 1 week");
      expect(values).toContain("in 1 month");
    });
  });
});
