# Recurring Tasks Feature

## Overview

The recurring tasks feature allows you to create tasks that automatically generate new instances when completed. This is perfect for repeating activities like "Weekly team meeting", "Monthly review", or "Daily standup".

## Usage

### Auto-Detection (Recommended)

Recurring patterns are **automatically detected** when you type phrases starting with "every":

```text
Buy groceries every week
Team standup every workday
Review reports every month
Birthday reminder every year on jan 15
```

The system recognizes the pattern and automatically:

1. Sets up the recurring schedule
2. Calculates the first due date from the pattern
3. Highlights the pattern in the input

### Supported Patterns

#### Interval-based

- `every N days` - Every N days (e.g., `every 2 days`)
- `every N weeks` - Every N weeks (e.g., `every 3 weeks`)
- `every N months` - Every N months (e.g., `every 2 months`)
- `every N quarters` - Every N quarters (e.g., `every 1 quarter`)
- `every N halfs` - Every N halves (e.g., `every 2 halfs`)
- `every N years` - Every N years (e.g., `every 1 year`)

#### Weekday-based

- `every monday` - Every Monday
- `every tuesday` - Every Tuesday
- `every wednesday` - Every Wednesday
- `every thursday` - Every Thursday
- `every friday` - Every Friday
- `every saturday` - Every Saturday
- `every sunday` - Every Sunday
- `every workday` - Every workday (Monday-Friday)

#### Nth Weekday of Month

- `every 1st monday` - First Monday of each month
- `every 2nd tuesday` - Second Tuesday of each month
- `every 3rd friday` - Third Friday of each month
- `every last friday` - Last Friday of each month

## How It Works

1. **Create a Task**: Type a task with a recurring pattern

   ```text
   Team meeting every monday
   ```

2. **Auto-Detection**: The system automatically:

   - Detects "every monday" as a recurring pattern
   - Creates a due date for the first occurrence
   - Sets up the recurring schedule

3. **Complete the Task**: When you mark the task as completed, a new instance is automatically created

4. **New Instance**: The new task:
   - Has the same plain text and metadata
   - Gets a new due date calculated from the recurring pattern
   - Starts with no comments
   - Is in "active" state
   - Has a new creation timestamp

## Examples

### Daily Tasks

```text
Morning meditation every day
Check emails every workday
```

### Weekly Tasks

```text
Team standup every monday @john @sarah %project-alpha
Grocery shopping every week
Backup data every friday
```

### Monthly Tasks

```text
Pay rent every month !!high
Submit timesheet every last friday
Review goals every month on 15th
```

### Quarterly/Yearly Tasks

```text
Quarterly review every quarter @manager
Annual review every year on jan 1
Tax preparation every year on apr 1 !!urgent
```

## Combining with Other Input Methods

Recurring tasks work seamlessly with all other markers and auto-detection:

```text
Team sync every monday @team %project 30m !!high
```

This creates a recurring task that:

- Repeats every Monday
- Assigned to @team
- Tagged with %project
- Due date is calculated from the pattern (first occurrence)
- Takes 30 minutes (auto-detected duration)
- Has high priority

## Tips

1. **Natural Language**: Just type "every monday" or "every 2 weeks" - no special markers needed
2. **Time Ranges**: Add times like "every monday at 9am to 5pm" for recurring events with duration
3. **Assign People**: Pre-assign recurring tasks with @person markers
4. **Priority Levels**: Mark important recurring tasks with !!priority
5. **Clear Descriptions**: Use descriptive task names so new instances are immediately recognizable

## Visual Feedback

When you type a recurring pattern:

- The pattern is highlighted with a colored background
- A dotted underline indicates it's auto-detected
- Click on it to deactivate if needed
- Both the due date and recurring pattern are captured from a single phrase

## Recurring Pattern Suggestions

When editing a todo in the details overlay, you can access recurring pattern suggestions through the Recurring field. Common patterns available include:

- every day
- every 2 days
- every week
- every 2 weeks
- every month
- every workday
- every monday through sunday
- every 1st/2nd/last weekday patterns
