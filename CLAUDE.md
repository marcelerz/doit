# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

Node 24 or newer; the version is pinned in `.nvmrc` and CI reads it from there.

```bash
npm run dev              # Next.js development server
npm run build            # Production build
npm run build:gh-pages   # Static export for GitHub Pages (set GITHUB_PAGES=true)
npm run start            # Serve a production build
npm run clean            # Remove .next and coverage
npm run lint             # ESLint validation
npm run typecheck        # TypeScript type checking

npm run test             # Jest unit tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Unit tests with the coverage floor in jest.config.js enforced
npm run test:tz          # Unit tests in four time zones, one after the other

npm run test:smoke       # Playwright smoke suite: desktop and phone projects (Chromium)
npm run test:smoke:quick # Desktop smoke project only
npm run test:smoke:headed  # Desktop smoke project in a visible browser
npm run test:visual      # Visual regression suite
npm run test:visual:update # Rewrite the baselines that currently fail
npm run test:browsers    # A smoke subset in WebKit and Firefox
npm run test:pwa         # Builds the static export and tests offline reload and updates
npm run test:e2e         # Every project in playwright.config.ts (needs all three browsers)
npm run test:e2e:ui      # ...in Playwright's UI mode; also :headed, :debug, :report

npm run test:all         # typecheck + lint + unit + smoke + visual
npm run test:full        # unit + smoke + visual
npm run validate         # test:all, but with the coverage floor enforced

npm run setup:hooks      # Install the pre-commit hook (also runs on npm install)
npm run bump:minor       # Bump version.json's minor and reset the revision
npm run bump:major       # Bump version.json's major and reset minor and revision
```

## Architecture Overview

**Doit** is a Next.js 16 PWA for todo/project management with offline support, multiple views, and intelligent task parsing.

### Core Layers

**Models (`src/models/`)** - Business logic wrappers around raw data

- `TodoModel`, `NoteModel`, `ReviewModel`, `SprintModel`, `SettingsModel`
- `PersonModel` and `ProjectModel`, which share `BaseEntityModel`
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
- Migration system in `migrations.ts`; backups in `backup.ts`
- `keys.ts` is the key registry (see Key Storage Keys below)

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
- `CalendarView.tsx`, `StatisticsView.tsx`
- `SprintsView.tsx`, `ProjectsView.tsx`, `PeopleView.tsx`, `TimeReportsView.tsx`
- `NotesView.tsx`, `NoteDetailView.tsx`, `ReviewsView.tsx`, `ReviewDetailView.tsx`, `ReviewEditView.tsx`
- `EntityListView.tsx` - shared shell behind PeopleView and ProjectsView

`src/types/viewRegistry.ts` is the authoritative list of views. The tab bar, the
digit shortcuts and the shortcut table in Help derive from it; the other Help
sections are written by hand.

### Component Organization

- `views/` - Large view containers
- `items/` - List item components (TodoItem, TodoListItem, PersonItem, ProjectItem, SprintItem, NoteItem, NoteListItem, ReviewItem, EntityItem)
- `overlays/` - Modals, detail views, and the two full-screen focus modes
- `overlays/help/` - The sections of the Help overlay
- `input/` - SmartInput, RichTextEditor
- `shared/` - Reusable components
- `settings/` - One component per settings tab
- `settings/components/` - Pieces shared by the settings tabs
- `providers/` - ThemeProvider, StorageInitializer, ServiceWorkerProvider

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

**Logging:**

- `createLogger(scope)` from `src/utils/logger.ts`, not `console.warn` or `console.error`.
  Every line is prefixed `[doit:<scope>]`.
- `warn` and `error` always print. `debug` and `info` are silent in a production build
  unless `localStorage["doit-debug"]` is `"true"`.
- Nine `console.log` lines in `storage.ts` and `useServiceWorker.ts` are left as they are
  for now, and `public/sw.js` cannot import the logger.

## Testing

**Unit Tests (Jest):** Coverage for code

```bash
npm run test -- path/to/file.test.ts    # Run single test file
npm run test -- --testNamePattern="pattern"  # Run matching tests
```

**E2E Tests (Playwright):** spec files in `e2e/`

```bash
npx playwright test e2e/smoke/specific.spec.ts  # Run single E2E file
npx playwright test --ui                        # Interactive UI mode
```

`docs/e2e-testing.md` describes the projects, the fixtures and where a new spec goes.

**CI** (`.github/workflows/ci.yml`) runs on every pull request and push to `main`:
typecheck, lint, unit tests with the coverage floor, the unit tests again in a time
zone ahead of UTC, the static build, and the Chromium smoke suite. The visual suite,
the WebKit and Firefox subset and the PWA run are local only.

