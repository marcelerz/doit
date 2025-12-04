# TodoModel Refactoring Summary

## Overview

The `useTodos` hook now returns `TodoModel[]` instead of `Todo[]`, which allows business logic to live in the `TodoModel` class rather than in view components. This makes the codebase more maintainable and easier to test.

## What Changed

### 1. **useTodos Hook**

**Before:**

```typescript
const { todos } = useTodos();
// todos: Todo[]
```

**After:**

```typescript
const { todos } = useTodos();
// todos: TodoModel[]
```

#### Internal Implementation

- **Raw state management**: Internally, `useTodos` maintains state as `rawTodos: Todo[]` for simpler mutation operations
- **Automatic wrapping**: The hook uses `useMemo` to automatically wrap `rawTodos` with `TodoModel` instances
- **Seamless conversion**: All CRUD operations work with raw `Todo` objects internally, but consumers only see `TodoModel` instances

```typescript
export function useTodos() {
  const [rawTodos, setRawTodos] = useState<Todo[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Automatically wrap in TodoModel for consumers
  const todos = useMemo(() => createTodoModels(rawTodos, settings), [rawTodos, settings]);

  // ... CRUD operations work with rawTodos internally

  return { todos /* ... */ };
}
```

### 2. **Component Props**

All components that accept todos now expect `TodoModel[]`:

- `TodoItem` - accepts `todo: TodoModel`
- `TodoDetailsOverlay` - accepts `todo: TodoModel` and `todos?: TodoModel[]`
- `GanttView` - accepts `todos: TodoModel[]`
- `CalendarView` - accepts `todos: TodoModel[]`
- `SmartInput` - accepts `availableTodos?: TodoModel[]`

### 3. **Backward Compatibility**

Since `TodoModel` exposes all the same properties as `Todo` (via getters), existing code continues to work:

```typescript
// These all still work
todo.id;
todo.text;
todo.plainText;
todo.state;
todo.metadata;
todo.comments;
todo.activity;
```

## Benefits of TodoModel

### 1. **Validation Methods**

TodoModel provides validation methods that check state and dependencies:

```typescript
const validation = todoModel.canComplete(allTodos);
if (!validation.canComplete) {
  console.log(validation.reason); // "Cannot complete: 2 incomplete dependencies: Task A, Task B"
}

// Other validation methods
todoModel.canArchive(allTodos); // { canArchive: boolean, reason?: string }
todoModel.canDelete(); // { canDelete: boolean, reason?: string }
todoModel.canUnarchive(); // { canUnarchive: boolean, reason?: string }
```

### 2. **Auto-Assign with Smart Getters**

TodoModel automatically applies auto-assign defaults when fields are empty:

```typescript
// Without auto-assign
todo.metadata.assignedPeople; // []

// With TodoModel (if auto-assign is enabled)
todoModel.assignedPeople; // ["Marcel"] - automatically applies default
todoModel.assignedPeopleRaw; // [] - get the raw value without auto-assign
```

This works for: `assignedPeople`, `sourcePeople`, `projects`, `priority`, `dueDate`, `duration`, `recurring`

### 3. **Computed UI Properties**

TodoModel provides many computed properties for the UI:

```typescript
todoModel.hasComments; // boolean
todoModel.commentCount; // number
todoModel.hasActivity; // boolean
todoModel.activityCount; // number
todoModel.latestComment; // { commentId, content, date }
todoModel.latestActivity; // ActivityEntry
todoModel.createdDateDisplay; // "12/3/2025"
todoModel.updatedDateDisplay; // "12/3/2025"
todoModel.completedDateDisplay; // "12/3/2025"
todoModel.ageDisplay; // "2 hours ago"
```

### 4. **Date Calculations**

TodoModel provides convenient date-related computed properties:

```typescript
todoModel.isOverdue; // true if past due and not completed
todoModel.isDueToday; // true if due today
todoModel.isDueThisWeek; // true if due within 7 days
todoModel.daysUntilDue; // number of days until due (negative if overdue)
todoModel.dueDateObject; // Date object for the due date
todoModel.dueDateDisplay; // "Today", "Tomorrow", or formatted date
```

### 5. **Display & Formatting Methods**

Clean methods for displaying todos in the UI:

