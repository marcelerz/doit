/**
 * Import utilities for importing todos from other apps
 * Supports: Todoist, Things 3, Apple Reminders, CSV, JSON
 */

import { Todo, Subtask, TodoState, getSubtaskId, getTag } from "@/types/todo";
import { getTimestamp } from "@/types/time";
import { getActivityId } from "@/types/types";

// Supported import formats
export type ImportFormat = "todoist" | "things" | "reminders" | "csv" | "json" | "auto";

// Import result with preview
export interface ImportResult {
  success: boolean;
  format: ImportFormat;
  todos: ImportedTodo[];
  errors: string[];
  warnings: string[];
}

// Intermediate format for previewing before import
export interface ImportedTodo {
  // Original fields from source
  originalId?: string;
  title: string;
  notes?: string;

  // Mapped fields
  isCompleted: boolean;
  dueDate?: string;
  priority?: string;
  project?: string;
  tags: string[];
  subtasks: string[];

  // Source-specific
  source: ImportFormat;
  rawData?: unknown;
}

// Field mapping configuration
export interface FieldMapping {
  title: string;
  notes?: string;
  completed?: string;
  dueDate?: string;
  priority?: string;
  project?: string;
  tags?: string;
  subtasks?: string;
}

// Default field mappings for CSV
export const DEFAULT_CSV_MAPPING: FieldMapping = {
  title: "title",
  notes: "notes",
  completed: "completed",
  dueDate: "due_date",
  priority: "priority",
  project: "project",
  tags: "tags",
};

/**
 * Detect import format from file content
 */
export function detectFormat(content: string, fileName?: string): ImportFormat {
  const ext = fileName?.toLowerCase().split(".").pop();

  // Check by extension first
  if (ext === "csv") return "csv";

  // Try to parse as JSON
  try {
    const data = JSON.parse(content);

    // Todoist export format
    if (Array.isArray(data) && data[0]?.content && data[0]?.checked !== undefined) {
      return "todoist";
    }

    // Things export format (has type field)
    if (Array.isArray(data) && data[0]?.type === "to-do") {
      return "things";
    }

    // Apple Reminders export (has isCompleted field)
    if (Array.isArray(data) && data[0]?.isCompleted !== undefined && data[0]?.title) {
      return "reminders";
    }

    // Our own JSON format
    if (Array.isArray(data) && data[0]?.plainText !== undefined && data[0]?.state) {
      return "json";
    }

    // Generic JSON array with title/name field
    if (Array.isArray(data) && (data[0]?.title || data[0]?.name || data[0]?.text)) {
      return "json";
    }

    return "json";
  } catch {
    // Not JSON, check for CSV
    if (content.includes(",") && content.includes("\n")) {
      return "csv";
    }
  }

  return "csv"; // Default fallback
}

/**
 * Parse Todoist JSON export
 * Todoist exports tasks with: content, checked, due, priority, labels, etc.
 */
export function parseTodoist(content: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const todos: ImportedTodo[] = [];

  try {
    const data = JSON.parse(content);

    if (!Array.isArray(data)) {
      return {
        success: false,
        format: "todoist",
        todos: [],
        errors: ["Invalid Todoist format: expected array"],
        warnings: [],
      };
    }

    for (const item of data) {
      try {
        const todo: ImportedTodo = {
          originalId: item.id?.toString(),
          title: item.content || item.text || "",
          notes: item.description || "",
          isCompleted: item.checked === true || item.completed === true,
          dueDate: item.due?.date || item.due_date || undefined,
          priority: mapTodoistPriority(item.priority),
          project: item.project_name || item.project || undefined,
          tags: item.labels || [],
          subtasks: [],
          source: "todoist",
          rawData: item,
        };

        // Handle subtasks (Todoist calls them sub-items in some exports)
        if (Array.isArray(item.items)) {
          todo.subtasks = item.items.map((sub: any) => sub.content || sub.text || "").filter(Boolean);
        }

        if (todo.title) {
          todos.push(todo);
        } else {
          warnings.push(`Skipped item with empty title (ID: ${item.id})`);
        }
      } catch (e) {
        warnings.push(`Failed to parse item: ${e}`);
      }
    }

    return { success: true, format: "todoist", todos, errors, warnings };
  } catch (e) {
    return {
      success: false,
      format: "todoist",
      todos: [],
      errors: [`Failed to parse Todoist JSON: ${e}`],
      warnings: [],
    };
  }
}

