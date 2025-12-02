export interface TodoMetadata {
  assignedPeople: string[]; // @ marker
  sourcePeople: string[]; // $ marker
  mentionedPeople: string[]; // ^ marker
  projects: string[]; // # marker
  priority?: string; // !! marker
  dueDate?: string; // ~ marker
  duration?: string; // * marker
  recurring?: string; // % marker
}

export interface Comment {
  commentId: number;
  history: CommentHistoryEntry[];
}

export interface CommentHistoryEntry {
  date: number;
  content: string;
}

export type TodoState = "active" | "completed" | "archived" | "deleted";

export interface Todo {
  id: string;
  text: string; // Full text with markers
  plainText: string; // Text without markers
  state: TodoState; // Current state of the todo
  createdAt: number;
  updatedAt?: number; // Timestamp when task was last updated
  completedAt?: number; // Timestamp when task was marked as completed
  archivedAt?: number; // Timestamp when task was archived
  deletedAt?: number; // Timestamp when task was deleted
  metadata: TodoMetadata;
  comments: Comment[];
}
