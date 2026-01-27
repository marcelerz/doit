import { PersonId } from "./person";
import { ProjectId } from "./project";
import { Tag } from "./todo";
import { Timestamp } from "./time";
import { ActivityEntry, Comment } from "./types";

// Unique branded type for Note IDs
export type NoteId = string & { readonly __brand: unique symbol };

// Unique branded type for ActionItem IDs
export type ActionItemId = string & { readonly __brand: unique symbol };

// Converts string id to NoteId type
export function getNoteId(id: string): NoteId {
  return id as NoteId;
}

// Converts string id to ActionItemId type
export function getActionItemId(id: string): ActionItemId {
  return id as ActionItemId;
}

// Main state of a note item
const _NOTE_STATES = ["active", "archived", "deleted"] as const;
export type NoteState = (typeof _NOTE_STATES)[number];

// Action item before conversion to todo (pending/editable)
export interface ActionItem {
  id: ActionItemId;
  text: string; // SmartInput text (with markers)
  plainText: string; // Plain text version
  createdAt: Timestamp;
}

// Action item after conversion to todo (read-only reference)
export interface CreatedActionItem {
  id: ActionItemId;
  todoId: string; // Reference to created todo (stored as string, cast to TodoId when needed)
  createdAt: Timestamp;
  convertedAt: Timestamp;
}

// Main note item interface
export interface Note {
  id: NoteId;

  // Input text
  text: string; // Title with markers (SmartInput)
  plainText: string; // Title without markers

  // State
  state: NoteState;

  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  archivedAt?: Timestamp;
  deletedAt?: Timestamp;

  // Content
  content: string; // Rich text "Note" field (main content)
  tags: Tag[];
  pinned: boolean;
  sortOrder?: number;

  // Relations
  assignedPeople: PersonId[];
  sourcePeople: PersonId[];
  mentionedPeople: PersonId[];
  projects: ProjectId[];

  // Action Items (meeting follow-ups)
  actionItems: ActionItem[];
  createdActionItems: CreatedActionItem[];

  comments: Comment[];
  activity: ActivityEntry<NoteActivityType>[];
}

// Activity types for note entries
export type NoteActivityType =
  | "created"
  | "edited"
  | "archived"
  | "unarchived"
  | "deleted"
  | "undeleted"
  | "pinned"
  | "unpinned"
  | "comment_added"
  | "comment_edited"
  | "comment_deleted"
  | "converted_to_todo"
  | "action_item_added"
  | "action_item_edited"
  | "action_item_deleted"
  | "action_items_converted"
  | "assigned_added"
  | "assigned_removed"
  | "source_added"
  | "source_removed"
  | "mentioned_added"
  | "mentioned_removed"
  | "project_added"
  | "project_removed"
  | "tag_added"
  | "tag_removed"
  | "content_changed";

/**
 * NoteMetadata - String-based editing interface for notes.
 *
 * This is used for:
 * 1. UI editing flow (user types names, not IDs)
 * 2. Token parsing from SmartInput (produces string values)
 * 3. Activity logging (tracks human-readable changes)
 *
 * Note: This is NOT stored on Note - it's converted to typed ID fields when saving.
 */
export interface NoteMetadata {
  assignedPeople: string[]; // @ marker - person names
  sourcePeople: string[]; // $ marker - person names
  mentionedPeople: string[]; // auto-detected (no marker) - person names
  projects: string[]; // % marker - project names
  tags?: string[]; // # marker - free-form tags
  content?: string; // Rich text content
}
