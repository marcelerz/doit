/**
 * Suggestion utilities for duration and recurring patterns
 */

export const DURATION_SUGGESTIONS = [
  "15m",
  "30m",
  "45m",
  "1h",
  "1.5h",
  "2h",
  "3h",
  "4h",
  "5h",
  "6h",
  "7h",
  "8h",
  "10h",
  "1d",
  "2d",
  "3d",
  "5d",
  "1w",
  "2w",
  "3w",
  "1m",
  "2m",
  "3m",
];

export const RECURRING_SUGGESTIONS = [
  "daily",
  "every day",
  "every weekday",
  "weekly",
  "every week",
  "every monday",
  "every tuesday",
  "every wednesday",
  "every thursday",
  "every friday",
  "every saturday",
  "every sunday",
  "every 2 weeks",
  "monthly",
  "every month",
  "yearly",
  "every year",
];

export function getDurationSuggestions(input: string): string[] {
  if (input.trim() === "") return DURATION_SUGGESTIONS;
  const lowerInput = input.toLowerCase();
  return DURATION_SUGGESTIONS.filter((s) => s.toLowerCase().includes(lowerInput));
}

export function filterRecurringSuggestions(input: string): string[] {
  if (input.trim() === "") return RECURRING_SUGGESTIONS;
  const lowerInput = input.toLowerCase();
  return RECURRING_SUGGESTIONS.filter((s) => s.toLowerCase().includes(lowerInput));
}
