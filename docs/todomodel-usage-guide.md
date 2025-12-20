# TodoModel Usage Guide

The `TodoModel` class provides a business logic abstraction layer for Todo objects. It handles auto-assignment, date calculations, validation, and other business rules so that views don't have to implement this logic themselves.

## Overview

`TodoModel` wraps a `Todo` object and a `Settings` object to provide smart getters that automatically apply business logic:

- **Auto-assign defaults**: Returns auto-assign values when metadata fields are empty
- **Date normalization**: Converts shorthand dates (e.g., "today") to full dates
- **Date calculations**: Provides helpers like `isOverdue`, `isDueToday`, `daysUntilDue`
- **Display helpers**: Provides formatted strings for display (e.g., `dueDateDisplay`)

## Basic Usage

### In a Hook (useTodos)

The `useTodos` hook now exports a `createModels()` helper and `settings`:

```typescript
const { todos, settings, createModels, ...otherMethods } = useTodos();

// Create TodoModel instances
const todoModels = createModels(); // Uses all todos
const specificModels = createModels(filteredTodos); // Uses specific todos
```

### In a Component

```typescript
import { TodoModel } from "@/models/TodoModel";

function MyComponent() {
  const { todos, settings, createModels } = useTodos();

  // Create models
  const todoModels = createModels();

  // Or create a single model
  const todo = todos[0];
  const todoModel = new TodoModel(todo, settings);

  // Use smart getters
  console.log(todoModel.assignedPeople); // Returns auto-assign if empty
  console.log(todoModel.dueDate); // Normalized date
  console.log(todoModel.isOverdue); // Boolean
  console.log(todoModel.dueDateDisplay); // "Today", "Tomorrow", or formatted date
}
```

## Key Differences: Smart vs Raw Getters

TodoModel provides both "smart" and "raw" getters:

### Smart Getters (with auto-assign)

```typescript
todoModel.assignedPeople; // Returns auto-assign value if empty
todoModel.sourcePeople; // Returns auto-assign value if empty
todoModel.projects; // Returns auto-assign value if empty
todoModel.priority; // Returns auto-assign value if undefined
todoModel.dueDate; // Returns normalized auto-assign value if undefined
todoModel.duration; // Returns auto-assign value if undefined
todoModel.recurring; // Returns auto-assign value if undefined
```

### When to Use

