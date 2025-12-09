"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/Modal";

type HelpSection =
  | "getting-started"
  | "views"
  | "input"
  | "filtering"
  | "people-projects"
  | "time-tracking"
  | "keyboard"
  | "settings"
  | "advanced";

interface HelpSectionData {
  id: HelpSection;
  title: string;
  icon: string;
}

const sections: HelpSectionData[] = [
  { id: "getting-started", title: "Getting Started", icon: "🚀" },
  { id: "views", title: "Views", icon: "👁️" },
  { id: "input", title: "Smart Input", icon: "✏️" },
  { id: "filtering", title: "Filtering & Sorting", icon: "🔍" },
  { id: "people-projects", title: "People & Projects", icon: "👥" },
  { id: "time-tracking", title: "Time & Focus", icon: "⏱️" },
  { id: "keyboard", title: "Keyboard Shortcuts", icon: "⌨️" },
  { id: "settings", title: "Settings", icon: "🔧" },
  { id: "advanced", title: "Advanced Features", icon: "⚙️" },
];

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpOverlay({ isOpen, onClose }: HelpOverlayProps) {
  const [activeSection, setActiveSection] = useState<HelpSection>("getting-started");

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl">
      <div className="flex flex-col h-[80vh] max-h-[800px]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
                ❓
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Help & Documentation</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Learn how to use Doit effectively</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap gap-2 mt-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span className="mr-1">{section.icon}</span>
                <span className="hidden sm:inline">{section.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "getting-started" && <GettingStartedSection />}
          {activeSection === "views" && <ViewsSection />}
          {activeSection === "input" && <InputSection />}
          {activeSection === "filtering" && <FilteringSection />}
          {activeSection === "people-projects" && <PeopleProjectsSection />}
          {activeSection === "time-tracking" && <TimeTrackingSection />}
          {activeSection === "keyboard" && <KeyboardSection />}
          {activeSection === "settings" && <SettingsSection />}
          {activeSection === "advanced" && <AdvancedSection />}
        </div>
      </div>
    </Modal>
  );
}

function GettingStartedSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">🚀 Getting Started</h3>

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="text-zinc-600 dark:text-zinc-400">
          Doit is a powerful todo app designed to help you manage tasks efficiently. Here&apos;s how to get started:
        </p>

        <div className="space-y-4 mt-4">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">1. Create Your First Task</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Type in the input field at the top and press Enter. You can add simple tasks or use smart markers to add
              metadata like due dates, people, and projects. Press{" "}
              <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">N</kbd> anywhere to focus the
              input.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">2. Complete Tasks</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Click the checkbox next to a task to mark it complete. Completed tasks can be automatically archived based
              on your settings (default: 7 days). The checkbox outline shows the task&apos;s priority color.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">3. Organize with Views</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Switch between List, Kanban, Gantt, and Calendar views using the tabs at the top or number keys{" "}
              <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">1-8</kbd>. Each view offers
              unique ways to manage your workflow.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">4. Add People & Projects</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Create people and projects to organize your tasks. Assign tasks to people using{" "}
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">@name</code> and link to projects using{" "}
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">%project</code> in your task text.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">5. Click for Details</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Click on any task to open the detail view where you can add comments, set due dates, durations,
              dependencies, subtasks, and more. Changes are saved automatically.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">💡 Quick Tips</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
            <li>
              Press <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">?</kbd> anytime to open
              this help
            </li>
            <li>
              Use <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">/</kbd> to quickly search
              tasks
            </li>
            <li>All data is stored locally in your browser (IndexedDB with localStorage fallback)</li>
            <li>Create backups regularly in Settings → Backup</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ViewsSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">👁️ Views</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Doit offers multiple views to visualize and manage your tasks. Switch views using tabs or number keys{" "}
        <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">1-8</kbd>.
      </p>

      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">📋 List View (1)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            The default view showing all your tasks in a list format. Features include:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Filter by status (Active, Completed, Archived)</li>
            <li>Group by person, project, priority, due date, sprint, or category</li>
            <li>Sort by created date, due date, priority, title, or manual order</li>
            <li>Quick search across all task fields</li>
            <li>Save and load custom view presets</li>
            <li>Drag-and-drop manual reordering</li>
          </ul>
        </div>

        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">📊 Kanban Board (2)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            A visual board for managing tasks through workflow states:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Drag and drop tasks between columns</li>
            <li>Customizable workflow states (Backlog, To Do, In Progress, Review, Done, Archived)</li>
            <li>Filter by sprint (All, Backlog, or specific sprint)</li>
            <li>Create custom views showing different state combinations</li>
            <li>Configure allowed state transitions in Settings</li>
            <li>Cards show priority, assignee, due date, and more</li>
          </ul>
        </div>

        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">📅 Gantt Chart (3)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Timeline visualization for planning and scheduling:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>View tasks on a horizontal timeline</li>
            <li>Three scheduling techniques: Sequential, Pomodoro, and Flow</li>
            <li>Customizable time blocks (meetings, focus time, lunch, breaks)</li>
            <li>Group tasks by project</li>
            <li>Shows dependencies between tasks</li>
            <li>Click &quot;Start Focus&quot; to enter focus mode from any task</li>
          </ul>
        </div>

        <div className="border-l-4 border-orange-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">🗓️ Calendar View (4)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Monthly calendar showing tasks by due date:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Colored dots indicate tasks on each day (by state, priority, or project)</li>
            <li>Click a day to see all tasks due</li>
            <li>Navigate between months</li>
            <li>Week numbers and overdue badges (optional)</li>
            <li>Shows recurring task indicators</li>
          </ul>
        </div>

        <div className="border-l-4 border-cyan-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">👥 People View (5)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Manage your contacts with dedicated features:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Create people with names and alternative names (nicknames)</li>
            <li>Add context notes and comments</li>
            <li>Custom colors for highlighting in tasks</li>
            <li>See task counts per person</li>
            <li>Archive inactive people</li>
          </ul>
        </div>

        <div className="border-l-4 border-indigo-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">📁 Projects View (6)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Organize work into projects with categories:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Create projects with alternative names</li>
            <li>Assign projects to categories (Work, Personal, etc.)</li>
            <li>Custom colors for project badges</li>
            <li>Add context notes and comments</li>
            <li>Archive completed projects</li>
          </ul>
        </div>

        <div className="border-l-4 border-pink-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">🏃 Sprints View (7)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Scrum-style sprint planning:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Create time-boxed sprints with goals and dates</li>
            <li>Sprint statuses: Planning, Active, Completed, Cancelled</li>
            <li>Assign tasks to sprints via the task detail view</li>
            <li>Filter Kanban board by sprint</li>
            <li>Track sprint progress</li>
          </ul>
        </div>

        <div className="border-l-4 border-yellow-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">📈 Statistics View (8)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Analytics and insights:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Task completion rates over time</li>
            <li>Distribution by person, project, and priority</li>
            <li>Productivity trends</li>
            <li>Time tracking summaries</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function InputSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">✏️ Smart Input</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        The smart input field automatically detects metadata as you type. Here are the markers you can use:
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">Marker</th>
              <th className="text-left py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">Purpose</th>
              <th className="text-left py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <tr>
              <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">@name</td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Assign to person</td>
              <td className="py-2 px-3 text-zinc-500 dark:text-zinc-500">Review PR @John</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-mono text-green-600 dark:text-green-400">$name</td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Source person (who requested)</td>
              <td className="py-2 px-3 text-zinc-500 dark:text-zinc-500">Fix bug $Sarah</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-mono text-purple-600 dark:text-purple-400">%project</td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Link to project</td>
              <td className="py-2 px-3 text-zinc-500 dark:text-zinc-500">Update docs %Website</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-mono text-red-600 dark:text-red-400">!!priority</td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Set priority</td>
              <td className="py-2 px-3 text-zinc-500 dark:text-zinc-500">Deploy hotfix !!urgent</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-mono text-cyan-600 dark:text-cyan-400">#tag</td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Add tag</td>
              <td className="py-2 px-3 text-zinc-500 dark:text-zinc-500">Research #frontend #react</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">🪄 Auto-Detection</h4>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
          The smart input automatically detects these patterns without markers:
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
          <li>
            <strong>Dates:</strong> &quot;tomorrow&quot;, &quot;next Friday&quot;, &quot;Dec 25&quot;, &quot;in 3
            days&quot;
          </li>
          <li>
            <strong>Date shortcuts:</strong> &quot;eod&quot; (end of day), &quot;bow&quot; (beginning of week),
            &quot;eom&quot; (end of month), &quot;morning&quot;, &quot;noon&quot;, &quot;afternoon&quot;
          </li>
          <li>
            <strong>Recurring:</strong> &quot;every monday&quot;, &quot;every 2 weeks&quot;, &quot;every first
            friday&quot;, &quot;every day&quot;
          </li>
          <li>
            <strong>Mentioned people:</strong> Names of existing people are automatically highlighted
          </li>
          <li>
            <strong>Projects with context:</strong> &quot;on Project Name&quot;, &quot;for Project&quot;, &quot;in
            Project&quot;
          </li>
          <li>
            <strong>Source with context:</strong> &quot;from John&quot;, &quot;via Sarah&quot;, &quot;per Mike&quot;
          </li>
          <li>
            <strong>Priorities:</strong> &quot;urgent&quot;, &quot;high&quot;, &quot;medium&quot;, &quot;low&quot; are
            auto-detected
          </li>
        </ul>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">📅 Date Shorthand Reference</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-green-800 dark:text-green-200">
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">today</code> - Today
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">tomorrow</code> - Tomorrow
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">eod</code> - End of day
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">bod</code> - Beginning of day
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">bow</code> - Beginning of week
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">eow</code> - End of week
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">bom</code> - Beginning of month
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">eom</code> - End of month
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">boq</code> - Beginning of quarter
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">eoq</code> - End of quarter
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">morning</code> - Morning time
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">afternoon</code> - Afternoon time
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">💡 Input Tips</h4>
        <ul className="text-sm text-amber-800 dark:text-amber-200 list-disc list-inside space-y-1">
          <li>Auto-detected dates and recurring patterns are removed from the task text</li>
          <li>Click on a detected token to deactivate it</li>
          <li>People mentioned with @ and $ markers stay in the text</li>
          <li>Use the detail view to set duration and dependencies (no markers for these)</li>
          <li>Press Enter to create the task, or Escape to cancel</li>
        </ul>
      </div>
    </div>
  );
}

function FilteringSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">🔍 Filtering & Sorting</h3>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔎 Search</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use the search bar (or press{" "}
            <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">/</kbd>) to find tasks. Search
            looks across:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Task text and plain text</li>
            <li>Comments</li>
            <li>Assigned people and source</li>
            <li>Projects and tags</li>
            <li>Context notes</li>
          </ul>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2 italic">
            Search history is saved automatically. Click on the search field to see recent searches.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🎛️ Filters</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Click the filter button (or press{" "}
            <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">F</kbd>) to show filter options.
            Available filters:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Assigned person
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Source person
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> Project
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Mentioned people
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Priority
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-500"></span> Due date range
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Duration
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> Tags
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Recurring tasks
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Dependencies
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2 italic">
            Filter buttons are colored using your configured marker colors from Settings.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📂 Grouping</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Group tasks to organize your view. Available grouping options:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>None:</strong> Flat list of all tasks
            </li>
            <li>
              <strong>Person:</strong> Group by assigned person
            </li>
            <li>
              <strong>Project:</strong> Group by project
            </li>
            <li>
              <strong>Priority:</strong> Group by priority level
            </li>
            <li>
              <strong>Due Date:</strong> Group by due date (Overdue, Today, This Week, Later, etc.)
            </li>
            <li>
              <strong>Sprint:</strong> Group by sprint assignment
            </li>
            <li>
              <strong>Category:</strong> Group by project category
            </li>
          </ul>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2 italic">
            Click on group headers to collapse/expand sections.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">↕️ Sorting</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Sort tasks by these fields:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Created date (newest/oldest first)</li>
            <li>Updated date</li>
            <li>Due date (soonest/latest first)</li>
            <li>Priority (highest/lowest first)</li>
            <li>Title (alphabetical)</li>
            <li>Manual order (drag to reorder)</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">💾 View Presets</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Save your current filter, sort, and group settings as a preset. Quickly switch between different views for
            different workflows (e.g., &quot;My Tasks&quot;, &quot;Team Overview&quot;, &quot;Due This Week&quot;).
          </p>
        </div>
      </div>
    </div>
  );
}

function PeopleProjectsSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">👥 People & Projects</h3>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">👤 Creating People</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Go to the People view and click &quot;Add Person&quot;. You can configure:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Name:</strong> The primary name for the person
            </li>
            <li>
              <strong>Alternatives:</strong> Nicknames or variations (e.g., &quot;Johnny&quot;, &quot;JD&quot;)
            </li>
            <li>
              <strong>Context:</strong> Role, department, notes, or any other info (rich text supported)
            </li>
            <li>
              <strong>Color:</strong> Custom highlight color (or use default marker color)
            </li>
            <li>
              <strong>Comments:</strong> Add notes with full edit history
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📁 Creating Projects</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Go to the Projects view and click &quot;Add Project&quot;. Projects have:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Name:</strong> The primary project name
            </li>
            <li>
              <strong>Alternatives:</strong> Other names or abbreviations
            </li>
            <li>
              <strong>Category:</strong> Work, Personal, or custom categories
            </li>
            <li>
              <strong>Context:</strong> Description, goals, or notes
            </li>
            <li>
              <strong>Color:</strong> Custom color for project badges
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🏷️ Categories</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Organize projects into categories (e.g., Work, Personal, Client A). Configure categories in Settings →
            Categories. Categories help you:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Group related projects together</li>
            <li>Filter tasks by category</li>
            <li>Apply category-specific time blocks in Gantt view</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">✨ Using in Tasks</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Reference people and projects in your tasks:</p>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <code className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono">
                @John
              </code>
              <span className="text-zinc-600 dark:text-zinc-400">Assign task to John (shows in blue)</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded font-mono">
                $Sarah
              </code>
              <span className="text-zinc-600 dark:text-zinc-400">Mark Sarah as source/requester (shows in green)</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-mono">
                %Website
              </code>
              <span className="text-zinc-600 dark:text-zinc-400">Link to Website project (shows in purple)</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded font-mono">
                John
              </code>
              <span className="text-zinc-600 dark:text-zinc-400">Auto-detected mention (shows in yellow/orange)</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📦 Archiving</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Archive people or projects you no longer need. Archived items:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Won&apos;t appear in dropdowns when creating tasks</li>
            <li>Remain linked to existing tasks</li>
            <li>Can be viewed by toggling &quot;Show Archived&quot;</li>
            <li>Can be unarchived anytime</li>
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">💡 Pro Tip: Alternative Names</h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Add alternative names for better auto-detection. For example, if you have a person named &quot;John
            Doe&quot; with alternatives &quot;Johnny&quot; and &quot;JD&quot;, typing any of these in a task will
            automatically highlight them.
          </p>
        </div>
      </div>
    </div>
  );
}

function KeyboardSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">⌨️ Keyboard Shortcuts</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Use these shortcuts to navigate and manage tasks quickly. Shortcuts work when not focused on an input field.
      </p>

      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">🧭 Navigation</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="py-2 px-3 w-40">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">1</kbd> -{" "}
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">8</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                    Switch between views (List, Kanban, Gantt, Calendar, People, Projects, Sprints, Stats)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">/</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Focus search bar</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Esc</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                    Close overlay / Clear search / Exit mode
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">📝 Task Management</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="py-2 px-3 w-40">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">N</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Create new task (focus input)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">S</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                    Toggle selection mode for batch operations
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">F</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Toggle filters panel</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">?</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Show this help overlay</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">↩️ Undo/Redo</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="py-2 px-3 w-40">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">⌘/Ctrl</kbd>
                    <span className="mx-1">+</span>
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Z</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Undo last action</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">⌘/Ctrl</kbd>
                    <span className="mx-1">+</span>
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Shift</kbd>
                    <span className="mx-1">+</span>
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Z</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Redo last undone action</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">🎯 Focus Mode</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="py-2 px-3 w-40">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Space</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Pause/Resume timer</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Enter</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Complete current task</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">→</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Skip to next task</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">+</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Extend timer</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mt-4">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">💡 Tip</h4>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Keyboard shortcuts only work when you&apos;re not focused on an input field. Press{" "}
          <kbd className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 rounded text-xs">Escape</kbd> first to unfocus
          any input, then use the shortcut.
        </p>
      </div>
    </div>
  );
}

function TimeTrackingSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">⏱️ Time Tracking & Focus Mode</h3>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⏱️ Time Tracking</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Track time spent on tasks directly from the task detail view:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Click &quot;Start Timer&quot; to begin tracking</li>
            <li>Pause and resume as needed</li>
            <li>Add manual time entries</li>
            <li>View total time tracked per task</li>
            <li>Compare actual vs. estimated time</li>
            <li>Time entries are stored with timestamps and optional notes</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🎯 Focus Mode</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enter a distraction-free mode to work through your tasks sequentially:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Start from the Gantt view by clicking &quot;Start Focus&quot; on any task</li>
            <li>Full-screen timer with task details</li>
            <li>Automatic time tracking</li>
            <li>Notifications when tasks complete or breaks start</li>
            <li>Preview of the next task during breaks</li>
            <li>Session statistics (tasks completed, time worked)</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🍅 Scheduling Techniques</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The Gantt view supports three scheduling techniques:
          </p>
          <div className="mt-3 space-y-3">
            <div className="pl-3 border-l-2 border-blue-500">
              <h5 className="font-medium text-zinc-900 dark:text-zinc-100">📋 Sequential</h5>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Simple task-to-task scheduling with configurable context switching time between tasks.
              </p>
            </div>
            <div className="pl-3 border-l-2 border-red-500">
              <h5 className="font-medium text-zinc-900 dark:text-zinc-100">🍅 Pomodoro</h5>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Work in focused sessions (default 25 min) with short breaks (5 min) and long breaks (15 min) after every
                4 sessions. Includes audio notifications.
              </p>
            </div>
            <div className="pl-3 border-l-2 border-green-500">
              <h5 className="font-medium text-zinc-900 dark:text-zinc-100">🌊 Flow</h5>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Extended focus sessions (default 52 min) with longer breaks (17 min). Based on the 52/17 method or
                Ultradian rhythm.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔔 Notifications & Sounds</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Configure alerts in Settings → Focus:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Browser notifications for breaks and task events</li>
            <li>Sound alerts (different tones for short/long breaks)</li>
            <li>Optional confirmation before starting breaks</li>
            <li>Ambient sounds during work and break phases</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⏰ Time Blocks</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Block out parts of your day in Settings → Work Hours:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Set work hours for each day</li>
            <li>Add blocks: Break ☕, Lunch 🍴, Meeting 👥, Focus Time 🎯, Commute 🚗, Personal 🏠</li>
            <li>Custom colors per block type</li>
            <li>Different schedules for weekdays vs. weekends</li>
            <li>Tasks automatically schedule around your blocks</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">💡 Time Tracking Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
          <li>Set duration estimates on tasks to compare actual vs. planned time</li>
          <li>Use Focus Mode to automatically track time while working</li>
          <li>Review tracked time in the Statistics view</li>
          <li>Extend the timer if you need more time (press + in Focus Mode)</li>
        </ul>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">🔧 Settings</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Access settings via the gear icon in the header. Settings are organized into tabs:
      </p>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⚙️ General</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>Theme:</strong> Light, Dark, or System preference
            </li>
            <li>
              <strong>Auto-Archive:</strong> Days before completed tasks are archived (default: 7)
            </li>
            <li>
              <strong>Auto-Delete:</strong> Days before archived tasks are deleted (default: 90)
            </li>
            <li>
              <strong>Feature Toggles:</strong> Enable/disable views and features to simplify the interface
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🎨 Priorities</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Create custom priority levels (default: Urgent, High, Medium, Low)</li>
            <li>Set custom colors for each priority</li>
            <li>Add alternative names (e.g., &quot;asap&quot; for &quot;urgent&quot;)</li>
            <li>Drag to reorder priority levels</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🏷️ Categories</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Organize projects into categories (Work, Personal, etc.)</li>
            <li>Custom colors per category</li>
            <li>Filter and group tasks by category</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🎨 Markers</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Customize colors for each marker type (@, $, %, !!, #, etc.)</li>
            <li>Colors apply to highlighting in the input and task display</li>
            <li>Filter buttons also use these colors</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📅 Date/Time</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>Time-of-day:</strong> Set times for morning, noon, afternoon, evening shortcuts
            </li>
            <li>
              <strong>Work Week Start:</strong> Sunday or Monday
            </li>
            <li>
              <strong>Fiscal Year Start:</strong> Month when fiscal year begins (for bofy/eofy shortcuts)
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🕐 Work Hours</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Set daily work hours (start/end times)</li>
            <li>Add time blocks (lunch, meetings, focus time, breaks)</li>
            <li>Different schedules for weekdays vs. weekends</li>
            <li>Per-day custom schedules if needed</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📊 Gantt & Calendar</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>Gantt:</strong> Scheduling technique (Sequential, Pomodoro, Flow), presets, zoom level
            </li>
            <li>
              <strong>Calendar:</strong> Week start day, dot colors, task limits per day
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📋 Kanban</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>Workflow States:</strong> Add/edit/reorder columns with custom colors and icons
            </li>
            <li>
              <strong>Transitions:</strong> Define which states can move to which others
            </li>
            <li>
              <strong>Views:</strong> Create custom views showing different state combinations
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔄 Auto-Assign</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Set default values for new tasks. When enabled, new tasks automatically get:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Default assigned person</li>
            <li>Default project</li>
            <li>Default priority (default: Medium)</li>
            <li>Default due date (default: Today)</li>
            <li>Default duration (default: 30 minutes)</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">💾 Backup & Import</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>Backup:</strong> Export all data as JSON (tasks, people, projects, settings)
            </li>
            <li>
              <strong>Restore:</strong> Import from a backup file
            </li>
            <li>
              <strong>Export:</strong> Export tasks in Markdown, CSV, or JSON format
            </li>
            <li>
              <strong>Import:</strong> Import tasks from external sources
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔗 Links</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Define link patterns to auto-detect references in task text:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              Set a prefix (e.g., &quot;T&quot;) and URL template (e.g.,
              &quot;https://jira.com/browse/&#123;id&#125;&quot;)
            </li>
            <li>Text like &quot;T-123&quot; becomes a clickable link</li>
            <li>Custom colors per link pattern</li>
          </ul>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">💡 Simplify Your Interface</h4>
        <p className="text-sm text-green-800 dark:text-green-200">
          Don&apos;t need all features? Go to Settings → General → Feature Toggles to disable views (Gantt, Calendar,
          Kanban, Sprints, Stats) and features (Templates, Batch Processing, Focus Mode) you don&apos;t use.
        </p>
      </div>
    </div>
  );
}

function AdvancedSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">⚙️ Advanced Features</h3>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📝 Templates</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Save frequently used task configurations as templates for quick reuse:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Create templates from existing tasks or from scratch</li>
            <li>Include text, metadata (assignee, project, priority, tags), and subtasks</li>
            <li>Quick-apply when creating new tasks</li>
            <li>Track usage count per template</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔄 Recurring Tasks</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Create recurring tasks that automatically regenerate:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Intervals:</strong> &quot;every day&quot;, &quot;every 2 weeks&quot;, &quot;every 3 months&quot;
            </li>
            <li>
              <strong>Weekdays:</strong> &quot;every monday&quot;, &quot;every friday&quot;, &quot;every workday&quot;
            </li>
            <li>
              <strong>Nth weekdays:</strong> &quot;every first monday&quot;, &quot;every last friday&quot;
            </li>
            <li>When you complete a recurring task, a new instance is automatically created</li>
            <li>The next due date is calculated from the pattern</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔗 Dependencies</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Link tasks together with dependencies:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Set blockers in the task detail view</li>
            <li>Tasks with unfinished dependencies show a blocked indicator</li>
            <li>Complete blockers before completing dependent tasks</li>
            <li>Dependencies show as arrows in the Gantt view</li>
            <li>Filter by tasks with/without dependencies</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">✅ Subtasks</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Break down complex tasks into subtasks:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Add subtasks in the task detail view</li>
            <li>Check off subtasks independently</li>
            <li>Progress indicator shows completed/total</li>
            <li>Include subtasks in templates</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">✅ Batch Processing</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">S</kbd> to enable
            selection mode:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Click tasks to select/deselect them</li>
            <li>Use &quot;Select All&quot; / &quot;Clear All&quot; buttons</li>
            <li>
              <strong>Batch operations:</strong> Complete, Archive, Delete, Unarchive
            </li>
            <li>
              <strong>Batch edit:</strong> Change assignee, project, priority, sprint, or due date for all selected
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">💾 Backup & Export</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Keep your data safe and portable:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Full Backup (JSON):</strong> All tasks, people, projects, sprints, and settings
            </li>
            <li>
              <strong>Export Markdown:</strong> Human-readable task list
            </li>
            <li>
              <strong>Export CSV:</strong> Spreadsheet-compatible format
            </li>
            <li>
              <strong>Import:</strong> Restore from backup or import from other systems
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🏃 Sprints & Scrum</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Agile-style sprint planning:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Create time-boxed sprints with goals and dates</li>
            <li>Sprint statuses: Planning → Active → Completed/Cancelled</li>
            <li>Assign tasks to sprints</li>
            <li>Filter Kanban board by sprint</li>
            <li>Group tasks by sprint in List view</li>
            <li>Batch-assign sprint to selected tasks</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📚 Activity History</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Track all changes to tasks, people, and projects:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>View activity log in the detail overlay</li>
            <li>See when tasks were created, edited, completed, archived</li>
            <li>Track metadata changes (assignee, project, priority, etc.)</li>
            <li>Comment history with edit timestamps</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">💬 Comments</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Add notes and updates to tasks:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Add comments in the task detail view</li>
            <li>Edit comments (full history preserved)</li>
            <li>Delete comments</li>
            <li>Comments are searchable</li>
            <li>People and projects also support comments</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">↩️ Undo/Redo</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Mistakes happen - undo any action:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">⌘/Ctrl + Z</kbd> to undo
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">⌘/Ctrl + Shift + Z</kbd> to
              redo
            </li>
            <li>Undo creating, editing, completing, archiving, or deleting tasks</li>
            <li>Works with batch operations too</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📏 Manual Reordering</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Drag tasks to set custom order:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Set sort to &quot;Manual&quot; in List view</li>
            <li>Drag tasks up/down to reorder</li>
            <li>Order is preserved when sorting by manual</li>
            <li>Works within groups</li>
          </ul>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mt-4">
        <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm mb-2">🗄️ Storage</h4>
        <p className="text-sm text-purple-800 dark:text-purple-200">
          All data is stored locally in your browser using IndexedDB (with localStorage fallback for Safari private
          mode). Data never leaves your device. Create regular backups in Settings → Backup to protect your data.
        </p>
      </div>
    </div>
  );
}
