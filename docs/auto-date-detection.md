# Automatic Date Detection with Chrono-node

## Overview

The SmartInput automatically detects dates in natural language. Dates are **auto-detected only** - there is no explicit marker for due dates. This provides a natural typing experience.

## Features

### 1. **Automatic Detection**

The system uses chrono-node to detect dates in plain text:

**Examples:**

- "Call client tomorrow" → detects "tomorrow"
- "Meeting next Friday at 3pm" → detects "next Friday at 3pm"
- "Review by end of week" → detects "end of week"
- "Follow up in 2 weeks" → detects "in 2 weeks"

### 2. **Visual Styling**

Auto-detected dates are styled with:

- Lighter opacity (80%) background
- Dotted underline to indicate auto-detection
- Click to deactivate the detection

### 3. **Click to Deactivate**

Auto-detected dates can be deactivated by clicking on them:

- Click once → Removes the date detection
- The text remains unchanged, only the highlighting is removed
- Useful when chrono incorrectly identifies a date (e.g., "March" as a name)

## How It Works

### Detection Process

1. **Run Chrono**: chrono-node scans the text for dates
2. **Apply Custom Shorthands**: Detect shorthands like "eod", "morning", "bow"
3. **Detect Recurring**: Detect "every" patterns
4. **Filter Overlaps**: Remove overlapping detections
5. **Create Tokens**: Detected dates become `dueDate` tokens with `isAutoDetected: true`

### Token Structure

```typescript
interface TokenMatch {
  type: "dueDate";
  value: string; // ISO format: "2025-12-06T15:00"
  raw: string; // Original text: "tomorrow at 3pm"
  start: number;
  end: number;
  isAutoDetected: true;
  detectedDateIndex: 0; // For future multi-date support
  allDetectedDates: string[]; // All detected dates at this position
}
```

### Date Conversion

Chrono returns Date objects which are converted to ISO format strings for storage:

- Input: "tomorrow at 3pm"
- Chrono output: Date object
- Stored: "2025-12-06T15:00" (ISO local time)

## Usage Examples

### Basic Date Detection

```text
Input: "Call Sarah tomorrow"
Result: [Token: @Sarah] [Auto-detected: tomorrow]
Saved: dueDate = "2025-12-06T12:00" (assuming noon default)
```

### Complex Natural Language

```text
Input: "Review code by end of week"
Result: [Auto-detected: end of week]
Saved: dueDate = "2025-12-08T17:00" (EOW)
```

### Deactivating Auto-Detection

```text
1. Type: "Call March"
2. System detects: [Auto-detected: March] (incorrectly)
3. Click on "March"
4. Result: "Call March" (no detection)
```

## Supported Date Formats

Chrono-node supports a wide variety of natural language date formats, enhanced with custom parsers:

### Relative Dates

- today, tomorrow, yesterday
- next week, next month, next year
- in 2 days, in 3 weeks, 5 days from now
- 2 weeks ago, last Friday
- **in 3 business days**, **in 5 working days** (skips weekends)

### Absolute Dates

- December 25, 2025
- 25 Dec 2025
- 12/25/2025
- 2025-12-25

### Time Expressions

- at 3pm, at 15:00
- tomorrow at 9am
- Friday from 2-4pm
- **2pm**, **3:30pm** (time-only, defaults to today or tomorrow)

### Contextual

- end of week, end of month, end of year
- beginning of week, start of month
- this Friday, this weekend
- next Monday morning

### Custom Shorthands

**Time of Day:**

- **morning** - configured morning time (default 9am)
- **noon**, **midday** - configured noon time (default 12pm)
- **afternoon** - configured afternoon time (default 2pm)
- **evening** - configured evening time (default 6pm)
- **midnight** - 00:00

**Day Boundaries:**

- **bod**, **startofday**, **beginningofday**, **beginningoftheday** - beginning of day (from work hours)
- **eod**, **endofday**, **endoftheday**, **startoftheday** - end of day (from work hours)

**Week Boundaries:**

