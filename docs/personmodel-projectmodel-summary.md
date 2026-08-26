# PersonModel and ProjectModel Refactoring Summary

## Overview

Following the [TodoModel](./todomodel-refactoring-summary.md) pattern, `Person` and
`Project` have a business logic layer too. `usePeople` and `useProjects` return
`PersonModel[]` and `ProjectModel[]`, keeping that logic out of view components.

## Architecture Pattern

Both hooks are thin wrappers around `useEntityManager`, which holds the raw array and
wraps it for consumers:

```typescript
const people = useMemo(() => createPersonModels(rawPeople), [rawPeople]);
```

Unlike `createTodoModels`, neither factory takes settings: nothing on these entities is
resolved against configuration, so a model is a pure view over one raw object.

## What both models share

Almost everything, in `BaseEntityModel` -- `PersonModel` and `ProjectModel` add only
`canDelete`, plus `category` on projects.

### Validation

```typescript
person.canArchive(); // { canArchive: boolean, reason?: string }
person.canUnarchive(); // { canUnarchive: boolean, reason?: string }
person.canDelete(todos); // { canDelete: boolean, reason?: string }
```

`canDelete` takes the todo models and refuses while the entity is still referenced --
"Person is assigned to active todos". It reads `assignedPeopleIds` and `projectIds`, the
getters that include auto-assigned defaults, so a person who is only referenced as an
auto-assign default still counts as in use. Called with no argument it always allows the
delete, so the caller has to pass the todos for the check to mean anything.

### Computed properties

**State**: `isActive`, `isArchived`, `archived`

**Comments and activity**: `hasComments`, `commentCount`, `latestComment`, `hasActivity`,
`activityCount`, `latestActivity`

**Display**:

- `initials` -- first letters of the first and last word ("JD" from "John Doe"), or the
  first two letters of a single-word name
- `displayName` -- `"John Doe (Johnny, JD)"`, or just the name when there are no
  alternatives
- `statusBadge` -- "Active" or "Archived"
- `statusColor` -- `"blue"` or `"gray"`
- `allNames` -- name plus alternatives, the list the @ and % detectors match against
- `name`, `alternatives`, `color`, `context`, `id`, `raw`

### Methods

```typescript
person.getMetadataSummary(todoCount); // "3 todos • 2 comments • Active"
person.matchesSearch("john"); // name, alternatives, context and comments
person.matchesAnyName(["john", "johnny"]); // for @mention and %project resolution
```

`getMetadataSummary` omits a count that is zero or missing, so an entity with nothing on
it renders as just its status rather than "0 todos • 0 comments • Active".

## Components take models

`PersonItem` and `ProjectItem` read `initials`, `isActive`, `isArchived` and
`commentCount` off the model. `PersonDetailsOverlay`, `ProjectDetailsOverlay`,
`PeopleView`, `ProjectsView`, `CalendarView`, `GanttView`, `SmartInput`, `MarkedText` and
`AutoAssignTab` all take the model types.

```typescript
// Before: manual logic in the view
<div>{person.archived ? "Archived" : "Active"}</div>
<div>{person.name.charAt(0).toUpperCase()}</div>
{person.comments.length > 0 && <span>{person.comments.length}</span>}

// After
<div>{person.statusBadge}</div>
<div>{person.initials}</div>
{person.hasComments && <span>{person.commentCount}</span>}
```

Validation follows the same shape -- the reason string comes from the model rather than
being written at each call site:

```typescript
const validation = project.canDelete(todos);
if (!validation.canDelete) {
  showError(validation.reason);
  return;
}
deleteProject(project.id);
```

## Accessing raw data

Models are read views. To update, go through the hook with the raw object, which `.raw`
hands back as a deep clone:

```typescript
updatePerson(person.id, { ...person.raw, name: "New Name" });
```

## A caveat on IDs

`PersonId` and `ProjectId` brand the entity's **name**, not a generated identifier: a
person named "Marcel" has the id `"Marcel"`. That is what makes `@Marcel` in task text
resolvable without a lookup table, and it is why renaming an entity is not a simple field
update. `PersonModel.createId()` mints a `person-<uuid>` and is not what these ids hold.

## Migration notes

- **No data migration** -- models wrap the existing stored shapes
- **Read views only** -- mutation stays in the hooks
- **`.raw` is a clone** -- modifying it does not touch the model or the stored object
