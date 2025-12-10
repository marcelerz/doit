# Doit - Advanced Todo & Project Management App

A powerful, feature-rich todo and project management application built with Next.js, TypeScript, and Tailwind CSS. Features multiple views, smart input detection, sprint planning, and comprehensive storage options.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### Core Functionality

- ✅ **State-based Todo System** - Active, Completed, Archived, Deleted states with full timestamp tracking
- ✅ **Smart Input** - Natural language parsing with auto-detection of dates, people, projects, and priorities
- ✅ **Multiple Views** - List, Kanban, Gantt, and Calendar views
- ✅ **People & Projects** - Full entity management with assignments and mentions
- ✅ **Sprint Planning** - Scrum-style sprint management with Kanban integration
- ✅ **Comments & Activity** - Full history tracking on todos, people, and projects

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

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/doit.git
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

# Start production server
npm start
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

Current test coverage: **84%+** with 1000+ tests.

## 📁 Project Structure

```
doit/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main app page
│   │   └── settings/           # Settings page
│   ├── components/
│   │   ├── views/              # Main views (TodoApp, GanttView, CalendarView)
│   │   ├── items/              # List item components
│   │   ├── overlays/           # Modal/detail views
│   │   ├── input/              # SmartInput, RichTextEditor
│   │   ├── shared/             # Reusable components
│   │   └── settings/           # Settings tab components
│   ├── hooks/                  # React hooks
│   │   ├── useTodos.ts         # Todo state management
│   │   ├── usePeople.ts        # People management
│   │   ├── useProjects.ts      # Projects management
│   │   ├── useSettings.ts      # App settings
│   │   └── useSprints.ts       # Sprint management
│   ├── models/                 # Business logic layer
│   │   ├── TodoModel.ts        # Todo business logic (30+ methods)
│   │   ├── PersonModel.ts      # Person business logic
│   │   └── ProjectModel.ts     # Project business logic
│   ├── services/               # Service abstractions
│   │   └── NotificationService.ts  # Browser notifications
│   ├── storage/                # Storage abstraction
│   │   ├── storage.ts          # IndexedDB/localStorage adapters
│   │   └── migrations.ts       # Data migrations
│   ├── types/                  # TypeScript types
│   │   ├── todo.ts             # Todo types
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
// TodoModel provides 30+ methods and properties
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
import { loadFromStorage, saveToStorage } from "@/storage/storage";

const data = await loadFromStorage("doit-todos");
await saveToStorage("doit-todos", updatedData);
```

### Hooks Architecture

Each data domain has its own hook:

- `useTodos()` - Returns `TodoModel[]` with full CRUD
- `usePeople()` - Returns `PersonModel[]` with assignments
- `useProjects()` - Returns `ProjectModel[]` with linking
- `useSettings()` - App configuration

## ⚙️ Configuration

### Settings Tabs

- **General** - Archive retention, auto-delete
- **Priorities** - Custom priority levels with colors
- **Date/Time** - Morning, noon, afternoon, evening times
- **Work Hours** - Schedule configuration, time blocks
- **Gantt** - Scheduling technique settings, Pomodoro config
- **Kanban** - Workflow states, transitions, views
- **Sprints** - Sprint management, default duration
- **Auto-Assign** - Default metadata for new todos
- **Markers** - Color customization
- **Backup** - Export/import data

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
- **Testing**: Jest + ts-jest

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

Additional documentation is available in the `docs/` folder:

- [TodoModel Usage Guide](docs/todomodel-usage-guide.md)
- [Storage Architecture](docs/storage-architecture.md)
- [Auto-Detection Features](docs/auto-date-detection.md)
- [Recurring Tasks](docs/recurring-tasks.md)

---

Built with ❤️ using Next.js and TypeScript
