import { ProjectId } from "./project";
import { Tag } from "./todo";
import { Timestamp } from "./time";
import { ActivityEntry, Comment } from "./types";

// Unique branded type for Review IDs
export type ReviewId = string & { readonly __brand: unique symbol };

// Converts string id to ReviewId type
export function getReviewId(id: string): ReviewId {
  return id as ReviewId;
}

// Main state of a review item
const _REVIEW_STATES = ["pending", "completed", "archived", "deleted"] as const;
export type ReviewState = (typeof _REVIEW_STATES)[number];

// Review period levels
const _REVIEW_LEVELS = ["day", "week", "month", "half", "year"] as const;
export type ReviewLevel = (typeof _REVIEW_LEVELS)[number];

// Task entry embedded in a review (copied at creation time)
export interface ReviewTaskEntry {
  type: "task";
  todoId: string; // Reference to original todo (may not exist anymore)
  title: string; // Copied at creation
  completedAt: Timestamp;
  content: string; // Optional rich text notes
  collapsed: boolean;
}

// Child review entry embedded in a review (copied at creation time)
export interface ReviewChildEntry {
  type: "review";
  reviewId: string; // Reference to child review
  title: string; // Copied title
  level: ReviewLevel;
  content: string; // Summary copied from child
  collapsed: boolean;
}

// Union type for all review entry types
export type ReviewEntry = ReviewTaskEntry | ReviewChildEntry;

// Main review item interface
export interface Review {
  id: ReviewId;
  level: ReviewLevel;
  periodStart: string; // ISO date string (YYYY-MM-DD)
  periodEnd: string; // ISO date string (YYYY-MM-DD)
  periodLabel: string; // e.g., "Week 3, 2025" or "January 2025"

  state: ReviewState;

  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  completedAt?: Timestamp;
  archivedAt?: Timestamp;
  deletedAt?: Timestamp;

  // Content
  title: string; // User-editable title (defaults to periodLabel)
  summary: string; // Rich text summary

  // Entries (tasks and child reviews)
  entries: ReviewEntry[];

  // Metadata
  projects: ProjectId[];
  tags: Tag[];

  // Collaboration
  comments: Comment[];
  activity: ActivityEntry<ReviewActivityType>[];
}

// Activity types for review entries
export type ReviewActivityType =
  | "created"
  | "edited"
  | "completed"
  | "archived"
  | "unarchived"
  | "deleted"
  | "undeleted"
  | "comment_added"
  | "comment_edited"
  | "comment_deleted"
  | "entry_added"
  | "entry_removed"
  | "entry_edited"
  | "entry_collapsed"
  | "entry_expanded"
  | "project_added"
  | "project_removed"
  | "tag_added"
  | "tag_removed"
  | "summary_changed"
  | "title_changed";
