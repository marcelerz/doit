/**
 * Tests for Color Utilities
 */

import {
  getPersonColor,
  getProjectColor,
  getPriorityColor,
  findPersonColor,
  findProjectColor,
  findPriorityColor,
  getTextColor,
} from "@/utils/colors";

describe("colors", () => {
  describe("getPersonColor", () => {
    it("should return custom color when provided", () => {
      expect(getPersonColor("#ff0000")).toBe("#ff0000");
      expect(getPersonColor("#00ff00")).toBe("#00ff00");
    });

    it("should return default color when no color provided", () => {
      expect(getPersonColor()).toBe("#cce5ff");
      expect(getPersonColor(undefined)).toBe("#cce5ff");
    });

    it("should return default for empty string", () => {
      expect(getPersonColor("")).toBe("#cce5ff");
    });
  });

  describe("getProjectColor", () => {
    it("should return custom color when provided", () => {
      expect(getProjectColor("#ff0000")).toBe("#ff0000");
    });

    it("should return default color when no color provided", () => {
      expect(getProjectColor()).toBe("#e2ccff");
      expect(getProjectColor(undefined)).toBe("#e2ccff");
    });
  });

  describe("getPriorityColor", () => {
    it("should return custom color when provided", () => {
      expect(getPriorityColor("#ff0000")).toBe("#ff0000");
    });

    it("should return default color when no color provided", () => {
      expect(getPriorityColor()).toBe("#ffcccc");
      expect(getPriorityColor(undefined)).toBe("#ffcccc");
    });
  });

  describe("findPersonColor", () => {
    const people = [
      { name: "Alice", alternatives: ["Al", "A"], color: "#ff0000" },
      { name: "Bob", alternatives: ["Bobby"], color: "#00ff00" },
      { name: "Charlie", alternatives: [], color: undefined },
    ];
    const fallbackColor = "#cccccc";

    it("should find color by name", () => {
      expect(findPersonColor("Alice", people, fallbackColor)).toBe("#ff0000");
      expect(findPersonColor("Bob", people, fallbackColor)).toBe("#00ff00");
    });

    it("should find color by alternative name", () => {
      expect(findPersonColor("Al", people, fallbackColor)).toBe("#ff0000");
      expect(findPersonColor("Bobby", people, fallbackColor)).toBe("#00ff00");
    });

    it("should return fallback for person with no custom color", () => {
      expect(findPersonColor("Charlie", people, fallbackColor)).toBe(fallbackColor);
    });

    it("should return fallback for unknown person", () => {
      expect(findPersonColor("Unknown", people, fallbackColor)).toBe(fallbackColor);
    });
  });

  describe("findProjectColor", () => {
    const projects = [
      { name: "Project A", alternatives: ["PA"], color: "#ff0000" },
      { name: "Project B", alternatives: [], color: "#00ff00" },
    ];
    const fallbackColor = "#cccccc";

    it("should find color by name", () => {
      expect(findProjectColor("Project A", projects, fallbackColor)).toBe("#ff0000");
    });

    it("should find color by alternative name", () => {
      expect(findProjectColor("PA", projects, fallbackColor)).toBe("#ff0000");
    });

    it("should return fallback for unknown project", () => {
      expect(findProjectColor("Unknown", projects, fallbackColor)).toBe(fallbackColor);
    });
  });

  describe("findPriorityColor", () => {
    const priorities = [
      { name: "urgent", alternatives: ["critical", "asap"], color: "#ff0000" },
      { name: "high", alternatives: ["important"], color: "#ff6600" },
      { name: "low", alternatives: [], color: "#00cc00" },
    ];
    const fallbackColor = "#cccccc";

    it("should find color by name", () => {
      expect(findPriorityColor("urgent", priorities, fallbackColor)).toBe("#ff0000");
      expect(findPriorityColor("high", priorities, fallbackColor)).toBe("#ff6600");
    });

    it("should find color by alternative name", () => {
      expect(findPriorityColor("critical", priorities, fallbackColor)).toBe("#ff0000");
      expect(findPriorityColor("asap", priorities, fallbackColor)).toBe("#ff0000");
      expect(findPriorityColor("important", priorities, fallbackColor)).toBe("#ff6600");
    });

    it("should return fallback for unknown priority", () => {
      expect(findPriorityColor("medium", priorities, fallbackColor)).toBe(fallbackColor);
    });
  });

  describe("getTextColor", () => {
    it("should return black for light backgrounds", () => {
      expect(getTextColor("#ffffff")).toBe("#000000"); // White
      expect(getTextColor("#ffff00")).toBe("#000000"); // Yellow
      expect(getTextColor("#cce5ff")).toBe("#000000"); // Light blue
      expect(getTextColor("#e2ccff")).toBe("#000000"); // Light purple
    });

    it("should return white for dark backgrounds", () => {
      expect(getTextColor("#000000")).toBe("#FFFFFF"); // Black
      expect(getTextColor("#333333")).toBe("#FFFFFF"); // Dark gray
      expect(getTextColor("#0000ff")).toBe("#FFFFFF"); // Blue
      expect(getTextColor("#800000")).toBe("#FFFFFF"); // Dark red
    });

    it("should handle shorthand hex colors", () => {
      expect(getTextColor("#fff")).toBe("#000000"); // White shorthand
      expect(getTextColor("#000")).toBe("#FFFFFF"); // Black shorthand
    });

    it("should handle colors without hash", () => {
      expect(getTextColor("ffffff")).toBe("#000000");
      expect(getTextColor("000000")).toBe("#FFFFFF");
    });

    it("should handle hsl colors", () => {
      expect(getTextColor("hsl(0, 0%, 100%)")).toBe("#000000"); // White
      expect(getTextColor("hsl(0, 0%, 0%)")).toBe("#FFFFFF"); // Black
      // The threshold in the function is > 50, so 50% returns white, 51% returns black
      expect(getTextColor("hsl(0, 0%, 50%)")).toBe("#FFFFFF"); // 50% gray (at threshold)
      expect(getTextColor("hsl(0, 0%, 51%)")).toBe("#000000"); // 51% gray (above threshold)
      expect(getTextColor("hsl(0, 0%, 40%)")).toBe("#FFFFFF"); // 40% gray (below threshold)
    });

    it("should return black for empty/invalid input", () => {
      expect(getTextColor("")).toBe("#000000");
    });

    it("should handle mid-range colors correctly", () => {
      // Gray at ~50% luminance boundary
      expect(getTextColor("#808080")).toBe("#000000"); // Medium gray
      expect(getTextColor("#606060")).toBe("#FFFFFF"); // Darker gray
    });
  });
});
