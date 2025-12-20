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
import { DateTimeSettings, WorkHoursSettings, Priority } from "@/types/settings";
import { parseRecurringPattern, calculateNextOccurrence, RecurringPattern } from "./recurringParser";
import { createCustomChrono } from "./chronoCustom";

/**
 * Minimal interface for person-like objects (works with both Person and PersonModel)
 */
export interface PersonLike {
  name: string;
  alternatives: string[];
}

/**
 * Minimal interface for project-like objects (works with both Project and ProjectModel)
 */
export interface ProjectLike {
  name: string;
  alternatives: string[];
}

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

// Note: Custom shorthand patterns (eod, morning, bow, etc.), time-only patterns (2pm, 3:30pm),
// and relative date patterns (in 3 days) are now handled by custom chrono parsers in chronoCustom.ts

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
 * Detect recurring patterns in text
 * Supports multiple trigger words: every, each, repeat, daily, weekly, etc.
 * Returns pattern with first due date derived from the pattern
 */
function detectRecurringPatterns(text: string, referenceDate: Date = new Date()): DetectedDate[] {
  const results: DetectedDate[] = [];

  // Patterns to match:
  // 1. "every/each <pattern>" where pattern can be:
  //    - "day", "2 days", "week", "3 weeks", etc.
  //    - "monday", "tuesday", etc.
  //    - "first monday", "2nd tuesday", "last friday", etc.
  //    - "workday", "weekday"
  //    - "month on the 15th", "month on 1"
  //    - "other day/week/month" (= every 2)
  // 2. Single-word shortcuts: daily, weekly, biweekly, monthly, quarterly, yearly
  // 3. "repeat <pattern>"

  // Build the actual regex from the pattern parts
  const regexPattern = new RegExp(
    // Single-word shortcuts (must be word boundaries)
    "\\b(daily|weekly|biweekly|fortnightly|monthly|bimonthly|quarterly|yearly|annually|semiannually)\\b|" +
      // Workday/weekday patterns
      "\\b(?:every|each)\\s+(workday|weekday)s?\\b|" +
      // Every other X patterns
      "\\bevery\\s+other\\s+(day|week|month|quarter|half|year)\\b|" +
      // Every X (number) unit patterns
      "\\b(?:every|each|repeat)\\s+(?:(\\d+)\\s+)?(day|week|month|quarter|half|year)s?\\b|" +
      // Every weekday patterns
      "\\b(?:every|each)\\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\\b|" +
      // Nth weekday patterns
      "\\b(?:every|each)\\s+(1st|2nd|3rd|4th|5th|last|first|second|third|fourth|fifth)\\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\\b|" +
      // Every month on the Xth
      "\\b(?:every|each)\\s+month\\s+on\\s+(?:the\\s+)?(\\d+)(?:st|nd|rd|th)?\\b",
    "gi",
  );

  let match;
  while ((match = regexPattern.exec(text)) !== null) {
    const fullMatch = match[0];
    const patternStart = match.index;
    const patternEnd = patternStart + fullMatch.length;

    // Try to parse the full match
    const pattern = parseRecurringPattern(fullMatch);

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
    }
  }

  return results;
}

/**
 * Detect custom shorthand dates in text that chrono doesn't recognize
 */
/**
 * Detect all dates in a text string using chrono-node + custom shorthands
 * Returns dates sorted by position in text
 * Duration patterns (like 46m, 2h) are detected first and excluded from chrono processing
 * Uses custom chrono configuration with extended parsers and refiners
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

  // Use our custom chrono with extended parsers (shorthands, relative dates, time-only)
  const customChrono = createCustomChrono(dateTimeSettings, workHoursSettings);
  const chronoResults = customChrono.parse(text, referenceDate, { forwardDate: true });

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

  // Note: Custom shorthands (eod, morning, bow, etc.), relative dates (in 3 days),
  // and time-only patterns (2pm, 3:30pm) are now handled by our custom chrono parsers

  // Add recurring patterns (these are handled separately since they need special processing)
  const recurringDates = detectRecurringPatterns(text, referenceDate);

  // Combine and deduplicate
  // Priority order: recurring patterns > chrono dates (which now include shorthands, relative, and time)
  // This ensures "every monday" takes precedence over chrono's "monday" detection
  // BUT: If a recurring pattern overlaps with a chrono range (with time), merge the time info
  const allDates = [...recurringDates, ...chronoDates];

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
export function detectMentionedPeople(text: string, availablePeople: PersonLike[]): DetectedPerson[] {
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
export function detectMentionedProjects(text: string, availableProjects: ProjectLike[]): DetectedProject[] {
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
    { pattern: /\b(?:on|in|for|about)\s+project\s+/gi, prefix: true },
    { pattern: /\b(?:on|in|for|about)\s+/gi, prefix: true },
    { pattern: /\bre:\s+/gi, prefix: true }, // "re: Project Name"
    { pattern: /\b(?:regarding|related\s+to|concerning)\s+/gi, prefix: true },
    { pattern: /\b(?:working\s+on|part\s+of)\s+/gi, prefix: true },
    { pattern: /\s+project\b/gi, prefix: false },
    { pattern: /\s+initiative\b/gi, prefix: false },
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
 * Interface for detected assigned person
 */
export interface DetectedAssignedPerson {
  text: string; // The text that was matched (e.g., "ask Marcel")
  start: number; // Start index in the original text
  end: number; // End index in the original text
  personName: string; // The canonical person name
}

/**
 * Detect assigned people in text using context patterns
 * These patterns suggest the person should be assigned to the task
 * Matches patterns like:
 * - "ask <person name>"
 * - "tell <person name>"
 * - "cc <person name>"
 * - "with <person name>"
 * - "assign to <person name>"
 * - "for <person name> to"
 * - "have <person name>"
 * - "get <person name> to"
 * - "reminder for <person name>"
 */
