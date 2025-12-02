# Recurring Tasks Feature

## Overview

The recurring tasks feature allows you to create tasks that automatically generate new instances when completed. This is perfect for repeating activities like "Weekly team meeting", "Monthly review", or "Daily standup".

## Usage

### Basic Syntax

Use the `%` marker followed by a recurring pattern:

```
Buy groceries %every week
Team standup %every workday
Review reports %monthly on 1st
Birthday reminder %yearly on jan 15
```

### Supported Patterns

#### Interval-based

- `%every N days` - Every N days (e.g., `%every 2 days`)
- `%every N weeks` - Every N weeks (e.g., `%every 3 weeks`)
- `%every N months` - Every N months (e.g., `%every 2 months`)
- `%every N quarters` - Every N quarters (e.g., `%every 1 quarter`)
- `%every N halfs` - Every N halves (e.g., `%every 2 halfs`)
- `%every N years` - Every N years (e.g., `%every 1 year`)

#### Weekday-based

- `%every monday` - Every Monday
- `%every tuesday` - Every Tuesday
- `%every wednesday` - Every Wednesday
- `%every thursday` - Every Thursday
- `%every friday` - Every Friday
- `%every saturday` - Every Saturday
- `%every sunday` - Every Sunday
- `%every workday` - Every workday (Monday-Friday)

#### Nth Weekday of Month

- `%every 1st monday` - First Monday of each month
- `%every 2nd tuesday` - Second Tuesday of each month
- `%every 3rd friday` - Third Friday of each month
- `%every last friday` - Last Friday of each month

#### Monthly/Quarterly/Yearly

- `%monthly on 15th` - 15th day of every month
- `%quarterly on 1st` - 1st day of every quarter (Jan/Apr/Jul/Oct)
- `%yearly on jan 15` - January 15th of every year

## How It Works

1. **Create a Task**: Add a task with a recurring pattern using the `%` marker

   ```
   Team meeting %every monday ~next monday *1h
   ```

2. **Complete the Task**: When you mark the task as completed, a new instance is automatically created

3. **New Instance**: The new task:
   - Has the same plain text, markers, and metadata
   - Gets a new due date calculated from the recurring pattern
   - Starts with no comments
   - Is in "active" state
   - Has a new creation timestamp

## Examples

### Daily Tasks

```
Morning meditation %every day
Check emails %every workday
```

### Weekly Tasks

```
Team standup %every monday @john @sarah #project-alpha
Grocery shopping %every week
Backup data %every friday
```

### Monthly Tasks

```
Pay rent %monthly on 1st !!high
Submit timesheet %every last friday
Review goals %monthly on 15th
```

### Quarterly/Yearly Tasks

```
Quarterly review %quarterly on 1st @manager
Annual review %yearly on jan 1
Tax preparation %yearly on apr 1 !!urgent
```

## Combining with Other Markers

Recurring tasks work seamlessly with all other markers:

```
Team sync %every monday @team #project ~next monday *30m !!high
```

This creates a recurring task that:

- Repeats every Monday
- Assigned to @team
- Tagged with #project
- Due next Monday (updated each time)
- Takes 30 minutes
- Has high priority

## Tips

1. **Use Due Dates**: Combine recurring patterns with due dates to keep tasks scheduled
2. **Set Duration**: Add duration markers to help with time management
3. **Assign People**: Pre-assign recurring tasks to team members
4. **Priority Levels**: Mark important recurring tasks with priority markers
5. **Clear Descriptions**: Use descriptive task names so new instances are immediately recognizable

## Autocomplete

When you type `%` in the input field, an autocomplete dropdown appears with common recurring patterns:

- every day
- every 2 days
- every week
- every 2 weeks
- every month
- every workday
- every monday through sunday
- every 1st/2nd/last weekday patterns
- monthly/quarterly/yearly patterns

Type to filter the suggestions or write your own custom pattern.
