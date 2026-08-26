# Recurring Pattern Auto-Detection

This document describes the automatic recurring pattern detection feature that parses natural language recurring patterns without requiring any marker.

## Overview

The system automatically detects recurring patterns that start with "every" and:

1. Extracts the recurring pattern
2. Calculates the first due date from the pattern
3. Creates both a **dueDate** token (first occurrence) and a **recurring** token (pattern)

## Supported Patterns

### Interval Patterns

- `every day` - Daily recurrence
- `every 2 days` - Every 2 days
- `every week` - Weekly recurrence
- `every 3 weeks` - Every 3 weeks
- `every month` - Monthly recurrence
- `every quarter` - Quarterly recurrence
- `every year` - Yearly recurrence

### Weekday Patterns

- `every monday` - Every Monday
- `every tuesday` - Every Tuesday
- `every friday` - Every Friday
- `every workday` - Every weekday (Mon-Fri)

### Nth Weekday Patterns

Both numeric and word forms are supported:

- `every 1st monday` / `every first monday` - First Monday of each month
- `every 2nd tuesday` / `every second tuesday` - Second Tuesday of each month
- `every 3rd friday` / `every third friday` - Third Friday of each month
- `every last friday` - Last Friday of each month

## Examples

### Input Text → Detected Pattern → First Due Date

| Input                        | Pattern Detected     | First Occurrence (from Dec 5, 2025 3pm)      |
| ---------------------------- | -------------------- | -------------------------------------------- |
| "review every monday"        | `every monday`       | Next Monday: Dec 8, 2025 12pm                |
| "cleanup every 2 days"       | `every 2 days`       | 2 days from now: Dec 7, 2025 3pm             |
| "meeting every first friday" | `every first friday` | First Friday of next month: Jan 3, 2026 12pm |
| "check email every workday"  | `every workday`      | Next weekday: Dec 8, 2025 (Monday)           |
| "backup every month"         | `every month`        | One month from now: Jan 5, 2026 3pm          |

## Visual Indicators

Auto-detected recurring patterns are shown with:

- **Lighter background color** - Distinguishes from explicit `%` markers
- **Dotted underline** - Indicates auto-detection
- **Click to deactivate** - Click the highlighted text to deactivate detection

When detected, the pattern creates **two tokens**:

1. 📅 **Due Date** - Shows the first occurrence date
2. 🔁 **Recurring** - Shows the pattern (e.g., "every monday")

## Interaction with Chrono

The system runs in sequence:

1. **Chrono date detection** - Detects natural dates like "tomorrow", "next Friday"
2. **Custom shorthands** - Detects "eod", "morning", "bow", etc.
3. **Recurring patterns** - Detects "every" patterns
4. **Explicit markers** (@, $, %, !!, #) - Assigned/source people, projects, priorities, tags

Overlapping detections are removed, with more specific patterns taking priority.

## Implementation Details

### Detection Flow

1. **Regex Pattern**: `/\bevery\s+(?:(\d+)\s+)?(day|week|month|...)/gi`

   - Matches "every" followed by optional number and time unit or weekday
   - Supports both "1st" and "first" ordinal forms

2. **Pattern Parsing**: Uses `recurringParser.parseRecurringPattern()`

   - Converts text to structured `RecurringPattern` object
   - Validates pattern syntax

3. **First Date Calculation**: Uses `recurringParser.calculateNextOccurrence()`

   - Computes next occurrence from reference date
   - Handles edge cases (e.g., "last friday of month")

4. **Token Creation**: Creates two co-located tokens
   - Both share same `start` and `end` positions
   - Rendered together with appropriate badges

### Data Structure

```typescript
export interface DetectedDate {
  text: string; // e.g., "every monday"
  start: number; // Position in text
  end: number; // End position
  date: Date; // First occurrence date
  timestamp: number; // Unix timestamp
  recurring?: RecurringPattern; // Parsed pattern
}
```


## Visual Styling

| Feature         | Auto-detected recurring patterns |
| --------------- | -------------------------------- |
| Syntax          | `every 2 weeks`                  |
| Visual          | Dotted underline                 |
| Deactivation    | Click to deactivate              |
| Pattern Storage | Normalized pattern               |

Recurring patterns are auto-detected only. There is no explicit marker for recurring patterns.
