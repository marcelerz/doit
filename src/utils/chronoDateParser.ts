/**
 * Chrono-based date parser for natural language date detection
 * Detects dates in text without requiring markers
 * Augmented with custom shorthand dates (eod, morning, bow, etc.)
 */

import * as chrono from "chrono-node";
import { DateTimeSettings, WorkHoursSettings } from "@/types/settings";
import { parseShorthand } from "./dateParser";

export interface DetectedDate {
  text: string; // The text that was matched (e.g., "tomorrow at 3pm")
  start: number; // Start index in the original text
  end: number; // End index in the original text
  date: Date; // The parsed date
  timestamp: number; // Unix timestamp
}

// Custom shorthand patterns that we support
const CUSTOM_SHORTHANDS = [
  // Time of day
  "morning",
  "noon",
  "afternoon",
  "evening",
  // Day boundaries
  "bod",
  "eod",
  "startofday",
  "endofday",
  // Week boundaries
  "bow",
  "eow",
  "startofweek",
  "endofweek",
  // Month boundaries
  "bom",
  "eom",
  "startofmonth",
  "endofmonth",
  // Quarter boundaries
  "boq",
  "eoq",
  "startofquarter",
  "endofquarter",
  // Half-year boundaries
  "boh",
  "eoh",
  "startofhalf",
  "endofhalf",
  // Year boundaries
  "boy",
  "eoy",
  "startofyear",
  "endofyear",
];

/**
 * Detect custom shorthand dates in text that chrono doesn't recognize
 */
function detectCustomShorthands(
  text: string,
  dateTimeSettings?: DateTimeSettings,
  workHoursSettings?: WorkHoursSettings,
): DetectedDate[] {
  if (!dateTimeSettings || !workHoursSettings) {
    return [];
  }

  const results: DetectedDate[] = [];
  const lowerText = text.toLowerCase();

  for (const shorthand of CUSTOM_SHORTHANDS) {
    // Find all occurrences of this shorthand (as whole words)
    const regex = new RegExp(`\\b${shorthand}\\b`, "gi");
    let match;

    while ((match = regex.exec(text)) !== null) {
      const parsed = parseShorthand(shorthand, dateTimeSettings, workHoursSettings);
      if (parsed) {
        results.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          date: parsed,
          timestamp: parsed.getTime(),
        });
      }
    }
  }

  return results;
}

/**
 * Detect all dates in a text string using chrono-node + custom shorthands
 * Returns dates sorted by position in text
 */
export function detectDatesInText(
  text: string,
  referenceDate: Date = new Date(),
  dateTimeSettings?: DateTimeSettings,
  workHoursSettings?: WorkHoursSettings,
): DetectedDate[] {
  // Use chrono's casual parser for more flexible parsing
  const chronoResults = chrono.parse(text, referenceDate, { forwardDate: true });

  const chronoDates: DetectedDate[] = chronoResults.map((result) => ({
    text: result.text,
    start: result.index,
    end: result.index + result.text.length,
    date: result.start.date(),
    timestamp: result.start.date().getTime(),
  }));

  // Add custom shorthand dates
  const customDates = detectCustomShorthands(text, dateTimeSettings, workHoursSettings);

  // Combine and deduplicate (chrono might catch some of our shortcuts)
  const allDates = [...chronoDates, ...customDates];

  // Remove overlapping dates (keep the first one at each position)
  const deduped: DetectedDate[] = [];
  for (const date of allDates) {
    const overlaps = deduped.some((existing) => !(date.end <= existing.start || date.start >= existing.end));
    if (!overlaps) {
      deduped.push(date);
    }
  }

  // Sort by position in text
  return deduped.sort((a, b) => a.start - b.start);
}

/**
 * Get the first detected date from text
 */
export function getFirstDetectedDate(
  text: string,
  referenceDate: Date = new Date(),
  dateTimeSettings?: DateTimeSettings,
  workHoursSettings?: WorkHoursSettings,
): DetectedDate | null {
  const dates = detectDatesInText(text, referenceDate, dateTimeSettings, workHoursSettings);
  return dates.length > 0 ? dates[0] : null;
}

/**
 * Format detected date for display
 */
export function formatDetectedDate(detectedDate: DetectedDate): string {
  const date = detectedDate.date;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Convert detected date to ISO format string (yyyy-MM-ddTHH:mm) using local time
 */
export function detectedDateToISO(detectedDate: DetectedDate): string {
  const date = detectedDate.date;
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Check if a position in text overlaps with any detected date
 */
export function isPositionInDate(position: number, dates: DetectedDate[]): boolean {
  return dates.some((date) => position >= date.start && position < date.end);
}

/**
 * Get the date at a specific position in text
 */
export function getDateAtPosition(position: number, dates: DetectedDate[]): DetectedDate | null {
  return dates.find((date) => position >= date.start && position < date.end) || null;
}
