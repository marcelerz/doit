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

/**
 * Format duration in minutes to a readable string (e.g., "2h 30m", "45m")
 * Used by: SprintProgress, TimeTracking, TodoModel, ganttViewUtils
 *
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number): string {
  if (minutes === 0) return "0m";
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Format seconds to MM:SS or HH:MM:SS display
 * Used by: FocusView, OpenFocusView for timer display
 *
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "5:23" or "1:05:23")
 */
export function formatTime(seconds: number): string {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const hrs = Math.floor(absSeconds / 3600);
  const mins = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  const timeStr =
    hrs > 0
      ? `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      : `${mins}:${secs.toString().padStart(2, "0")}`;

  return isNegative ? `-${timeStr}` : timeStr;
}

/**
 * Format elapsed time in seconds to HH:MM:SS (always includes hours if > 0)
 * Used by: TimeTracking for active timer display
 *
 * @param seconds - Elapsed time in seconds
 * @returns Formatted elapsed time string
 */
export function formatElapsed(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format Date to clock time (e.g., "9:53 AM")
 * Used by: FocusView, OpenFocusView for break end times
 *
 * @param date - Date to format
 * @returns Formatted clock time string
 */
export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

