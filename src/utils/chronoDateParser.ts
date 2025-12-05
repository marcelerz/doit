/**
 * Chrono-based date parser for natural language date detection
 * Detects dates in text without requiring markers
 * Augmented with custom shorthand dates (eod, morning, bow, etc.)
 */

import * as chrono from "chrono-node";
import { DateTimeSettings, WorkHoursSettings } from "@/types/settings";
import { parseShorthand } from "./dateParser";
import { parseRecurringPattern, calculateNextOccurrence, RecurringPattern } from "./recurringParser";

export interface DetectedDate {
  text: string; // The text that was matched (e.g., "tomorrow at 3pm")
  start: number; // Start index in the original text
  end: number; // End index in the original text
  date: Date; // The parsed date
  timestamp: number; // Unix timestamp
  endDate?: Date; // For ranges: the end date
  endTimestamp?: number; // For ranges: the end timestamp
  durationMinutes?: number; // For ranges: calculated duration in minutes
  recurring?: RecurringPattern; // For recurring patterns: the parsed pattern
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
 * Detect recurring patterns in text starting with "every"
 * Returns pattern with first due date derived from the pattern
 */
function detectRecurringPatterns(text: string, referenceDate: Date = new Date()): DetectedDate[] {
  console.log("🔁 [Recurring Patterns] Scanning text:", text);
  const results: DetectedDate[] = [];

  // Pattern: "every <pattern>" where pattern can be:
  // - "day", "2 days", "week", "3 weeks", etc.
  // - "monday", "tuesday", etc.
  // - "first monday", "2nd tuesday", "last friday", etc.
  // - "workday"

  const regex =
    /\bevery\s+(?:(\d+)\s+)?(day|week|month|quarter|half|year|workday|sunday|monday|tuesday|wednesday|thursday|friday|saturday)s?\b|\bevery\s+(1st|2nd|3rd|4th|5th|last|first|second|third|fourth|fifth)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    const patternStart = match.index;
    const patternEnd = patternStart + fullMatch.length;

    // Extract just the pattern part (remove "every ")
    const patternText = fullMatch.replace(/^every\s+/i, "");

    // Try to parse it
    const pattern = parseRecurringPattern(`every ${patternText}`);

    if (pattern) {
      console.log(`  ✅ Found recurring pattern "${fullMatch}" at position ${patternStart}-${patternEnd}`);
      console.log(`     Pattern:`, pattern);

      // Calculate first occurrence from reference date
      const firstDate = calculateNextOccurrence(pattern, referenceDate);
      console.log(`     First occurrence: ${firstDate.toLocaleString()}`);

      results.push({
        text: fullMatch,
        start: patternStart,
        end: patternEnd,
        date: firstDate,
        timestamp: firstDate.getTime(),
        recurring: pattern,
      });
    } else {
      console.log(`  ⚠️ Could not parse pattern: "${fullMatch}"`);
    }
  }

  console.log(`🔁 [Recurring Patterns] Found ${results.length} recurring patterns`);
  return results;
}

/**
 * Detect custom shorthand dates in text that chrono doesn't recognize
 */
