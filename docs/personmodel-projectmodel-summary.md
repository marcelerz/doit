# PersonModel and ProjectModel Refactoring Summary

## Overview

Following the successful TodoModel abstraction pattern, we've extended the business logic layer to `Person` and `Project` entities. The hooks `usePeople` and `useProjects` now return `PersonModel[]` and `ProjectModel[]` respectively, keeping business logic out of view components.

## Architecture Pattern

All hooks follow the same pattern:

```typescript
// Internal state: raw data objects
const [rawPeople, setRawPeople] = useState<Person[]>([]);

// External interface: wrapped in models via useMemo
const people = useMemo(() => createPersonModels(rawPeople), [rawPeople]);

// Components receive PersonModel[] with built-in business logic
return { people, addPerson, updatePerson, ... };
```

## PersonModel Features

### Validation Methods

```typescript
person.canArchive(); // { canArchive: true/false, reason?: string }
person.canUnarchive(); // { canUnarchive: true/false, reason?: string }
person.canDelete(todos); // Checks if person is assigned to any todos
```

### Computed Properties

**State Checks:**

- `person.isActive` - Not archived
- `person.isArchived` - Is archived

**Comments & Activity:**

- `person.hasComments` - Has any comments
- `person.commentCount` - Total number of comments
- `person.latestComment` - Most recent comment
- `person.hasActivity` - Has any activity
- `person.activityCount` - Total number of activity entries
- `person.latestActivity` - Most recent activity entry

**Display:**

- `person.initials` - Two-letter initials ("JD" from "John Doe")
- `person.displayName` - "John Doe (Johnny, JD)" with alternatives
- `person.statusBadge` - "Active" or "Archived"
- `person.statusColor` - "blue" or "gray"
- `person.allNames` - Array of name + alternatives

### Display & Search Methods

```typescript
// Get formatted metadata summary
person.getMetadataSummary(todoCount);
// Returns: "3 todos • 2 comments • Active"

// Search across all fields
person.matchesSearch("john");
// Searches: name, alternatives, context, comments

// Check if matches any given names (for @mentions)
person.matchesAnyName(["john", "johnny"]);
// Returns: true
```

## ProjectModel Features

### Validation Methods

```typescript
project.canArchive(); // { canArchive: true/false, reason?: string }
project.canUnarchive(); // { canUnarchive: true/false, reason?: string }
project.canDelete(todos); // Checks if project is used in any todos
```

### Computed Properties

**State Checks:**

- `project.isActive` - Not archived
- `project.isArchived` - Is archived

**Comments & Activity:**

- `project.hasComments` - Has any comments
- `project.commentCount` - Total number of comments
- `project.latestComment` - Most recent comment
- `project.hasActivity` - Has any activity
- `project.activityCount` - Total number of activity entries
- `project.latestActivity` - Most recent activity entry

**Display:**

- `project.initials` - Two-letter initials ("WR" from "Website Redesign")
- `project.displayName` - "Website Redesign (website, redesign)" with alternatives
- `project.statusBadge` - "Active" or "Archived"
- `project.statusColor` - "blue" or "gray"
- `project.allNames` - Array of name + alternatives

### Display & Search Methods

```typescript
// Get formatted metadata summary
project.getMetadataSummary(todoCount);
// Returns: "5 todos • 3 comments • Active"

// Search across all fields
project.matchesSearch("website");
// Searches: name, alternatives, context, comments

// Check if matches any given names (for %project mentions)
project.matchesAnyName(["website", "redesign"]);
// Returns: true
```

## Component Updates

### Hook Usage

All components now receive model instances:

```typescript
// Before
const { people } = usePeople(); // Person[]

// After
const { people } = usePeople(); // PersonModel[]
```

### Updated Components

**Item Components:**

- `PersonItem.tsx` - Uses `person.initials`, `person.isActive`, `person.isArchived`, `person.commentCount`
- `ProjectItem.tsx` - Uses `project.initials`, `project.isActive`, `project.isArchived`, `project.commentCount`

**Overlay Components:**

- `PersonDetailsOverlay.tsx` - Accepts `PersonModel`, accesses `.raw` for updates
- `ProjectDetailsOverlay.tsx` - Accepts `ProjectModel`, accesses `.raw` for updates

**View Components:**

- `PeopleView.tsx` - Receives `PersonModel[]`
- `ProjectsView.tsx` - Receives `ProjectModel[]`
- `TodoApp.tsx` - Passes `PersonModel[]` and `ProjectModel[]` to child components
- `CalendarView.tsx` - Accepts `PersonModel[]` and `ProjectModel[]`
- `GanttView.tsx` - Accepts `PersonModel[]` and `ProjectModel[]`

**Input Components:**

- `SmartInput.tsx` - Accepts `PersonModel[]` and `ProjectModel[]`

**Shared Components:**

- `MarkedText.tsx` - Accepts `PersonModel[]` and `ProjectModel[]`

**Settings Components:**

- `AutoAssignTab.tsx` - Accepts `PersonModel[]` and `ProjectModel[]`

## Code Examples

### Using PersonModel in Components

```typescript
// Before: direct property access and manual logic
<div>{person.archived ? "Archived" : "Active"}</div>
<div>{person.name.charAt(0).toUpperCase()}</div>
{person.comments.length > 0 && <span>{person.comments.length}</span>}

// After: using computed properties
<div>{person.statusBadge}</div>
<div>{person.initials}</div>
{person.hasComments && <span>{person.commentCount}</span>}
```

### Using ProjectModel for Validation

```typescript
// Before: manual validation
const handleDelete = (id: string) => {
  const isUsed = todos.some((t) => t.projects?.includes(id));
  if (isUsed) {
    alert("Cannot delete: project is in use");
    return;
  }
  deleteProject(id);
};

// After: using validation method
const handleDelete = (project: ProjectModel) => {
  const validation = project.canDelete(todos);
  if (!validation.canDelete) {
    alert(validation.reason);
    return;
  }
  deleteProject(project.id);
};
```

### Accessing Raw Data

When you need to update storage or pass to hook methods:

```typescript
// Models provide read-only access
const displayName = person.displayName;
const isActive = person.isActive;

// To update, access .raw property
const handleUpdate = (person: PersonModel) => {
  updatePerson(person.id, {
    ...person.raw,
    name: "New Name",
  });
};
```

## Benefits

1. **Consistent Pattern**: All entities (Todo, Person, Project) use the same model abstraction
2. **Cleaner Components**: Business logic moved from views to models
3. **Type Safety**: TypeScript ensures proper usage of model methods
4. **Computed Properties**: Avoid repetitive calculations in components
5. **Validation**: Centralized validation logic with clear error messages
6. **Searchability**: Unified search across all entity fields
7. **Display Helpers**: Consistent formatting across the app

## Migration Notes

- **No data migration needed** - Models wrap existing data structures
- **Zero runtime impact** - Models created via useMemo, no performance overhead
- **Backward compatible** - Raw data still accessible via `.raw` property
- **No breaking changes** - Hook signatures remain the same (return type changes to models)

## Summary

The PersonModel and ProjectModel abstractions complete the business logic layer across all major entities in the app. This provides a consistent, type-safe, and maintainable architecture where:

- **Hooks** manage raw data and expose models
- **Models** encapsulate business logic
- **Components** consume models with clean interfaces

This pattern can be extended to other entities (Priority, etc.) as needed.
