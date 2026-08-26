# DoIt - Advanced Todo & Project Management App

NOTE: This is still under construction and probably very buggy!

A powerful, feature-rich todo and project management application built with Next.js, TypeScript, and Tailwind CSS. Features multiple views, smart input detection, sprint planning, and comprehensive storage options.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-Personal_Use-orange)

## ✨ Features

### Core Functionality

- ✅ **State-based Todo System** - Active, Completed, Archived, Deleted states with full timestamp tracking
- ✅ **Smart Input** - Natural language parsing with auto-detection of dates, people, projects, and priorities
- ✅ **Multiple Views** - Todos, Kanban, Gantt, Calendar, Notes, People, Projects, Sprints, Reviews, Statistics and Time Reports, each switchable off in settings
- ✅ **People & Projects** - Full entity management with assignments and mentions
- ✅ **Sprint Planning** - Scrum-style sprint management with Kanban integration
- ✅ **Notes & Reviews** - Rich-text notes with action items, and 1:1 review documents
- ✅ **Comments & Activity** - Full history tracking on todos, notes, people, and projects
- ✅ **Time Tracking** - Start/stop timers and manual entries, reported per project and person

### Views

#### 📋 List View

- Flexible filtering by any metadata (people, projects, tags, priorities, etc.)
- Multiple sort options and grouping (by project, priority, due date, sprint)
- Batch operations on multiple todos
- Saved view presets

#### 📊 Kanban Board

- Customizable workflow states (Backlog, To Do, In Progress, Review, Completed, Archived)
- Drag-and-drop between states
- Configurable state transitions
- Multiple board views for different workflows
- Sprint filtering

#### 📅 Gantt Chart

- Timeline visualization of tasks
- Three scheduling techniques:
  - **Sequential** - Simple task-to-task with context switching
  - **Pomodoro** - 25/5/15 work/break cycles with notifications
  - **Flow** - Extended focus sessions (52/17 method, Ultradian rhythm)
- Customizable time blocks (meetings, lunch, breaks)
- Audio notifications with ambient sounds

#### 🗓️ Calendar View

- Monthly calendar with task indicators
- Click to view and edit tasks for any day

#### 🎯 Focus View

- Pomodoro timer with configurable work/break intervals
- Flow mode for extended focus sessions
- Ambient sounds for concentration
- Task queue management

#### 📈 Statistics & Time Reports

- Task completion trends
- Time tracking reports
- Sprint velocity metrics

### Smart Input Detection

The app automatically detects and parses:

- **Dates** - "tomorrow", "next Friday", "in 2 weeks", "eod", "bow" (beginning of week)
- **Recurring** - "every monday", "every 2 weeks", "every first friday"
- **People** - Auto-detects names, or use `@person` for assignment, `$person` for source
- **Projects** - Auto-detects "on ProjectName", "for ProjectName", or use `%project`
- **Priorities** - Auto-detects "urgent", "high priority", or use `!!priority`
- **Tags** - Use `#tag` for tagging

### Storage & Data

- **Automatic IndexedDB** with localStorage fallback
- **Safari Private Mode** compatible
- **Automatic Migration** from localStorage to IndexedDB
- **Backup & Restore** with JSON export/import
- **Data Versioning** with automatic migrations

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (required by Next.js 16)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/marcelerz/doit.git
cd doit

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Production Build

```bash
# Build for production
npm run build

# Static export for GitHub Pages (sets basePath and output: "export")
npm run build:gh-pages
```

The deployed app is a static export with no server: everything runs in the browser and all
data stays in the browser's own storage.

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run smoke and visual suites
npm run test:smoke
npm run test:visual

# typecheck + lint + test + smoke + visual
npm run test:all