export function detectAssignedPeople(text: string, availablePeople: PersonLike[]): DetectedAssignedPerson[] {
  const results: DetectedAssignedPerson[] = [];

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
    "can",
    "will",
    "just",
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

  // Context patterns that suggest assignment
  const contextPatterns = [
    { pattern: /\b(?:ask|tell|ping|nudge|remind)\s+/gi, prefix: true },
    { pattern: /\b(?:cc|copy)\s+/gi, prefix: true },
    { pattern: /\b(?:with|involve)\s+/gi, prefix: true },
    { pattern: /\bassign(?:ed)?\s+to\s+/gi, prefix: true },
    { pattern: /\bfor\s+/gi, prefix: true, suffix: /\s+to\b/gi }, // "for Marcel to review"
    { pattern: /\bhave\s+/gi, prefix: true },
    { pattern: /\bget\s+/gi, prefix: true, suffix: /\s+to\b/gi }, // "get Marcel to help"
    { pattern: /\breminder\s+for\s+/gi, prefix: true },
    { pattern: /\bfollow\s*up\s+with\s+/gi, prefix: true },
    { pattern: /\bcheck\s+with\s+/gi, prefix: true },
    { pattern: /\bsync\s+with\s+/gi, prefix: true },
    { pattern: /\bmeet(?:ing)?\s+with\s+/gi, prefix: true },
  ];

  for (const lowerName of sortedNames) {
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    for (const { pattern, prefix, suffix } of contextPatterns) {
      let contextRegex: RegExp;

      if (prefix && suffix) {
        // Pattern with both prefix and suffix: "for Marcel to"
        contextRegex = new RegExp(`(${pattern.source})${escapedName}(${suffix.source})`, "gi");
      } else if (prefix) {
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

  return results;
}
/**
 * Detect source people in text using context patterns
 * Matches patterns like:
 * - "from <person name>"
 * - "source <person name>"
 * - "via <person name>"
 * - "per <person name>"
 * - "sent by <person name>"
 * - "shared by <person name>"
 * - "mentioned by <person name>"
 * - "cc'd by <person name>"
 * - "forwarded by <person name>"
 */
export function detectSourcePeople(text: string, availablePeople: PersonLike[]): DetectedSourcePerson[] {
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
    { pattern: /\b(?:sent|shared|forwarded|cc['']?d|mentioned|submitted|reported)\s+by\s+/gi, prefix: true },
    { pattern: /\breceived\s+from\s+/gi, prefix: true },
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
 * - "<priority name>" - direct match for specific words (e.g., "urgent", "critical", "asap")
 * - "<priority name> priority" - with suffix (e.g., "high priority")
 * - "priority <priority name>" - with prefix (e.g., "priority high")
 * - "priority: <priority name>" - with colon
 * - "p1", "p2", "p3" - shorthand priority levels
 *
 * Note: Common words like "high", "low", "medium", "normal" require "priority" context
 * to avoid false positives. More specific words like "urgent", "critical", "asap" can
 * be detected standalone.
 */
export function detectPriorities(text: string, availablePriorities: Priority[]): DetectedPriority[] {
  const results: DetectedPriority[] = [];

  // Words that are too common to detect without context
  const requiresContextWords = new Set(["high", "low", "medium", "normal", "none"]);

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

  // Context patterns for words that need context
  const contextPatterns = [
    { pattern: /\bpriority[:\s]+/gi, prefix: true }, // "priority high" or "priority: high"
    { pattern: /\s+priority\b/gi, prefix: false }, // "high priority"
    { pattern: /\bprio[:\s]+/gi, prefix: true }, // "prio high" or "prio: high"
    { pattern: /\bimportance[:\s]+/gi, prefix: true }, // "importance: high"
    { pattern: /\s+importance\b/gi, prefix: false }, // "high importance"
  ];

  for (const lowerName of sortedNames) {
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const needsContext = requiresContextWords.has(lowerName);

    let match;

    if (!needsContext) {
      // For specific priority words (urgent, critical, asap, etc.), allow direct match
      const directRegex = new RegExp(`\\b${escapedName}\\b`, "gi");
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
    }

    // Always try with context patterns (for common words, this is the only way)
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

/**
 * Interface for detected tag
 */
export interface DetectedTag {
  text: string; // The text that was matched (e.g., "#important")
  start: number; // Start index in the original text
  end: number; // End index in the original text
  tagName: string; // The tag name (without #)
}

/**
 * Detect hashtags in text
 * Matches patterns like:
 * - "#important"
 * - "#followup"
 * - "#waiting-on"
 *
 * Note: This is for auto-detecting hashtags that aren't explicitly added via the # marker
 * The explicit # marker is handled in SmartInput.tsx
 */
export function detectHashtags(text: string): DetectedTag[] {
  const results: DetectedTag[] = [];

  // Hashtag pattern: # followed by word characters (letters, numbers, dashes, underscores)
  // Must not be preceded by a word character (to avoid matching mid-word)
  const hashtagRegex = /(?:^|[^\w])#([\w-]+)/gi;

  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    const tagName = match[1];
    const fullMatch = match[0];

    // Calculate actual start (accounting for possible preceding character)
    const start = match.index + (fullMatch.length - tagName.length - 1);
    const end = match.index + fullMatch.length;

    results.push({
      text: fullMatch.trim(),
      start,
      end,
      tagName,
    });
  }

  // Sort by position in text
  results.sort((a, b) => a.start - b.start);

  return results;
}
