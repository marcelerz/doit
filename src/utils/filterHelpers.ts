/**
 * Helper utilities for filter operations
 */

/**
 * Convert a Set to a sorted array
 * Common pattern used when extracting filter options from todos
 */
export function setToSortedArray<T>(set: Set<T>): T[] {
  return Array.from(set).sort();
}

/**
 * Check if an array contains any value from a Set
 * Used for filtering todos by metadata arrays (people, projects, tags, dependencies)
 */
export function arrayHasAnyFromSet<T>(array: T[], set: Set<T>): boolean {
  return array.some((item) => set.has(item));
}

/**
 * Check if a Set contains a specific value
 * Used for filtering todos by single metadata values (priority, dueDate, duration, recurring)
 */
export function setHasValue<T>(set: Set<T>, value: T | undefined): boolean {
  return value !== undefined && set.has(value);
}
