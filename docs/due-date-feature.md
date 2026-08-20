# Due Date Feature

## Overview

The todo app supports comprehensive due date functionality with natural language parsing and configurable time boundaries.

## Usage

### Automatic Detection

Due dates are **automatically detected** from natural language in your todo text:

```text
Do the laundry tomorrow
Review pull requests by eod
Submit report by Jan 15, 2025
```

### Setting Via Details Overlay

You can also set or modify due dates through the Todo Details overlay:

1. Click on a todo to open its details
2. Find the "Due" section
3. Use the date and time pickers
4. Or use the "delay" button for quick presets (eod, tomorrow, next week, etc.)

### Supported Formats

#### Shorthand Expressions

The following shorthand expressions are automatically detected and converted:

**Daily:**

- `today`, `tod` - Current date/time
- `tomorrow`, `tmr`, `tom` - Tomorrow
- `yesterday` - Yesterday
- `bod`, `startofday` - Beginning of day (configurable)
- `eod`, `endofday` - End of day (configurable)

**Weekly:**

- `bow`, `startofweek` - Beginning of week (based on configured week start)
- `eow`, `endofweek` - End of week
- `nextweek` - Next week's start
- `weekend`, `nextsaturday` - Next Saturday

**Monthly:**

- `bom`, `startofmonth` - Beginning of current month
- `eom`, `endofmonth` - End of current month
- `nextmonth` - Beginning of next month

**Quarterly:**

- `boq`, `startofquarter` - Beginning of current quarter
- `eoq`, `endofquarter` - End of current quarter
- `nextquarter` - Beginning of next quarter

**Half-Yearly:**

- `boh`, `startofhalf` - Beginning of current half (H1/H2)
- `eoh`, `endofhalf` - End of current half
- `nexthalf` - Beginning of next half

**Yearly:**

- `boy`, `startofyear` - Beginning of current year
- `eoy`, `endofyear` - End of current year
- `nextyear` - Beginning of next year

#### Natural Language (via chrono-node)

Any natural language date expression is detected:

- "next Friday at 3pm"
- "in 2 weeks"
- "December 25"
- "end of week"

## Configuration

### Date/Time Settings

Configure time boundaries in **Settings → Date & Time**:

1. **Morning**: Default time for "morning" (default: 08:00)
2. **Noon**: Default time for "noon" (default: 12:00)
3. **Afternoon**: Default time for "afternoon" (default: 15:00)
4. **Evening**: Default time for "evening" (default: 19:00)
5. **Work Week Start**: First day of your work week (default: Monday)
6. **Fiscal Year Start**: First month of your fiscal year (default: January)

### Work Hours Settings

Configure work hours in **Settings → Work Hours**:

1. **Start of Day (BOD)**: Default time for "beginning of day" (from work hours start)
2. **End of Day (EOD)**: Default time for "end of day" (from work hours end)

These settings affect how shorthand expressions are interpreted:

- `eod` → Uses your configured work hours end time
- `bow` → Calculates based on your configured work week start
- `eoq` → Calculates quarters based on your fiscal year start

### Auto-Assignment

You can set a default due date for all new todos in **Settings → Auto-Assign**:

1. Set a default due date (e.g., "today", "eod", or a specific date)
2. New todos will use this default if no due date is detected

## Technical Details

### Date Storage Format

Dates are stored in ISO format: `YYYY-MM-DDTHH:mm`

Example: `2025-01-15T17:00`

### Components

- **`src/utils/dateUtils.ts`**: Date parsing and formatting utilities
- **`src/utils/autoDetection.ts`**: Auto-detection using chrono-node
- **`src/components/input/SmartInput.tsx`**: Input with auto-detection
- **`src/components/overlays/TodoDetailsOverlay.tsx`**: Date/time pickers

## Examples

### Simple Todo with Due Date

```text
Buy groceries tomorrow
```

Detected: dueDate = "2025-12-07T12:00"

### End of Day Deadline

```text
Complete code review by eod @john
```

Detected: dueDate = "2025-12-06T17:00" (based on work hours)

### Time Range (with Duration)

```text
Meeting tomorrow 9am to 11am
```

Detected:

- dueDate = "2025-12-07T09:00"
- duration = "2h"

## Benefits

1. **Natural Language**: Type dates the way you think about them
2. **Automatic Detection**: No markers needed, just type naturally
3. **Configurable**: Adapt to your work schedule and calendar
4. **Visual Feedback**: Detected dates are highlighted
5. **Click to Disable**: Click to deactivate incorrect detections
