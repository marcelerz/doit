/**
 * Shared activity utilities for creating activity log entries.
 * These functions were extracted from activityLogger.ts, useNotes.ts, useReviews.ts
 * to eliminate code duplication.
 */

import { ActivityEntry, getActivityId, ActivityId } from "@/types/types";
import { getTimestamp } from "@/types/time";
import { createActivityId } from "@/utils/idGenerator";

/**
 * Generate a unique ID for an activity entry.
 *
 * Delegates to createActivityId, so every activity entry in the app gets the
 * same "act-<uuid>" shape as every other id. The previous timestamp format
 * justified itself by "chronological ordering and simple sorting by ID", but
 * nothing sorts by activity id -- Activity.tsx sorts the timeline by
 * timestamp, and the id is only ever a React key.
 *
 * @returns A branded ActivityId
 */
export function generateActivityId(): ActivityId {
  return getActivityId(createActivityId());
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

