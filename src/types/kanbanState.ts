import { Color, getColor } from "./types";

// Unique branded type for KanbanState IDs
export type KanbanStateId = string & { readonly __brand: unique symbol };

// Represents an allowed state transition in the Kanban workflow
export interface AllowedTransition {
  fromStateId: KanbanStateId;
  toStateId: KanbanStateId;
}

// Converts string id to KanbanStateID type
export function getKanbanStateId(id: string): KanbanStateId {
  return id as KanbanStateId;
}

// Kanban Tab Settings
export interface KanbanState {
  id: KanbanStateId;
  name: string;
  color: Color;
  icon?: string; // emoji
  order: number;
  isSystem?: boolean; // System states (backlog, completed, archived) cannot be deleted
  mapsToTodoState?: "active" | "completed" | "archived"; // Maps to underlying TodoState
  wipLimit?: number; // Work-in-progress limit (undefined = no limit). Not applicable to system states.
}

// Default Kanban states
export const defaultKanbanStates: KanbanState[] = [
  {
    id: getKanbanStateId("backlog"),
    name: "Backlog",
    color: getColor("#94a3b8"),
    icon: "📥",
    order: 0,
    isSystem: true,
    mapsToTodoState: "active",
  },
  {
    id: getKanbanStateId("todo"),
    name: "To Do",
    color: getColor("#60a5fa"),
    icon: "📋",
    order: 1,
    mapsToTodoState: "active",
  },
  {
    id: getKanbanStateId("in-progress"),
    name: "In Progress",
    color: getColor("#fbbf24"),
    icon: "🔄",
    order: 2,
    mapsToTodoState: "active",
  },
  {
    id: getKanbanStateId("review"),
    name: "Review",
    color: getColor("#a78bfa"),
    icon: "👀",
    order: 3,
    mapsToTodoState: "active",
  },
  {
    id: getKanbanStateId("completed"),
    name: "Done",
    color: getColor("#4ade80"),
    icon: "✅",
    order: 4,
    isSystem: true,
    mapsToTodoState: "completed",
  },
  {
    id: getKanbanStateId("rejected"),
    name: "Rejected",
    color: getColor("#f87171"),
    icon: "🚫",
    order: 5,
    isSystem: true,
    mapsToTodoState: "completed",
  },
  {
    id: getKanbanStateId("archived"),
    name: "Archived",
    color: getColor("#9ca3af"),
    icon: "📦",
    order: 6,
    isSystem: true,
    mapsToTodoState: "archived",
  },
];
