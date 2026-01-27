import { TodoModel } from "@/models/TodoModel";
import { NoteModel } from "@/models/NoteModel";

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

  if (todo.priorityName) {
    metadata.push(`Priority: ${todo.priorityName}`);
  }
  if (todo.dueDateDisplay) {
    metadata.push(`Due: ${todo.dueDateDisplay}`);
  }
  // Note: assignedPeopleIds contains IDs, not names - we use tags for now
  // In a full implementation, we'd use registry to look up names
  if (todo.tags.length > 0) {
    metadata.push(`Tags: ${todo.tags.join(", ")}`);
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
      todo.priorityName || "",
      todo.dueDateDisplay || "",
      todo.durationDisplay || "",
      "", // Assigned - would need registry for names
      "", // Projects - would need registry for names
      todo.tags.join("; "),
      todo.createdAt ? new Date(todo.createdAt).toISOString() : "",
      todo.completedAt ? new Date(todo.completedAt).toISOString() : "",
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
    fields: {
      priority: todo.priorityName,
      dueDate: todo.dueDateDisplay,
      duration: todo.durationDisplay,
      recurring: todo.recurring,
      assignedPeopleIds: todo.assignedPeopleIds,
      sourcePeopleIds: todo.sourcePeopleIds,
      mentionedPeopleIds: todo.mentionedPeopleIds,
      projectIds: todo.projectIds,
      tags: todo.tags,
      dependencyIds: todo.dependencyIds,
    },
    timestamps: {
      created: todo.createdAt,
      updated: todo.updatedAt,
      completed: todo.completedAt,
      archived: todo.archivedAt,
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
  // Defer URL revocation to allow download to complete
  // Using setTimeout ensures the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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

// ============================================================================
// Notes Export Functions
// ============================================================================

/**
 * Export notes to Markdown format
 */
export function exportNotesToMarkdown(
  notes: NoteModel[],
  peopleMap: Map<string, string> = new Map(),
  projectsMap: Map<string, string> = new Map(),
  title = "Notes",
): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`*Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*`);
  lines.push("");

  // Group notes by state
  const activeNotes = notes.filter((n) => n.isActive);
  const archivedNotes = notes.filter((n) => n.isArchived);

  if (activeNotes.length > 0) {
    lines.push("## Active Notes");
    lines.push("");
    activeNotes.forEach((note) => {
      lines.push(formatNoteMarkdown(note, peopleMap, projectsMap));
      lines.push("");
    });
  }

  if (archivedNotes.length > 0) {
    lines.push("## Archived Notes");
    lines.push("");
    archivedNotes.forEach((note) => {
      lines.push(formatNoteMarkdown(note, peopleMap, projectsMap));
      lines.push("");
    });
  }

  return lines.join("\n");
}

