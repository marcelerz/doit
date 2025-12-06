import { TodoModel } from "@/models/TodoModel";

export type ExportFormat = "markdown" | "csv" | "json";

/**
 * Export todos to Markdown format
 */
export function exportToMarkdown(todos: TodoModel[], title = "Todo List"): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`*Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*`);
  lines.push("");

  // Group todos by state
  const activeTodos = todos.filter((t) => t.isActive);
  const completedTodos = todos.filter((t) => t.isCompleted);
  const archivedTodos = todos.filter((t) => t.isArchived);

  if (activeTodos.length > 0) {
    lines.push("## Active Tasks");
    lines.push("");
    activeTodos.forEach((todo) => {
      lines.push(formatTodoMarkdown(todo, false));
    });
    lines.push("");
  }

  if (completedTodos.length > 0) {
    lines.push("## Completed Tasks");
    lines.push("");
    completedTodos.forEach((todo) => {
      lines.push(formatTodoMarkdown(todo, true));
    });
    lines.push("");
  }

  if (archivedTodos.length > 0) {
    lines.push("## Archived Tasks");
    lines.push("");
    archivedTodos.forEach((todo) => {
      lines.push(formatTodoMarkdown(todo, true));
    });
    lines.push("");
  }

  return lines.join("\n");
}

function formatTodoMarkdown(todo: TodoModel, completed: boolean): string {
  const checkbox = completed ? "[x]" : "[ ]";
  let line = `- ${checkbox} ${todo.plainText}`;

  const metadata: string[] = [];

  if (todo.metadata.priority) {
    metadata.push(`Priority: ${todo.metadata.priority}`);
  }
  if (todo.metadata.dueDate) {
    metadata.push(`Due: ${todo.metadata.dueDate}`);
  }
  if (todo.metadata.assignedPeople.length > 0) {
    metadata.push(`Assigned: ${todo.metadata.assignedPeople.join(", ")}`);
  }
  if (todo.metadata.projects.length > 0) {
    metadata.push(`Project: ${todo.metadata.projects.join(", ")}`);
  }
  if (todo.metadata.tags.length > 0) {
    metadata.push(`Tags: ${todo.metadata.tags.join(", ")}`);
  }

  if (metadata.length > 0) {
    line += ` *(${metadata.join(" | ")})*`;
  }

  return line;
}

/**
 * Export todos to CSV format
 */
export function exportToCSV(todos: TodoModel[]): string {
  const headers = [
    "Title",
    "Status",
    "Priority",
    "Due Date",
    "Duration",
    "Assigned",
    "Projects",
    "Tags",
    "Created",
    "Completed",
  ];

  const rows: string[][] = [headers];

  todos.forEach((todo) => {
    rows.push([
      escapeCSV(todo.plainText),
      todo.state,
      todo.metadata.priority || "",
      todo.metadata.dueDate || "",
      todo.metadata.duration || "",
      todo.metadata.assignedPeople.join("; "),
      todo.metadata.projects.join("; "),
      todo.metadata.tags.join("; "),
      todo.raw.createdAt ? new Date(todo.raw.createdAt).toISOString() : "",
      todo.raw.completedAt ? new Date(todo.raw.completedAt).toISOString() : "",
    ]);
  });

  return rows.map((row) => row.join(",")).join("\n");
}

function escapeCSV(value: string): string {
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export todos to JSON format
 */
export function exportToJSON(todos: TodoModel[]): string {
  const data = todos.map((todo) => ({
    id: todo.id,
    title: todo.plainText,
    fullText: todo.text,
    state: todo.state,
    metadata: {
      priority: todo.metadata.priority,
      dueDate: todo.metadata.dueDate,
      duration: todo.metadata.duration,
      recurring: todo.metadata.recurring,
      assignedPeople: todo.metadata.assignedPeople,
      sourcePeople: todo.metadata.sourcePeople,
      mentionedPeople: todo.metadata.mentionedPeople,
      projects: todo.metadata.projects,
      tags: todo.metadata.tags,
      dependencies: todo.metadata.dependencies,
    },
    timestamps: {
      created: todo.raw.createdAt,
      updated: todo.raw.updatedAt,
      completed: todo.raw.completedAt,
      archived: todo.raw.archivedAt,
    },
    commentsCount: todo.commentCount,
  }));

  return JSON.stringify({ todos: data, exportedAt: new Date().toISOString() }, null, 2);
}

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case "markdown":
      return "text/markdown";
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    default:
      return "text/plain";
  }
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case "markdown":
      return "md";
    case "csv":
      return "csv";
    case "json":
      return "json";
    default:
      return "txt";
  }
}

/**
 * Export todos in the specified format
 */
export function exportTodos(todos: TodoModel[], format: ExportFormat, filename = "todos"): void {
  let content: string;

  switch (format) {
    case "markdown":
      content = exportToMarkdown(todos);
      break;
    case "csv":
      content = exportToCSV(todos);
      break;
    case "json":
      content = exportToJSON(todos);
      break;
    default:
      content = exportToMarkdown(todos);
  }

  const mimeType = getMimeType(format);
  const extension = getFileExtension(format);
  const fullFilename = `${filename}.${extension}`;

  downloadFile(content, fullFilename, mimeType);
}
