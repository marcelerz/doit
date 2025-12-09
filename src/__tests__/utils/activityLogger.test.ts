/**
 * Tests for Activity Logger Utilities
 */

import {
  createActivity,
  generateMetadataActivities,
  formatActivityTime,
  formatActivityDateTime,
} from "@/utils/activityLogger";
import { TodoMetadata } from "@/types/todo";

describe("activityLogger", () => {
  describe("createActivity", () => {
    it("should create an activity entry with required fields", () => {
      const activity = createActivity("created", "Task created");

      expect(activity.id).toMatch(/^activity_\d+_[a-z0-9]+$/);
      expect(activity.timestamp).toBeGreaterThan(0);
      expect(activity.type).toBe("created");
      expect(activity.description).toBe("Task created");
      expect(activity.metadata).toBeUndefined();
    });

    it("should include optional metadata when provided", () => {
      const metadata = { oldValue: "test", newValue: "test2" };
      const activity = createActivity("edited", "Task edited", metadata);

      expect(activity.metadata).toEqual(metadata);
    });

    it("should generate unique IDs for each activity", () => {
      const activity1 = createActivity("created", "Test 1");
      const activity2 = createActivity("created", "Test 2");

      expect(activity1.id).not.toBe(activity2.id);
    });

    it("should create activities with correct types", () => {
      const types = ["created", "completed", "archived", "edited", "comment_added"] as const;

      types.forEach((type) => {
        const activity = createActivity(type, `Activity type: ${type}`);
        expect(activity.type).toBe(type);
      });
    });
  });

  describe("generateMetadataActivities", () => {
    const emptyMetadata: TodoMetadata = {
      assignedPeople: [],
      sourcePeople: [],
      mentionedPeople: [],
      projects: [],
      dependencies: [],
      tags: [],
    };

    it("should return empty array when no changes", () => {
      const activities = generateMetadataActivities(emptyMetadata, emptyMetadata);
      expect(activities).toHaveLength(0);
    });

    describe("assigned people", () => {
      it("should detect added assigned person", () => {
        const newMetadata = { ...emptyMetadata, assignedPeople: ["Alice"] };
        const activities = generateMetadataActivities(emptyMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("assigned_added");
        expect(activities[0].description).toBe("Assigned to @Alice");
      });

      it("should detect removed assigned person", () => {
        const oldMetadata = { ...emptyMetadata, assignedPeople: ["Alice"] };
        const activities = generateMetadataActivities(oldMetadata, emptyMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("assigned_removed");
        expect(activities[0].description).toBe("Unassigned from @Alice");
      });

      it("should detect multiple assigned changes", () => {
        const oldMetadata = { ...emptyMetadata, assignedPeople: ["Alice", "Bob"] };
        const newMetadata = { ...emptyMetadata, assignedPeople: ["Bob", "Charlie"] };
        const activities = generateMetadataActivities(oldMetadata, newMetadata);

        expect(activities).toHaveLength(2);
        expect(activities.map((a) => a.type)).toContain("assigned_added");
        expect(activities.map((a) => a.type)).toContain("assigned_removed");
      });
    });

    describe("source people", () => {
      it("should detect added source person", () => {
        const newMetadata = { ...emptyMetadata, sourcePeople: ["Manager"] };
        const activities = generateMetadataActivities(emptyMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("source_added");
        expect(activities[0].description).toBe("Added source $Manager");
      });

      it("should detect removed source person", () => {
        const oldMetadata = { ...emptyMetadata, sourcePeople: ["Manager"] };
        const activities = generateMetadataActivities(oldMetadata, emptyMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("source_removed");
      });
    });

    describe("mentioned people", () => {
      it("should detect added mentioned person", () => {
        const newMetadata = { ...emptyMetadata, mentionedPeople: ["Reviewer"] };
        const activities = generateMetadataActivities(emptyMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("mentioned_added");
        expect(activities[0].description).toBe("Mentioned ^Reviewer");
      });
    });

    describe("projects", () => {
      it("should detect added project", () => {
        const newMetadata = { ...emptyMetadata, projects: ["Website"] };
        const activities = generateMetadataActivities(emptyMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("project_added");
        expect(activities[0].description).toBe("Added to project #Website");
      });

      it("should detect removed project", () => {
        const oldMetadata = { ...emptyMetadata, projects: ["Website"] };
        const activities = generateMetadataActivities(oldMetadata, emptyMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("project_removed");
      });
    });

    describe("priority", () => {
      it("should detect priority set", () => {
        const newMetadata = { ...emptyMetadata, priority: "high" };
        const activities = generateMetadataActivities(emptyMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("priority_changed");
        expect(activities[0].description).toBe("Set priority to !!high");
      });

      it("should detect priority removed", () => {
        const oldMetadata = { ...emptyMetadata, priority: "high" };
        const activities = generateMetadataActivities(oldMetadata, emptyMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("priority_removed");
        expect(activities[0].description).toBe("Removed priority !!high");
      });

      it("should detect priority changed", () => {
        const oldMetadata = { ...emptyMetadata, priority: "low" };
        const newMetadata = { ...emptyMetadata, priority: "high" };
        const activities = generateMetadataActivities(oldMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("priority_changed");
        expect(activities[0].description).toBe("Changed priority from !!low to !!high");
      });
    });

    describe("due date", () => {
      it("should detect due date set", () => {
        const newMetadata = { ...emptyMetadata, dueDate: "2025-12-15" };
        const activities = generateMetadataActivities(emptyMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("duedate_changed");
        expect(activities[0].description).toBe("Set due date to ~2025-12-15");
      });

      it("should detect due date removed", () => {
        const oldMetadata = { ...emptyMetadata, dueDate: "2025-12-15" };
        const activities = generateMetadataActivities(oldMetadata, emptyMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("duedate_removed");
      });

      it("should detect due date changed", () => {
        const oldMetadata = { ...emptyMetadata, dueDate: "2025-12-10" };
        const newMetadata = { ...emptyMetadata, dueDate: "2025-12-15" };
        const activities = generateMetadataActivities(oldMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("duedate_changed");
      });
    });

    describe("duration", () => {
      it("should detect duration set", () => {
        const newMetadata = { ...emptyMetadata, duration: "2h" };
        const activities = generateMetadataActivities(emptyMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("duration_changed");
        expect(activities[0].description).toBe("Set duration to *2h");
      });

      it("should detect duration removed", () => {
        const oldMetadata = { ...emptyMetadata, duration: "2h" };
        const activities = generateMetadataActivities(oldMetadata, emptyMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("duration_removed");
      });
    });

    describe("recurring", () => {
      it("should detect recurring set", () => {
        const newMetadata = { ...emptyMetadata, recurring: "weekly" };
        const activities = generateMetadataActivities(emptyMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("recurring_changed");
        expect(activities[0].description).toBe("Set recurring to %weekly");
      });

      it("should detect recurring removed", () => {
        const oldMetadata = { ...emptyMetadata, recurring: "weekly" };
        const activities = generateMetadataActivities(oldMetadata, emptyMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("recurring_removed");
      });
    });

    describe("dependencies", () => {
      it("should detect added dependency", () => {
        const newMetadata = { ...emptyMetadata, dependencies: ["task-123"] };
        const activities = generateMetadataActivities(emptyMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("dependency_added");
        expect(activities[0].description).toBe("Added dependency >task-123");
      });

      it("should detect removed dependency", () => {
        const oldMetadata = { ...emptyMetadata, dependencies: ["task-123"] };
        const activities = generateMetadataActivities(oldMetadata, emptyMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("dependency_removed");
      });
    });

    describe("tags", () => {
      it("should detect added tag", () => {
        const newMetadata = { ...emptyMetadata, tags: ["important"] };
        const activities = generateMetadataActivities(emptyMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("tag_added");
        expect(activities[0].description).toBe("Added tag &important");
      });

      it("should detect removed tag", () => {
        const oldMetadata = { ...emptyMetadata, tags: ["important"] };
        const activities = generateMetadataActivities(oldMetadata, emptyMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("tag_removed");
      });
    });

    describe("context", () => {
      it("should detect context added", () => {
        const newMetadata = { ...emptyMetadata, context: "Some notes" };
        const activities = generateMetadataActivities(emptyMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("context_changed");
        expect(activities[0].description).toBe("Added context");
      });

      it("should detect context removed", () => {
        const oldMetadata = { ...emptyMetadata, context: "Some notes" };
        const activities = generateMetadataActivities(oldMetadata, emptyMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("context_changed");
        expect(activities[0].description).toBe("Removed context");
      });

      it("should detect context updated", () => {
        const oldMetadata = { ...emptyMetadata, context: "Old notes" };
        const newMetadata = { ...emptyMetadata, context: "New notes" };
        const activities = generateMetadataActivities(oldMetadata, newMetadata);

        expect(activities).toHaveLength(1);
        expect(activities[0].type).toBe("context_changed");
        expect(activities[0].description).toBe("Updated context");
      });
    });

    it("should detect multiple changes at once", () => {
      const oldMetadata: TodoMetadata = {
        assignedPeople: ["Alice"],
        sourcePeople: [],
        mentionedPeople: [],
        projects: ["OldProject"],
        dependencies: [],
        tags: ["old-tag"],
        priority: "low",
      };

      const newMetadata: TodoMetadata = {
        assignedPeople: ["Alice", "Bob"],
        sourcePeople: [],
        mentionedPeople: [],
        projects: ["NewProject"],
        dependencies: [],
        tags: ["new-tag"],
        priority: "high",
      };

      const activities = generateMetadataActivities(oldMetadata, newMetadata);

      // Should have: assigned_added (Bob), project_removed, project_added, tag_removed, tag_added, priority_changed
      expect(activities.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("formatActivityTime", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "just now" for recent timestamps', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      expect(formatActivityTime(now)).toBe("just now");
      expect(formatActivityTime(now - 30000)).toBe("just now"); // 30 seconds ago
    });

    it("should format minutes ago", () => {
      const now = Date.now();
      jest.setSystemTime(now);

      expect(formatActivityTime(now - 60000)).toBe("1m ago"); // 1 minute
      expect(formatActivityTime(now - 300000)).toBe("5m ago"); // 5 minutes
      expect(formatActivityTime(now - 3540000)).toBe("59m ago"); // 59 minutes
    });

    it("should format hours ago", () => {
      const now = Date.now();
      jest.setSystemTime(now);

      expect(formatActivityTime(now - 3600000)).toBe("1h ago"); // 1 hour
      expect(formatActivityTime(now - 7200000)).toBe("2h ago"); // 2 hours
      expect(formatActivityTime(now - 82800000)).toBe("23h ago"); // 23 hours
    });

    it("should format days ago", () => {
      const now = Date.now();
      jest.setSystemTime(now);

      expect(formatActivityTime(now - 86400000)).toBe("1d ago"); // 1 day
      expect(formatActivityTime(now - 172800000)).toBe("2d ago"); // 2 days
      expect(formatActivityTime(now - 518400000)).toBe("6d ago"); // 6 days
    });

    it("should format as date for older timestamps", () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const eightDaysAgo = now - 691200000; // 8 days
      const result = formatActivityTime(eightDaysAgo);

      // Should be a date string, not "Xd ago"
      expect(result).not.toContain("d ago");
      expect(result).toMatch(/\d+\/\d+\/\d+/); // Date format
    });
  });

  describe("formatActivityDateTime", () => {
    it("should format timestamp as full date/time string", () => {
      // Use a known timestamp
      const timestamp = new Date(2025, 11, 9, 14, 30, 0).getTime();
      const result = formatActivityDateTime(timestamp);

      // Should contain date and time elements
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(10);
    });
  });
});
