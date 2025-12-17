// Unique branded type for Timestamps
export type Timestamp = number & { readonly __brand: unique symbol };

// Converts number into Timestamp type
export function getTimestamp(value: number): Timestamp {
  return value as Timestamp;
}

// Unique branded type for DurationSec
export type DurationSec = number & { readonly __brand: unique symbol };

// Converts number into DurationSec type
export function getDurationSec(value: number): DurationSec {
  return value as DurationSec;
}

// Unique branded type for DurationMin
export type DurationMin = number & { readonly __brand: unique symbol };

// Converts number into DurationMin type
export function getDurationMin(value: number): DurationMin {
  return value as DurationMin;
}

// Unique branded type for DurationHour
export type DurationHour = number & { readonly __brand: unique symbol };

// Converts number into DurationHour type
export function getDurationHour(value: number): DurationHour {
  return value as DurationHour;
}

// Unique branded type for DurationDay
export type DurationDay = number & { readonly __brand: unique symbol };

// Converts number into DurationDay type
export function getDurationDay(value: number): DurationDay {
  return value as DurationDay;
}

// Unique branded type for DurationWeek
export type DurationWeek = number & { readonly __brand: unique symbol };

// Converts number into DurationWeek type
export function getDurationWeek(value: number): DurationWeek {
  return value as DurationWeek;
}

// Unique branded type for DurationMonth
export type DurationMonth = number & { readonly __brand: unique symbol };

// Converts number into DurationMonth type
export function getDurationMonth(value: number): DurationMonth {
  return value as DurationMonth;
}

// Unique branded type for DurationYear
export type DurationYear = number & { readonly __brand: unique symbol };

// Converts number into DurationYear type
export function getDurationYear(value: number): DurationYear {
  return value as DurationYear;
}

// Unique branded type for ShortTime (e.g. "14:30")
export type ShortTime = string & { readonly __brand: unique symbol };

// Converts number into DurationYear type
export function getShortTime(value: string): ShortTime {
  return value as ShortTime;
}

// Unique branded type for Weekday (e.g. 0 - Sunday, 6 - Saturday)
export type Weekday = number & { readonly __brand: unique symbol };

// Converts number into Weekday type
export function getWeekday(value: number): Weekday {
  return value as Weekday;
}
// Unique branded type for Month (e.g. 1 - January, 12 - December)
export type Month = number & { readonly __brand: unique symbol };

// Converts number into Month type
export function getMonth(value: number): Month {
  return value as Month;
}
