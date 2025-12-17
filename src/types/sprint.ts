import { Color } from "./types";

// Unique branded type for Sprint IDs
export type SprintId = string & { readonly __brand: unique symbol };

// Converts string id to SprintID type
export function getSprintId(id: string): SprintId {
  return id as SprintId;
}

// Sprint Settings for Scrum planning
export type SprintStatus = "planning" | "active" | "completed" | "cancelled";
export type SprintState = "active" | "archived";

export interface Sprint {
  id: SprintId;
  name: string;
  goal?: string; // Sprint goal description
  color?: Color; // Optional - defaults to marker color if not set
  durationDays: number; // Sprint duration in days
  plannedStartDate?: string; // Planned start date (ISO date string)
  actualStartDate?: string; // Actual start date when sprint was started
  actualEndDate?: string; // Actual end date when sprint was completed/cancelled
  status: SprintStatus;
  state: SprintState; // For archiving sprints
  createdAt: number;
  startedAt?: number; // Timestamp when sprint was started
  completedAt?: number; // Timestamp when sprint was completed
  cancelledAt?: number; // Timestamp when sprint was cancelled
  archivedAt?: number; // Timestamp when sprint was archived
  comments: Array<{
    commentId: number;
    history: Array<{ date: number; content: string }>;
  }>;
  activity: Array<{
    id: string;
    timestamp: number;
    type:
      | "created"
      | "edited"
      | "updated"
      | "archived"
      | "unarchived"
      | "comment_added"
      | "comment_edited"
      | "comment_deleted"
      | "started"
      | "completed"
      | "cancelled";
    description: string;
  }>;
}

// Search history
export interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: number;
}
