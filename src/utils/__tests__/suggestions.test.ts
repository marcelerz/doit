/**
 * Tests for Suggestion Utilities
 */

import {
  DURATION_SUGGESTIONS,
  RECURRING_SUGGESTIONS,
  getDurationSuggestions,
  filterRecurringSuggestions,
} from "@/utils/suggestions";

describe("suggestions", () => {
  describe("DURATION_SUGGESTIONS", () => {
    it("should contain common duration values", () => {
      expect(DURATION_SUGGESTIONS).toContain("15m");
      expect(DURATION_SUGGESTIONS).toContain("30m");
      expect(DURATION_SUGGESTIONS).toContain("1h");
      expect(DURATION_SUGGESTIONS).toContain("2h");
    });

    it("should include day and week durations", () => {
      expect(DURATION_SUGGESTIONS).toContain("1d");
      expect(DURATION_SUGGESTIONS).toContain("1w");
    });
  });

  describe("RECURRING_SUGGESTIONS", () => {
    it("should contain common recurring patterns", () => {
      expect(RECURRING_SUGGESTIONS).toContain("daily");
      expect(RECURRING_SUGGESTIONS).toContain("weekly");
      expect(RECURRING_SUGGESTIONS).toContain("monthly");
      expect(RECURRING_SUGGESTIONS).toContain("yearly");
    });

    it("should include weekday patterns", () => {
      expect(RECURRING_SUGGESTIONS).toContain("every monday");
      expect(RECURRING_SUGGESTIONS).toContain("every friday");
      expect(RECURRING_SUGGESTIONS).toContain("every weekday");
    });
  });

  describe("getDurationSuggestions", () => {
    it("should return all suggestions for empty input", () => {
      const result = getDurationSuggestions("");
      expect(result).toEqual(DURATION_SUGGESTIONS);
    });

    it("should return all suggestions for whitespace input", () => {
      const result = getDurationSuggestions("   ");
      expect(result).toEqual(DURATION_SUGGESTIONS);
    });

    it("should filter suggestions by input", () => {
      const result = getDurationSuggestions("h");
      expect(result).toContain("1h");
      expect(result).toContain("2h");
      expect(result.every((s) => s.toLowerCase().includes("h"))).toBe(true);
    });

    it("should filter by minute values", () => {
      const result = getDurationSuggestions("30");
      expect(result).toContain("30m");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should be case-insensitive", () => {
      const resultLower = getDurationSuggestions("m");
      const resultUpper = getDurationSuggestions("M");
      expect(resultLower).toEqual(resultUpper);
    });

    it("should return empty array for non-matching input", () => {
      const result = getDurationSuggestions("xyz");
      expect(result).toHaveLength(0);
    });
  });

  describe("filterRecurringSuggestions", () => {
    it("should return all suggestions for empty input", () => {
      const result = filterRecurringSuggestions("");
      expect(result).toEqual(RECURRING_SUGGESTIONS);
    });

    it("should return all suggestions for whitespace input", () => {
      const result = filterRecurringSuggestions("   ");
      expect(result).toEqual(RECURRING_SUGGESTIONS);
    });

    it("should filter suggestions by input", () => {
      const result = filterRecurringSuggestions("day");
      // "daily" doesn't contain "day" as a substring (filter is for partial match)
      expect(result).toContain("every day");
      expect(result).toContain("every weekday");
      expect(result.every((s) => s.toLowerCase().includes("day"))).toBe(true);
    });

    it("should filter by specific weekday", () => {
      const result = filterRecurringSuggestions("monday");
      expect(result).toContain("every monday");
    });

    it("should be case-insensitive", () => {
      const resultLower = filterRecurringSuggestions("weekly");
      const resultUpper = filterRecurringSuggestions("WEEKLY");
      expect(resultLower).toEqual(resultUpper);
    });

    it("should return empty array for non-matching input", () => {
      const result = filterRecurringSuggestions("xyz");
      expect(result).toHaveLength(0);
    });

    it("should filter by 'every' prefix", () => {
      const result = filterRecurringSuggestions("every");
      expect(result.length).toBeGreaterThan(5);
      expect(result.every((s) => s.toLowerCase().includes("every"))).toBe(true);
    });
  });
});