/**
 * Map Todoist priority (1-4, where 4 is highest) to our format
 */
function mapTodoistPriority(priority?: number): string | undefined {
  if (!priority) return undefined;
  switch (priority) {
    case 4:
      return "urgent";
    case 3:
      return "high";
    case 2:
      return "medium";
    case 1:
      return "low";
    default:
      return undefined;
  }
}

/**
 * Parse Things 3 JSON export
 * Things exports with: type, title, notes, status, tags, dueDate, etc.
 */
export function parseThings(content: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const todos: ImportedTodo[] = [];

  try {
    const data = JSON.parse(content);
    const items = Array.isArray(data) ? data : data.items || [];

    for (const item of items) {
      if (item.type !== "to-do" && item.type !== "task") continue;

      try {
        const todo: ImportedTodo = {
          originalId: item.uuid || item.id,
          title: item.title || "",
          notes: item.notes || "",
          isCompleted: item.status === "completed" || item.completed === true,
          dueDate: item.dueDate || item.deadline || undefined,
          priority: undefined, // Things doesn't have priority, uses Today/Anytime
          project: item.project || item.area || undefined,
          tags: Array.isArray(item.tags) ? item.tags.map((t: any) => t.title || t) : [],
          subtasks: [],
          source: "things",
          rawData: item,
        };

        // Handle checklist items as subtasks
        if (Array.isArray(item.checklistItems)) {
          todo.subtasks = item.checklistItems.map((sub: any) => sub.title || "").filter(Boolean);
        }

        if (todo.title) {
          todos.push(todo);
        }
      } catch (e) {
        warnings.push(`Failed to parse Things item: ${e}`);
      }
    }

    return { success: true, format: "things", todos, errors, warnings };
  } catch (e) {
    return { success: false, format: "things", todos: [], errors: [`Failed to parse Things JSON: ${e}`], warnings: [] };
  }
}

/**
 * Parse Apple Reminders JSON export
 * Format varies by export tool, common fields: title, isCompleted, dueDate, priority
 */
export function parseReminders(content: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const todos: ImportedTodo[] = [];

  try {
    const data = JSON.parse(content);
    const items = Array.isArray(data) ? data : data.reminders || data.items || [];

    for (const item of items) {
      try {
        const todo: ImportedTodo = {
          originalId: item.id || item.uuid,
          title: item.title || item.name || "",
          notes: item.notes || item.body || "",
          isCompleted: item.isCompleted === true || item.completed === true,
          dueDate: item.dueDate || item.dueDateComponents?.date || undefined,
          priority: mapRemindersPriority(item.priority),
          project: item.list || item.listName || undefined,
          tags: item.tags || [],
          subtasks: [],
          source: "reminders",
          rawData: item,
        };

        // Handle subtasks if present
        if (Array.isArray(item.subtasks)) {
          todo.subtasks = item.subtasks.map((sub: any) => sub.title || sub).filter(Boolean);
        }

        if (todo.title) {
          todos.push(todo);
        }
      } catch (e) {
        warnings.push(`Failed to parse Reminders item: ${e}`);
      }
    }

    return { success: true, format: "reminders", todos, errors, warnings };
  } catch (e) {
    return {
      success: false,
      format: "reminders",
      todos: [],
      errors: [`Failed to parse Reminders JSON: ${e}`],
      warnings: [],
    };
  }
}

/**
 * Map Apple Reminders priority (0=none, 1=high, 5=medium, 9=low)
 */
function mapRemindersPriority(priority?: number): string | undefined {
  if (priority === undefined || priority === 0) return undefined;
  if (priority <= 1) return "high";
  if (priority <= 5) return "medium";
  return "low";
}

/**
 * Parse CSV content
 */
