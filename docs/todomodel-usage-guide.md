# TodoModel Usage Guide

The `TodoModel` class provides a business logic abstraction layer for Todo objects. It handles auto-assignment, date calculations, validation, and other business rules so that views don't have to implement this logic themselves.

## Overview

`TodoModel` wraps a `Todo` object and a `SettingsModel` to provide smart getters that automatically apply business logic:

- **Auto-assign defaults**: Returns auto-assign values when metadata fields are empty
- **Date normalization**: Converts shorthand dates (e.g., "today") to full dates
- **Date calculations**: Provides helpers like `isOverdue`, `isDueToday`, `daysUntilDue`
- **Display helpers**: Provides formatted strings for display (e.g., `dueDateDisplay`)

## Basic Usage

### In a Hook (useTodos)

`useTodos` returns models, not raw todos. `todos` is already `TodoModel[]`, built once
per render from the raw array and a `SettingsModel`:

```typescript
const { todos, settings } = useTodos();

todos[0].isOverdue; // already a TodoModel
```

The hook also returns `settings`, the raw `Settings` object, for the cases where a
component needs to read a setting directly.

### Building models yourself

Anything outside the hook -- a test, a utility, a component handed raw todos -- goes
through `createTodoModels`, which needs a `SettingsModel` rather than raw settings:

```typescript
import { createTodoModels } from "@/models/TodoModel";
import { createSettingsModel } from "@/models/SettingsModel";

const settingsModel = createSettingsModel(settings);
const models = createTodoModels(rawTodos, settingsModel);
```

`createTodoModels` drops null entries, so a partially-corrupt stored array does not
crash the view that renders it.

## Key Differences: Smart vs Raw Getters

TodoModel provides both "smart" and "raw" getters:

### Smart Getters (with auto-assign)

```typescript
todoModel.assignedPeople; // Returns auto-assign value if empty
todoModel.sourcePeople; // Returns auto-assign value if empty
todoModel.projects; // Returns auto-assign value if empty
todoModel.priority; // Returns auto-assign value if undefined
todoModel.dueDate; // Returns normalized auto-assign value if undefined
todoModel.recurring; // Returns auto-assign value if undefined
```

### When to Use