- **Use smart getters** when displaying data to users (shows what they'll see including auto-assign)
- **Use `metadata` property** when you need exact stored values for editing or saving

## Example: Display Component

Here's how to update a display component to use TodoModel:

### Before (without TodoModel)

```typescript
function TodoDisplay({ todo, settings }: Props) {
  // Manual auto-assign logic
  const assignedPeople =
    todo.metadata.assignedPeople.length > 0
      ? todo.metadata.assignedPeople
      : settings.autoAssign.enabled && settings.autoAssign.assignedPerson
      ? [settings.autoAssign.assignedPerson]
      : [];

  // Manual date normalization
  const dueDate = todo.metadata.dueDate
    ? normalizeDateValue(todo.metadata.dueDate, settings.dateTime, settings.workHours)
    : settings.autoAssign.enabled && settings.autoAssign.dueDate
    ? normalizeDateValue(settings.autoAssign.dueDate, settings.dateTime, settings.workHours)
    : undefined;

  // Manual overdue calculation
  const isOverdue = dueDate && new Date(dueDate) < new Date() && todo.state === "active";

  return (
    <div>
      <p>Assigned: {assignedPeople.join(", ")}</p>
      <p>Due: {dueDate}</p>
      {isOverdue && <span>OVERDUE!</span>}
    </div>
  );
}
```

### After (with TodoModel)

```typescript
function TodoDisplay({ todo, settings }: Props) {
  const todoModel = new TodoModel(todo, settings);

  return (
    <div>
      <p>Assigned: {todoModel.assignedPeople.join(", ")}</p>
      <p>Due: {todoModel.dueDateDisplay}</p>
      {todoModel.isOverdue && <span>OVERDUE!</span>}
    </div>
  );
}
```

## Example: Filter Component

When filtering, you can use smart getters to include auto-assigned values:

```typescript
function FilteredTodoList({ todos, settings, assignedFilter }: Props) {
  const todoModels = createTodoModels(todos, settings);

  // Filter using smart getters (includes auto-assign)
  const filtered = todoModels.filter((model) => model.assignedPeople.includes(assignedFilter));

  return (
    <ul>
      {filtered.map((model) => (
        <TodoItem key={model.id} todoModel={model} />
      ))}
    </ul>
  );
}
```

## Example: Edit Component

When editing, use the `metadata` property to get the exact stored values:

```typescript
function TodoEditor({ todo, settings, onSave }: Props) {
  const todoModel = new TodoModel(todo, settings);
  const metadata = todoModel.metadata;

  // Use metadata for editing (don't show auto-assign as if user set it)
  const [assignedPeople, setAssignedPeople] = useState(metadata.assignedPeople);
  const [dueDate, setDueDate] = useState(metadata.dueDate ?? "");

  // Show indicator that auto-assign will apply if empty
  const willAutoAssign =
    assignedPeople.length === 0 && settings.autoAssign.enabled && settings.autoAssign.assignedPerson;

  return (
    <div>
      <input
        value={assignedPeople.join(", ")}
        onChange={(e) => setAssignedPeople(e.target.value.split(","))}
        placeholder={willAutoAssign ? `Auto: ${settings.autoAssign.assignedPerson}` : ""}
      />
      {willAutoAssign && <small>Will auto-assign to {settings.autoAssign.assignedPerson}</small>}
    </div>
  );
}
```

## Available Properties

### Core Properties

- `id`, `text`, `plainText`, `state`, `createdAt`, `updatedAt`, `completedAt`, `archivedAt`, `deletedAt`, `comments`, `activity`, `context`

### Smart Metadata (with auto-assign)

- `assignedPeople`, `sourcePeople`, `projects`, `priority`, `dueDate`, `duration`, `recurring`
- `mentionedPeople`, `dependencies`, `tags` (no auto-assign for these)
- `metadata`: Full TodoMetadata object (for editing - exact stored values)

### Date Helpers

- `dueDateObject`: Due date as Date object
- `durationMinutes`: Duration in minutes
- `isOverdue`: Boolean - is past due and not completed
- `isDueToday`: Boolean - due today
- `isDueThisWeek`: Boolean - due within 7 days
- `daysUntilDue`: Number - days until due (negative if overdue)
- `dueDateDisplay`: String - "Today", "Tomorrow", or formatted date

### State Checks

- `isActive`, `isCompleted`, `isArchived`, `isDeleted`
- `isRecurring`: Has a recurring pattern

### Display Helpers

- `priorityColor`: Color for the priority
- `priorityOrder`: Order number (lower = higher priority)
- `recurringPattern`: Parsed recurring pattern object

### Utility

- `metadata`: Full TodoMetadata object
- `effectiveMetadata`: Metadata with auto-assign applied
- `raw`: Original Todo object
- `hasMetadata`: Boolean - has any metadata set
- `wouldAutoAssignApply`: Boolean - would auto-assign apply to empty fields
- `updateSettings(settings)`: Update settings (if settings change)

## Migration Strategy

To migrate existing components:

1. **Identify metadata access**: Search for `todo.metadata.assignedPeople`, `todo.metadata.dueDate`, etc.
2. **Create TodoModel**: Add `const todoModel = new TodoModel(todo, settings);` at the top
3. **Replace direct access**: Change `todo.metadata.assignedPeople` to `todoModel.assignedPeople`
4. **Use helpers**: Replace manual calculations with built-in helpers like `isOverdue`, `dueDateDisplay`
5. **Exact values for editing**: Use `todoModel.metadata` when you need the exact stored values

## Benefits

1. **Centralized logic**: Business rules in one place, not scattered across components
2. **Easier maintenance**: Change auto-assign logic once, affects all components
3. **Type safety**: TypeScript ensures correct usage
4. **Consistency**: All views show same calculated values
5. **Simpler components**: Less code, easier to read
6. **Better testing**: Test business logic separately from UI

## Future Enhancements

The TodoModel can be extended to handle:

- Setting metadata (e.g., `setDueDate()` that also updates delay date)
- Validation (e.g., `canComplete()` checks dependencies)
- Computed fields (e.g., `estimatedEndTime` from duration + due date)
- Change detection (e.g., `hasChanged()` for dirty state)
- Batch operations (e.g., `assignTo(person)` updates metadata and text)