export function parseCSV(content: string, mapping?: FieldMapping): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const todos: ImportedTodo[] = [];
  const fieldMap = mapping || DEFAULT_CSV_MAPPING;

  try {
    const lines = parseCSVLines(content);
    if (lines.length < 2) {
      return {
        success: false,
        format: "csv",
        todos: [],
        errors: ["CSV file is empty or has no data rows"],
        warnings: [],
      };
    }

    const headers = lines[0].map((h) => h.toLowerCase().trim());
    const titleIndex = findColumnIndex(headers, [fieldMap.title, "title", "name", "task", "content", "text", "todo"]);

    if (titleIndex === -1) {
      return {
        success: false,
        format: "csv",
        todos: [],
        errors: ["Could not find title/task column in CSV"],
        warnings: [],
      };
    }

    const notesIndex = findColumnIndex(headers, [fieldMap.notes || "", "notes", "description", "body", "details"]);
    const completedIndex = findColumnIndex(headers, [
      fieldMap.completed || "",
      "completed",
      "done",
      "checked",
      "status",
    ]);
    const dueDateIndex = findColumnIndex(headers, [
      fieldMap.dueDate || "",
      "due_date",
      "duedate",
      "due",
      "deadline",
      "date",
    ]);
    const priorityIndex = findColumnIndex(headers, [fieldMap.priority || "", "priority", "importance", "urgency"]);
    const projectIndex = findColumnIndex(headers, [fieldMap.project || "", "project", "list", "category", "folder"]);
    const tagsIndex = findColumnIndex(headers, [fieldMap.tags || "", "tags", "labels", "categories"]);

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      try {
        const title = row[titleIndex] || "";
        if (title.trim() === "") {
          warnings.push(`Row ${i + 1}: Skipped empty title`);
          continue;
        }

        const completedValue = completedIndex >= 0 ? row[completedIndex]?.toLowerCase() : "";
        const isCompleted = ["true", "yes", "1", "done", "completed", "x", "✓", "✔"].includes(completedValue);

        const tagsValue = tagsIndex >= 0 ? row[tagsIndex] : "";
        const tags = tagsValue
          ? tagsValue
              .split(/[,;|]/)
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        const todo: ImportedTodo = {
          title: title.trim(),
          notes: notesIndex >= 0 ? row[notesIndex] : undefined,
          isCompleted,
          dueDate: dueDateIndex >= 0 ? parseCSVDate(row[dueDateIndex]) : undefined,
          priority: priorityIndex >= 0 ? normalizeCSVPriority(row[priorityIndex]) : undefined,
          project: projectIndex >= 0 ? row[projectIndex] : undefined,
          tags,
          subtasks: [],
          source: "csv",
        };

        todos.push(todo);
      } catch (e) {
        warnings.push(`Row ${i + 1}: Failed to parse - ${e}`);
      }
    }

    return { success: true, format: "csv", todos, errors, warnings };
  } catch (e) {
    return { success: false, format: "csv", todos: [], errors: [`Failed to parse CSV: ${e}`], warnings: [] };
  }
}

/**
 * Parse CSV lines handling quoted values
 */
function parseCSVLines(content: string): string[][] {
  const lines: string[][] = [];
  const rows = content.split(/\r?\n/);

  for (const row of rows) {
    if (row.trim() === "") continue;

    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"' && (i === 0 || row[i - 1] !== "\\")) {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    lines.push(values);
  }

  return lines;
}

/**
 * Find column index by possible names
 */
function findColumnIndex(headers: string[], names: string[]): number {
  for (const name of names) {
    if (!name) continue;
    const index = headers.findIndex((h) => h === name.toLowerCase() || h.includes(name.toLowerCase()));
    if (index >= 0) return index;
  }
  return -1;
}

/**
 * Parse date from CSV (various formats)
 */
function parseCSVDate(value?: string): string | undefined {
  if (!value || value.trim() === "") return undefined;

  const trimmed = value.trim();

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.split("T")[0];
  }

  // MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, a, b, year] = slashMatch;
    // Assume MM/DD/YYYY (US format) if first number <= 12
    const month = parseInt(a) <= 12 ? a : b;
    const day = parseInt(a) <= 12 ? b : a;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try native Date parsing
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  } catch {
    // Ignore parse errors
  }

  return undefined;
}

/**
 * Normalize priority from CSV values
 */
function normalizeCSVPriority(value?: string): string | undefined {
  if (!value) return undefined;

  const lower = value.toLowerCase().trim();

  if (["urgent", "critical", "asap", "4", "p1"].includes(lower)) return "urgent";
  if (["high", "important", "3", "p2", "!"].includes(lower)) return "high";
  if (["medium", "normal", "2", "p3", "med"].includes(lower)) return "medium";
  if (["low", "1", "p4", "minor"].includes(lower)) return "low";

  return undefined;
}

/**
 * Parse generic JSON (including our own format)
 */