```typescript
todoModel.getSummary(100); // Truncated text with max length
todoModel.statusBadge; // "Completed", "Overdue", "Due Today", etc.
todoModel.statusColor; // "#10b981" for completed, "#dc2626" for overdue, etc.
todoModel.metadataSummary; // "2 people, 1 project, High priority, due Today"
todoModel.durationDisplay; // "2h" (formatted from "2h" or "120m")
todoModel.matchesSearch("keyword"); // boolean - searches across all fields
todoModel.isBlockerFor(allTodos); // TodoModel[] - tasks that depend on this one
```

### 6. **State Checks**

Clean boolean properties for state checks:

```typescript
todoModel.isActive; // state === "active"
todoModel.isCompleted; // state === "completed"
todoModel.isArchived; // state === "archived"
todoModel.isDeleted; // state === "deleted"
todoModel.isRecurring; // has recurring pattern
```

### 7. **Priority Helpers**

Get priority-related data from settings:

```typescript
todoModel.priorityColor; // "#ff0000"
todoModel.priorityOrder; // 1 (lower = higher priority)
```

### 8. **Duration Parsing**

Get duration in minutes:

```typescript
todoModel.duration; // "2h"
todoModel.durationMinutes; // 120
```

### 9. **Metadata Operations**

Convenient metadata checks:

```typescript
todoModel.hasMetadata; // true if any metadata is set
todoModel.wouldAutoAssignApply; // true if auto-assign would affect this todo
todoModel.effectiveMetadata; // metadata with auto-assign applied
```

## Usage Examples

### Before (with raw Todo)

```typescript
function TodoList() {
  const { todos, settings } = useTodos();

  // Complex validation logic
  const canComplete = (todo: Todo) => {
    if (todo.state === "completed") return false;
    if (todo.metadata.dependencies.length > 0) {
      const unsatisfied = todo.metadata.dependencies
        .map((depId) => todos.find((t) => t.id === depId))
        .filter((t) => t && t.state !== "completed");
      if (unsatisfied.length > 0) return false;
    }
    return true;
  };

  // Complex search logic
  const filteredTodos = todos.filter((todo) => {
    const searchLower = searchText.toLowerCase();
    return (
      todo.plainText.toLowerCase().includes(searchLower) ||
      todo.metadata.assignedPeople.some((p) => p.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div>
      {filteredTodos.map((todo) => (
        <TodoItem todo={todo} />
      ))}
    </div>
  );
}
```

### After (with TodoModel)

```typescript
function TodoList() {
  const { todos } = useTodos();

  // Business logic is in TodoModel
  const validation = todo.canComplete(todos);
  if (!validation.canComplete) {
    alert(validation.reason);
  }

  const filteredTodos = todos.filter((todo) => todo.matchesSearch(searchText));

  return (
    <div>
      {filteredTodos.map((todo) => (
        <TodoItem todo={todo} />
      ))}
    </div>
  );
}
```

### Accessing Raw Todo When Needed

If you need the raw `Todo` object (e.g., for mutations):

```typescript
const rawTodo = todoModel.raw;
```

## Advanced Examples

### 1. Validation with User Feedback

```typescript
function CompleteTodoButton({ todo, allTodos }: { todo: TodoModel; allTodos: TodoModel[] }) {
  const handleComplete = () => {
    const validation = todo.canComplete(allTodos);
    if (!validation.canComplete) {
      toast.error(validation.reason);
      return;
    }
    onToggle(todo.id);
  };

  return <button onClick={handleComplete}>Complete</button>;
}
```

### 2. Smart Status Display

```typescript
function TodoStatus({ todo }: { todo: TodoModel }) {
  return <Badge color={todo.statusColor}>{todo.statusBadge}</Badge>;
}
```

### 3. Dependency Management

```typescript
function DependencyList({ todo, allTodos }: { todo: TodoModel; allTodos: TodoModel[] }) {
  const blockedTodos = todo.isBlockerFor(allTodos);

  return (
    <div>
      {blockedTodos.length > 0 && <p>Blocking {blockedTodos.length} tasks:</p>}
      {blockedTodos.map((blocked) => (
        <div key={blocked.id}>{blocked.plainText}</div>
      ))}
    </div>
  );
}
```

### 4. Metadata Summary Display

