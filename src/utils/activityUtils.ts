/**
 * Shared activity utilities for creating activity log entries.
 * These functions were extracted from activityLogger.ts, useNotes.ts, useReviews.ts
 * to eliminate code duplication.
 */

import { ActivityEntry, getActivityId, ActivityId } from "@/types/types";
import { getTimestamp, Timestamp } from "@/types/time";

/**
 * Generate a unique ID for an activity entry.
 * Format: "activity_{timestamp}_{random9chars}"
 *
 * This uses a timestamp-based ID (rather than UUID) for chronological ordering
 * and to enable simple sorting of activities by their ID.
 *
 * @returns A branded ActivityId
 */
export function generateActivityId(): ActivityId {
  return getActivityId(`activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
}

/**
 * Create a new activity entry with the current timestamp.
 *
 * @param type - The activity type (e.g., "created", "edited", "deleted")
 * @param description - Human-readable description of the activity
 * @param metadata - Optional additional metadata to attach to the activity
 * @returns A fully populated ActivityEntry
 *
 * @example
 * createActivityEntry("created", "Note created")
 * createActivityEntry("edited", "Title updated", { oldTitle: "Old", newTitle: "New" })
 */
export function createActivityEntry<AT>(
  type: AT,
  description: string,
  metadata?: Record<string, unknown>
): ActivityEntry<AT> {
  return {
    id: generateActivityId(),
    timestamp: getTimestamp(Date.now()),
    type,
    description,
    metadata,
  };
}

/**
 * Create a new activity entry with a specific timestamp.
 * Useful when the activity needs to be backdated or synchronized.
 *
 * @param type - The activity type
 * @param description - Human-readable description
 * @param timestamp - The timestamp to use for the activity
 * @param metadata - Optional additional metadata
 * @returns A fully populated ActivityEntry with the specified timestamp
 */
export function createActivityEntryWithTimestamp<AT>(
  type: AT,
  description: string,
  timestamp: Timestamp,
  metadata?: Record<string, unknown>
): ActivityEntry<AT> {
  return {
    id: generateActivityId(),
    timestamp,
    type,
    description,
    metadata,
  };
}