function detectCustomShorthands(
  text: string,
  dateTimeSettings?: DateTimeSettings,
  workHoursSettings?: WorkHoursSettings,
): DetectedDate[] {
  if (!dateTimeSettings || !workHoursSettings) {
    console.log("🔍 [Custom Shorthands] No settings provided, skipping custom detection");
    return [];
  }

  console.log("🔍 [Custom Shorthands] Scanning text:", text);
  const results: DetectedDate[] = [];
  const lowerText = text.toLowerCase();

  for (const shorthand of CUSTOM_SHORTHANDS) {
    // Find all occurrences of this shorthand (as whole words)
    const regex = new RegExp(`\\b${shorthand}\\b`, "gi");
    let match;

    while ((match = regex.exec(text)) !== null) {
      const parsed = parseShorthand(shorthand, dateTimeSettings, workHoursSettings);
      if (parsed) {
        console.log(`  ✅ Found shorthand "${match[0]}" at position ${match.index}-${match.index + match[0].length}`, {
          parsedDate: parsed.toISOString(),
          localDate: parsed.toLocaleString(),
        });
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

  console.log(`🔍 [Custom Shorthands] Found ${results.length} custom dates`);
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
  console.log("\n🔍 [detectDatesInText] Starting date detection");
  console.log("📝 Input text:", text);
  console.log("📅 Reference date:", referenceDate.toLocaleString());

  // Use chrono's casual parser for more flexible parsing
  const chronoResults = chrono.parse(text, referenceDate, { forwardDate: true });

  console.log(`\n🤖 [Chrono] Found ${chronoResults.length} dates`);
  if (chronoResults.length > 0) {
    chronoResults.forEach((result, index) => {
      console.log(`  ${index + 1}. "${result.text}" at position ${result.index}-${result.index + result.text.length}`);
      console.log(`     → Date: ${result.start.date().toLocaleString()}`);
      console.log(`     → ISO: ${result.start.date().toISOString()}`);
      if (result.end) {
        const durationMs = result.end.date().getTime() - result.start.date().getTime();
        const durationMins = Math.floor(durationMs / 60000);
        console.log(`     → End: ${result.end.date().toLocaleString()}`);
        console.log(`     → Duration: ${durationMins} minutes`);
      }
    });
  }

  const chronoDates: DetectedDate[] = chronoResults.map((result) => {
    const detected: DetectedDate = {
      text: result.text,
      start: result.index,
      end: result.index + result.text.length,
      date: result.start.date(),
      timestamp: result.start.date().getTime(),
    };

    // If chrono detected a range, include end date and calculate duration
    if (result.end) {
      detected.endDate = result.end.date();
      detected.endTimestamp = result.end.date().getTime();
      detected.durationMinutes = Math.floor((detected.endTimestamp - detected.timestamp) / 60000);
    }

    return detected;
  });

  // Add custom shorthand dates
  const customDates = detectCustomShorthands(text, dateTimeSettings, workHoursSettings);

  // Add recurring patterns
  const recurringDates = detectRecurringPatterns(text, referenceDate);

  // Combine and deduplicate
  // Priority order: recurring patterns > custom shorthands > chrono dates
  // This ensures "every monday" takes precedence over chrono's "monday" detection
  // BUT: If a recurring pattern overlaps with a chrono range (with time), merge the time info
  const allDates = [...recurringDates, ...customDates, ...chronoDates];
  console.log(`\n🔄 [Merge] Total dates before deduplication: ${allDates.length}`);

  // Special handling: If a recurring pattern overlaps with a chrono range that has duration,
  // merge the time information into the recurring pattern
  for (const recurring of recurringDates) {
    if (recurring.recurring) {
      // Find overlapping chrono dates with duration
      const overlappingChronoRange = chronoDates.find(
        (chrono) =>
          chrono.durationMinutes &&
          chrono.durationMinutes > 0 &&
          !(chrono.end <= recurring.start || chrono.start >= recurring.end),
      );

      if (overlappingChronoRange) {
        console.log(
          `  🔗 Merging time range from "${overlappingChronoRange.text}" into recurring pattern "${recurring.text}"`,
        );
        // Copy the time information from chrono to the recurring pattern DetectedDate
        recurring.date = overlappingChronoRange.date;
        recurring.timestamp = overlappingChronoRange.timestamp;
        recurring.endDate = overlappingChronoRange.endDate;
        recurring.endTimestamp = overlappingChronoRange.endTimestamp;
        recurring.durationMinutes = overlappingChronoRange.durationMinutes;

        // Store time information in the RecurringPattern itself so subsequent occurrences include it
        if (recurring.recurring) {
          recurring.recurring.hour = overlappingChronoRange.date.getHours();
          recurring.recurring.minute = overlappingChronoRange.date.getMinutes();
          if (overlappingChronoRange.endDate) {
            recurring.recurring.endHour = overlappingChronoRange.endDate.getHours();
            recurring.recurring.endMinute = overlappingChronoRange.endDate.getMinutes();
          }
          recurring.recurring.durationMinutes = overlappingChronoRange.durationMinutes;
          console.log(
            `     Stored time in pattern: ${recurring.recurring.hour}:${recurring.recurring.minute
              ?.toString()
              .padStart(2, "0")}${
              recurring.recurring.endHour !== undefined
                ? ` to ${recurring.recurring.endHour}:${recurring.recurring.endMinute?.toString().padStart(2, "0")}`
                : ""
            }`,
          );
        }

        // Extend the text range to cover both the recurring pattern and the time range
        recurring.start = Math.min(recurring.start, overlappingChronoRange.start);
        recurring.end = Math.max(recurring.end, overlappingChronoRange.end);
        recurring.text = text.slice(recurring.start, recurring.end);

        console.log(`     Extended range to ${recurring.start}-${recurring.end}: "${recurring.text}"`);

        // Update the recurring pattern's raw field to include the full text with time
        if (recurring.recurring) {
          recurring.recurring.raw = recurring.text;
          console.log(`     Updated pattern.raw to: "${recurring.recurring.raw}"`);
        }
      }
    }
  }

  // Remove overlapping dates (keep the first one at each position)
  const deduped: DetectedDate[] = [];
  for (const date of allDates) {
    const overlaps = deduped.some((existing) => !(date.end <= existing.start || date.start >= existing.end));
    if (!overlaps) {
      deduped.push(date);
    } else {
      console.log(
        `  ⚠️ Skipping overlapping date: "${date.text}" at ${date.start}-${date.end} (type: ${
          date.recurring ? "recurring" : date.durationMinutes ? "range" : "simple"
        })`,
      );
    }
  }

  // Sort by position in text
  const sorted = deduped.sort((a, b) => a.start - b.start);

  console.log(`\n✅ [Final] Returning ${sorted.length} deduplicated dates:`);
  sorted.forEach((date, index) => {
    console.log(`  ${index + 1}. "${date.text}" at position ${date.start}-${date.end}`);
    console.log(`     → ${date.date.toLocaleString()}`);
  });
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  return sorted;
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
