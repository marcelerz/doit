/**
 * Tests for Import Utilities
 */

import {
  detectFormat,
  parseTodoist,
  parseThings,
  parseReminders,
  parseCSV,
  parseJSON,
  importTodos,
  convertToTodo,
  convertAllToTodos,
  DEFAULT_CSV_MAPPING,
  ImportFormat,
} from "@/utils/import";

describe("import", () => {
  describe("detectFormat", () => {
    it("should detect CSV by file extension", () => {
      expect(detectFormat("any content", "data.csv")).toBe("csv");
      expect(detectFormat("any content", "export.CSV")).toBe("csv");
    });

    it("should detect Todoist JSON format", () => {
      const todoistData = JSON.stringify([
        { content: "Task 1", checked: false },
        { content: "Task 2", checked: true },
      ]);

      expect(detectFormat(todoistData)).toBe("todoist");
    });

    it("should detect Things JSON format", () => {
      const thingsData = JSON.stringify([
        { type: "to-do", title: "Task 1" },
        { type: "to-do", title: "Task 2" },
      ]);

      expect(detectFormat(thingsData)).toBe("things");
    });

    it("should detect Reminders JSON format", () => {
      const remindersData = JSON.stringify([
        { title: "Task 1", isCompleted: false },
        { title: "Task 2", isCompleted: true },
      ]);

      expect(detectFormat(remindersData)).toBe("reminders");
    });

    it("should detect our own JSON format", () => {
      const ourData = JSON.stringify([
        { plainText: "Task 1", state: "active" },
        { plainText: "Task 2", state: "completed" },
      ]);

      expect(detectFormat(ourData)).toBe("json");
    });

    it("should detect generic JSON with title field", () => {
      const genericData = JSON.stringify([{ title: "Task 1" }]);

      expect(detectFormat(genericData)).toBe("json");
    });

    it("should fall back to CSV for non-JSON with commas and newlines", () => {
      const csvContent = "title,status\nTask 1,active\nTask 2,done";

      expect(detectFormat(csvContent)).toBe("csv");
    });
  });

  describe("parseTodoist", () => {
    it("should parse Todoist JSON format", () => {
      const data = JSON.stringify([
        {
          id: "123",
          content: "Task 1",
          description: "Notes here",
          checked: false,
          due: { date: "2025-12-15" },
          priority: 4,
          project_name: "Work",
          labels: ["urgent"],
        },
      ]);

      const result = parseTodoist(data);

      expect(result.success).toBe(true);
      expect(result.format).toBe("todoist");
      expect(result.todos).toHaveLength(1);
      expect(result.todos[0].title).toBe("Task 1");
      expect(result.todos[0].notes).toBe("Notes here");
      expect(result.todos[0].isCompleted).toBe(false);
      expect(result.todos[0].dueDate).toBe("2025-12-15");
      expect(result.todos[0].priority).toBe("urgent");
      expect(result.todos[0].project).toBe("Work");
      expect(result.todos[0].tags).toContain("urgent");
    });

    it("should map Todoist priorities correctly", () => {
      const data = JSON.stringify([
        { content: "P4", priority: 4 },
        { content: "P3", priority: 3 },
        { content: "P2", priority: 2 },
        { content: "P1", priority: 1 },
      ]);

      const result = parseTodoist(data);

      expect(result.todos[0].priority).toBe("urgent");
      expect(result.todos[1].priority).toBe("high");
      expect(result.todos[2].priority).toBe("medium");
      expect(result.todos[3].priority).toBe("low");
    });

    it("should handle completed tasks", () => {
      const data = JSON.stringify([{ content: "Done task", checked: true }]);

      const result = parseTodoist(data);

      expect(result.todos[0].isCompleted).toBe(true);
    });

    it("should return error for invalid JSON", () => {
      const result = parseTodoist("not json");

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should return error for non-array data", () => {
      const result = parseTodoist(JSON.stringify({ not: "array" }));

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain("expected array");
    });

    it("should skip items with empty titles", () => {
      const data = JSON.stringify([{ content: "Valid" }, { content: "" }, { id: "no-content" }]);

      const result = parseTodoist(data);

      expect(result.todos).toHaveLength(1);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("parseThings", () => {
    it("should parse Things JSON format", () => {
      const data = JSON.stringify([
        {
          type: "to-do",
          uuid: "abc123",
          title: "Task 1",
          notes: "Some notes",
          status: "completed",
          dueDate: "2025-12-15",
          project: "Work",
          tags: [{ title: "urgent" }],
        },
      ]);

      const result = parseThings(data);

      expect(result.success).toBe(true);
      expect(result.format).toBe("things");
      expect(result.todos).toHaveLength(1);
      expect(result.todos[0].title).toBe("Task 1");
      expect(result.todos[0].notes).toBe("Some notes");
      expect(result.todos[0].isCompleted).toBe(true);
      expect(result.todos[0].dueDate).toBe("2025-12-15");
      expect(result.todos[0].project).toBe("Work");
    });

    it("should skip non-todo items", () => {
      const data = JSON.stringify([
        { type: "to-do", title: "Valid" },
        { type: "project", title: "Project" },
        { type: "area", title: "Area" },
      ]);

      const result = parseThings(data);

      expect(result.todos).toHaveLength(1);
      expect(result.todos[0].title).toBe("Valid");
    });

    it("should handle checklist items as subtasks", () => {
      const data = JSON.stringify([
        {
          type: "to-do",
          title: "Main task",
          checklistItems: [{ title: "Step 1" }, { title: "Step 2" }],
        },
      ]);

      const result = parseThings(data);

      expect(result.todos[0].subtasks).toEqual(["Step 1", "Step 2"]);
    });

    it("should handle nested items object", () => {
      const data = JSON.stringify({
        items: [{ type: "to-do", title: "Nested" }],
      });

      const result = parseThings(data);

      expect(result.todos).toHaveLength(1);
      expect(result.todos[0].title).toBe("Nested");
    });
  });

  describe("parseReminders", () => {
    it("should parse Apple Reminders format", () => {
      const data = JSON.stringify([
        {
          id: "reminder-1",
          title: "Task 1",
          notes: "Notes",
          isCompleted: false,
          dueDate: "2025-12-15",
          priority: 1,
          list: "Work",
          tags: ["important"],
        },
      ]);

      const result = parseReminders(data);

      expect(result.success).toBe(true);
      expect(result.format).toBe("reminders");
      expect(result.todos).toHaveLength(1);
      expect(result.todos[0].title).toBe("Task 1");
      expect(result.todos[0].isCompleted).toBe(false);
      expect(result.todos[0].priority).toBe("high");
      expect(result.todos[0].project).toBe("Work");
    });

    it("should map Reminders priorities correctly", () => {
      const data = JSON.stringify([
        { title: "High", priority: 1 },
        { title: "Medium", priority: 5 },
        { title: "Low", priority: 9 },
        { title: "None", priority: 0 },
      ]);

      const result = parseReminders(data);

      expect(result.todos[0].priority).toBe("high");
      expect(result.todos[1].priority).toBe("medium");
      expect(result.todos[2].priority).toBe("low");
      expect(result.todos[3].priority).toBeUndefined();
    });

    it("should handle nested reminders object", () => {
      const data = JSON.stringify({
        reminders: [{ title: "Nested reminder" }],
      });

      const result = parseReminders(data);

      expect(result.todos).toHaveLength(1);
    });
  });

  describe("parseCSV", () => {
    it("should parse basic CSV", () => {
      const csv = `title,completed,priority
Task 1,false,high
Task 2,true,low`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.todos).toHaveLength(2);
      expect(result.todos[0].title).toBe("Task 1");
      expect(result.todos[0].isCompleted).toBe(false);
      expect(result.todos[0].priority).toBe("high");
      expect(result.todos[1].title).toBe("Task 2");
      expect(result.todos[1].isCompleted).toBe(true);
    });

    it("should handle various completed values", () => {
      const csv = `title,completed
Done 1,true
Done 2,yes
Done 3,1
Done 4,done
Done 5,completed
Done 6,x
Not done,false`;

      const result = parseCSV(csv);

      expect(result.todos[0].isCompleted).toBe(true);
      expect(result.todos[1].isCompleted).toBe(true);
      expect(result.todos[2].isCompleted).toBe(true);
      expect(result.todos[3].isCompleted).toBe(true);
      expect(result.todos[4].isCompleted).toBe(true);
      expect(result.todos[5].isCompleted).toBe(true);
      expect(result.todos[6].isCompleted).toBe(false);
    });

    it("should handle quoted values", () => {
      const csv = `title,notes
"Task with, comma","Notes with ""quotes"""`;

      const result = parseCSV(csv);

      expect(result.todos[0].title).toBe("Task with, comma");
    });

    it("should handle various date formats", () => {
      const csv = `title,due_date
Task 1,2025-12-15
Task 2,12/15/2025
Task 3,`;

      const result = parseCSV(csv);

      expect(result.todos[0].dueDate).toBe("2025-12-15");
      expect(result.todos[1].dueDate).toBe("2025-12-15");
      expect(result.todos[2].dueDate).toBeUndefined();
    });

    it("should normalize priority values", () => {
      const csv = `title,priority
Task 1,urgent
Task 2,critical
Task 3,p1
Task 4,high
Task 5,p2
Task 6,medium
Task 7,low`;

      const result = parseCSV(csv);

      expect(result.todos[0].priority).toBe("urgent");
      expect(result.todos[1].priority).toBe("urgent");
      expect(result.todos[2].priority).toBe("urgent");
      expect(result.todos[3].priority).toBe("high");
      expect(result.todos[4].priority).toBe("high");
      expect(result.todos[5].priority).toBe("medium");
      expect(result.todos[6].priority).toBe("low");
    });

    it("should parse tags from delimiter-separated values", () => {
      // Tags can be separated by semicolon, pipe within the same cell
      const csv = `title,tags
Task 1,urgent;followup
Task 2,important|review
Task 3,single`;

      const result = parseCSV(csv);

      expect(result.todos[0].tags).toEqual(["urgent", "followup"]);
      expect(result.todos[1].tags).toEqual(["important", "review"]);
      expect(result.todos[2].tags).toEqual(["single"]);
    });

    it("should return error for missing title column", () => {
      const csv = `priority,status
high,done`;

      const result = parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain("Could not find title");
    });

    it("should return error for empty CSV", () => {
      const result = parseCSV("");

      expect(result.success).toBe(false);
    });

    it("should skip empty title rows", () => {
      const csv = `title
Valid

Also Valid`;

      const result = parseCSV(csv);

      // Empty rows are simply skipped (no warning generated for empty lines)
      expect(result.todos).toHaveLength(2);
    });

    it("should use custom field mapping", () => {
      const csv = `task_name,done
My Task,yes`;

      const mapping = {
        title: "task_name",
        completed: "done",
      };

      const result = parseCSV(csv, mapping);

      expect(result.todos[0].title).toBe("My Task");
      expect(result.todos[0].isCompleted).toBe(true);
    });
  });

  describe("parseJSON", () => {
    it("should parse generic JSON with title field", () => {
      const data = JSON.stringify([{ title: "Task 1", completed: true, priority: "high" }, { title: "Task 2" }]);

      const result = parseJSON(data);

      expect(result.success).toBe(true);
      expect(result.todos).toHaveLength(2);
      expect(result.todos[0].title).toBe("Task 1");
      expect(result.todos[0].isCompleted).toBe(true);
      expect(result.todos[0].priority).toBe("high");
    });

    it("should parse our own export format", () => {
      const data = JSON.stringify([
        {
          plainText: "Task 1",
          state: "completed",
          metadata: {
            priority: "high",
            dueDate: "2025-12-15",
            projects: ["Work"],
            tags: ["urgent"],
          },
          subtasks: [{ text: "Step 1" }],
        },
      ]);

      const result = parseJSON(data);

      expect(result.todos[0].title).toBe("Task 1");
      expect(result.todos[0].isCompleted).toBe(true);
      expect(result.todos[0].priority).toBe("high");
      expect(result.todos[0].dueDate).toBe("2025-12-15");
      expect(result.todos[0].project).toBe("Work");
      expect(result.todos[0].tags).toContain("urgent");
      expect(result.todos[0].subtasks).toContain("Step 1");
    });

    it("should handle nested todos object", () => {
      const data = JSON.stringify({
        todos: [{ title: "Nested" }],
      });

      const result = parseJSON(data);

      expect(result.todos).toHaveLength(1);
    });

    it("should handle name/text fields as title", () => {
      expect(parseJSON(JSON.stringify([{ name: "By name" }])).todos[0].title).toBe("By name");
      expect(parseJSON(JSON.stringify([{ text: "By text" }])).todos[0].title).toBe("By text");
    });

    it("should skip items without title", () => {
      const data = JSON.stringify([{ title: "Valid" }, { description: "No title" }]);

      const result = parseJSON(data);

      expect(result.todos).toHaveLength(1);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("importTodos", () => {
    it("should auto-detect format and parse", () => {
      const todoistData = JSON.stringify([{ content: "Task", checked: false }]);

      const result = importTodos(todoistData, "auto");

      expect(result.success).toBe(true);
      expect(result.format).toBe("todoist");
    });

    it("should use specified format", () => {
      const data = JSON.stringify([{ title: "Task" }]);

      const result = importTodos(data, "json");

      expect(result.format).toBe("json");
    });

    it("should detect format from filename", () => {
      const result = importTodos("title\nTask", "auto", "data.csv");

      expect(result.format).toBe("csv");
    });
  });

  describe("convertToTodo", () => {
    it("should convert ImportedTodo to Todo format", () => {
      const imported = {
        title: "Test task",
        notes: "Some notes",
        isCompleted: false,
        dueDate: "2025-12-15",
        priority: "high",
        project: "Work",
        tags: ["urgent"],
        subtasks: ["Step 1", "Step 2"],
        assignedPeople: [],
        source: "json" as ImportFormat,
      };

      const result = convertToTodo(imported);

      expect(result.plainText).toBe("Test task");
      expect(result.state).toBe("active");
      expect(result.dueDate).toBeDefined(); // Now a Timestamp
      expect(result.context).toBe("Some notes");
      expect(result.tags).toEqual(["urgent"]); // Tags are Tag branded strings
      expect(result.subtasks).toHaveLength(2);
      expect(result.subtasks![0].text).toBe("Step 1");
    });

    it("should set state to completed for completed tasks", () => {
      const imported = {
        title: "Done",
        isCompleted: true,
        tags: [],
        subtasks: [],
        assignedPeople: [],
        source: "json" as ImportFormat,
      };

      const result = convertToTodo(imported);

      expect(result.state).toBe("completed");
      expect(result.completedAt).toBeDefined();
    });

    it("should build text with markers", () => {
      const imported = {
        title: "Task",
        isCompleted: false,
        project: "Work",
        priority: "high",
        tags: ["urgent", "review"],
        subtasks: [],
        assignedPeople: [],
        source: "json" as ImportFormat,
      };

      const result = convertToTodo(imported);

      expect(result.text).toContain("%Work");
      expect(result.text).toContain("!!high");
      expect(result.text).toContain("#urgent");
      expect(result.text).toContain("#review");
    });

    it("should create activity entry for import", () => {
      const imported = {
        title: "Task",
        isCompleted: false,
        tags: [],
        subtasks: [],
        assignedPeople: [],
        source: "todoist" as ImportFormat,
      };

      const result = convertToTodo(imported);

      expect(result.activity).toHaveLength(1);
      expect(result.activity[0].type).toBe("created");
      expect(result.activity[0].description).toContain("todoist");
    });
  });

  describe("convertAllToTodos", () => {
    it("should convert array of imported todos", () => {
      const imported = [
        { title: "Task 1", isCompleted: false, tags: [], subtasks: [], assignedPeople: [], source: "json" as ImportFormat },
        { title: "Task 2", isCompleted: true, tags: [], subtasks: [], assignedPeople: [], source: "json" as ImportFormat },
      ];

      const result = convertAllToTodos(imported);

      expect(result).toHaveLength(2);
      expect(result[0].plainText).toBe("Task 1");
      expect(result[1].plainText).toBe("Task 2");
    });

    it("should handle empty array", () => {
      const result = convertAllToTodos([]);
      expect(result).toEqual([]);
    });
  });

  describe("DEFAULT_CSV_MAPPING", () => {
    it("should have expected default mappings", () => {
      expect(DEFAULT_CSV_MAPPING.title).toBe("title");
      expect(DEFAULT_CSV_MAPPING.notes).toBe("notes");
      expect(DEFAULT_CSV_MAPPING.completed).toBe("completed");
      expect(DEFAULT_CSV_MAPPING.dueDate).toBe("due_date");
      expect(DEFAULT_CSV_MAPPING.priority).toBe("priority");
      expect(DEFAULT_CSV_MAPPING.project).toBe("project");
      expect(DEFAULT_CSV_MAPPING.tags).toBe("tags");
    });
  });
});
