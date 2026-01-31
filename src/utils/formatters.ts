/**
 * Shared formatting utilities for display purposes.
 * These functions were extracted from TodoModel, NoteModel, ReviewModel
 * to eliminate code duplication.
 */

/**
 * Format a timestamp as a date with time.
 * Output format: "1/15/2024 2:30 PM" (locale-dependent)
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string
 */
export function formatDateWithTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

/**
 * Format a timestamp as a relative age display.
 * Output: "just now", "X minutes ago", "X hours ago", "X days ago"
 *
 * @param createdAt - Unix timestamp in milliseconds
 * @returns Human-readable relative time string
 */
export function formatAgeDisplay(createdAt: number): string {
  const now = Date.now();
  const diff = now - createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  return "just now";
}

/**
 * Pluralize a word based on count.
 * Simple English pluralization that adds 's' for counts !== 1.
 *
 * @param count - The number to check
 * @param singular - The singular form of the word
 * @param plural - Optional custom plural form (defaults to singular + 's')
 * @returns The appropriate word form
 *
 * @example
 * pluralize(1, "person", "people") // "person"
 * pluralize(5, "person", "people") // "people"
 * pluralize(0, "tag") // "tags"
 * pluralize(1, "tag") // "tag"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/**
 * Format a count with its pluralized label.
 *
 * @param count - The number to display
 * @param singular - The singular form of the word
 * @param plural - Optional custom plural form (defaults to singular + 's')
 * @returns Formatted string like "1 person" or "5 people"
 *
 * @example
 * formatCount(1, "person", "people") // "1 person"
 * formatCount(5, "person", "people") // "5 people"
 * formatCount(0, "tag") // "0 tags"
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}

/**
 * Format activity timestamp as relative time (compact format).
 * Used in activity logs where space is limited.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Compact relative time string ("just now", "5m ago", "2h ago", "3d ago", or date)
 */
export function formatActivityTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
}

/**
 * Format activity timestamp as full date/time string.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Full locale date/time string
 */
export function formatActivityDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}
