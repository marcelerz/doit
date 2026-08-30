/**
 * Tests for Token Parser
 */

import { parseTokensToMetadata, resolveTodoTitle } from "@/utils/tokenParser";
import { TokenMatch } from "@/types/token";

describe("tokenParser", () => {
  describe("parseTokensToMetadata", () => {
    it("should return empty metadata for empty tokens array", () => {
      const result = parseTokensToMetadata([]);

      expect(result.assignedPeople).toEqual([]);
      expect(result.sourcePeople).toEqual([]);
      expect(result.mentionedPeople).toEqual([]);
      expect(result.projects).toEqual([]);
      expect(result.dependencies).toEqual([]);
      expect(result.tags).toEqual([]);
      expect(result.priority).toBeUndefined();
      expect(result.dueDate).toBeUndefined();
      expect(result.duration).toBeUndefined();
      expect(result.recurring).toBeUndefined();
    });

    it("should parse assigned people tokens", () => {
      const tokens = [
        { type: "assigned", value: "Alice" },
        { type: "assigned", value: "Bob" },
      ] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.assignedPeople).toEqual(["Alice", "Bob"]);
    });

    it("should parse source people tokens", () => {
      const tokens = [
        { type: "source", value: "Manager" },
        { type: "source", value: "Client" },
      ] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.sourcePeople).toEqual(["Manager", "Client"]);
    });

    it("should parse mentioned people tokens", () => {
      const tokens = [{ type: "mentioned", value: "Reviewer" }] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.mentionedPeople).toEqual(["Reviewer"]);
    });

    it("should parse project tokens", () => {
      const tokens = [
        { type: "project", value: "Website" },
        { type: "project", value: "Marketing" },
      ] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.projects).toEqual(["Website", "Marketing"]);
    });

    it("should parse priority token", () => {
      const tokens = [{ type: "priority", value: "high" }] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.priority).toBe("high");
    });

    it("should parse dueDate token", () => {
      const tokens = [{ type: "dueDate", value: "2025-12-15" }] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.dueDate).toBe("2025-12-15");
    });

    it("should parse duration token", () => {
      const tokens = [{ type: "duration", value: "2h" }] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.duration).toBe("2h");
    });

    it("should parse recurring token", () => {
      const tokens = [{ type: "recurring", value: "weekly" }] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.recurring).toBe("weekly");
    });

    it("should parse dependency tokens", () => {
      const tokens = [
        { type: "dependency", value: "task-123" },
        { type: "dependency", value: "task-456" },
      ] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.dependencies).toEqual(["task-123", "task-456"]);
    });

    it("should parse tag tokens", () => {
      const tokens = [
        { type: "tag", value: "important" },
        { type: "tag", value: "followup" },
      ] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.tags).toEqual(["important", "followup"]);
    });

    it("should parse mixed tokens", () => {
      const tokens = [
        { type: "assigned", value: "Alice" },
        { type: "project", value: "Website" },
        { type: "priority", value: "high" },
        { type: "dueDate", value: "2025-12-15" },
        { type: "tag", value: "urgent" },
        { type: "duration", value: "2h" },
      ] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.assignedPeople).toEqual(["Alice"]);
      expect(result.projects).toEqual(["Website"]);
      expect(result.priority).toBe("high");
      expect(result.dueDate).toBe("2025-12-15");
      expect(result.tags).toEqual(["urgent"]);
      expect(result.duration).toBe("2h");
    });

    it("should handle multiple priority tokens (last one wins)", () => {
      const tokens = [
        { type: "priority", value: "low" },
        { type: "priority", value: "high" },
      ] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      // Last priority should be set
      expect(result.priority).toBe("high");
    });

    it("should handle multiple dueDate tokens (last one wins)", () => {
      const tokens = [
        { type: "dueDate", value: "2025-12-10" },
        { type: "dueDate", value: "2025-12-15" },
      ] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      // Last dueDate should be set
      expect(result.dueDate).toBe("2025-12-15");
    });

    it("should preserve order of array values", () => {
      const tokens = [
        { type: "assigned", value: "Charlie" },
        { type: "assigned", value: "Alice" },
        { type: "assigned", value: "Bob" },
      ] as TokenMatch[];

      const result = parseTokensToMetadata(tokens);

      expect(result.assignedPeople).toEqual(["Charlie", "Alice", "Bob"]);
    });
  });
  describe("resolveTodoTitle", () => {
    it("keeps the parsed text when auto-detection left something behind", () => {
      expect(resolveTodoTitle("Pay the rent tomorrow", "Pay the rent")).toBe("Pay the rent");
    });

    it("falls back to the raw text when auto-detection consumed the whole title", () => {
      // "Payday" and "Someday" are date shorthands, "Monday" a weekday -- each
      // is stripped entirely, which used to discard the todo silently.
      expect(resolveTodoTitle("Payday", "")).toBe("Payday");
      expect(resolveTodoTitle("Someday", "")).toBe("Someday");
      expect(resolveTodoTitle("Monday", "")).toBe("Monday");
      expect(resolveTodoTitle("tomorrow", "")).toBe("tomorrow");
    });

    it("treats whitespace-only parsed text as empty", () => {
      expect(resolveTodoTitle("2h", "   ")).toBe("2h");
    });

    it("trims both the parsed and the raw fallback", () => {
      expect(resolveTodoTitle("  spaced  ", "  parsed  ")).toBe("parsed");
      expect(resolveTodoTitle("  spaced  ", "")).toBe("spaced");
    });

    it("returns an empty string only when there was no input at all", () => {
      expect(resolveTodoTitle("", "")).toBe("");
      expect(resolveTodoTitle("   ", "")).toBe("");
    });
  });
});
