# Next.js Todo App Project Setup

## Completed Steps

- [x] Create copilot-instructions.md file
- [x] Scaffold Next.js project with TypeScript
- [x] Create todo app components with localStorage
- [x] Add mobile-responsive styling
- [x] Initialize git repository
- [x] Install dependencies and compile
- [x] Create and run dev task
- [x] Implement comments system with history tracking
- [x] Create migration system with version tracking
- [x] Add auto-delete with retention policy
- [x] Implement backup/restore system
- [x] Fix date parsing and display
- [x] Add metadata organization and UI persistence
- [x] Convert from boolean-based to state-based todo system
- [x] Add multiple view tabs (List, Gantt, Calendar)
- [x] Update Date/Time settings to derive BOD/EOD from Work Hours
- [x] Restructure settings localStorage to organize by tabs
- [x] Create storage abstraction layer and separate people/projects from settings
- [x] Reorganize components into logical folders (views, items, overlays, shared, input, settings)
- [x] Create reusable abstractions (Badge, Modal, SearchableDropdown, colors, suggestions, keyboard nav)
- [x] Refactor TodoDetailsOverlay.tsx with new components (1996 → 1098 lines, 898 lines saved)
- [x] Add tag usage tracking with SearchableDropdown showing most-used tags first
- [x] Make color optional for people/projects/priorities with fallback to marker colors
- [x] Add "Use Default" button to reset custom colors
- [x] Remove imageUrl field from people and projects (v5 migration)
- [x] Refactor for reusability: ColorPicker, AlternativesInput, ActionButtons, CollapsibleSection components
- [x] Add useDropdownManager and useFilters hooks for centralized state management
- [x] Move date conversion utilities to dateParser.ts (convertToDateInputFormat, convertToTimeInputFormat)
- [x] Refactor PersonDetailsOverlay, ProjectDetailsOverlay, PrioritiesTab to use new components
- [x] Refactor TodoDetailsOverlay to use useDropdownManager and ActionButtons
- [x] Create EmptyState, MetadataSection, and FilterSection components for maximum reusability
- [x] Refactor TodoDetailsOverlay to use MetadataSection for 6 metadata types (people, projects, tags, dependencies)
- [x] Refactor TodoApp to use EmptyState for people and projects views
- [x] Refactor TodoApp to use FilterSection for all 10 filter types (assigned, projects, source, mentioned, priorities, dueDates, durations, tags, recurring, dependencies)
- [x] Make filter button colors dynamic using marker colors from settings (not hardcoded)
- [x] Create utility functions for common patterns (metadataParser, filterHelpers)
- [x] Extract showFiltersSection as derived state in TodoApp
- [x] Rename TodoListView to TodoApp (better reflects multi-view nature)
- [x] Create comprehensive storage abstraction with IndexedDB support
- [x] Centralize all storage operations through storage adapter
- [x] Add all storage keys to STORAGE_KEYS registry
- [x] Add automatic IndexedDB detection with localStorage fallback
- [x] Implement automatic data migration from localStorage to IndexedDB
- [x] Add Safari and Safari Private Mode compatibility
- [x] Create StorageInitializer component for app startup
- [x] Create TodoModel business logic abstraction layer
- [x] Add offline PWA support with service worker
- [x] Refactor useTodos to return TodoModel[] instead of Todo[]
- [x] Create PersonModel and ProjectModel business logic abstractions
- [x] Refactor usePeople to return PersonModel[] instead of Person[]
- [x] Refactor useProjects to return ProjectModel[] instead of Project[]
- [x] Update all components to use PersonModel and ProjectModel
- [x] Add recurring pattern auto-detection starting with "every"
- [x] Implement auto-detection of mentioned people without ^ marker
- [x] Implement auto-detection of mentioned projects with context patterns
- [x] Implement auto-detection of source people with context patterns ("from", "via", "per", "source")
- [x] Implement auto-detection of priorities with direct and context-based recognition
- [x] Remove auto-detected dates, durations, recurring, and dependencies from plainText output
- [x] Remove explicit marker text (^, \*, ~, >, !!, %, #) from plainText output
- [x] Keep @ and $ markers in plainText for assigned and source people
- [x] Swap markers: % for projects (was #), # for tags (was &), ^ for dueDate (was ~), ~ for recurring (was %)
- [x] Remove explicit marker support for ^, \*, ~, > - these are now auto-detect only or set via fields
- [x] Add Pomodoro-style planning to Gantt chart with short/long breaks and presets
- [x] Add customizable time blocks with types and colors (meeting, focus, lunch, break, commute, personal)
- [x] Add Kanban board view with workflow states, drag-and-drop, state transitions, and multiple views
- [x] Add Sprint/Scrum feature with sprint planning, assignment, and Kanban filtering
- [x] Add sprint as grouping option in list view
- [x] Add sprint assignment to batch edit modal
- [x] Add priority-colored checkmark outlines for todos
- [x] Add distinct round selection checkboxes with black border for batch mode
- [x] Add three scheduling techniques to Gantt view (Sequential, Pomodoro, Flow) with presets
- [x] Add WIP (Work-In-Progress) limits to Kanban board columns with visual warnings
- [x] Make Backlog a system state (cannot be deleted, like Completed and Archived)

## Coding Standards

### Explicit Comparisons

To avoid ambiguity when reading code, use explicit comparisons instead of relying on JavaScript's implicit type coercion:

**Booleans** - Use direct checks:

```typescript
// ✅ Good
if (settings.enabled) { ... }
if (!this.archived) { ... }

// ❌ Unnecessary verbosity
if (settings.enabled === true) { ... }
if (this.archived === false) { ... }
```

**Strings** - Use explicit comparison for empty string checks:

```typescript
// ✅ Good
if (searchText.trim() === "") return true;

// ❌ Bad
if (!searchText.trim()) return true;
```

**Numbers** - Use explicit comparison for zero checks:

```typescript
// ✅ Good
if (count === 0) { ... }
if (weight === 0) return;

// ❌ Bad
if (!count) { ... }
```

**Undefined/null checks** - Truthiness checks are acceptable:

```typescript
// ✅ Good - truthiness is fine for undefined/null
if (this.context) { ... }
if (!value) { ... }

// ✅ Good - use == null to check both null and undefined
if (value == null) { ... }

// ❌ Unnecessary verbosity
if (this.context !== undefined) { ... }
```

## Project Details

- **Type**: Next.js TypeScript webapp
- **Features**: Todo app with automatic IndexedDB/localStorage, state-based architecture, multiple views, business logic abstraction (TodoModel, PersonModel, ProjectModel), offline PWA support
- **Design**: Full-page, mobile-responsive, installable PWA
- **Status**: Complete and running
- **Storage**: Automatic IndexedDB with localStorage fallback and migration
- **Migration Version**: 5 (removed imageUrl field from people and projects)
- **Business Logic**: Model abstraction layer - useTodos returns TodoModel[], usePeople returns PersonModel[], useProjects returns ProjectModel[]
- **PWA**: Service worker with offline caching, update notifications, and installable on mobile/desktop

## Architecture

### PWA & Offline Support

The app is a fully installable PWA with comprehensive offline support:

**Service Worker (`public/sw.js`):**

- Caches static assets (icons, manifest, fonts) on install
- Caches ambient sound files for offline Pomodoro use
- Uses different caching strategies based on resource type:
  - **Network-first** for HTML pages (always get latest, fall back to cache)
  - **Cache-first** for static assets (icons, sounds, fonts)
  - **Stale-while-revalidate** for Next.js bundles
- Handles offline gracefully with fallback to cached content
- Supports background sync for future enhancements
- Handles push notifications (infrastructure ready)

**Service Worker Registration (`src/hooks/useServiceWorker.ts`):**

- Registers service worker on app load
- Tracks online/offline status
- Detects available updates
- Provides `applyUpdate()` to activate new service worker
- Provides `clearCache()` to clear all cached data

**UI Components (`src/components/ServiceWorkerProvider.tsx`):**

- Shows offline toast when connection is lost
- Shows persistent offline indicator in corner when offline
- Shows update notification with "Update" button when new version available
- Smooth animations for toast notifications

**Web Manifest (`public/site.webmanifest`):**

- Full PWA manifest with icons, theme colors, and app metadata
- Standalone display mode for native-like experience
- Portrait orientation preferred
- Launch handler to reuse existing window

### Storage Abstraction Layer

The app uses a storage abstraction layer (`src/utils/storage.ts`) that provides:

- `StorageAdapter` interface for easy swapping of storage mechanisms
- `LocalStorageAdapter` implementation for basic localStorage
- `IndexedDBAdapter` implementation for IndexedDB with larger capacity
- **Automatic storage detection** (`src/utils/storageInit.ts`) - tries IndexedDB first, falls back to localStorage
- **Safari compatibility** - detects Safari Private Mode and uses localStorage fallback
- **Automatic migration** - migrates existing localStorage data to IndexedDB transparently
- Generic async helpers: `loadFromStorage`, `saveToStorage`, `removeFromStorage`
- Synchronous helpers for backward compatibility: `loadFromStorageSync`, `saveToStorageSync`, `removeFromStorageSync`
- Centralized storage keys in `STORAGE_KEYS` constant
- `setStorageAdapter()` to manually switch storage mechanisms
- `createIndexedDBAdapter()` factory for IndexedDB instances
- `StorageInitializer` component that runs on app startup

The system automatically:

1. Detects if IndexedDB is available (including Safari private mode check)
2. Falls back to localStorage if IndexedDB is blocked or unavailable
3. Migrates existing localStorage data to IndexedDB on first load
4. Logs storage initialization status to console

### Data Organization

Data is now organized into separate top-level storage keys:

- `doit-todos` - Todo items (managed by `useTodos` hook)
- `doit-people` - People entities (managed by `usePeople` hook)
- `doit-projects` - Project entities (managed by `useProjects` hook)
- `doit-settings` - Application settings (managed by `useSettings` hook)
- `doit-version` - Data version for migrations
- `doit-view-presets` - Saved view configurations
- `doit-view-options` - Current view state (filters, sort, group) for List view
- `doit-gantt-view-options` - Gantt view state (schedulingMode, groupByProject, completedCollapsed, showTasksWithoutDates)
- `doit-calendar-view-options` - Calendar view state (viewMode, sortField, sortDirection, showTasksWithoutDates)
- `doit-kanban-view-options` - Kanban view state (activeViewId, sortField, sortDirection, sprintId)
- `doit-backup-settings` - Backup configuration

All keys are centralized in `STORAGE_KEYS` constant for easy management.

### Hooks Architecture

- **`useTodos`** - Manages todo state, CRUD operations, undo/redo, exports `createModels()` helper
- **`usePeople`** - Manages people state, CRUD operations, comments
- **`useProjects`** - Manages projects state, CRUD operations, comments
- **`useSettings`** - Manages application settings (priorities, links, markers, general, dateTime, workHours, autoAssign)

Each hook:

- Loads data from storage on mount using the storage abstraction
- Automatically saves changes back to storage
- Provides specific methods for data manipulation
- Is independent and can be used separately

### Business Logic Layer

The app uses a **Model abstraction layer** for all major entities, wrapping raw data objects with extensive business logic:

#### TodoModel (`src/models/TodoModel.ts`)

Wraps `Todo` objects with 30+ methods and properties:

**Validation Methods:**

- `canComplete(allTodos)` - Checks dependencies and state before completion
- `canArchive(allTodos)` - Validates archiving is allowed
- `canDelete()` - Checks if deletion is permitted
- `canUnarchive()` - Validates unarchiving

**Date & Time:**

- Auto-assigns defaults from settings when fields are empty
- Normalizes shorthand dates (e.g., "today" → "2025-12-03")
- Provides `isOverdue`, `isDueToday`, `isDueThisWeek`, `daysUntilDue`
- Display helpers: `dueDateDisplay` ("Today", "Tomorrow", etc.)

**UI Properties:**

- `hasComments`, `commentCount`, `latestComment`
- `hasActivity`, `activityCount`, `latestActivity`
- `statusBadge`, `statusColor` - for UI badges
- `metadataSummary` - formatted string of all metadata
- `ageDisplay` - "2 hours ago" format
- Date displays: `createdDateDisplay`, `updatedDateDisplay`, `completedDateDisplay`

**Smart Getters (with auto-assign):**

- `assignedPeople`, `sourcePeople`, `projects`, `priority`, `dueDate`, `duration`, `recurring`
- Raw versions available: `assignedPeopleRaw`, `projectsRaw`, etc.

**Display & Search:**

- `getSummary(maxLength)` - truncated text
- `matchesSearch(text)` - searches across all fields
- `isBlockerFor(allTodos)` - finds dependent tasks
- `durationDisplay` - formatted duration ("2h" from "120m")

**State Checks:**

- `isActive`, `isCompleted`, `isArchived`, `isDeleted`, `isRecurring`

#### PersonModel (`src/models/PersonModel.ts`)

Wraps `Person` objects with business logic:

**Validation Methods:**

- `canArchive()` - Check if person can be archived
- `canUnarchive()` - Check if person can be unarchived
- `canDelete(allTodos)` - Check if person can be deleted (validates not assigned to todos)

**Computed Properties:**

- `isActive`, `isArchived` - State checks
- `hasComments`, `commentCount`, `latestComment` - Comment info
- `hasActivity`, `activityCount`, `latestActivity` - Activity tracking
- `initials` - Two-letter initials from name
- `displayName` - Name with alternatives: "John Doe (Johnny, JD)"
- `statusBadge`, `statusColor` - UI badge properties
- `allNames` - Array of name + alternatives

**Display & Search:**

- `getMetadataSummary(todoCount)` - Formatted metadata: "3 todos • 2 comments • Active"
- `matchesSearch(text)` - Searches name, alternatives, context, comments
- `matchesAnyName(names)` - Check if matches given names (for @mentions)

#### ProjectModel (`src/models/ProjectModel.ts`)

Wraps `Project` objects with business logic (similar to PersonModel):

**Validation Methods:**

- `canArchive()` - Check if project can be archived
- `canUnarchive()` - Check if project can be unarchived
- `canDelete(allTodos)` - Check if project can be deleted (validates not used in todos)

**Computed Properties:**

- `isActive`, `isArchived` - State checks
- `hasComments`, `commentCount`, `latestComment` - Comment info
- `hasActivity`, `activityCount`, `latestActivity` - Activity tracking
- `initials` - Two-letter initials from name
- `displayName` - Name with alternatives
- `statusBadge`, `statusColor` - UI badge properties
- `allNames` - Array of name + alternatives

**Display & Search:**

- `getMetadataSummary(todoCount)` - Formatted metadata: "5 todos • 3 comments • Active"
- `matchesSearch(text)` - Searches name, alternatives, context, comments
- `matchesAnyName(names)` - Check if matches given names (for %project mentions)

#### Hook Usage Pattern

All hooks follow the same pattern:

```typescript
// useTodos.ts
const [rawTodos, setRawTodos] = useState<Todo[]>([]);
const todos = useMemo(() => createTodoModels(rawTodos, settings), [rawTodos, settings]);
// todos is TodoModel[] - business logic built-in

// usePeople.ts
const [rawPeople, setRawPeople] = useState<Person[]>([]);
const people = useMemo(() => createPersonModels(rawPeople), [rawPeople]);
// people is PersonModel[] - business logic built-in

// useProjects.ts
const [rawProjects, setRawProjects] = useState<Project[]>([]);
const projects = useMemo(() => createProjectModels(rawProjects), [rawProjects]);
// projects is ProjectModel[] - business logic built-in
```

**The hooks:**

- Return Model[] instead of raw data
- Internal state uses raw data for mutations
- useMemo automatically wraps on every change
- Access `.raw` property when saving back to storage

See `docs/todomodel-usage-guide.md` for detailed usage examples.

## Settings Structure

Settings are organized by tabs and no longer include people/projects:

- `priorities` - Priorities Tab
- `linkPatterns` - Links Tab
- `markerColors` - Markers Tab
- `general` - General Tab (archiveDays, autoDelete)
- `dateTime` - Date/Time Tab (morning, noon, afternoon, evening, workWeekStart, fiscalYearStart)
- `workHours` - Work Hours Tab (schedules, BOD/EOD computation)
- `gantt` - Gantt Tab (scheduling settings, Pomodoro configuration)
- `kanban` - Kanban Tab (workflow states, transitions, views, display options)
- `sprints` - Sprints Tab (sprint management, active sprint, default duration)
- `autoAssign` - Auto-Assign Tab (default metadata for new todos)

## Views

The app now has four different views accessible via tabs:

1. **List View** - Traditional todo list with filtering, sorting, grouping
2. **Kanban View** - Drag-and-drop board with customizable workflow states
3. **Gantt View** - Timeline visualization showing todos with due dates on a horizontal timeline
4. **Calendar View** - Monthly calendar with dots indicating tasks, click to see details

### Kanban View

The Kanban view provides a visual board for managing todos through workflow states:

- **Workflow States**: Customizable columns (Backlog, To Do, In Progress, Review, Completed, Archived)
- **Drag and Drop**: Move tasks between states by dragging cards
- **State Transitions**: Configurable rules for which states can transition to others
- **System States**: Backlog, Completed, and Archived are system states (cannot be deleted) and sync with TodoState
- **WIP Limits**: Set work-in-progress limits on non-system states (columns turn red when exceeded)
- **Multiple Views**: Create custom views showing different combinations of states (e.g., "Active Work", "Intake", "Done & Archived")
- **Sprint Filtering**: Filter board by sprint - All, Backlog (no sprint), or specific sprints
- **Card Display**: Shows task title, due date, assigned people, project, priority, comments, subtasks, and sprint
- **Sorting**: Sort tasks within columns by created date, updated date, due date, priority, or title
- **Settings**: Configure in Settings → Kanban (states, transitions, views, display options)

**Kanban Settings Tabs:**

1. **Workflow States**: Add/edit/delete/reorder states with custom colors, icons, and WIP limits
2. **Transitions**: Matrix to define allowed state-to-state transitions
3. **Views**: Create named views with specific state combinations

**Display Options:**

- Show/hide empty columns
- Show/hide task count in column headers (shows WIP limit when configured)

### Sprint/Scrum Planning

The app supports Scrum-style sprint planning for agile workflows:

- **Sprint Management**: Create, edit, and manage sprints in Settings → Sprints
- **Sprint Status**: Each sprint has a status - Planning, Active, Completed, or Cancelled
- **Active Sprint**: Mark one sprint as active (shown prominently in filters)
- **Sprint Assignment**: Assign todos to sprints via the todo detail overlay
- **Sprint Filtering**: Filter Kanban board by sprint (All, Backlog, or specific sprint)
- **Sprint Metadata**: Name, goal, start/end dates, status

**Sprint Settings:**

- **Default Duration**: Set default sprint length (default: 14 days)
- **Show Backlog in Sprint**: Option to include backlog items in sprint views

**Sprint Workflow:**

1. Create sprints in Settings → Sprints
2. Assign todos to sprints via todo detail overlay (Sprint field)
3. Mark a sprint as Active to start working on it
4. Filter Kanban board by sprint to focus on current work
5. Complete sprint when done

### Gantt View Scheduling Techniques

The Gantt view supports three scheduling techniques, switchable from the toolbar:

**📋 Sequential**

- Simple task-to-task scheduling with context switching buffer
- **Context Switching Time**: Fixed buffer between tasks (default 5 minutes)
- **Best For**: Predictable spacing without structured breaks

**🍅 Pomodoro**

- Work in focused sessions with short and long breaks
- **Work Duration**: Focus time per session (default 25 minutes)
- **Short Breaks**: Between each task (default 5 minutes)
- **Long Breaks**: After every N tasks (default 15 minutes after 4 tasks)
- **Presets**: Standard Pomodoro (25/5/15/4), Long Sessions (50/10/20/4)
- **Visual Indicators**: Short breaks shown in blue, long breaks in green
- **Notifications**: Browser notifications when breaks start (requires permission)
- **Sound Alerts**: Audio tones using Web Audio API - different sounds for short/long breaks

**🌊 Flow**

- Simplified work/break/context cycle for longer focus sessions
- **Work Duration**: Focus time per session (default 52 minutes)
- **Break Duration**: Rest between sessions (default 17 minutes)
- **Context Switch**: Buffer between tasks (default 10 minutes)
- **Presets**: 52/17 Method (52m work, 17m break, 10m context), Ultradian Rhythm (90m work, 20m break, 10m context)
- **Best For**: Extended focus sessions like the 52/17 method or Ultradian rhythm cycles

**Common Settings:**

- **Default Task Duration**: When no duration specified (5-480 minutes)
- **Duration Multiplier**: Safety factor for scheduling (0.5-5.0×)
- **Presets**: Quick-apply configurations grouped by technique
- **Custom Presets**: Save current settings as a named preset

### Customizable Time Blocks

The Gantt view supports customizable time blocks for blocking out parts of the day:

- **Block Types**: Pre-defined types with icons - Break ☕, Lunch 🍴, Meeting 👥, Focus Time 🎯, Commute 🚗, Personal 🏠
- **Colors**: Each block type has a default color, but can be customized with any color
- **Visual Display**: Blocks appear on the Gantt timeline with their assigned color (70% opacity)
- **Tooltips**: Hover to see block icon and name
- **Settings**: Configure in Settings → Work Hours → Time Blocks
- **Per-Schedule**: Different blocks can be set for common schedule, weekday/weekend, or individual days
- **Task Scheduling**: Tasks are automatically scheduled around time blocks

## Auto-Detection Features

The SmartInput component automatically detects dates, recurring patterns, mentioned people, project references, source people, and priorities without requiring explicit markers:

### Date Auto-Detection

- **Natural Language Dates**: Automatically detects dates using chrono-node (e.g., "tomorrow", "next Friday", "in 2 weeks")
- **Custom Shorthands**: Detects 30+ custom shortcuts (e.g., "eod", "morning", "bow", "bom", "eoq")
- **Date Ranges**: Detects ranges like "monday to friday" and automatically creates both dueDate and duration
- **Visual Indicators**: Auto-detected dates show with lighter background and dotted underline
- **Click to Deactivate**: Click auto-detected dates to deactivate them
- **Removed from Input**: Auto-detected dates are removed from plainText output

### Recurring Pattern Auto-Detection

- **"Every" Patterns**: Automatically detects recurring patterns starting with "every"
- **Supported Patterns**:
  - Intervals: "every 2 days", "every week", "every 3 months"
  - Weekdays: "every monday", "every friday", "every workday"
  - Nth weekdays: "every first monday", "every 2nd tuesday", "every last friday"
- **First Date Calculation**: Automatically derives the first due date from the pattern
- **Dual Tokens**: Creates both dueDate (first occurrence) and recurring (pattern) tokens
- **Removed from Input**: Auto-detected recurring patterns are removed from plainText output

### Person Mention Auto-Detection

- **No Marker Required**: Mentioned people are automatically detected without needing the ^ marker
- **Name Matching**: Detects person names and all their alternatives as whole words
- **Smart Priority**: Avoids conflicts with explicit @ and $ markers, and with dates
- **Color Highlighting**: Uses person's custom color or falls back to marker color (yellow/orange)
- **Explicit Markers Still Available**: @ for assigned people and $ for source people still work as before
- **Blacklist**: Common English words (me, i, the, and, etc.) are filtered to prevent false positives

See `docs/person-mention-auto-detection.md` for detailed documentation.

### Project Reference Auto-Detection

- **Context-Based Detection**: Automatically detects projects when mentioned with context words
- **Supported Patterns**:
  - "on <project name>" - e.g., "working on Website Redesign"
  - "in <project name>" - e.g., "task in Marketing Campaign"
  - "for <project name>" - e.g., "meeting for API Development"
  - "on project <project name>" - e.g., "focus on project Website"
  - "in project <project name>" - e.g., "issue in project Backend"
  - "for project <project name>" - e.g., "docs for project API"
  - "<project name> project" - e.g., "Marketing project is ready"
- **Alternative Names**: All project alternatives are recognized
- **Smart Priority**: Avoids conflicts with explicit % markers, dates, and people
- **No False Positives**: Requires context words to prevent detecting standalone project names
- **Color Highlighting**: Uses project's custom color or falls back to marker color (purple)
- **Explicit Marker Still Available**: % marker still works as before

### Source Person Auto-Detection

- **Context-Based Detection**: Automatically detects source people with context patterns
- **Supported Patterns**:
  - "from <person name>" - e.g., "feedback from Marcel"
  - "via <person name>" - e.g., "received via John Doe"
  - "per <person name>" - e.g., "update per Sarah"
  - "source <person name>" - e.g., "information source Johnny"
- **Alternative Names**: All person alternatives are recognized
- **Smart Priority**: Avoids conflicts with explicit $ markers and other detected tokens
- **Color Highlighting**: Uses person's custom color or falls back to marker color
- **Explicit Marker Still Available**: $ marker still works as before
- **Context Required**: Standalone names are not detected to prevent false positives

### Priority Auto-Detection

- **Direct Recognition**: Automatically detects priority names without requiring !! marker
- **Supported Patterns**:
  - Direct: "urgent", "high", "medium", "low"
  - With suffix: "high priority", "urgent priority"
  - With prefix: "priority high", "priority urgent"
- **Alternative Names**: All priority alternatives are recognized (e.g., "critical", "ASAP", "important")
- **Smart Priority**: Avoids conflicts with explicit !! markers and other detected tokens
- **Color Highlighting**: Uses priority's custom color or falls back to marker color
- **Explicit Marker Still Available**: !! marker still works as before
- **No Context Required**: Priority names are specific enough to detect standalone

### PlainText Output Behavior

The SmartInput component removes the following from plainText output:

**Always Removed (explicit markers):**

- `!!` Priority marker and its value
- `%` Project marker and its value
- `#` Tag marker and its value

**Kept in plainText (explicit markers):**

- `@` Assigned person marker and name
- `$` Source person marker and name

**Auto-detected removals:**

- Auto-detected dates (removed from plainText)
- Auto-detected recurring patterns (removed from plainText)
- Auto-detected duration ranges (removed from plainText)
- Auto-detected dependencies (removed from plainText)

**Auto-detected kept in plainText:**

- Auto-detected mentioned people (kept in plainText)
- Auto-detected projects (kept in plainText)
- Auto-detected source people (kept in plainText)
- Auto-detected priorities (kept in plainText)

This behavior allows users to quickly set metadata values without cluttering the todo text.

### Markers and Input Methods

The app supports the following metadata assignment methods:

**Explicit Markers (always available):**

- `@name` - Assign person
- `$name` - Source person
- `%project` - Project
- `!!priority` - Priority
- `#tag` - Tag

**Auto-Detection Only (no explicit markers):**

- Due dates - Natural language detection ("tomorrow", "next Friday", etc.) and custom shorthands
- Recurring patterns - "every" patterns ("every monday", "every 2 weeks", etc.)
- Duration - Not detected, set via detail view field only
- Dependencies - Not detected, set via detail view field only

**Note:** Due date (^), duration (\*), recurring (~), and dependency (>) explicit markers have been removed. These are now set through auto-detection (dates and recurring) or through the dedicated fields in the detail view (duration and dependencies).

## Todo State System

Todos now use a unified state system instead of separate boolean flags:

- **States**: `"active"`, `"completed"`, `"archived"`, `"deleted"`
- **Timestamps**: `createdAt`, `updatedAt`, `completedAt`, `archivedAt`, `deletedAt`
- **Migration**: Automatically converts legacy boolean-based todos (v3) to state-based system (v4)

## Component Organization

Components are organized by purpose:

- **views/** - Main application views (TodoApp [main container], CalendarView, GanttView, PeopleView, ProjectsView)
- **items/** - List item components (TodoItem, PersonItem, ProjectItem)
- **overlays/** - Modal/detail views (TodoDetailsOverlay, PersonDetailsOverlay, ProjectDetailsOverlay)
- **input/** - Input components (SmartInput, RichTextEditor)
- **shared/** - Reusable components (Activity, Comments, MarkedText, MarkerReference, Notification, Badge, Modal, SearchableDropdown)
- **settings/** - Settings tab components

## Reusable Abstractions

### Components

- **Badge** - Reusable badge with optional remove button (7 color variants)
- **Modal** - Modal/overlay wrapper with backdrop
- **SearchableDropdown** - Dropdown with search, keyboard nav, and add functionality
- **ColorPicker** - Color picker with text input and "Use Default" button
- **AlternativesInput** - Comma-separated input with preview badges
- **ActionButtons** - Archive/unarchive + delete button group
- **CollapsibleSection** - Collapsible section with header and count
- **EmptyState** - Standardized empty state with emoji, message, and optional action
- **MetadataSection** - Reusable metadata section with badges and add dropdown
- **FilterSection** - Standardized filter section with select/clear all buttons

### Hooks

- **useKeyboardNavigation** - Arrow up/down/enter/escape handling for lists
- **useTodos** - Todo state management with localStorage
- **usePeople** - People management with separate storage
- **useProjects** - Projects management with separate storage
- **useSettings** - Application settings management
- **useDropdownManager** - Centralized dropdown state management
- **useFilters** - Filter state management with localStorage persistence

### Utilities

- **colors.ts** - Color generation and manipulation (getPersonColor, getProjectColor, getTextColor)
- **suggestions.ts** - Duration and recurring pattern suggestions
- **storage.ts** - Storage abstraction layer
- **dateParser.ts** - Date parsing, suggestions, and conversion utilities (convertToDateInputFormat, convertToTimeInputFormat)
- **recurringParser.ts** - Recurring pattern parsing
- **metadataParser.ts** - Token-to-metadata conversion (parseTokensToMetadata)
- **filterHelpers.ts** - Filter operations (setToSortedArray, arrayHasAnyFromSet, setHasValue)

## Types

- `todo.ts` - TodoState type and Todo interface
- `settings.ts` - Settings, Person, Project, Priority interfaces

4. **Features**
   - ✅ Add, edit, delete todos
   - ✅ State-based system (active/completed/archived/deleted)
   - ✅ Timestamp tracking for all state transitions
   - ✅ localStorage persistence
   - ✅ Comments with history
   - ✅ Backup/restore with import/export
   - ✅ Auto-archive based on retention policy
   - ✅ Mobile-responsive design
   - ✅ Dark mode support
   - ✅ Tailwind CSS styling

## Running the App

The dev server is currently running at http://localhost:3000

To start it again later:

```bash
npm run dev
```

To build for production:

```bash
npm run build
npm start
```
