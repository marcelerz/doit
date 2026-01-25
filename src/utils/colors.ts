/**
 * Color utility functions for consistent color generation and manipulation
 */

/**
 * Get person color, using custom color if provided or defaulting to marker color
 */
export function getPersonColor(color?: string): string {
  return color || "#cce5ff"; // Default to "assigned" marker color
}

/**
 * Get project color from marker colors or generate default
 */
export function getProjectColor(color?: string): string {
  return color || "#e2ccff";
}

/**
 * Get priority color from marker colors or generate default
 */
export function getPriorityColor(color?: string): string {
  return color || "#ffcccc";
}

/**
 * Find person color by name from a list of people
 */
export function findPersonColor(
  name: string,
  people: Array<{ name: string; alternatives: string[]; color?: string }>,
  fallbackColor: string,
): string {
  const person = people.find((p) => p.name === name || p.alternatives.includes(name));
  return person?.color || fallbackColor;
}

/**
 * Find project color by name from a list of projects
 */
export function findProjectColor(
  name: string,
  projects: Array<{ name: string; alternatives: string[]; color?: string }>,
  fallbackColor: string,
): string {
  const project = projects.find((p) => p.name === name || p.alternatives.includes(name));
  return project?.color || fallbackColor;
}

/**
 * Find priority color by name from a list of priorities
 */
export function findPriorityColor(
  name: string,
  priorities: Array<{ name: string; alternatives: string[]; color?: string }>,
  fallbackColor: string,
): string {
  const priority = priorities.find((p) => p.name === name || p.alternatives.includes(name));
  return priority?.color || fallbackColor;
}

/**
 * Determine text color (black or white) based on background luminance
 */
export function getTextColor(backgroundColor: string): string {
  if (!backgroundColor) return "#000000";

  let hex = backgroundColor;

  // Handle hsl() format
  if (backgroundColor.startsWith("hsl(")) {
    // For hsl colors, we'll use a simple heuristic based on lightness
    const match = backgroundColor.match(/hsl\(\s*\d+\s*,\s*\d+%\s*,\s*(\d+)%\s*\)/);
    if (match) {
      const lightness = parseInt(match[1]);
      return lightness > 50 ? "#000000" : "#FFFFFF";
    }
    return "#000000";
  }

  // Handle hex colors
  hex = hex.replace("#", "");

  // Handle shorthand hex
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Handle invalid hex values that return NaN
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return "#000000";
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
