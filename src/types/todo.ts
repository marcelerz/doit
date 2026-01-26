import { PersonId } from "./person";
import { PriorityId } from "./priority";
import { ProjectId } from "./project";
import { SprintId } from "./sprint";
import { DurationMin, DurationSec, Timestamp } from "./time";
import { ActivityEntry, Comment } from "./types";

// Unique branded type for Todo IDs
export type TodoId = string & { readonly __brand: unique symbol };

// Unique branded type for SubTask IDs
export type SubtaskId = string & { readonly __brand: unique symbol };

// Unique branded type for TimeEntry IDs
export type TimeEntryId = string & { readonly __brand: unique symbol };

// Unique branded type for Tags
export type Tag = string & { readonly __brand: unique symbol };

// Converts string id to TodoId type
export function getTodoId(id: string): TodoId {
  return id as TodoId;
}

// Converts string id to SubtaskId type
export function getSubtaskId(id: string): SubtaskId {
  return id as SubtaskId;
}

// Converts string id to TimeEntryId type
export function getTimeEntryId(id: string): TimeEntryId {
  return id as TimeEntryId;
}

// Converts string into Tag type
export function getTag(id: string): Tag {
  return id as Tag;
}

// Main todo item interface
export interface Todo {
  id: TodoId;

  // Input text
  text: string; // Full text with markers
  plainText: string; // Text without markers

  // States
  state: TodoState; // Current state of the todo
  workflowState?: string; // Kanban workflow state ID (e.g., "backlog", "in-progress", "review")

  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp; // Timestamp when task was last updated
  completedAt?: Timestamp; // Timestamp when task was marked as completed
  archivedAt?: Timestamp; // Timestamp when task was archived
  deletedAt?: Timestamp; // Timestamp when task was deleted

  // Fields
  context: string; // Rich text context
  tags: Tag[]; // # marker - free-form tags
  dependencies: TodoId[]; // via field (no marker)
  sprint?: SprintId; // Sprint ID for scrum planning
  sortOrder?: number; // Manual sort order (lower = higher priority)

  // Actual metadata fields
  assignedPeople: PersonId[]; // Actual assigned people
  sourcePeople: PersonId[]; // Actual source people
  mentionedPeople: PersonId[]; // Actual mentioned people
  projects: ProjectId[]; // Actual projects
  priority?: PriorityId; // Actual priority used
  dueDate?: Timestamp; // Actual due date timestamp
  duration?: DurationSec; // Actual duration used
  recurring?: string; // auto-detected or via field (~ pattern)
  recurringOriginId?: TodoId; // ID of the first task in the recurring chain
  recurringPreviousId?: TodoId; // ID of the task this one was created from

  comments: Comment[]; // Comments for todos
  activity: ActivityEntry<TodoActivityType>[]; // Activity log for the todo
  subtasks: Subtask[]; // Optional nested subtasks
  timeTracking?: TimeTracking; // Optional time tracking
}

// Main state of a todo item
const _TODO_STATES = ["active", "completed", "archived", "deleted"] as const;
export type TodoState = (typeof _TODO_STATES)[number];

/**
 * TodoMetadata - String-based editing interface for todos.
 *
 * This is used for:
 * 1. UI editing flow (user types names, not IDs)
 * 2. Token parsing from SmartInput (produces string values)
 * 3. Activity logging (tracks human-readable changes)
 *
 * Note: This is NOT stored on Todo - it's converted to typed ID fields when saving.
 */
export interface TodoMetadata {
  assignedPeople: string[]; // @ marker - person names
  sourcePeople: string[]; // $ marker - person names
  mentionedPeople: string[]; // auto-detected (no marker) - person names
  projects: string[]; // % marker - project names
  priority?: string; // !! marker - priority name
  dueDate?: string; // auto-detected or via field - date string like "tomorrow", "2025-12-15"
  duration?: string; // auto-detected or via field - duration string like "2h", "30m"
  recurring?: string; // auto-detected or via field (~ pattern)
  tags?: string[]; // # marker - free-form tags
  dependencies?: string[]; // via field (no marker) - todo IDs as strings
  sprint?: string; // Sprint ID for scrum planning
  context?: string; // Rich text context
}

// Activity types for entries
export type TodoActivityType =
  | "created" // Todo created
  | "completed" // Todo marked as completed
  | "uncompleted" // Todo marked as active again
  | "archived" // Todo archived
  | "unarchived" // Todo unarchived
  | "deleted" // Todo deleted
  | "undeleted" // Todo restored from deleted
  | "edited" // Todo text edited
  | "comment_added" // Comment added
  | "comment_edited" // Comment edited
  | "comment_deleted" // Comment deleted
  | "assigned_added" // Assigned person added
  | "assigned_removed" // Assigned person removed
  | "source_added" // Source person added
  | "source_removed" // Source person removed
  | "mentioned_added" // Mentioned person added
  | "mentioned_removed" // Mentioned person removed
  | "project_added" // Project added
  | "project_removed" // Project removed
  | "priority_changed" // Priority changed
  | "priority_removed" // Priority removed
  | "duedate_changed" // Due date changed
  | "duedate_removed" // Due date removed
  | "duration_changed" // Duration changed
  | "duration_removed" // Duration removed
  | "recurring_changed" // Recurring changed
  | "recurring_removed" // Recurring removed
  | "dependency_added" // Dependency added
  | "dependency_removed" // Dependency removed
  | "tag_added" // Tag added
  | "tag_removed" // Tag removed
  | "context_changed" // Context changed
  | "workflow_state_changed"; // Workflow state changed

export interface Subtask {
  id: SubtaskId;
  text: string;
  completed: boolean;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// Time tracking for tasks
export interface TimeEntry {
  id: TimeEntryId;
  startTime: Timestamp;
  endTime?: Timestamp; // undefined if currently tracking
  duration?: DurationMin; // in minutes, calculated when stopped
  note?: string;
}

export interface TimeTracking {
  entries: TimeEntry[];
  totalMinutes: DurationMin; // Cached total for performance
}
