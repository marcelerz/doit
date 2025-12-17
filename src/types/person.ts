import { ActivityEntry, Color } from "./types";

// Unique branded type for Person IDs
export type PersonId = string & { readonly __brand: unique symbol };

// Converts string id to PersonID type
export function getPersonId(id: string): PersonId {
  return id as PersonId;
}

// Person entity representing individuals associated with tasks/projects
export interface Person {
  id: PersonId;
  name: string;
  alternatives: string[];
  color?: Color; // Optional - defaults to marker color if not set
  context?: string; // Rich text context
  comments: Comment[];
  activity: ActivityEntry<PersonActivityType>[];
  archived?: boolean;
}

// Activity types for entries
export type PersonActivityType =
  | "created"
  | "edited"
  | "archived"
  | "unarchived"
  | "deleted"
  | "comment_added"
  | "comment_edited"
  | "comment_deleted";
