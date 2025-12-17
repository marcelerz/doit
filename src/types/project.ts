import { ActivityEntry, Color, getColor } from "./types";

// Unique branded type for Project IDs
export type ProjectId = string & { readonly __brand: unique symbol };

// Converts string id to ProjectID type
export function getProjectId(id: string): ProjectId {
  return id as ProjectId;
}

// Unique branded type for Project Category IDs
export type ProjectCategoryId = string & { readonly __brand: unique symbol };

// Converts string id to ProjectCategoryId type
export function getProjectCategoryId(id: string): ProjectCategoryId {
  return id as ProjectCategoryId;
}

// Project categories for organizing work types (e.g., "Office", "Private", "Client A")
export interface ProjectCategory {
  id: ProjectCategoryId;
  name: string;
  color: Color;
  description?: string;
}

// Default project categories
export const defaultCategories: ProjectCategory[] = [
  {
    id: getProjectCategoryId("work"),
    name: "Work",
    color: getColor("#3b82f6"),
    description: "Office and work-related tasks",
  },
  {
    id: getProjectCategoryId("personal"),
    name: "Personal",
    color: getColor("#22c55e"),
    description: "Personal and home tasks",
  },
];

export interface Project {
  id: ProjectId;
  name: string;
  alternatives: string[];
  color?: Color; // Optional - defaults to marker color if not set
  context?: string; // Rich text context
  comments: Comment[];
  activity: ActivityEntry<ProjectActivityType>[];
  archived?: boolean;
  category?: ProjectCategoryId; // Category ID - links to ProjectCategory
}

// Activity types for entries
export type ProjectActivityType =
  | "created"
  | "edited"
  | "archived"
  | "unarchived"
  | "deleted"
  | "comment_added"
  | "comment_edited"
  | "comment_deleted";
