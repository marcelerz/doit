/**
 * A marker matched inside smart-input text, e.g. `@marcel` or `%website`.
 *
 * This is a plain data shape, so it lives in the types layer. It used to be
 * declared in `components/input/SmartInput`, which meant `utils/tokenParser`
 * -- 63 lines with no React in it -- imported a 1,179-line component module
 * just to name its argument type.
 */
export interface TokenMatch {
  type: string;
  value: string; // parsed value, e.g. "marcel" (not "@marcel")
  raw: string; // raw matched string, e.g. "@marcel"
  start: number;
  end: number;
  // For auto-detected dates (without ~)
  isAutoDetected?: boolean;
  detectedDateIndex?: number; // Which detected date is active (0-based)
  allDetectedDates?: string[]; // All ISO dates found at this location
  autoDetectedType?: "simple" | "range" | "recurring"; // What kind of auto-detection: simple date, date range, or recurring pattern
}
