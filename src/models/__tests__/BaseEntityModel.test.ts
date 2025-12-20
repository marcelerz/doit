/**
 * Tests for BaseEntityModel
 */

import { BaseEntityModel, BaseEntity } from "@/models/BaseEntityModel";
import { Comment, ActivityEntry, getCommentId, getActivityId, getTimestamp, getColor } from "@/types/settings";

// Concrete implementation for testing
class TestEntityModel extends BaseEntityModel<BaseEntity> {
  protected get entityTypeName(): string {
    return "TestEntity";
  }
}

// Helper to create a test entity
const createTestEntity = (overrides: Partial<BaseEntity> = {}): BaseEntity => ({
  id: overrides.id || "test-id",
  name: overrides.name || "Test Name",
  alternatives: overrides.alternatives || [],
  color: overrides.color,
  context: overrides.context,
  comments: overrides.comments || [],
  activity: overrides.activity || [],
  archived: overrides.archived,
});

describe("BaseEntityModel", () => {
  describe("basic properties", () => {
    it("should expose raw entity", () => {
      const entity = createTestEntity({ id: "my-id", name: "My Entity" });
      const model = new TestEntityModel(entity);

      expect(model.raw).toBe(entity);
    });

    it("should expose id", () => {
      const model = new TestEntityModel(createTestEntity({ id: "unique-123" }));
      expect(model.id).toBe("unique-123");
    });

    it("should expose name", () => {
      const model = new TestEntityModel(createTestEntity({ name: "John Doe" }));
      expect(model.name).toBe("John Doe");
    });

    it("should expose alternatives", () => {
      const model = new TestEntityModel(createTestEntity({ alternatives: ["Johnny", "JD"] }));
      expect(model.alternatives).toEqual(["Johnny", "JD"]);
    });

    it("should expose color", () => {
      const model = new TestEntityModel(createTestEntity({ color: "#ff0000" }));
      expect(model.color).toBe("#ff0000");
    });

    it("should handle undefined color", () => {
      const model = new TestEntityModel(createTestEntity({ color: undefined }));
      expect(model.color).toBeUndefined();
    });

    it("should expose context", () => {
      const model = new TestEntityModel(createTestEntity({ context: "Some notes" }));
      expect(model.context).toBe("Some notes");
    });

    it("should expose comments array", () => {
      const comments: Comment[] = [
        { commentId: getCommentId("1"), history: [{ timestamp: getTimestamp(Date.now()), content: "First comment" }] },
      ];
      const model = new TestEntityModel(createTestEntity({ comments }));
      expect(model.comments).toBe(comments);
    });

    it("should expose activity array", () => {
      const activity: ActivityEntry<string>[] = [
        { id: getActivityId("act-1"), timestamp: getTimestamp(Date.now()), type: "created", description: "Created" },
      ];
      const model = new TestEntityModel(createTestEntity({ activity }));
      expect(model.activity).toBe(activity);
    });
  });

  describe("state checks", () => {
    it("should return isActive true when not archived", () => {
      const model = new TestEntityModel(createTestEntity({ archived: false }));
      expect(model.isActive).toBe(true);
    });

    it("should return isActive true when archived is undefined", () => {
      const model = new TestEntityModel(createTestEntity({ archived: undefined }));
      expect(model.isActive).toBe(true);
    });

    it("should return isActive false when archived", () => {
      const model = new TestEntityModel(createTestEntity({ archived: true }));
      expect(model.isActive).toBe(false);
    });

    it("should return isArchived correctly", () => {
      const archived = new TestEntityModel(createTestEntity({ archived: true }));
      const active = new TestEntityModel(createTestEntity({ archived: false }));

      expect(archived.isArchived).toBe(true);
      expect(active.isArchived).toBe(false);
    });
  });

  describe("validation methods", () => {
    describe("canArchive", () => {
      it("should allow archiving active entity", () => {
        const model = new TestEntityModel(createTestEntity({ archived: false }));
        const result = model.canArchive();

        expect(result.canArchive).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it("should not allow archiving already archived entity", () => {
        const model = new TestEntityModel(createTestEntity({ archived: true }));
        const result = model.canArchive();

        expect(result.canArchive).toBe(false);
        expect(result.reason).toContain("already archived");
      });
    });

    describe("canUnarchive", () => {
      it("should allow unarchiving archived entity", () => {
        const model = new TestEntityModel(createTestEntity({ archived: true }));
        const result = model.canUnarchive();

        expect(result.canUnarchive).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it("should not allow unarchiving active entity", () => {
        const model = new TestEntityModel(createTestEntity({ archived: false }));
        const result = model.canUnarchive();

        expect(result.canUnarchive).toBe(false);
        expect(result.reason).toContain("not archived");
      });
    });
  });

  describe("comments & activity", () => {
    it("should return hasComments false for empty comments", () => {
      const model = new TestEntityModel(createTestEntity({ comments: [] }));
      expect(model.hasComments).toBe(false);
    });

    it("should return hasComments true when comments exist", () => {
      const comments: Comment[] = [
        { commentId: getCommentId("1"), history: [{ timestamp: getTimestamp(Date.now()), content: "Comment" }] },
      ];
      const model = new TestEntityModel(createTestEntity({ comments }));
      expect(model.hasComments).toBe(true);
    });

    it("should return correct commentCount", () => {
      const comments: Comment[] = [
        { commentId: getCommentId("1"), history: [{ timestamp: getTimestamp(Date.now()), content: "One" }] },
        { commentId: getCommentId("2"), history: [{ timestamp: getTimestamp(Date.now()), content: "Two" }] },
        { commentId: getCommentId("3"), history: [{ timestamp: getTimestamp(Date.now()), content: "Three" }] },
      ];
      const model = new TestEntityModel(createTestEntity({ comments }));
      expect(model.commentCount).toBe(3);
    });

    it("should return latestComment", () => {
      const comments: Comment[] = [
        { commentId: getCommentId("1"), history: [{ timestamp: getTimestamp(1000), content: "First" }] },
        { commentId: getCommentId("2"), history: [{ timestamp: getTimestamp(2000), content: "Second" }] },
      ];
      const model = new TestEntityModel(createTestEntity({ comments }));

      expect(model.latestComment?.commentId).toBe(getCommentId("2"));
    });

    it("should return undefined latestComment for empty comments", () => {
      const model = new TestEntityModel(createTestEntity({ comments: [] }));
      expect(model.latestComment).toBeUndefined();
    });

    it("should return hasActivity false for empty activity", () => {
      const model = new TestEntityModel(createTestEntity({ activity: [] }));
      expect(model.hasActivity).toBe(false);
    });

    it("should return hasActivity true when activity exists", () => {
      const activity: ActivityEntry<string>[] = [
        { id: getActivityId("1"), timestamp: getTimestamp(Date.now()), type: "created", description: "Created" },
      ];
      const model = new TestEntityModel(createTestEntity({ activity }));
      expect(model.hasActivity).toBe(true);
    });

    it("should return correct activityCount", () => {
      const activity: ActivityEntry<string>[] = [
        { id: getActivityId("1"), timestamp: getTimestamp(Date.now()), type: "created", description: "One" },
        { id: getActivityId("2"), timestamp: getTimestamp(Date.now()), type: "edited", description: "Two" },
      ];
      const model = new TestEntityModel(createTestEntity({ activity }));
      expect(model.activityCount).toBe(2);
    });

    it("should return latestActivity", () => {
      const activity: ActivityEntry<string>[] = [
        { id: getActivityId("1"), timestamp: getTimestamp(1000), type: "created", description: "First" },
        { id: getActivityId("2"), timestamp: getTimestamp(2000), type: "edited", description: "Second" },
      ];
      const model = new TestEntityModel(createTestEntity({ activity }));

      expect(model.latestActivity?.id).toBe(getActivityId("2"));
    });
  });

  describe("display properties", () => {
    it("should return name as displayName when no alternatives", () => {
      const model = new TestEntityModel(createTestEntity({ name: "John Doe", alternatives: [] }));
      expect(model.displayName).toBe("John Doe");
    });

    it("should include alternatives in displayName", () => {
      const model = new TestEntityModel(createTestEntity({ name: "John Doe", alternatives: ["Johnny", "JD"] }));
      expect(model.displayName).toBe("John Doe (Johnny, JD)");
    });

    it("should return correct initials for two-word name", () => {
      const model = new TestEntityModel(createTestEntity({ name: "John Doe" }));
      expect(model.initials).toBe("JD");
    });

    it("should return correct initials for single word name", () => {
      const model = new TestEntityModel(createTestEntity({ name: "Johnny" }));
      expect(model.initials).toBe("JO");
    });

    it("should return correct initials for multi-word name", () => {
      const model = new TestEntityModel(createTestEntity({ name: "John Michael Doe" }));
      expect(model.initials).toBe("JD"); // First and last word
    });

    it("should return correct statusBadge", () => {
      const active = new TestEntityModel(createTestEntity({ archived: false }));
      const archived = new TestEntityModel(createTestEntity({ archived: true }));

      expect(active.statusBadge).toBe("Active");
      expect(archived.statusBadge).toBe("Archived");
    });

    it("should return correct statusColor", () => {
      const active = new TestEntityModel(createTestEntity({ archived: false }));
      const archived = new TestEntityModel(createTestEntity({ archived: true }));

      expect(active.statusColor).toBe("blue");
      expect(archived.statusColor).toBe("gray");
    });
  });

  describe("getMetadataSummary", () => {
    it("should include todo count when provided", () => {
      const model = new TestEntityModel(createTestEntity());
      const summary = model.getMetadataSummary(5);

      expect(summary).toContain("5 todos");
    });

    it("should use singular 'todo' for count of 1", () => {
      const model = new TestEntityModel(createTestEntity());
      const summary = model.getMetadataSummary(1);

      expect(summary).toContain("1 todo");
      expect(summary).not.toContain("1 todos");
    });

    it("should not include todo count when zero", () => {
      const model = new TestEntityModel(createTestEntity());
      const summary = model.getMetadataSummary(0);

      expect(summary).not.toContain("todo");
    });

    it("should include comment count when present", () => {
      const comments: Comment[] = [
        { commentId: getCommentId("1"), history: [{ timestamp: getTimestamp(Date.now()), content: "One" }] },
        { commentId: getCommentId("2"), history: [{ timestamp: getTimestamp(Date.now()), content: "Two" }] },
      ];
      const model = new TestEntityModel(createTestEntity({ comments }));
      const summary = model.getMetadataSummary();

      expect(summary).toContain("2 comments");
    });

    it("should use singular 'comment' for count of 1", () => {
      const comments: Comment[] = [
        { commentId: getCommentId("1"), history: [{ timestamp: getTimestamp(Date.now()), content: "One" }] },
      ];
      const model = new TestEntityModel(createTestEntity({ comments }));
      const summary = model.getMetadataSummary();

      expect(summary).toContain("1 comment");
      expect(summary).not.toContain("1 comments");
    });

    it("should include activity count when present", () => {
      const activity: ActivityEntry<string>[] = [
        { id: getActivityId("1"), timestamp: getTimestamp(Date.now()), type: "created", description: "One" },
        { id: getActivityId("2"), timestamp: getTimestamp(Date.now()), type: "edited", description: "Two" },
        { id: getActivityId("3"), timestamp: getTimestamp(Date.now()), type: "edited", description: "Three" },
      ];
      const model = new TestEntityModel(createTestEntity({ activity }));
      const summary = model.getMetadataSummary();

      expect(summary).toContain("3 activities");
    });

    it("should include status", () => {
      const active = new TestEntityModel(createTestEntity({ archived: false }));
      const archived = new TestEntityModel(createTestEntity({ archived: true }));

      expect(active.getMetadataSummary()).toContain("Active");
      expect(archived.getMetadataSummary()).toContain("Archived");
    });

    it("should join parts with bullet separator", () => {
      const comments: Comment[] = [
        { commentId: getCommentId("1"), history: [{ timestamp: getTimestamp(Date.now()), content: "One" }] },
      ];
      const model = new TestEntityModel(createTestEntity({ comments }));
      const summary = model.getMetadataSummary(3);

      expect(summary).toContain(" • ");
    });
  });

  describe("search & matching", () => {
    describe("matchesSearch", () => {
      it("should match by name", () => {
        const model = new TestEntityModel(createTestEntity({ name: "John Doe" }));

        expect(model.matchesSearch("john")).toBe(true);
        expect(model.matchesSearch("doe")).toBe(true);
        expect(model.matchesSearch("JOHN")).toBe(true);
      });

      it("should match by alternatives", () => {
        const model = new TestEntityModel(createTestEntity({ name: "John", alternatives: ["Johnny", "JD"] }));

        expect(model.matchesSearch("johnny")).toBe(true);
        expect(model.matchesSearch("jd")).toBe(true);
      });

      it("should match by context", () => {
        const model = new TestEntityModel(createTestEntity({ name: "John", context: "Works in engineering" }));

        expect(model.matchesSearch("engineering")).toBe(true);
      });

      it("should match by comment content", () => {
        const comments: Comment[] = [
          {
            commentId: getCommentId("1"),
            history: [{ timestamp: getTimestamp(Date.now()), content: "Important meeting tomorrow" }],
          },
        ];
        const model = new TestEntityModel(createTestEntity({ comments }));

        expect(model.matchesSearch("meeting")).toBe(true);
        expect(model.matchesSearch("tomorrow")).toBe(true);
      });

      it("should return true for empty search text", () => {
        const model = new TestEntityModel(createTestEntity());

        expect(model.matchesSearch("")).toBe(true);
        expect(model.matchesSearch("   ")).toBe(true);
      });

      it("should return false for non-matching search", () => {
        const model = new TestEntityModel(createTestEntity({ name: "John", alternatives: ["Johnny"] }));

        expect(model.matchesSearch("xyz")).toBe(false);
      });
    });

    describe("matchesAnyName", () => {
      it("should match canonical name", () => {
        const model = new TestEntityModel(createTestEntity({ name: "John Doe", alternatives: ["Johnny"] }));

        expect(model.matchesAnyName(["John Doe"])).toBe(true);
      });

      it("should match alternative names", () => {
        const model = new TestEntityModel(createTestEntity({ name: "John Doe", alternatives: ["Johnny", "JD"] }));

        expect(model.matchesAnyName(["Johnny"])).toBe(true);
        expect(model.matchesAnyName(["JD"])).toBe(true);
      });

      it("should be case-insensitive", () => {
        const model = new TestEntityModel(createTestEntity({ name: "John Doe", alternatives: ["Johnny"] }));

        expect(model.matchesAnyName(["JOHN DOE"])).toBe(true);
        expect(model.matchesAnyName(["johnny"])).toBe(true);
      });

      it("should return false for no matches", () => {
        const model = new TestEntityModel(createTestEntity({ name: "John" }));

        expect(model.matchesAnyName(["Jane", "Bob"])).toBe(false);
      });
    });

    describe("allNames", () => {
      it("should return array with just name when no alternatives", () => {
        const model = new TestEntityModel(createTestEntity({ name: "John", alternatives: [] }));

        expect(model.allNames).toEqual(["John"]);
      });

      it("should return name and all alternatives", () => {
        const model = new TestEntityModel(createTestEntity({ name: "John", alternatives: ["Johnny", "JD"] }));

        expect(model.allNames).toEqual(["John", "Johnny", "JD"]);
      });
    });
  });
});
