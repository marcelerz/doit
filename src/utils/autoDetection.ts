/**
 * Auto-detection utilities for SmartInput
 *
 * Detects various metadata in natural language text without requiring explicit markers:
 * - Dates (using chrono-node + custom shorthands like eod, morning, bow)
 * - Durations (patterns like 46m, 2h, 1.5h)
 * - Recurring patterns ("every monday", "every 2 weeks")
 * - People mentions (names from people list)
 * - Project references ("on <project>", "for <project>")
 * - Source people ("from <person>", "via <person>")
 * - Priorities (direct match or "high priority" patterns)
 */

import * as chrono from "chrono-node";
import { DateTimeSettings, WorkHoursSettings, Person, Project, Priority } from "@/types/settings";
import { parseShorthand } from "./dateUtils";
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

export interface DetectedPerson {
  text: string; // The text that was matched (e.g., "Marcel")
  start: number; // Start index in the original text
  end: number; // End index in the original text
  personName: string; // The canonical person name
}

export interface DetectedProject {
  text: string; // The text that was matched (e.g., "on Website Redesign")
  start: number; // Start index in the original text
  end: number; // End index in the original text
  projectName: string; // The canonical project name
}

export interface DetectedSourcePerson {
  text: string; // The text that was matched (e.g., "from Marcel")
  start: number; // Start index in the original text
  end: number; // End index in the original text
  personName: string; // The canonical person name
}

