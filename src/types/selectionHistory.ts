/**
 * Selection History Types
 *
 * Tracks user selections for smart suggestions.
 * Stores a rolling queue of recent selections per field type.
 */

/**
 * Field types that can be tracked for selection history
 */
export type SelectionFieldType =
  | "assignedPeople"
  | "sourcePeople"
  | "mentionedPeople"
  | "projects"
  | "priorities"
  | "tags"
  | "dueDates"
  | "durations"
  | "recurring"
  | "sprints";

/**
 * A single selection entry with timestamp
 */
export interface SelectionEntry {
  value: string; // The actual selected value (name, not ID)
  timestamp: number; // When it was selected
}

/**
 * Selection history for all field types
 * Each field stores a queue of recent selections
 */
export interface SelectionHistory {
  assignedPeople: SelectionEntry[];
  sourcePeople: SelectionEntry[];
  mentionedPeople: SelectionEntry[];
  projects: SelectionEntry[];
  priorities: SelectionEntry[];
  tags: SelectionEntry[];
  dueDates: SelectionEntry[];
  durations: SelectionEntry[];
  recurring: SelectionEntry[];
  sprints: SelectionEntry[];
}

/**
 * Default empty selection history
 */
export const DEFAULT_SELECTION_HISTORY: SelectionHistory = {
  assignedPeople: [],
  sourcePeople: [],
  mentionedPeople: [],
  projects: [],
  priorities: [],
  tags: [],
  dueDates: [],
  durations: [],
  recurring: [],
  sprints: [],
};

/**
 * Maximum number of selections to keep per field type
 */
export const MAX_SELECTION_HISTORY = 100;
