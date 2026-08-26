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

/**
 * Interface for entities with name and alternatives (Person, Project, Priority)
 */
interface NamedWithAlternatives {
  name: string;
  alternatives: string[];
}

/**
 * Find an entity by exact match on name or any alternative (case-insensitive)
 *
 * @param items - Array of items to search
 * @param input - Input string to match
 * @returns The first matching item, or undefined
 *
 * @example
 * const person = findByNameOrAlternatives(availablePeople, "john");
 * const project = findByNameOrAlternatives(availableProjects, "acme");
 */
export function findByNameOrAlternatives<T extends NamedWithAlternatives>(
  items: T[],
  input: string
): T | undefined {
  const lowerInput = input.toLowerCase();
  return items.find(
    (item) =>
      item.name.toLowerCase() === lowerInput ||
      item.alternatives.some((alt) => alt.toLowerCase() === lowerInput)
  );
}

/**
 * Filter entities by partial match on name or any alternative (case-insensitive)
 *
 * @param items - Array of items to search
 * @param search - Search string for partial matching
 * @returns Array of matching items
 *
 * @example
 * const filteredPeople = filterByNameOrAlternatives(availablePeople, "jo");
 * const filteredProjects = filterByNameOrAlternatives(availableProjects, "ac");
 */
export function filterByNameOrAlternatives<T extends NamedWithAlternatives>(
  items: T[],
  search: string
): T[] {
  if (search === "") return items;
  const lowerSearch = search.toLowerCase();
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerSearch) ||
      item.alternatives.some((alt) => alt.toLowerCase().includes(lowerSearch))
  );
}

/**
 * Whether two arrays hold the same values, regardless of order.
 *
 * Used to decide whether the current filter set still matches a saved preset.
 * Both view-state hooks had a byte-identical private copy of this.
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}
