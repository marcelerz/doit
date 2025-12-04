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
- [x] Refactor useTodos to return TodoModel[] instead of Todo[]

## Project Details

- **Type**: Next.js TypeScript webapp
- **Features**: Todo app with automatic IndexedDB/localStorage, state-based architecture, multiple views, business logic abstraction
- **Design**: Full-page, mobile-responsive
- **Status**: Complete and running
- **Storage**: Automatic IndexedDB with localStorage fallback and migration
- **Migration Version**: 5 (removed imageUrl field from people and projects)
- **Business Logic**: TodoModel abstraction layer - useTodos returns TodoModel[] instead of Todo[]

## Architecture

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
- `doit-view-options` - Current view state (filters, sort, group)
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

The app uses a **TodoModel** abstraction layer (`src/models/TodoModel.ts`) that wraps `Todo` objects with extensive business logic:

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

The **useTodos** hook returns `TodoModel[]` instead of `Todo[]`:

```typescript
const { todos, settings } = useTodos();
// todos is TodoModel[] - business logic built-in
console.log(todos[0].assignedPeople); // With auto-assign
console.log(todos[0].isOverdue); // Boolean
console.log(todos[0].dueDateDisplay); // "Today" or formatted date

// Access raw Todo when needed
const rawTodo = todos[0].raw;
```

See `docs/todomodel-usage-guide.md` and `docs/todomodel-refactoring-summary.md` for detailed usage.

## Settings Structure

Settings are organized by tabs and no longer include people/projects:

- `priorities` - Priorities Tab
- `linkPatterns` - Links Tab
- `markerColors` - Markers Tab
- `general` - General Tab (archiveDays, autoDelete)
- `dateTime` - Date/Time Tab (morning, noon, afternoon, evening, workWeekStart, fiscalYearStart)
- `workHours` - Work Hours Tab (schedules, BOD/EOD computation)
- `autoAssign` - Auto-Assign Tab (default metadata for new todos)

## Views

The app now has three different views accessible via tabs:

1. **List View** - Traditional todo list with filtering, sorting, grouping
2. **Gantt View** - Timeline visualization showing todos with due dates on a horizontal timeline
3. **Calendar View** - Monthly calendar with dots indicating tasks, click to see details

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
