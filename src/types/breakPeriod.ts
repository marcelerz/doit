import { ProjectCategoryId } from "./project";
import { ShortTime } from "./time";
import { TimeBlockId } from "./timeBlock";
import { Color } from "./types";

// Unique branded type for BreakPeriod IDs
export type BreakPeriodId = string & { readonly __brand: unique symbol };

// Converts string id to BreakPeriodID type
export function getBreakPeriodId(id: string): BreakPeriodId {
  return id as BreakPeriodId;
}

export interface BreakPeriod {
  id: BreakPeriodId;
  name: string;
  startTime: ShortTime; // e.g., "12:00"
  endTime: ShortTime; // e.g., "13:00"
  blockType?: TimeBlockId; // Type of block (break, meeting, focus, etc.)
  color?: Color; // Custom color override (if not set, uses blockType color)
  allowedCategories?: ProjectCategoryId[]; // Category IDs - only schedule tasks from these categories during this block
}
