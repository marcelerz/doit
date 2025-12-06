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

Chrono-node supports a wide variety of natural language date formats:

### Relative Dates

- today, tomorrow, yesterday
- next week, next month, next year
- in 2 days, in 3 weeks, 5 days from now
- 2 weeks ago, last Friday

### Absolute Dates

- December 25, 2025
- 25 Dec 2025
- 12/25/2025
- 2025-12-25

### Time Expressions

- at 3pm, at 15:00
- tomorrow at 9am
- Friday from 2-4pm

### Contextual

- end of week, end of month, end of year
- beginning of week, start of month
- this Friday, this weekend
- next Monday morning

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
