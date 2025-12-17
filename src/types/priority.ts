import { Color } from "./types";

// Unique branded type for Priority IDs
export type PriorityId = string & { readonly __brand: unique symbol };

// Converts string id to PriorityID type
export function getPriorityId(id: string): PriorityId {
  return id as PriorityId;
}

// Priority entity representing different priority levels
export interface Priority {
  id: PriorityId;
  name: string;
  alternatives: string[];
  color?: Color; // Optional - defaults to marker color if not set
  order: number; // Lower number = higher priority
  archived?: boolean; // Will always be archived, not deleted
}

export const defaultPriorities: Priority[] = [
  {
    id: getPriorityId("1"),
    name: "urgent",
    alternatives: ["asap", "critical"],
    order: 1,
  },
  { id: getPriorityId("2"), name: "high", alternatives: [], order: 2 },
  {
    id: getPriorityId("3"),
    name: "medium",
    alternatives: ["normal", "med"],
    order: 3,
  },
  { id: getPriorityId("4"), name: "low", alternatives: [], order: 4 },
];