- **bow**, **startofweek**, **beginningofweek**, **beginningoftheweek** - start of work week
- **eow**, **endofweek**, **endoftheweek**, **startoftheweek** - end of work week
- **nextweek** - start of next work week
- **weekend** - next Saturday

**Month Boundaries:**

- **bom**, **startofmonth**, **beginningofmonth**, **beginningofthemonth** - first of month
- **eom**, **endofmonth**, **endofthemonth**, **startofthemonth** - last of month
- **nextmonth** - first of next month

**Quarter Boundaries:**

- **boq**, **startofquarter**, **beginningofquarter**, **beginningofthequarter** - start of quarter
- **eoq**, **endofquarter**, **endofthequarter**, **startofthequarter** - end of quarter
- **nextquarter** - first of next quarter

**Half-Year Boundaries:**

- **boh**, **startofhalf** - start of current half (Jan 1 or Jul 1)
- **eoh**, **endofhalf** - end of current half (Jun 30 or Dec 31)
- **nexthalf** - start of next half

**Year Boundaries:**

- **boy**, **startofyear**, **beginningofyear**, **beginningoftheyear** - January 1
- **eoy**, **endofyear**, **endoftheyear**, **startoftheyear** - December 31
- **nextyear** - January 1 of next year

### Fiscal Periods (default to END of period)

**Quarters:**

- **Q1** - March 31 (end of Q1)
- **Q2** - June 30 (end of Q2)
- **Q3** - September 30 (end of Q3)
- **Q4** - December 31 (end of Q4)
- **Q1 2025** - March 31, 2025 (explicit year)

**Half Years:**

- **H1** - June 30 (end of first half)
- **H2** - December 31 (end of second half)

**Fiscal Years:**

- **FY2025** - December 31, 2025
- **FY25** - December 31, 2025 (short form)

### Holidays (US-centric)

**Fixed-Date Holidays:**

- **christmas** - December 25
- **christmaseve** - December 24
- **newyears**, **newyearsday** - January 1
- **newyearseve** - December 31
- **valentines**, **valentinesday** - February 14
- **stpatricks**, **stpatricksday** - March 17
- **halloween** - October 31
- **independenceday**, **julyfourth** - July 4

**Floating Holidays:**

- **laborday** - 1st Monday of September
- **memorialday** - Last Monday of May
- **thanksgiving** - 4th Thursday of November
- **mlkday** - 3rd Monday of January
- **presidentsday** - 3rd Monday of February
- **columbusday** - 2nd Monday of October

_Note: All holiday patterns return the next occurrence from the reference date._

## Technical Details

### Implementation Files

- `src/utils/autoDetection.ts` - Date detection using chrono-node
- `src/components/input/SmartInput.tsx` - Integration and UI
- `src/utils/tokenParser.ts` - Converts tokens to metadata

### Dependencies

- `chrono-node` v2.x - Natural language date parser

### State Management

- `activeDateIndices` - Tracks which detected dates are active
- Format: `{"start-end": 0}` where key is position, value is date index (-1 = deactivated)

### Event Handling

Click handlers are attached to auto-detected date spans:

```javascript
span.addEventListener("click", (e) => {
  // Deactivate by setting index to -1
  setActiveDateIndices((prev) => ({
    ...prev,
    [posKey]: -1,
  }));
  // Re-render
});
```

## PlainText Output

Auto-detected dates are **removed from the plainText output**. This keeps the task description clean while preserving the metadata.

**Example:**

- Input: `"Call client tomorrow at 3pm"`
- plainText: `"Call client"`
- dueDate: `"2025-12-07T15:00"`

## Testing

To test the feature:

1. Start the app: `npm run dev`
2. Click "Add Todo"
3. Type natural language dates:
   - "Call client tomorrow"
   - "Meeting next Friday at 3pm"
   - "Review by end of week"
4. Observe highlighting (lighter, dotted underline)
5. Click on detected dates to deactivate
6. Submit and verify due date is saved correctly
