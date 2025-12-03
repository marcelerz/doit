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

## Project Details

- **Type**: Next.js TypeScript webapp
- **Features**: Todo app with localStorage persistence, state-based architecture, multiple views
- **Design**: Full-page, mobile-responsive
- **Status**: Complete and running
- **Migration Version**: 5 (removed imageUrl field from people and projects)

## Architecture

### Storage Abstraction Layer

The app now uses a storage abstraction layer (`src/utils/storage.ts`) that provides:

- `StorageAdapter` interface for easy swapping of storage mechanisms
- `LocalStorageAdapter` as the default implementation
- Generic helpers: `loadFromStorage`, `saveToStorage`, `removeFromStorage`
- Centralized storage keys in `STORAGE_KEYS` constant

This makes it easy to switch from localStorage to IndexedDB, API, or any other storage mechanism in the future.

### Data Organization

Data is now organized into separate top-level storage keys:

- `doit-todos` - Todo items (managed by `useTodos` hook)
- `doit-people` - People entities (managed by `usePeople` hook)
- `doit-projects` - Project entities (managed by `useProjects` hook)
- `doit-settings` - Application settings (managed by `useSettings` hook)
- `doit-version` - Data version for migrations

### Hooks Architecture

- **`useTodos`** - Manages todo state, CRUD operations, undo/redo
- **`usePeople`** - Manages people state, CRUD operations, comments
- **`useProjects`** - Manages projects state, CRUD operations, comments
- **`useSettings`** - Manages application settings (priorities, links, markers, general, dateTime, workHours, autoAssign)

Each hook:

- Loads data from storage on mount using the storage abstraction
- Automatically saves changes back to storage
- Provides specific methods for data manipulation
- Is independent and can be used separately

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

- **views/** - Main application views (TodoListView, CalendarView, GanttView, PeopleView, ProjectsView)
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

### Hooks

- **useKeyboardNavigation** - Arrow up/down/enter/escape handling for lists
- **useTodos** - Todo state management with localStorage
- **usePeople** - People management with separate storage
- **useProjects** - Projects management with separate storage
- **useSettings** - Application settings management

### Utilities

- **colors.ts** - Color generation and manipulation (getPersonColor, getProjectColor, getTextColor)
- **suggestions.ts** - Duration and recurring pattern suggestions
- **storage.ts** - Storage abstraction layer
- **dateParser.ts** - Date parsing and suggestions
- **recurringParser.ts** - Recurring pattern parsing

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
