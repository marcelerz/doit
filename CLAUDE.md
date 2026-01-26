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
npm run test:coverage    # Coverage report (84%+ target)
npm run test:e2e         # Playwright E2E tests
npm run test:all         # Full validation suite (typecheck + lint + test + e2e + visual)
npm run deploy:gh-pages  # Deploy to GitHub Pages
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

- `useTodos`, `usePeople`, `useProjects`, `useSettings`, `useSprints`
- Return `Model[]` arrays, not raw data
- Auto-save to storage on state changes
- `useListViewState` manages filter/sort/group persistence

**Storage (`src/storage/`)** - Persistence abstraction

- `StorageAdapter` interface with `LocalStorageAdapter` and `IndexedDBAdapter`
- Auto-detects IndexedDB support, falls back to localStorage
- Safari Private Mode detection with graceful fallback
- Migration system in `migrations.ts`

### Branded Types (`src/types/`)

All IDs use branded types to prevent mixing:

```typescript
TodoId, PersonId, ProjectId, SprintId, Tag;
```

Create with factory functions: `getTodoId()`, `getPersonId()`, etc.

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
- `CalendarView.tsx`, `FocusView.tsx`, `StatisticsView.tsx`
- `SprintsView.tsx`, `ProjectsView.tsx`, `PeopleView.tsx`, `TimeReportsView.tsx`

### Component Organization

- `views/` - Large view containers
- `items/` - List item components (TodoItem, PersonItem, ProjectItem, SprintItem)
- `overlays/` - Modals and detail views
- `input/` - SmartInput, RichTextEditor
- `shared/` - 26 reusable components
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

All prefixed with `doit-`: `todos`, `people`, `projects`, `sprints`, `settings`, `version`, `templates`, `view-presets`, `view-options`, `*-view-options`, `ui-options`, `selection-history`, `search-history`, `backup-settings`, `tutorial-preferences`

## Documentation

Detailed docs in `docs/` folder cover auto-detection features, storage architecture, model usage, and E2E testing patterns.