export interface DetectedPriority {
  text: string; // The text that was matched (e.g., "high priority" or "urgent")
  start: number; // Start index in the original text
  end: number; // End index in the original text
  priorityName: string; // The canonical priority name
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
 * Interface for detected duration patterns
 */
export interface DetectedDuration {
  text: string; // The text that was matched (e.g., "46m", "2h", "1.5h")
  start: number; // Start index in the original text
  end: number; // End index in the original text
  value: string; // Normalized duration value
}

/**
 * Detect duration patterns in text
 * Patterns like: 15m, 30m, 46m, 1h, 2h, 1.5h, 2d, 1w, etc.
 * These should be prioritized over chrono's time detection
 */
export function detectDurationPatterns(text: string): DetectedDuration[] {
  const results: DetectedDuration[] = [];

  // Duration pattern: number (optional decimal) followed by unit (m, h, d, w)
  // Must be standalone (word boundary) to avoid matching parts of other text
  // Excludes patterns that could be times (like "at 9am", "9:30pm")
  const durationRegex =
    /\b(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks)\b/gi;

  let match;
  while ((match = durationRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const start = match.index;
    const end = start + fullMatch.length;
    const number = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    // Normalize the unit
    let normalizedUnit: string;
    if (unit.startsWith("m")) {
      normalizedUnit = "m";
    } else if (unit.startsWith("h")) {
      normalizedUnit = "h";
    } else if (unit.startsWith("d")) {
      normalizedUnit = "d";
    } else if (unit.startsWith("w")) {
      normalizedUnit = "w";
    } else {
      continue;
    }

    // Format the value (e.g., "1.5h", "46m")
    const value = Number.isInteger(number) ? `${number}${normalizedUnit}` : `${number}${normalizedUnit}`;

    results.push({
      text: fullMatch,
      start,
      end,
      value,
    });
  }

  return results;
}

/**
 * Detect recurring patterns in text starting with "every"
 * Returns pattern with first due date derived from the pattern
 */
function detectRecurringPatterns(text: string, referenceDate: Date = new Date()): DetectedDate[] {
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
      // Calculate first occurrence from reference date
      const firstDate = calculateNextOccurrence(pattern, referenceDate);

      results.push({
        text: fullMatch,
        start: patternStart,
        end: patternEnd,
        date: firstDate,
        timestamp: firstDate.getTime(),
        recurring: pattern,
      });
    } else {
    }
  }

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
 * Duration patterns (like 46m, 2h) are detected first and excluded from chrono processing
 */
export function detectDatesInText(
  text: string,
  referenceDate: Date = new Date(),
  dateTimeSettings?: DateTimeSettings,
  workHoursSettings?: WorkHoursSettings,
): DetectedDate[] {
  // FIRST: Detect duration patterns (like 46m, 2h, 1.5h)
  // These should NOT be interpreted as times by chrono
  const durationPatterns = detectDurationPatterns(text);
  const durationRanges = durationPatterns.map((d) => ({ start: d.start, end: d.end }));

  // Use chrono's casual parser for more flexible parsing
  const chronoResults = chrono.parse(text, referenceDate, { forwardDate: true });

  // Filter out chrono results that overlap with duration patterns
  const filteredChronoResults = chronoResults.filter((result) => {
    const resultStart = result.index;
    const resultEnd = result.index + result.text.length;

    const overlapsWithDuration = durationRanges.some(
      (range) => !(resultEnd <= range.start || resultStart >= range.end),
    );

    if (overlapsWithDuration) {
      return false;
    }
    return true;
  });

  const chronoDates: DetectedDate[] = filteredChronoResults.map((result) => {
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
        }

        // Extend the text range to cover both the recurring pattern and the time range
        recurring.start = Math.min(recurring.start, overlappingChronoRange.start);
        recurring.end = Math.max(recurring.end, overlappingChronoRange.end);
        recurring.text = text.slice(recurring.start, recurring.end);

        // Update the recurring pattern's raw field to include the full text with time
        if (recurring.recurring) {
          recurring.recurring.raw = recurring.text;
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
    }
  }

  // Sort by position in text
  const sorted = deduped.sort((a, b) => a.start - b.start);

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

/**
 * Detect mentioned people in text without requiring ^ marker
 * Matches person names and their alternatives as whole words
 */
export function detectMentionedPeople(text: string, availablePeople: Person[]): DetectedPerson[] {
  const results: DetectedPerson[] = [];

  // Blacklist common English words to avoid false positives
  const blacklist = new Set([
    "me",
    "i",
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "up",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "s",
    "t",
    "can",
    "will",
    "just",
    "don",
    "should",
    "now",
    "he",
    "she",
    "it",
    "we",
    "they",
    "us",
    "them",
    "his",
    "her",
    "its",
    "our",
    "their",
    "my",
    "your",
  ]);

  // Build a list of all names (canonical + alternatives) with their canonical names
  const nameMap = new Map<string, string>(); // lowercase name -> canonical name

  for (const person of availablePeople) {
    // Add canonical name (unless blacklisted)
    const lowerName = person.name.toLowerCase();
    if (!blacklist.has(lowerName)) {
      nameMap.set(lowerName, person.name);
    }

    // Add all alternatives (unless blacklisted)
    for (const alt of person.alternatives) {
      const lowerAlt = alt.toLowerCase();
      if (!blacklist.has(lowerAlt)) {
        nameMap.set(lowerAlt, person.name);
      }
    }
  }

  // Sort names by length (longest first) to match longer names before shorter ones
  // This prevents "Marcel Erzberg" being detected as just "Marcel"
  const sortedNames = Array.from(nameMap.keys()).sort((a, b) => b.length - a.length);

  // Track processed ranges to avoid overlaps
  const processedRanges: Array<{ start: number; end: number }> = [];

  for (const lowerName of sortedNames) {
    // Create a regex that matches the name as a whole word (word boundaries)
    // Escape special regex characters in the name
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedName}\\b`, "gi");

    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      // Check if this range overlaps with any already processed range
      const overlaps = processedRanges.some((range) => !(end <= range.start || start >= range.end));

      if (!overlaps) {
        const canonicalName = nameMap.get(lowerName)!;

        results.push({
          text: match[0],
          start,
          end,
          personName: canonicalName,
        });

        processedRanges.push({ start, end });
      }
    }
  }

  // Sort by position in text
  results.sort((a, b) => a.start - b.start);

  results.forEach((person, index) => {});

  return results;
}

/**
 * Detect project references in text without requiring % marker
 * Matches patterns like:
 * - "on <project name>"
 * - "in <project name>"
 * - "on project <project name>"
 * - "in project <project name>"
 * - "<project name> project"
 * - "for <project name>"
 * - "for project <project name>"
 */
export function detectMentionedProjects(text: string, availableProjects: Project[]): DetectedProject[] {
  const results: DetectedProject[] = [];

  // Blacklist common words that might be project names
  const blacklist = new Set([
    "me",
    "it",
    "this",
    "that",
    "these",
    "those",
    "work",
    "time",
    "day",
    "week",
    "month",
    "year",
    "project",
    "projects",
  ]);

  // Build a list of all project names (canonical + alternatives)
  const projectMap = new Map<string, string>(); // lowercase name -> canonical name

  for (const project of availableProjects) {
    const lowerName = project.name.toLowerCase();
    if (!blacklist.has(lowerName)) {
      projectMap.set(lowerName, project.name);
    }

    for (const alt of project.alternatives) {
      const lowerAlt = alt.toLowerCase();
      if (!blacklist.has(lowerAlt)) {
        projectMap.set(lowerAlt, project.name);
      }
    }
  }

  // Sort names by length (longest first)
  const sortedNames = Array.from(projectMap.keys()).sort((a, b) => b.length - a.length);

  // Track processed ranges to avoid overlaps
  const processedRanges: Array<{ start: number; end: number }> = [];

  // Context patterns that indicate a project reference
  const contextPatterns = [
    { pattern: /\b(?:on|in|for)\s+project\s+/gi, prefix: true },
    { pattern: /\b(?:on|in|for)\s+/gi, prefix: true },
    { pattern: /\s+project\b/gi, prefix: false },
  ];

  for (const lowerName of sortedNames) {
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Try each context pattern
    for (const { pattern, prefix } of contextPatterns) {
      let contextRegex: RegExp;

      if (prefix) {
        // Pattern comes before the project name: "on project Website" or "in Marketing"
        contextRegex = new RegExp(`(${pattern.source})${escapedName}\\b`, "gi");
      } else {
        // Pattern comes after the project name: "Website project"
        contextRegex = new RegExp(`\\b${escapedName}(${pattern.source})`, "gi");
      }

      let match;
      while ((match = contextRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const start = match.index;
        const end = start + fullMatch.length;

        // Check for overlaps
        const overlaps = processedRanges.some((range) => !(end <= range.start || start >= range.end));

        if (!overlaps) {
          const canonicalName = projectMap.get(lowerName)!;

          results.push({
            text: fullMatch,
            start,
            end,
            projectName: canonicalName,
          });

          processedRanges.push({ start, end });
        }
      }
    }
  }

  // Sort by position in text
  results.sort((a, b) => a.start - b.start);

  return results;
}

/**
 * Detect source people in text using context patterns
 * Matches patterns like:
 * - "from <person name>"
 * - "source <person name>"
 * - "via <person name>"
 * - "per <person name>"
 */
export function detectSourcePeople(text: string, availablePeople: Person[]): DetectedSourcePerson[] {
  const results: DetectedSourcePerson[] = [];

  // Blacklist common English words
  const blacklist = new Set([
    "me",
    "i",
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "up",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "s",
    "t",
    "can",
    "will",
    "just",
    "don",
    "should",
    "now",
    "he",
    "she",
    "it",
    "we",
    "they",
    "us",
    "them",
    "his",
    "her",
    "its",
    "our",
    "their",
    "my",
    "your",
  ]);

  // Build a list of all names (canonical + alternatives)
  const nameMap = new Map<string, string>();

  for (const person of availablePeople) {
    const lowerName = person.name.toLowerCase();
    if (!blacklist.has(lowerName)) {
      nameMap.set(lowerName, person.name);
    }

    for (const alt of person.alternatives) {
      const lowerAlt = alt.toLowerCase();
      if (!blacklist.has(lowerAlt)) {
        nameMap.set(lowerAlt, person.name);
      }
    }
  }

  // Sort names by length (longest first)
  const sortedNames = Array.from(nameMap.keys()).sort((a, b) => b.length - a.length);

  // Track processed ranges
  const processedRanges: Array<{ start: number; end: number }> = [];

  // Context patterns that indicate a source person
  const contextPatterns = [
    { pattern: /\b(?:from|via|per)\s+/gi, prefix: true },
    { pattern: /\bsource\s+/gi, prefix: true },
  ];

  for (const lowerName of sortedNames) {
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    for (const { pattern, prefix } of contextPatterns) {
      let contextRegex: RegExp;

      if (prefix) {
        contextRegex = new RegExp(`(${pattern.source})${escapedName}\\b`, "gi");
      } else {
        contextRegex = new RegExp(`\\b${escapedName}(${pattern.source})`, "gi");
      }

      let match;
      while ((match = contextRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const start = match.index;
        const end = start + fullMatch.length;

        // Check for overlaps
        const overlaps = processedRanges.some((range) => !(end <= range.start || start >= range.end));

        if (!overlaps) {
          const canonicalName = nameMap.get(lowerName)!;

          results.push({
            text: fullMatch,
            start,
            end,
            personName: canonicalName,
          });

          processedRanges.push({ start, end });
        }
      }
    }
  }

  // Sort by position in text
  results.sort((a, b) => a.start - b.start);

  results.forEach((person, index) => {});

  return results;
}

/**
 * Detect priorities in text
 * Matches patterns like:
 * - "<priority name>" - direct match (e.g., "urgent", "high priority")
 * - "<priority name> priority" - with suffix
 * - "priority <priority name>" - with prefix
 * Priority names are typically specific enough to detect without additional context
 */
export function detectPriorities(text: string, availablePriorities: Priority[]): DetectedPriority[] {
  const results: DetectedPriority[] = [];

  // No blacklist needed - priority names should be specific enough
  // Build a list of all priority names (canonical + alternatives)
  const priorityMap = new Map<string, string>();

  for (const priority of availablePriorities) {
    priorityMap.set(priority.name.toLowerCase(), priority.name);

    for (const alt of priority.alternatives) {
      priorityMap.set(alt.toLowerCase(), priority.name);
    }
  }

  // Sort names by length (longest first)
  const sortedNames = Array.from(priorityMap.keys()).sort((a, b) => b.length - a.length);

  // Track processed ranges
  const processedRanges: Array<{ start: number; end: number }> = [];

  // Context patterns (optional - priorities can be detected standalone)
  const contextPatterns = [
    { pattern: /\bpriority\s+/gi, prefix: true }, // "priority high"
    { pattern: /\s+priority\b/gi, prefix: false }, // "high priority"
  ];

  for (const lowerName of sortedNames) {
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // First, try direct match (no context required)
    const directRegex = new RegExp(`\\b${escapedName}\\b`, "gi");
    let match;
    while ((match = directRegex.exec(text)) !== null) {
      const fullMatch = match[0];
      const start = match.index;
      const end = start + fullMatch.length;

      // Check for overlaps
      const overlaps = processedRanges.some((range) => !(end <= range.start || start >= range.end));

      if (!overlaps) {
        const canonicalName = priorityMap.get(lowerName)!;

        results.push({
          text: fullMatch,
          start,
          end,
          priorityName: canonicalName,
        });

        processedRanges.push({ start, end });
      }
    }

    // Also try with "priority" context
    for (const { pattern, prefix } of contextPatterns) {
      let contextRegex: RegExp;

      if (prefix) {
        contextRegex = new RegExp(`(${pattern.source})${escapedName}\\b`, "gi");
      } else {
        contextRegex = new RegExp(`\\b${escapedName}(${pattern.source})`, "gi");
      }

      while ((match = contextRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const start = match.index;
        const end = start + fullMatch.length;

        // Check for overlaps
        const overlaps = processedRanges.some((range) => !(end <= range.start || start >= range.end));

        if (!overlaps) {
          const canonicalName = priorityMap.get(lowerName)!;

          results.push({
            text: fullMatch,
            start,
            end,
            priorityName: canonicalName,
          });

          processedRanges.push({ start, end });
        }
      }
    }
  }

  // Sort by position in text
  results.sort((a, b) => a.start - b.start);

  return results;
}
