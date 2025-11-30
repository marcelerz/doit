# Due Date Feature

## Overview

The todo app now supports comprehensive due date functionality with natural language parsing and configurable time boundaries.

## Usage

### Marker Symbol

Use the `~` symbol to specify due dates in your todos:

```
~tomorrow Do the laundry
~eod Review pull requests
~2025-01-15 Submit report
```

### Supported Formats

#### Shorthand Expressions

The following shorthand expressions are automatically converted to actual date/times:

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

#### Structured Formats

The parser also accepts standard date formats:

- ISO format: `2025-01-15T10:30:00`
- Date strings: `Jan 15, 2025`
- Any format that JavaScript's `Date` can parse

### Autocomplete

When you type `~` in the todo input, an autocomplete dropdown appears with suggestions:

1. Type `~` to see the most common options (today, tomorrow, eod, etc.)
2. Start typing to filter suggestions (e.g., `~eod` shows "eod - End of day")
3. Press Tab or Enter to select a suggestion
4. The shorthand is automatically converted to the actual date/time when saved

Example autocomplete flow:

```
Type: ~eod
Shows: "eod - End of day"
Saved as: "Wed, 25th Dec 2024 5:00pm" (based on your settings)
```

## Configuration

### Date/Time Settings

Configure time boundaries in **Settings → General → Date & Time Configuration**:

1. **Start of Day (BOD)**: Default time for "beginning of day" (default: 09:00)
2. **End of Day (EOD)**: Default time for "end of day" (default: 17:00)
3. **Work Week Start**: First day of your work week (default: Monday)
4. **Fiscal Year Start**: First month of your fiscal year (default: January)

These settings affect how shorthand expressions are interpreted:

- `~eod` → Uses your configured "End of Day" time
- `~bow` → Calculates based on your configured "Work Week Start"
- `~eoq` → Calculates quarters based on your fiscal year start

### Auto-Assignment

You can set a default due date for all new todos in **Settings → General → Auto-Assign Metadata**:

1. Enable auto-assignment
2. Set a default due date (e.g., "tomorrow", "eod", or a specific date)
3. New todos without an explicit `~` marker will use this default

## Technical Details

### Date Storage Format

All dates are stored in the format: `"DayOfWeek, DDth Month YYYY HH:MMam/pm"`

Examples:

- `"Wed, 25th Dec 2024 10:30am"`
- `"Mon, 1st Jan 2025 5:00pm"`
- `"Fri, 13th Dec 2024 11:45pm"`

### Parsing Logic

The date parser (`src/utils/dateParser.ts`) handles:

1. **Shorthand parsing**: Converts expressions like "eod" to actual dates using your configured settings
2. **Date calculation**: Computes relative dates (tomorrow, next week, etc.)
3. **Time application**: Applies configured times (start/end of day) to dates
4. **Format standardization**: Converts all dates to the standard display format

### Components

- **`src/utils/dateParser.ts`**: Core parsing and formatting utilities
- **`src/components/SmartInput.tsx`**: Autocomplete dropdown for due date suggestions
- **`src/components/settings/GeneralTab.tsx`**: Configuration UI for date/time settings
- **`src/types/settings.ts`**: TypeScript types for DateTimeSettings

## Examples

### Simple Todo with Due Date

```
~tomorrow Buy groceries #personal
```

Saved as: `~Thu, 26th Dec 2024 12:00pm Buy groceries #personal`

### End of Day Deadline

```
~eod Complete code review @john #work
```

Saved as: `~Wed, 25th Dec 2024 5:00pm Complete code review @john #work`

### Next Week Planning

```
~nextweek Start new project !!1 #work
```

Saved as: `~Mon, 30th Dec 2024 9:00am Start new project !!1 #work`

### End of Quarter Goal

```
~eoq Review annual goals !!2 @team
```

Saved as: `~Tue, 31st Mar 2025 5:00pm Review annual goals !!2 @team`

## Benefits

1. **Natural Language**: Type dates the way you think about them
2. **Consistency**: All dates are normalized to a standard format
3. **Configurable**: Adapt to your work schedule and fiscal calendar
4. **Fast Input**: Autocomplete makes adding due dates quick
5. **Smart Parsing**: Multiple date format support for flexibility
