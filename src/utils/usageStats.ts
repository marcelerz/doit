/**
 * Usage statistics utilities for sorting by frequency.
 *
 * For tracking user selections, use the useSelectionHistory hook instead.
 */

/**
 * Get top N most used items from a frequency map
 */
export function getTopUsed(usageMap: Map<string, number>, limit: number = 10): string[] {
  return Array.from(usageMap.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .slice(0, limit)
    .map((entry) => entry[0]);
}

/**
 * Sort items by usage frequency (highest first)
 */
export function sortByUsage<T extends { name: string }>(items: T[], usageMap: Map<string, number>): T[] {
  return [...items].sort((a, b) => {
    const aScore = usageMap.get(a.name) || 0;
    const bScore = usageMap.get(b.name) || 0;
    if (aScore !== bScore) {
      return bScore - aScore; // Higher score first
    }
    // If scores are equal, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort simple string items by usage frequency
 */
export function sortStringsByUsage(items: string[], usageMap: Map<string, number>): string[] {
  return [...items].sort((a, b) => {
    const aScore = usageMap.get(a) || 0;
    const bScore = usageMap.get(b) || 0;
    if (aScore !== bScore) {
      return bScore - aScore; // Higher score first
    }
    // If scores are equal, sort alphabetically
    return a.localeCompare(b);
  });
}