## Key Storage Keys

All prefixed with `doit-` and registered in `STORAGE_KEYS`, which is the authoritative
list -- no literal key strings elsewhere. The registry lives in `src/storage/keys.ts`,
a module with no imports, so the server-rendered layout, the logger and the e2e tests
can read it without loading the storage layer. `storage.ts` re-exports all of it, and
that is where application code imports from.

- Data: `todos`, `notes`, `reviews`, `people`, `projects`, `sprints`, `settings`, `templates`
- Per-view options: `view-options`, `gantt-`, `calendar-`, `kanban-`, `notes-`, `reviews-`,
  `people-`, `projects-`, `sprints-view-options`, `time-report-options`, `ui-options`
- Presets: `view-presets`, `notes-view-presets`, `kanban-filter-presets`
- Other: `version`, `backup-settings`, `search-history`, `selection-history`,
  `tutorial-preferences`, `notified-tasks`, `focus-session`, `focus-sessions`

Backups use the `doit-backup-` prefix. `STORAGE_KEY_PREFIX` and `BACKUP_KEY_PREFIX`
are exported for code that has to match on the namespace rather than a single key.

`INTERNAL_STORAGE_KEYS` lists the names under the prefix that are bookkeeping, not
user data (the migration flag, the IndexedDB probe, the database name, `doit-debug`).
They are left out of backups and of storage migration.

## Versioning

- `version.json` is the authoritative version. The footer shows it and the build stamps
  it into the service worker, which is how browsers notice a new deploy.
- The pre-commit hook adds one to its revision on **every** commit, amends included,
  and stages the file. A `version.json` change in every commit is expected. `npm install`
  installs the hook; it leaves a hook it did not write alone, and does nothing when
  `core.hooksPath` is set or in CI.
- `npm run bump:minor` and `npm run bump:major` are for larger steps.
- A `CHANGELOG.md` heading uses the value `version.json` has after the last commit of
  the change it describes.
- `package.json`'s `version` (0.1.0) is not used for anything.

## Documentation

Detailed docs in `docs/` cover auto-detection, storage architecture, model usage
and E2E testing patterns.

`docs/sweep-2026-11/` holds the November 2026 codebase sweep: the backlog and the
phased roadmap. Start at its `README.md`, which says how a batch is run.

## Testing notes

- Jest matches `*.test.ts` and `*.test.tsx`; component and hook tests need a
  `/** @jest-environment jsdom */` docblock.
- Shared test helpers are in `src/__tests__/helpers/`: `fixtures.ts` (settings and
  entity factories), `storageMock.ts` (`mockStorageModule()`, the one mock of
  `@/storage/storage`) and `mockBrowserApis.ts`.
- Jest pins the time zone to `America/Los_Angeles` unless `TZ` is set, and Playwright
  uses the same zone. A zone behind UTC is where a date-only string parsed as UTC shows
  up as the previous day. `npm run test:tz` runs the suite in four zones. Setting
  `process.env.TZ` inside a test does nothing: each test file gets a copy of the
  environment.
- A test pins behaviour that is right. Where today's behaviour is a known defect, the
  case is an `it.todo` (or `test.fixme` in Playwright) that names the backlog unit, and
  the fix turns it into the reproducer. Activity tests assert entry types, not wording.
- The coverage floor in `jest.config.js` is a ratchet -- raise it when coverage
  improves, so a later change cannot quietly give the gain back. A file or folder with
  its own key there is checked on its own and leaves the global group. Set a floor
  below the exact measured figure: 71.095 prints as 71.10 and fails a floor of 71.1.
- Playwright's port is overridable with `PLAYWRIGHT_PORT`, because
  `reuseExistingServer` will otherwise test whatever already answers on 3000.
- The visual suite fixes the clock (30 August 2026, 10:00) and applies `e2e/visual.css`
  while a screenshot is taken, so the baselines do not depend on the day, the hour or
  the commit.
- The visual tolerance is 0.1% of the pixels by default and 0.2% for the shots that
  say so. That is about 920 pixels at 1280x720 and 250 at phone width -- enough to let
  a changed digit, a highlight that moved one calendar cell, or a whole 36-pixel icon
  pass. It catches a layout change; do not rely on it for a small one.
- `npm run test:visual:update` rewrites only the baselines that fail, so a baseline
  that is stale but inside the tolerance stays stale. After an intended visual change,
  delete the affected baselines, regenerate them, and review old against new.