# the same, with the coverage floors enforced
npm run validate
```

## 📁 Project Structure

```
doit/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main app page
│   │   └── settings/           # Settings page
│   ├── components/
│   │   ├── views/              # Main views (TodoApp is the container)
│   │   ├── items/              # List item components
│   │   ├── overlays/           # Modal/detail views
│   │   ├── input/              # SmartInput, RichTextEditor
│   │   ├── shared/             # Reusable components
│   │   ├── settings/           # Settings tab components
│   │   └── providers/          # App-level React providers
│   │       ├── ServiceWorkerProvider.tsx  # PWA service worker
│   │       ├── StorageInitializer.tsx     # Storage initialization
│   │       └── ThemeProvider.tsx          # Dark/light theme
│   ├── hooks/                  # React hooks (state management)
│   │   ├── useTodos.ts         # Todo state management
│   │   ├── usePeople.ts        # People management
│   │   ├── useProjects.ts      # Projects management
│   │   ├── useSprints.ts       # Sprint management
│   │   └── useSettings.ts      # App settings
│   ├── models/                 # Business logic layer
│   │   ├── TodoModel.ts        # Todo business logic
│   │   ├── PersonModel.ts      # Person business logic
│   │   ├── ProjectModel.ts     # Project business logic
│   │   └── SettingsModel.ts    # Settings business logic
│   ├── storage/                # Storage abstraction
│   │   ├── storage.ts          # IndexedDB/localStorage adapters
│   │   ├── migrations.ts       # Data migrations
│   │   └── backup.ts           # Backup/restore functionality
│   ├── types/                  # TypeScript types, one file per domain
│   │   ├── todo.ts             # Todo types and branded TodoId
│   │   ├── viewRegistry.ts     # The single source for the view tabs
│   │   └── settings.ts         # Settings types
│   └── utils/                  # Utility functions
│       ├── autoDetection.ts    # Smart input detection
│       ├── dateUtils.ts        # Date parsing
│       ├── recurringParser.ts  # Recurring pattern parsing
│       ├── ganttScheduler.ts   # Gantt scheduling algorithms
│       └── notifications.ts    # Sound/notification utilities
├── public/
│   └── sounds/                 # Ambient sounds for focus mode
├── docs/                       # Documentation
└── package.json
```

## 🏗️ Architecture

### Model Abstraction Layer

The app uses a business logic layer that wraps raw data with computed properties and validation:

```typescript
// useTodos returns models, so todos[0] is already a TodoModel
const todo = todos[0];
todo.isOverdue; // Computed: is past due date?
todo.dueDateDisplay; // "Today", "Tomorrow", "Dec 15"
todo.canComplete(todos); // Validates dependencies
todo.matchesSearch(q); // Full-text search
```

### Storage Abstraction

Automatic storage selection with migration:

```typescript
// Automatic IndexedDB with localStorage fallback
import { loadFromStorage, saveToStorage, waitForStorageInit } from "@/storage/storage";

// Await initialization first, or on an IndexedDB install you read an
// emptied localStorage and persist the fallback over the user's data
await waitForStorageInit();
const data = await loadFromStorage("doit-todos", []);
await saveToStorage("doit-todos", updatedData);
```

### Hooks Architecture

Each data domain has its own hook:

- `useTodos()` - Returns `TodoModel[]` with full CRUD
- `usePeople()` - Returns `PersonModel[]` with assignments
- `useProjects()` - Returns `ProjectModel[]` with linking
- `useSprints()` - Sprint management
- `useSettings()` - App configuration

## ⚙️ Configuration

### Settings Tabs

- **General** - Archive retention, auto-delete
- **Priorities** - Custom priority levels with colors
- **Categories** - Project categories
- **Date/Time** - Morning, noon, afternoon, evening times
- **Work Hours** - Schedule configuration, time blocks
- **Gantt** - Scheduling technique settings
- **Focus** - Pomodoro/Flow mode configuration
- **Calendar** - Calendar display options
- **Notes** - Note defaults and templates
- **Import** - Import from Todoist and other CSV exports
- **Kanban** - Workflow states, transitions, views
- **Sprints** - Sprint management, default duration
- **Auto-Assign** - Default metadata for new todos
- **Markers** - Color customization
- **Links** - URL pattern detection
- **Notifications** - Browser notification settings
- **Backup** - Export/import data
- **Storage** - IndexedDB/localStorage settings

### Markers Reference

| Marker | Usage         | Example    |
| ------ | ------------- | ---------- |
| `@`    | Assign person | `@john`    |
| `$`    | Source person | `$sarah`   |
| `%`    | Project       | `%website` |
| `!!`   | Priority      | `!!urgent` |
| `#`    | Tag           | `#bug`     |

## 🎨 Styling

- **Tailwind CSS 4** - Utility-first styling
- **Dark Mode** - Automatic system preference detection
- **Mobile-First** - Fully responsive design
- **Custom Theme** - Configurable marker colors

## 📱 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (including Private Mode)
- Mobile browsers

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Date Parsing**: chrono-node
- **Storage**: IndexedDB + localStorage
- **Audio**: Web Audio API
- **Testing**: Jest + Playwright

## 📄 License

Personal Use License - This software is available for personal, non-commercial use only. Commercial use, redistribution, and derivative works are prohibited. See [LICENSE](LICENSE) for full details.

## 🤝 Contributing

This is a personal project under a Personal Use License, which does not permit
redistribution or derivative works -- so there is no open contribution process. Bug reports
and suggestions are welcome as issues.

## 📚 Documentation

Additional documentation is available in the `docs/` folder:

- [TodoModel Usage Guide](docs/todomodel-usage-guide.md)
- [PersonModel and ProjectModel](docs/personmodel-projectmodel-summary.md)
- [Storage Architecture](docs/storage-architecture.md)
- [Date Auto-Detection](docs/auto-date-detection.md)
- [Person Mentions](docs/person-mention-auto-detection.md) and [Project References](docs/project-reference-auto-detection.md)
- [Recurring Tasks](docs/recurring-tasks.md)
- [E2E Testing](docs/e2e-testing.md)
