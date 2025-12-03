/**
 * Color utility functions for consistent color generation and manipulation
 */

/**
 * Generate a consistent color for a person based on their name
 */
export function getPersonColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 85%)`;
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

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
