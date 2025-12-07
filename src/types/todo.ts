export interface TodoMetadata {
  assignedPeople: string[]; // @ marker
  sourcePeople: string[]; // $ marker
  mentionedPeople: string[]; // auto-detected (no marker)
  projects: string[]; // % marker
  priority?: string; // !! marker
  dueDate?: string; // auto-detected or via field
  duration?: string; // auto-detected or via field
  recurring?: string; // auto-detected or via field (~ pattern)
  dependencies: string[]; // via field (no marker)
  context?: string; // Rich text context
  tags: string[]; // # marker - free-form tags
}

export interface Comment {
  commentId: number;
  history: CommentHistoryEntry[];
}

export interface CommentHistoryEntry {
  date: number;
  content: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: number;
  type:
    | "created"
    | "completed"
    | "uncompleted"
    | "archived"
    | "unarchived"
    | "deleted"
    | "undeleted"
    | "edited"
    | "comment_added"
    | "comment_edited"
    | "comment_deleted"
    | "assigned_added"
    | "assigned_removed"
    | "source_added"
    | "source_removed"
    | "mentioned_added"
    | "mentioned_removed"
    | "project_added"
    | "project_removed"
    | "priority_changed"
    | "priority_removed"
    | "duedate_changed"
    | "duedate_removed"
    | "duration_changed"
    | "duration_removed"
    | "recurring_changed"
    | "recurring_removed"
    | "dependency_added"
    | "dependency_removed"
    | "tag_added"
    | "tag_removed"
    | "context_changed"
    | "workflow_state_changed";
  description: string;
  metadata?: any; // Optional metadata for the activity
}

export type TodoState = "active" | "completed" | "archived" | "deleted";

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface Todo {
  id: string;
  text: string; // Full text with markers
  plainText: string; // Text without markers
  state: TodoState; // Current state of the todo
  workflowState?: string; // Kanban workflow state ID (e.g., "backlog", "in-progress", "review")
  createdAt: number;
  updatedAt?: number; // Timestamp when task was last updated
  completedAt?: number; // Timestamp when task was marked as completed
  archivedAt?: number; // Timestamp when task was archived
  deletedAt?: number; // Timestamp when task was deleted
  sortOrder?: number; // Manual sort order (lower = higher priority)
  metadata: TodoMetadata;
  comments: Comment[];
  activity: ActivityEntry[];
  subtasks?: Subtask[]; // Optional nested subtasks
  timeTracking?: TimeTracking; // Optional time tracking
}

// Time tracking for tasks
export interface TimeEntry {
  id: string;
  startTime: number;
  endTime?: number; // undefined if currently tracking
  duration?: number; // in minutes, calculated when stopped
  note?: string;
}

export interface TimeTracking {
  entries: TimeEntry[];
  totalMinutes: number; // Cached total for performance
}

// Task templates for recurring patterns
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  text: string;
  plainText: string;
  metadata: Partial<TodoMetadata>;
  subtasks?: string[]; // Subtask texts to create
  createdAt: number;
  usageCount: number;
}

// Search history
export interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: number;
}