```typescript
function TodoCard({ todo }: { todo: TodoModel }) {
  return (
    <div>
      <h3>{todo.getSummary(50)}</h3>
      <p className="text-gray-500">{todo.metadataSummary}</p>
      <p className="text-sm">Created {todo.ageDisplay}</p>
      {todo.hasComments && <p>{todo.commentCount} comments</p>}
    </div>
  );
}
```

### 5. Search with TodoModel

```typescript
function SearchableTodoList({ todos, searchText }: { todos: TodoModel[]; searchText: string }) {
  const filtered = todos.filter((todo) => todo.matchesSearch(searchText));

  return (
    <div>
      <p>Found {filtered.length} todos</p>
      {filtered.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}
```

## Migration Guide

If you have custom code that works with todos:

1. **Update type annotations**: Change `Todo` to `TodoModel` in component props
2. **Use TodoModel properties**: Replace complex logic with TodoModel getters
3. **Access raw when mutating**: Use `todoModel.raw` if you need to pass to a function expecting `Todo`

### Example Migration

**Before:**

```typescript
interface MyComponentProps {
  todos: Todo[];
}

function MyComponent({ todos }: MyComponentProps) {
  const overdueTodos = todos.filter((todo) => {
    // complex date logic...
  });
}
```

**After:**

```typescript
interface MyComponentProps {
  todos: TodoModel[];
}

function MyComponent({ todos }: MyComponentProps) {
  const overdueTodos = todos.filter((todo) => todo.isOverdue);
}
```

## Future Enhancements

Additional business logic that could be added to TodoModel:

1. **Progress Tracking**: `todoModel.progressPercentage` (based on dependencies or subtasks)
2. **Time Estimates**: `todoModel.estimatedCompletionTime` (based on duration and schedule)
3. **Smart Scheduling**: `todoModel.suggestedStartTime(workHours)` (when to start based on due date)
4. **Effort Calculation**: `todoModel.effortScore` (complexity based on metadata)
5. **Batch Operations**: `TodoModel.bulkUpdate()`, `TodoModel.bulkValidate()`
6. **Export/Import**: `todoModel.toJSON()`, `TodoModel.fromJSON()`

## Complete API Reference

### Properties (Read-only)

- Core: `id`, `text`, `plainText`, `state`, `createdAt`, `updatedAt`, `completedAt`, `archivedAt`, `deletedAt`
- Metadata (with auto-assign): `assignedPeople`, `sourcePeople`, `projects`, `priority`, `dueDate`, `duration`, `recurring`, `dependencies`, `tags`
- Metadata (raw): `assignedPeopleRaw`, `sourcePeopleRaw`, `projectsRaw`, `priorityRaw`, `dueDateRaw`, `durationRaw`, `recurringRaw`
- State checks: `isActive`, `isCompleted`, `isArchived`, `isDeleted`, `isRecurring`
- Date properties: `isOverdue`, `isDueToday`, `isDueThisWeek`, `daysUntilDue`, `dueDateObject`, `dueDateDisplay`
- UI properties: `hasComments`, `commentCount`, `hasActivity`, `activityCount`, `hasMetadata`
- Display: `statusBadge`, `statusColor`, `metadataSummary`, `ageDisplay`, `durationDisplay`, `priorityColor`, `priorityOrder`
- Dates: `createdDateDisplay`, `updatedDateDisplay`, `completedDateDisplay`
- Latest: `latestComment`, `latestActivity`

### Methods

- Validation: `canComplete(allTodos)`, `canArchive(allTodos)`, `canDelete()`, `canUnarchive()`
- Search: `matchesSearch(searchText)`
- Display: `getSummary(maxLength)`
- Dependencies: `isBlockerFor(allTodos)`
- Raw access: `raw` property

## Files Changed

- `src/models/TodoModel.ts` - Added 30+ new methods and properties
- `src/hooks/useTodos.ts` - Returns `TodoModel[]`, uses validation methods
- `src/components/items/TodoItem.tsx` - Accepts `TodoModel`
- `src/components/overlays/TodoDetailsOverlay.tsx` - Accepts `TodoModel`
- `src/components/views/TodoApp.tsx` - Uses `matchesSearch()` method
- `src/components/views/GanttView.tsx` - Accepts `TodoModel[]`
- `src/components/views/CalendarView.tsx` - Accepts `TodoModel[]`
- `src/components/input/SmartInput.tsx` - Accepts `TodoModel[]` for dependencies