- **Use smart getters** when displaying data to users (shows what they'll see including auto-assign)
- **Use `metadata` property** when you need exact stored values for editing or saving

## Example: Display Component

A component handed a model reads business logic off it rather than recomputing it:

```typescript
function TodoDisplay({ todoModel }: { todoModel: TodoModel }) {
  return (
    <div>
      <p>Assigned: {todoModel.assignedPeople.join(", ")}</p>
      <p>Due: {todoModel.dueDateDisplay}</p>
      {todoModel.isOverdue && <span>Overdue</span>}
    </div>
  );
}
```

Without the model, each component reimplements the same three rules -- fall back to the
auto-assign person when the list is empty, normalize a shorthand date against the
date-time and work-hours settings, and treat only active todos as overdue -- and they
drift apart as the rules change.

## Example: Filter Component

When filtering, smart getters include auto-assigned values:

```typescript
function FilteredTodoList({ todos, assignedFilter }: Props) {
  const filtered = todos.filter((model) => model.assignedPeople.includes(assignedFilter));

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

When editing, use the `metadata` property to get the exact stored values, so an
auto-assigned person is not saved back as if the user had picked it:

```typescript
function TodoEditor({ todoModel, settings }: Props) {
  const metadata = todoModel.metadata;

  const [assignedPeople, setAssignedPeople] = useState(metadata.assignedPeople);

  // Show an indicator that auto-assign will apply if the field is left empty
  const willAutoAssign =
    assignedPeople.length === 0 && settings.autoAssign.enabled && settings.autoAssign.assignedPerson;

  return (
    <input
      value={assignedPeople.join(", ")}
      placeholder={willAutoAssign ? `Auto: ${settings.autoAssign.assignedPerson}` : ""}
      onChange={(e) => setAssignedPeople(e.target.value.split(","))}
    />
  );
}
```

## Available Properties

### Core Properties

- `id`, `text`, `plainText`, `state`, `createdAt`, `updatedAt`, `completedAt`, `archivedAt`, `deletedAt`, `comments`, `activity`, `context`, `sortOrder`, `workflowState`

### Smart Metadata (with auto-assign)

- `assignedPeople`, `sourcePeople`, `projects`, `priority`, `dueDate`, `recurring`
- `mentionedPeople`, `dependencies`, `tags`, `sprint`, `subtasks`, `timeTracking` (no auto-assign for these)
- `metadata`: Full TodoMetadata object (for editing - exact stored values)

Each list getter has an `...Ids` twin -- `assignedPeopleIds`, `projectIds`, `tagIds`,
`dependencyIds`, `sprintId`, `priorityId` -- returning branded IDs for comparisons.

### Date Helpers

- `dueDateObject`: Due date as Date object
- `dueDateISO`, `dueDateKey`: ISO string and local date key
- `durationMinutes`, `durationSeconds`, `durationDisplay`: Duration in each form
- `isOverdue`: Boolean - is past due and not completed
- `isDueToday`: Boolean - due today
- `isDueThisWeek`: Boolean - due within 7 days
- `daysUntilDue`: Number - days until due (negative if overdue)
- `dueDateDisplay`: String - "Today", "Tomorrow", or formatted date
- `createdDateDisplay`, `updatedDateDisplay`, `completedDateDisplay`, `archivedDateDisplay`, `ageDisplay`

### State Checks

- `isActive`, `isCompleted`, `isArchived`, `isDeleted`
- `isRecurring`: Has a recurring pattern
- `canComplete()`, `canArchive()`, `canUnarchive()`, `canDelete()`: Whether a transition is allowed

### Display Helpers

- `priorityColor`, `priorityName`, `priorityOrder`: Priority resolved against settings
- `statusBadge`, `statusColor`: State as shown in lists
- `recurringPattern`: Parsed recurring pattern object
- `metadataSummary`, `getSummary()`: Compact descriptions for dense rows and tooltips

### Subtasks, Time and Dependencies

- `hasSubtasks`, `subtaskCount`, `completedSubtaskCount`, `subtaskProgress`, `allSubtasksCompleted`
- `hasTimeTracking`, `isTrackingTime`, `activeTimeEntry`, `totalTrackedMinutes`, `totalTrackedTimeDisplay`
- `isBlockerFor(todo)`, `blockedTodosCount`

### Utility

- `raw`: A deep clone of the underlying Todo, safe to modify
- `settings`: The SettingsModel this model resolves against
- `hasFields`: Boolean - has any metadata set
- `matchesSearch(query)`: Text, metadata and comment search in one call
- `updateSettings(settings)`: Point the model at a new SettingsModel

## Migration Strategy

To migrate a component that still takes a raw `Todo`:

1. **Identify metadata access**: Search for `todo.metadata.assignedPeople`, `todo.metadata.dueDate`, etc.
2. **Take a model instead**: Change the prop from `todo: Todo` to `todoModel: TodoModel` -- callers already hold models
3. **Replace direct access**: Change `todo.metadata.assignedPeople` to `todoModel.assignedPeople`
4. **Use helpers**: Replace manual calculations with built-in helpers like `isOverdue`, `dueDateDisplay`
5. **Exact values for editing**: Use `todoModel.metadata` when you need the exact stored values

## Benefits

1. **Centralized logic**: Business rules in one place, not scattered across components
2. **Easier maintenance**: Change auto-assign logic once, affects all components
3. **Type safety**: Branded IDs make it a compile error to pass a project where a person belongs
4. **Consistency**: All views show same calculated values
5. **Simpler components**: Less code, easier to read
6. **Better testing**: Test business logic separately from UI
