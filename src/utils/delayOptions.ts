/**
 * Delay options for scheduling todos to future dates
 * Used in TodoItem and TodoDetailsOverlay for quick date selection
 */

export interface DelayOption {
  label: string;
  value: string;
}

/**
 * Common delay options for quickly scheduling tasks
 */
export const DELAY_OPTIONS: DelayOption[] = [
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "Next Week", value: "next week" },
  { label: "Next Month", value: "next month" },
  { label: "Next Monday", value: "next monday" },
  { label: "Next Tuesday", value: "next tuesday" },
  { label: "Next Wednesday", value: "next wednesday" },
  { label: "Next Thursday", value: "next thursday" },
  { label: "Next Friday", value: "next friday" },
  { label: "Next Saturday", value: "next saturday" },
  { label: "Next Sunday", value: "next sunday" },
  { label: "In 2 Days", value: "in 2 days" },
  { label: "In 3 Days", value: "in 3 days" },
  { label: "In 5 Days", value: "in 5 days" },
  { label: "In 1 Week", value: "in 1 week" },
  { label: "In 2 Weeks", value: "in 2 weeks" },
  { label: "In 3 Weeks", value: "in 3 weeks" },
  { label: "In 1 Month", value: "in 1 month" },
  { label: "In 2 Months", value: "in 2 months" },
  { label: "In 3 Months", value: "in 3 months" },
  { label: "In 6 Months", value: "in 6 months" },
];