export function parseJSON(content: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const todos: ImportedTodo[] = [];

  try {
    const data = JSON.parse(content);
    const items = Array.isArray(data) ? data : data.todos || data.tasks || data.items || [];

    for (const item of items) {
      try {
        // Check if it's our own Todo format
        if (item.plainText !== undefined && item.state !== undefined) {
          const todo: ImportedTodo = {
            originalId: item.id,
            title: item.plainText,
            notes: item.metadata?.context,
            isCompleted: item.state === "completed",
            dueDate: item.metadata?.dueDate,
            priority: item.metadata?.priority,
            project: item.metadata?.projects?.[0],
            tags: item.metadata?.tags || [],
            subtasks: item.subtasks?.map((s: Subtask) => s.text) || [],
            source: "json",
            rawData: item,
          };
          todos.push(todo);
          continue;
        }

        // Generic JSON format
        const title = item.title || item.name || item.text || item.content || "";
        if (title.trim() === "") {
          warnings.push(`Skipped item with empty title`);
          continue;
        }

        const todo: ImportedTodo = {
          originalId: item.id?.toString(),
          title,
          notes: item.notes || item.description || item.body || "",
          isCompleted: item.completed === true || item.done === true || item.status === "completed",
          dueDate: item.dueDate || item.due_date || item.deadline,
          priority: item.priority,
          project: item.project || item.list || item.category,
          tags: Array.isArray(item.tags) ? item.tags : item.labels || [],
          subtasks: Array.isArray(item.subtasks)
            ? item.subtasks.map((s: any) => (typeof s === "string" ? s : s.title || s.text || "")).filter(Boolean)
            : [],
          source: "json",
          rawData: item,
        };

        todos.push(todo);
      } catch (e) {
        warnings.push(`Failed to parse JSON item: ${e}`);
      }
    }

    return { success: true, format: "json", todos, errors, warnings };
  } catch (e) {
    return { success: false, format: "json", todos: [], errors: [`Failed to parse JSON: ${e}`], warnings: [] };
  }
}

/**
 * Main import function - detects format and parses
 */
export function importTodos(content: string, format: ImportFormat = "auto", fileName?: string): ImportResult {
  const detectedFormat = format === "auto" ? detectFormat(content, fileName) : format;

  switch (detectedFormat) {
    case "todoist":
      return parseTodoist(content);
    case "things":
      return parseThings(content);
    case "reminders":
      return parseReminders(content);
    case "csv":
      return parseCSV(content);
    case "json":
    default:
      return parseJSON(content);
  }
}

/**
 * Convert ImportedTodo to our Todo format
 */
export function convertToTodo(imported: ImportedTodo, existingProjects: string[] = []): Omit<Todo, "id"> {
  const now = Date.now();

  // Build text with markers
  let text = imported.title;
  if (imported.project) text += ` %${imported.project}`;
  if (imported.priority) text += ` !!${imported.priority}`;
  imported.tags.forEach((tag) => {
    text += ` #${tag}`;
  });

  // Build subtasks
  const subtasks: Subtask[] = (imported.subtasks ?? []).map((text) => ({
    id: getSubtaskId(`subtask-${now}-${Math.random().toString(36).slice(2, 9)}`),
    text,
    completed: false,
    createdAt: getTimestamp(now),
  }));

  const state: TodoState = imported.isCompleted ? "completed" : "active";

  return {
    text,
    plainText: imported.title,
    state,
    createdAt: getTimestamp(now),
    updatedAt: getTimestamp(now),
    completedAt: imported.isCompleted ? getTimestamp(now) : undefined,
    context: imported.notes || "",
    tags: (imported.tags ?? []).map(getTag),
    dependencies: [],
    assignedPeople: [],
    sourcePeople: [],
    mentionedPeople: [],
    projects: [], // Note: Projects are strings in imported data but need to be ProjectIds after resolution
    priority: undefined, // Note: Needs to be resolved to PriorityId
    dueDate: imported.dueDate ? getTimestamp(new Date(imported.dueDate).getTime()) : undefined,
    duration: undefined,
    recurring: undefined,
    comments: [],
    activity: [
      {
        id: getActivityId(`activity-${now}`),
        timestamp: getTimestamp(now),
        type: "created",
        description: `Imported from ${imported.source}`,
      },
    ],
    subtasks: subtasks,
  };
}

/**
 * Batch convert imported todos
 */
export function convertAllToTodos(imported: ImportedTodo[], existingProjects: string[] = []): Array<Omit<Todo, "id">> {
  return imported.map((item) => convertToTodo(item, existingProjects));
}
