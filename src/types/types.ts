import { Timestamp } from "./time";

// Unique branded type for Color
export type Color = string & { readonly __brand: unique symbol };

// Converts string into Color type
export function getColor(value: string): Color {
  return value as Color;
}

// Unique branded type for ActivityId
export type ActivityId = string & { readonly __brand: unique symbol };

// Converts string into ActivityId type
export function getActivityId(id: string): ActivityId {
  return id as ActivityId;
}

// Unique branded type for CommentId
export type CommentId = string & { readonly __brand: unique symbol };

// Converts string into CommentId type
export function getCommentId(id: string): CommentId {
  return id as CommentId;
}

// Unique branded type for SearchHistoryId
export type SearchHistoryId = string & { readonly __brand: unique symbol };

// Converts string into SearchHistoryId type
export function getSearchHistoryId(id: string): SearchHistoryId {
  return id as SearchHistoryId;
}

// Comments item
export interface Comment {
  commentId: CommentId;
  history: CommentHistoryEntry[];
}

// History entry for comments
export interface CommentHistoryEntry {
  timestamp: Timestamp;
  content: string; // Comment content
}

// Activity log entry
export interface ActivityEntry<AT> {
  id: ActivityId;
  timestamp: Timestamp;
  type: AT;
  description: string;
  metadata?: Record<string, unknown>; // Optional metadata for the activity
}

// Search history
export interface SearchHistoryEntry {
  id: SearchHistoryId;
  query: string;
  timestamp: Timestamp;
}
