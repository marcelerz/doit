/**
 * ID Generator Utility
 *
 * Generates universally unique identifiers (UUIDs) for all entities in the application.
 * Uses crypto.randomUUID() which is available in all modern browsers and Node.js 19+.
 *
 * This ensures IDs are:
 * - Truly unique (not dependent on timestamp collisions)
 * - Standard format (UUID v4)
 * - Suitable for distributed systems
 * - Prefixed for easy identification (e.g., "todo-xxx", "person-xxx")
 */

/**
 * Generate a UUID v4 string.
 * Uses the native crypto.randomUUID() API for secure random generation.
 *
 * @returns A UUID v4 string in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
  // Use native crypto.randomUUID() if available (modern browsers and Node.js 19+)
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback for older environments (should rarely be needed)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a prefixed UUID for easier identification in logs/debugging.
 * The prefix is separated by a hyphen for readability and consistency with UUID format.
 *
 * @param prefix - Optional prefix to add (e.g., "todo", "person", "sprint")
 * @returns A prefixed UUID string (e.g., "todo-a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5")
 */
export function generatePrefixedUUID(prefix?: string): string {
  const uuid = generateUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}

// ============================================================================
// PREFIXED ID GENERATORS
// These centralize ID creation for entity types that don't have models.
// For entity types with models (Todo, Person, Project, Sprint), use the
// static createId() method on the model class instead.
// ============================================================================

/**
 * Generate a prefixed ID for activity entries.
 * @returns An activity ID like "act-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function createActivityId(): string {
  return generatePrefixedUUID("act");
}

/**
 * Generate a prefixed ID for comments.
 * @returns A comment ID like "cmt-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function createCommentId(): string {
  return generatePrefixedUUID("cmt");
}

/**
 * Generate a prefixed ID for subtasks.
 * @returns A subtask ID like "sub-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function createSubtaskId(): string {
  return generatePrefixedUUID("sub");
}

/**
 * Generate a prefixed ID for time entries.
 * @returns A time entry ID like "time-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function createTimeEntryId(): string {
  return generatePrefixedUUID("time");
}

/**
 * Generate a prefixed ID for search history entries.
 * @returns A search history ID like "search-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function createSearchHistoryId(): string {
  return generatePrefixedUUID("search");
}

/**
 * Generate a prefixed ID for break periods.
 * @returns A break period ID like "break-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function createBreakPeriodId(): string {
  return generatePrefixedUUID("break");
}

/**
 * Generate a prefixed ID for time blocks.
 * @returns A time block ID like "block-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function createTimeBlockId(): string {
  return generatePrefixedUUID("block");
}

/**
 * Generate a prefixed ID for gantt presets.
 * @returns A gantt preset ID like "preset-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function createGanttPresetId(): string {
  return generatePrefixedUUID("preset");
}

/**
 * Generate a prefixed ID for view presets.
 * @returns A view preset ID like "view-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function createViewPresetId(): string {
  return generatePrefixedUUID("view");
}

/**
 * Generate a prefixed ID for sprints.
 * @returns A sprint ID like "sprint-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function createSprintId(): string {
  return generatePrefixedUUID("sprint");
}