function formatNoteMarkdown(
  note: NoteModel,
  peopleMap: Map<string, string>,
  projectsMap: Map<string, string>,
): string {
  const lines: string[] = [];

  // Title with pin indicator
  const pinPrefix = note.isPinned ? "📌 " : "";
  lines.push(`### ${pinPrefix}${note.plainText || "Untitled Note"}`);

  // Metadata
  const metadata: string[] = [];

  if (note.assignedPeople.length > 0) {
    const names = note.assignedPeople.map((id) => `@${peopleMap.get(id) || id}`);
    metadata.push(`Assigned: ${names.join(", ")}`);
  }

  if (note.projects.length > 0) {
    const names = note.projects.map((id) => `%${projectsMap.get(id) || id}`);
    metadata.push(`Projects: ${names.join(", ")}`);
  }

  if (note.tags.length > 0) {
    metadata.push(`Tags: ${note.tags.map((t) => `#${t}`).join(", ")}`);
  }

  if (note.ageDisplay) {
    metadata.push(`Updated: ${note.ageDisplay}`);
  }

  if (metadata.length > 0) {
    lines.push(`*${metadata.join(" | ")}*`);
  }

  // Content
  if (note.content) {
    lines.push("");
    lines.push(note.content);
  }

  // Action items
  if (note.pendingActionItemCount > 0) {
    lines.push("");
    lines.push("**Action Items:**");
    note.actionItems.forEach((item) => {
      lines.push(`- [ ] ${item.plainText}`);
    });
  }

  return lines.join("\n");
}

/**
 * Export notes to CSV format
 */
export function exportNotesToCSV(
  notes: NoteModel[],
  peopleMap: Map<string, string> = new Map(),
  projectsMap: Map<string, string> = new Map(),
): string {
  const headers = [
    "Title",
    "Status",
    "Pinned",
    "Assigned",
    "Source",
    "Mentioned",
    "Projects",
    "Tags",
    "Content Preview",
    "Action Items",
    "Comments",
    "Created",
    "Updated",
  ];

  const rows: string[][] = [headers];

  notes.forEach((note) => {
    const assignedNames = note.assignedPeople.map((id) => peopleMap.get(id) || id);
    const sourceNames = note.sourcePeople.map((id) => peopleMap.get(id) || id);
    const mentionedNames = note.mentionedPeople.map((id) => peopleMap.get(id) || id);
    const projectNames = note.projects.map((id) => projectsMap.get(id) || id);

    rows.push([
      escapeCSV(note.plainText || "Untitled"),
      note.state,
      note.isPinned ? "Yes" : "No",
      assignedNames.join("; "),
      sourceNames.join("; "),
      mentionedNames.join("; "),
      projectNames.join("; "),
      note.tags.join("; "),
      escapeCSV(note.getContentPreview(100)),
      String(note.pendingActionItemCount),
      String(note.commentCount),
      note.createdAt ? new Date(note.createdAt).toISOString() : "",
      note.updatedAt ? new Date(note.updatedAt).toISOString() : "",
    ]);
  });

  return rows.map((row) => row.join(",")).join("\n");
}

/**
 * Export notes to JSON format
 */
export function exportNotesToJSON(
  notes: NoteModel[],
  peopleMap: Map<string, string> = new Map(),
  projectsMap: Map<string, string> = new Map(),
): string {
  const data = notes.map((note) => ({
    id: note.id,
    title: note.plainText,
    fullText: note.text,
    state: note.state,
    pinned: note.isPinned,
    content: note.content,
    metadata: {
      assignedPeople: note.assignedPeople.map((id) => ({
        id,
        name: peopleMap.get(id) || id,
      })),
      sourcePeople: note.sourcePeople.map((id) => ({
        id,
        name: peopleMap.get(id) || id,
      })),
      mentionedPeople: note.mentionedPeople.map((id) => ({
        id,
        name: peopleMap.get(id) || id,
      })),
      projects: note.projects.map((id) => ({
        id,
        name: projectsMap.get(id) || id,
      })),
      tags: note.tags,
    },
    actionItems: note.actionItems.map((item) => ({
      id: item.id,
      text: item.plainText,
      createdAt: item.createdAt,
    })),
    timestamps: {
      created: note.createdAt,
      updated: note.updatedAt,
      archived: note.archivedAt,
    },
    commentsCount: note.commentCount,
  }));

  return JSON.stringify({ notes: data, exportedAt: new Date().toISOString() }, null, 2);
}

/**
 * Export notes in the specified format
 */
export function exportNotes(
  notes: NoteModel[],
  format: ExportFormat,
  peopleMap: Map<string, string> = new Map(),
  projectsMap: Map<string, string> = new Map(),
  filename = "notes",
): void {
  let content: string;

  switch (format) {
    case "markdown":
      content = exportNotesToMarkdown(notes, peopleMap, projectsMap);
      break;
    case "csv":
      content = exportNotesToCSV(notes, peopleMap, projectsMap);
      break;
    case "json":
      content = exportNotesToJSON(notes, peopleMap, projectsMap);
      break;
    default:
      content = exportNotesToMarkdown(notes, peopleMap, projectsMap);
  }

  const mimeType = getMimeType(format);
  const extension = getFileExtension(format);
  const fullFilename = `${filename}.${extension}`;

  downloadFile(content, fullFilename, mimeType);
}
