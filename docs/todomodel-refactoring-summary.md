# TodoModel Refactoring Summary

## Overview

`useTodos` returns `TodoModel[]` rather than `Todo[]`, so business logic lives in the
`TodoModel` class instead of being reimplemented in each view. This document records
what that boundary is and why. For the day-to-day API, see
[todomodel-usage-guide.md](./todomodel-usage-guide.md).

## The raw/model boundary

`useTodos` keeps state as `rawTodos: Todo[]`, because every mutation is a plain object
update, and wraps it for consumers:

```typescript
const settingsModel = useMemo(() => createSettingsModel(settings), [settings]);
const todos = useMemo(() => createTodoModels(rawTodos, settingsModel), [rawTodos, settingsModel]);
```

Two consequences worth knowing:

- `createTodoModels` takes a **`SettingsModel`**, not raw `Settings`. Anything building
  models outside the hook has to call `createSettingsModel` first.
- Both memos are keyed on settings, so changing an auto-assign default rebuilds every
  model, and the computed values change with it -- which is the point, and also why the
  settings object must not be rebuilt on every render.

Mutations go the other way: hook methods take IDs and updates, not models, and operate on
`rawTodos`. A model is a read view over one raw todo, never a handle to mutate through.

## Components take models

`TodoItem`, `TodoDetailsOverlay`, `GanttView` and `CalendarView` all take `TodoModel`
props. When a function genuinely needs the plain object -- export, backup, a structural
utility -- `todoModel.raw` hands back a deep clone that is safe to modify.

## What moved into the model

**Transition validation**, previously inline in three call sites and subtly different in
each:

```typescript
const validation = todo.canComplete(allTodos);
if (!validation.canComplete) {
  toast.error(validation.reason); // "Cannot complete: 2 incomplete dependencies: Task A, Task B"
}
```

`canComplete` and `canArchive` take the full model list because they check dependencies;
`canDelete()` and `canUnarchive()` take nothing.

**Auto-assign resolution.** Every metadata getter falls back to the configured default,
while `metadata` keeps the exact stored value:

```typescript
todoModel.assignedPeople; // ["Marcel"] - the auto-assign default
todoModel.metadata.assignedPeople; // [] - what is actually stored
```

That split is what stops an editor from saving a default back as if the user had chosen
it. It applies to `assignedPeople`, `sourcePeople`, `projects`, `priority`, `dueDate` and
`recurring`.

**Search**, which had drifted into four variants that each covered different fields:

```typescript
const filtered = todos.filter((todo) => todo.matchesSearch(searchText));
```

**Date arithmetic**, so "overdue" means the same thing in every view:

```typescript
todoModel.isOverdue; // past due and still active
todoModel.daysUntilDue; // negative when overdue
todoModel.dueDateDisplay; // "Today", "Tomorrow", or a formatted date
```

**Presentation** that had been duplicated per view -- `statusBadge`, `statusColor`,
`metadataSummary`, `ageDisplay`, `getSummary(maxLength)`, `priorityColor`,
`priorityOrder` -- along with the comment and activity counts (`hasComments`,
`commentCount`, `hasActivity`, `activityCount`) and `latestComment`, which flattens the
newest history entry into `{ commentId, content, timestamp }`.

**Dependencies**: `isBlockerFor(allTodos)` returns the incomplete models depending on
this one, and `blockedTodosCount` is the same thing as a number.

## Migrating remaining code

1. Change the prop type from `Todo` to `TodoModel` -- callers already hold models
2. Replace inline logic with the getter that covers it
3. Use `.raw` only where a plain object is genuinely required

```typescript
// Before
const overdue = todos.filter((todo) => {
  /* date arithmetic repeated per view */
});

// After
const overdue = todos.filter((todo) => todo.isOverdue);
```
