# Automatic Date Detection with Chrono-node

## Overview

The SmartInput now automatically detects dates in natural language without requiring the `~` marker. This provides a more natural typing experience while maintaining backward compatibility with explicit markers.

## Features

### 1. **Automatic Detection**

The system uses chrono-node to detect dates in plain text:

**Examples:**

- "Call client tomorrow" → detects "tomorrow"
- "Meeting next Friday at 3pm" → detects "next Friday at 3pm"
- "Review by end of week" → detects "end of week"
- "Follow up in 2 weeks" → detects "in 2 weeks"

### 2. **Visual Styling**

Auto-detected dates are styled differently from explicit `~` markers:

- **Explicit** (`~tomorrow`): Bold, solid background
- **Auto-detected** (`tomorrow`): Normal weight, lighter opacity (80%), dotted underline

### 3. **Click to Deactivate**

Auto-detected dates can be deactivated by clicking on them:

- Click once → Removes the date detection
- The text remains unchanged, only the highlighting is removed
- Useful when chrono incorrectly identifies a date (e.g., "March" as a name)

### 4. **Explicit Markers Take Precedence**

If you use `~` explicitly, the auto-detection won't interfere:

- `~tomorrow` → Uses explicit marker
- `tomorrow` → Auto-detected
- Both work, but explicit markers are always respected

### 5. **No Overlap**

Auto-detection skips any text already covered by explicit `~` markers to avoid conflicts.

## How It Works

### Detection Process

1. **Parse Explicit Markers**: First, all `~` markers are detected
2. **Run Chrono**: Then, chrono-node scans the remaining text for dates
3. **Skip Overlaps**: Any dates that overlap with `~` markers are ignored
4. **Create Tokens**: Detected dates become `dueDate` tokens with `isAutoDetected: true`

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

```
Input: "Call Sarah tomorrow"
Result: [Token: @Sarah] [Auto-detected: tomorrow]
Saved: dueDate = "2025-12-06T12:00" (assuming noon default)
```

### With Explicit Marker

```
Input: "Meeting ~next friday"
Result: [Explicit: ~next friday]
Saved: dueDate = "2025-12-13T12:00"
```

### Complex Natural Language

```
Input: "Review code by end of week"
Result: [Auto-detected: end of week]
Saved: dueDate = "2025-12-08T17:00" (EOW)
```

### Deactivating Auto-Detection

```
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

- `src/utils/chronoDateParser.ts` - Wrapper around chrono-node
- `src/components/input/SmartInput.tsx` - Integration and UI
- `src/utils/metadataParser.ts` - Converts tokens to metadata

### Dependencies

- `chrono-node` v2.x - Natural language date parser

### State Management

- `activeDateIndices` - Tracks which detected dates are active
- Format: `{"start-end": 0}` where key is position, value is date index

### Event Handling

Click handlers are attached to auto-detected date spans:

```javascript
span.addEventListener("click", (e) => {
  // Deactivate by removing from activeDateIndices
  setActiveDateIndices((prev) => {
    const newIndices = { ...prev };
    delete newIndices[posKey];
    return newIndices;
  });
  // Re-render
});
```

## Future Enhancements

### Multiple Dates Per Position

Currently, only the first detected date is shown. Future versions could support:

- Click to cycle through multiple interpretations
- "tomorrow" could mean:
  - Tomorrow at noon (default)
  - Tomorrow morning (8am)
  - Tomorrow evening (6pm)

### Smart Suggestions

- Show alternative date interpretations in tooltip
- Offer to correct obvious mistakes
- Learn from user corrections

### Integration with Other Markers

- Auto-detect durations: "2 hour meeting" → `*2h`
- Auto-detect recurring: "every Monday" → `%every monday`

## Backward Compatibility

The `~` marker continues to work exactly as before:

- All existing functionality preserved
- Can mix auto-detection and explicit markers
- No breaking changes to the data model

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
