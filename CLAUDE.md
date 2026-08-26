# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev              # Next.js development server
npm run build            # Production build
npm run lint             # ESLint validation
npm run typecheck        # TypeScript type checking
npm run test             # Jest unit tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Coverage report (enforced floor in jest.config.js)
npm run test:e2e         # Playwright E2E tests
npm run test:all         # typecheck + lint + unit + smoke + visual
npm run validate         # test:all, but with the coverage floor enforced
npm run build:gh-pages   # Static export for GitHub Pages
```

## Architecture Overview

**Doit** is a Next.js 16 PWA for todo/project management with offline support, multiple views, and intelligent task parsing.

### Core Layers

**Models (`src/models/`)** - Business logic wrappers around raw data

- `TodoModel`, `PersonModel`, `ProjectModel`, `SettingsModel`
- Provide computed properties, validation, search methods
- Return immutable copies (use `structuredClone` for objects)
- Access `_raw` directly only for count/boolean checks (performance)

**Hooks (`src/hooks/`)** - State management per domain

- `useTodos`, `usePeople`, `useProjects`, `useSettings`, `useSprints`, `useNotes`, `useReviews`
- Return `Model[]` arrays, not raw data
- Auto-save to storage on state changes
- `useListViewState` and `useNotesViewState` manage filter/sort/group state
- `usePersistedViewOptions` and `useViewPresets` persist per-view options and presets;
  both wait for `waitForStorageInit()` before reading, since the adapter is only
  correct once initialization resolves

**Storage (`src/storage/`)** - Persistence abstraction

- `StorageAdapter` interface with `LocalStorageAdapter` and `IndexedDBAdapter`
- Auto-detects IndexedDB support, falls back to localStorage
- Safari Private Mode detection with graceful fallback
- Migration system in `migrations.ts`

### Branded Types (`src/types/`)

All IDs use branded types to prevent mixing:

```typescript
TodoId, PersonId, ProjectId, SprintId, NoteId, ReviewId, Tag;
```

Create with factory functions: `getTodoId()`, `getPersonId()`, etc. Note that
person and project ids currently hold the entity's *name*, not a generated id --
`PersonModel.createId()` mints a uuid, but references are branded names.

### Smart Input System (`src/utils/autoDetection.ts`)

Parses natural language in task input:

- Dates via chrono-node + custom shortcuts
- Recurring patterns ("every monday", "every 2 weeks")
- Person mentions (@name, $source)
- Project references
- Priority and tags

### View Components (`src/components/views/`)

- `TodoApp.tsx` - Main container orchestrating all views
- `ListView.tsx` - Filterable/sortable list with grouping
- `KanbanView.tsx` - Drag-and-drop board with workflow states
- `GanttView.tsx` - Timeline with scheduling algorithms
- `CalendarView.tsx`, `FocusView.tsx`, `OpenFocusView.tsx`, `StatisticsView.tsx`
- `SprintsView.tsx`, `ProjectsView.tsx`, `PeopleView.tsx`, `TimeReportsView.tsx`
- `NotesView.tsx`, `NoteDetailView.tsx`, `ReviewsView.tsx`, `ReviewDetailView.tsx`, `ReviewEditView.tsx`
- `EntityListView.tsx` - shared shell behind PeopleView and ProjectsView

`src/types/viewRegistry.ts` is the authoritative list of views: the tab bar, the
digit shortcuts and the Help documentation all derive from it.

### Component Organization

- `views/` - Large view containers
- `items/` - List item components (TodoItem, TodoListItem, PersonItem, ProjectItem, SprintItem, NoteItem, NoteListItem, ReviewItem, EntityItem)
- `overlays/` - Modals and detail views
- `input/` - SmartInput, RichTextEditor
- `shared/` - reusable components (36 files)
- `settings/` - Settings tab components

## Coding Standards

**Type Comparisons:**

- Booleans: `if (enabled)` not `if (enabled === true)`
- Strings: `if (text === "")` not `if (!text)` (empty string check)
- Numbers: `if (count === 0)` not `if (!count)` (zero check)
- Undefined/null: `if (!value)` or `if (value == null)` acceptable

**Return Values:**

- `null` - lookup failures ("searched but not found")
- `undefined` - optional properties ("not set")

**Immutability:**

- Arrays of primitives: `[...array]`
- Objects: `structuredClone(obj)`

## Testing

**Unit Tests (Jest):** Coverage for code

```bash
npm run test -- path/to/file.test.ts    # Run single test file
npm run test -- --testNamePattern="pattern"  # Run matching tests
```

**E2E Tests (Playwright):** spec files in `e2e/`

```bash
npx playwright test e2e/specific.spec.ts  # Run single E2E file
npx playwright test --ui                   # Interactive UI mode
```

## Key Storage Keys

All prefixed with `doit-` and registered in `STORAGE_KEYS` (`src/storage/storage.ts`),
which is the authoritative list -- no literal key strings elsewhere:

- Data: `todos`, `notes`, `reviews`, `people`, `projects`, `sprints`, `settings`, `templates`
- Per-view options: `view-options`, `gantt-`, `calendar-`, `kanban-`, `notes-`, `reviews-`,
  `people-`, `projects-`, `sprints-view-options`, `time-report-options`, `ui-options`
- Presets: `view-presets`, `notes-view-presets`, `kanban-filter-presets`
- Other: `version`, `backup-settings`, `search-history`, `selection-history`,
  `tutorial-preferences`, `notified-tasks`

Backups use the `doit-backup-` prefix. `STORAGE_KEY_PREFIX` and `BACKUP_KEY_PREFIX`
are exported for code that has to match on the namespace rather than a single key.

## Documentation

Detailed docs in `docs/` cover auto-detection, storage architecture, model usage
and E2E testing patterns.

## Testing notes

- Jest matches `*.test.ts` and `*.test.tsx`; component and hook tests need a
  `/** @jest-environment jsdom */` docblock.
- The coverage floor in `jest.config.js` is a ratchet -- raise it when coverage
  improves, so a later change cannot quietly give the gain back.
- Playwright's port is overridable with `PLAYWRIGHT_PORT`, because
  `reuseExistingServer` will otherwise test whatever already answers on 3000.
- The visual suite allows a 1-2% pixel difference, so a real layout change can
  pass while leaving baselines stale. Delete the baseline and regenerate when
  you need to see the actual before and after.
