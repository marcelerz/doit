/**
 * Tests for Overlay Utility Functions
 */

import {
  buildMetadataFromTokens,
  mergeMetadataChanges,
  extractLinks,
  buildSelectionHistoryData,
  hasAnyMetadata,
  countMetadataFields,
  addAssignedPerson,
  removeAssignedPerson,
  addProject,
  removeProject,
  addTag,
  removeTag,
  addDependency,
  removeDependency,
  TokenMatch,
  LinkPattern,
} from "@/utils/overlayUtils";
import { TodoMetadata, getTodoId } from "@/types/todo";

// Helper to create empty metadata
function createEmptyMetadata(): TodoMetadata {
  return {
    assignedPeople: [],
    sourcePeople: [],
    mentionedPeople: [],
    projects: [],
    tags: [],
  };
}

describe("overlayUtils", () => {
  describe("buildMetadataFromTokens", () => {
    it("should extract assigned people from tokens", () => {
      const tokens: TokenMatch[] = [
        { type: "assigned", value: "Alice", match: "@Alice", index: 0 },
        { type: "assigned", value: "Bob", match: "@Bob", index: 10 },
      ];
      const existing = createEmptyMetadata();

      const result = buildMetadataFromTokens(tokens, existing);

      expect(result.assignedPeople).toEqual(["Alice", "Bob"]);
    });

    it("should extract projects from tokens", () => {
      const tokens: TokenMatch[] = [
        { type: "project", value: "Project A", match: "%Project A", index: 0 },
      ];
      const existing = createEmptyMetadata();

      const result = buildMetadataFromTokens(tokens, existing);

      expect(result.projects).toEqual(["Project A"]);
    });

    it("should extract singular fields from tokens", () => {
      const tokens: TokenMatch[] = [
        { type: "priority", value: "high", match: "!!high", index: 0 },
        { type: "dueDate", value: "2024-06-15", match: "tomorrow", index: 10 },
        { type: "duration", value: "2h", match: "~2h", index: 20 },
      ];
      const existing = createEmptyMetadata();

      const result = buildMetadataFromTokens(tokens, existing);

      expect(result.priority).toBe("high");
      expect(result.dueDate).toBe("2024-06-15");
      expect(result.duration).toBe("2h");
    });

    it("should preserve existing singular values when not in tokens", () => {
      const tokens: TokenMatch[] = [];
      const existing: TodoMetadata = {
        ...createEmptyMetadata(),
        priority: "medium",
        sprint: "Sprint 1",
        context: "work",
      };

      const result = buildMetadataFromTokens(tokens, existing);

      expect(result.priority).toBe("medium");
      expect(result.sprint).toBe("Sprint 1");
      expect(result.context).toBe("work");
    });

    it("should extract tags from tokens", () => {
      const tokens: TokenMatch[] = [
        { type: "tag", value: "frontend", match: "#frontend", index: 0 },
        { type: "tag", value: "urgent", match: "#urgent", index: 10 },
      ];
      const existing = createEmptyMetadata();

      const result = buildMetadataFromTokens(tokens, existing);

      expect(result.tags).toEqual(["frontend", "urgent"]);
    });

    it("should extract dependencies from tokens", () => {
      const tokens: TokenMatch[] = [
        { type: "dependency", value: "task-123", match: "^task-123", index: 0 },
      ];
      const existing = createEmptyMetadata();

      const result = buildMetadataFromTokens(tokens, existing);

      expect(result.dependencies).toEqual(["task-123"]);
    });
  });

  describe("mergeMetadataChanges", () => {
    it("should merge changes into metadata", () => {
      const current: TodoMetadata = {
        ...createEmptyMetadata(),
        priority: "low",
        dueDate: "2024-06-15",
      };
      const changes: Partial<TodoMetadata> = {
        priority: "high",
      };

      const result = mergeMetadataChanges(current, changes);

      expect(result.priority).toBe("high");
      expect(result.dueDate).toBe("2024-06-15");
    });

    it("should clone arrays properly", () => {
      const current: TodoMetadata = {
        ...createEmptyMetadata(),
        assignedPeople: ["Alice"],
      };
      const changes: Partial<TodoMetadata> = {
        assignedPeople: ["Alice", "Bob"],
      };

      const result = mergeMetadataChanges(current, changes);

      expect(result.assignedPeople).toEqual(["Alice", "Bob"]);
      expect(result.assignedPeople).not.toBe(changes.assignedPeople);
    });

    it("should preserve current arrays when not changed", () => {
      const current: TodoMetadata = {
        ...createEmptyMetadata(),
        projects: ["Project A"],
        tags: ["tag1"],
      };

      const result = mergeMetadataChanges(current, { priority: "high" });

      expect(result.projects).toEqual(["Project A"]);
      expect(result.tags).toEqual(["tag1"]);
    });
  });

  describe("extractLinks", () => {
    const patterns: LinkPattern[] = [
      { name: "Jira", pattern: "([A-Z]+-\\d+)", url: "https://jira.example.com/browse/$1" },
      { name: "GitHub", pattern: "#(\\d+)", url: "https://github.com/repo/issues/$1" },
    ];

    it("should extract Jira links", () => {
      const text = "Fix bug in PROJ-123 and PROJ-456";

      const links = extractLinks(text, patterns);

      expect(links).toHaveLength(2);
      expect(links[0].pattern).toBe("Jira");
      expect(links[0].url).toBe("https://jira.example.com/browse/PROJ-123");
    });

    it("should extract GitHub issue links", () => {
      const text = "Related to #42";

      const links = extractLinks(text, patterns);

      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://github.com/repo/issues/42");
    });

    it("should return empty array for no matches", () => {
      const text = "No links here";

      const links = extractLinks(text, patterns);

      expect(links).toHaveLength(0);
    });

    it("should handle invalid regex patterns gracefully", () => {
      const badPatterns: LinkPattern[] = [
        { name: "Bad", pattern: "[(invalid", url: "http://example.com" },
      ];

      const links = extractLinks("test", badPatterns);

      expect(links).toHaveLength(0);
    });
  });

  describe("buildSelectionHistoryData", () => {
    it("should build selection data from metadata", () => {
      const metadata: TodoMetadata = {
        assignedPeople: ["Alice"],
        sourcePeople: ["Bob"],
        mentionedPeople: ["Charlie"],
        projects: ["Project A"],
        tags: ["urgent"],
        priority: "high",
        dueDate: "2024-06-15",
        duration: "2h",
        recurring: "weekly",
        sprint: "Sprint 1",
      };

      const data = buildSelectionHistoryData(metadata);

      expect(data.assignedPeople).toEqual(["Alice"]);
      expect(data.priorities).toBe("high");
      expect(data.tags).toEqual(["urgent"]);
      expect(data.sprints).toBe("Sprint 1");
    });
  });

  describe("hasAnyMetadata", () => {
    it("should return false for empty metadata", () => {
      expect(hasAnyMetadata(createEmptyMetadata())).toBe(false);
    });

    it("should return true when assignedPeople is set", () => {
      const metadata = { ...createEmptyMetadata(), assignedPeople: ["Alice"] };
      expect(hasAnyMetadata(metadata)).toBe(true);
    });

    it("should return true when priority is set", () => {
      const metadata = { ...createEmptyMetadata(), priority: "high" };
      expect(hasAnyMetadata(metadata)).toBe(true);
    });

    it("should return true when tags are set", () => {
      const metadata = { ...createEmptyMetadata(), tags: ["urgent"] };
      expect(hasAnyMetadata(metadata)).toBe(true);
    });
  });

  describe("countMetadataFields", () => {
    it("should return 0 for empty metadata", () => {
      expect(countMetadataFields(createEmptyMetadata())).toBe(0);
    });

    it("should count populated fields", () => {
      const metadata: TodoMetadata = {
        ...createEmptyMetadata(),
        assignedPeople: ["Alice"],
        projects: ["Project A"],
        priority: "high",
      };

      expect(countMetadataFields(metadata)).toBe(3);
    });

    it("should not count empty arrays", () => {
      const metadata: TodoMetadata = {
        ...createEmptyMetadata(),
        assignedPeople: [],
        priority: "high",
      };

      expect(countMetadataFields(metadata)).toBe(1);
    });
  });

  describe("addAssignedPerson", () => {
    it("should add a person if not present", () => {
      const metadata = { ...createEmptyMetadata(), assignedPeople: ["Alice"] };

      const result = addAssignedPerson(metadata, "Bob");

      expect(result.assignedPeople).toEqual(["Alice", "Bob"]);
    });

    it("should not duplicate an existing person", () => {
      const metadata = { ...createEmptyMetadata(), assignedPeople: ["Alice"] };

      const result = addAssignedPerson(metadata, "Alice");

      expect(result.assignedPeople).toEqual(["Alice"]);
      expect(result).toBe(metadata); // Same reference
    });
  });

  describe("removeAssignedPerson", () => {
    it("should remove a person", () => {
      const metadata = { ...createEmptyMetadata(), assignedPeople: ["Alice", "Bob"] };

      const result = removeAssignedPerson(metadata, "Alice");

      expect(result.assignedPeople).toEqual(["Bob"]);
    });

    it("should handle removing non-existent person", () => {
      const metadata = { ...createEmptyMetadata(), assignedPeople: ["Alice"] };

      const result = removeAssignedPerson(metadata, "Bob");

      expect(result.assignedPeople).toEqual(["Alice"]);
    });
  });

  describe("addProject", () => {
    it("should add a project if not present", () => {
      const metadata = { ...createEmptyMetadata(), projects: ["Project A"] };

      const result = addProject(metadata, "Project B");

      expect(result.projects).toEqual(["Project A", "Project B"]);
    });

    it("should not duplicate an existing project", () => {
      const metadata = { ...createEmptyMetadata(), projects: ["Project A"] };

      const result = addProject(metadata, "Project A");

      expect(result.projects).toEqual(["Project A"]);
    });
  });

  describe("removeProject", () => {
    it("should remove a project", () => {
      const metadata = { ...createEmptyMetadata(), projects: ["Project A", "Project B"] };

      const result = removeProject(metadata, "Project A");

      expect(result.projects).toEqual(["Project B"]);
    });
  });

  describe("addTag", () => {
    it("should add a tag if not present", () => {
      const metadata = { ...createEmptyMetadata(), tags: ["existing"] };

      const result = addTag(metadata, "new");

      expect(result.tags).toEqual(["existing", "new"]);
    });

    it("should not duplicate an existing tag", () => {
      const metadata = { ...createEmptyMetadata(), tags: ["existing"] };

      const result = addTag(metadata, "existing");

      expect(result.tags).toEqual(["existing"]);
    });

    it("should handle undefined tags", () => {
      const metadata = { ...createEmptyMetadata(), tags: undefined };

      const result = addTag(metadata, "new");

      expect(result.tags).toEqual(["new"]);
    });
  });

  describe("removeTag", () => {
    it("should remove a tag", () => {
      const metadata = { ...createEmptyMetadata(), tags: ["tag1", "tag2"] };

      const result = removeTag(metadata, "tag1");

      expect(result.tags).toEqual(["tag2"]);
    });
  });

  describe("addDependency", () => {
    it("should add a dependency if not present", () => {
      const metadata = { ...createEmptyMetadata(), dependencies: [getTodoId("1")] };

      const result = addDependency(metadata, getTodoId("2"));

      expect(result.dependencies).toHaveLength(2);
    });

    it("should not duplicate an existing dependency", () => {
      const metadata = { ...createEmptyMetadata(), dependencies: [getTodoId("1")] };

      const result = addDependency(metadata, getTodoId("1"));

      expect(result.dependencies).toHaveLength(1);
    });
  });

  describe("removeDependency", () => {
    it("should remove a dependency", () => {
      const metadata = { ...createEmptyMetadata(), dependencies: [getTodoId("1"), getTodoId("2")] };

      const result = removeDependency(metadata, getTodoId("1"));

      expect(result.dependencies).toEqual([getTodoId("2")]);
    });
  });
});
