"use client";

import { useState } from "react";

type HelpSection = "getting-started" | "views" | "input" | "filtering" | "people-projects" | "keyboard" | "advanced";

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
  { id: "keyboard", title: "Keyboard Shortcuts", icon: "⌨️" },
  { id: "advanced", title: "Advanced Features", icon: "⚙️" },
];

export function HelpTab() {
  const [activeSection, setActiveSection] = useState<HelpSection>("getting-started");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Help & Documentation</h2>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Learn how to use Doit effectively with this comprehensive guide.
      </p>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
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
            {section.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        {activeSection === "getting-started" && <GettingStartedSection />}
        {activeSection === "views" && <ViewsSection />}
        {activeSection === "input" && <InputSection />}
        {activeSection === "filtering" && <FilteringSection />}
        {activeSection === "people-projects" && <PeopleProjectsSection />}
        {activeSection === "keyboard" && <KeyboardSection />}
        {activeSection === "advanced" && <AdvancedSection />}
      </div>
    </div>
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
              metadata like due dates, people, and projects.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">2. Complete Tasks</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Click the checkbox next to a task to mark it complete. Completed tasks can be automatically archived based
              on your settings.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">3. Organize with Views</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Switch between List, Kanban, Gantt, and Calendar views to visualize your tasks in different ways. Each
              view offers unique ways to manage your workflow.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">4. Add People & Projects</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Create people and projects to organize your tasks. Assign tasks to people using @name and link to projects
              using %project in your task text.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewsSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">👁️ Views</h3>

      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">📋 List View</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            The default view showing all your tasks in a list format. Features include:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Filter by status (Active, Completed, Archived)</li>
            <li>Group by person, project, priority, due date, or sprint</li>
            <li>Sort by created date, due date, priority, or title</li>
            <li>Quick search across all task fields</li>
          </ul>
        </div>

        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">📊 Kanban Board</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            A visual board for managing tasks through workflow states:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Drag and drop tasks between columns</li>
            <li>Customizable workflow states (Backlog, To Do, In Progress, etc.)</li>
            <li>Filter by sprint</li>
            <li>Configure allowed state transitions</li>
          </ul>
        </div>

        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">📅 Gantt Chart</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Timeline visualization for planning and scheduling:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>View tasks on a horizontal timeline</li>
            <li>Pomodoro-style planning with breaks</li>
            <li>Customizable time blocks (meetings, focus time, lunch)</li>
            <li>Group tasks by project</li>
          </ul>
        </div>

        <div className="border-l-4 border-orange-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">🗓️ Calendar View</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Monthly calendar showing tasks by due date:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Colored dots indicate tasks on each day</li>
            <li>Click a day to see all tasks due</li>
            <li>Navigate between months</li>
          </ul>
        </div>

        <div className="border-l-4 border-cyan-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">👥 People & Projects Views</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Manage your people and projects with dedicated views to create, edit, and organize them.
          </p>
        </div>

        <div className="border-l-4 border-pink-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">🏃 Sprints View</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Scrum-style sprint planning for agile workflows. Create sprints with goals and dates, assign tasks, and
            track progress.
          </p>
        </div>

        <div className="border-l-4 border-yellow-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">📈 Statistics View</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Charts and analytics showing task completion rates, distribution by person/project, and productivity trends.
          </p>
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
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">The smart input also automatically detects:</p>
        <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
          <li>
            <strong>Dates:</strong> &quot;tomorrow&quot;, &quot;next Friday&quot;, &quot;Dec 25&quot;, &quot;eod&quot;
            (end of day), &quot;bow&quot; (beginning of week)
          </li>
          <li>
            <strong>Recurring:</strong> &quot;every monday&quot;, &quot;every 2 weeks&quot;, &quot;every first
            friday&quot;
          </li>
          <li>
            <strong>Mentioned people:</strong> Names of existing people are automatically detected
          </li>
          <li>
            <strong>Projects:</strong> &quot;on Project Name&quot;, &quot;for Project Name&quot;, &quot;in Project
            Name&quot;
          </li>
          <li>
            <strong>Source:</strong> &quot;from John&quot;, &quot;via Sarah&quot;, &quot;per Mike&quot;
          </li>
          <li>
            <strong>Priorities:</strong> Priority names like &quot;urgent&quot;, &quot;high&quot;, &quot;low&quot; are
            auto-detected
          </li>
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
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Search</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use the search bar (or press{" "}
            <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">/</kbd>) to find tasks. Search
            looks across task text, comments, assigned people, projects, and tags.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Filters</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Click the filter button (or press{" "}
            <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">F</kbd>) to show filter options.
            You can filter by:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Assigned person</li>
            <li>Project</li>
            <li>Source person</li>
            <li>Mentioned people</li>
            <li>Priority</li>
            <li>Due date range</li>
            <li>Duration</li>
            <li>Tags</li>
            <li>Recurring tasks</li>
            <li>Dependencies</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Grouping</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Group tasks by person, project, priority, due date, sprint, or category to organize your view. Click on
            group headers to collapse/expand sections.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Sorting</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sort tasks by created date, updated date, due date, priority, or title. Click the sort button to toggle
            ascending/descending order.
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
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Creating People</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Go to the People view and click &quot;Add Person&quot;. You can add:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Name:</strong> The primary name for the person
            </li>
            <li>
              <strong>Alternatives:</strong> Nicknames or other names they go by
            </li>
            <li>
              <strong>Context:</strong> Role, department, or other info
            </li>
            <li>
              <strong>Color:</strong> Custom color for highlighting
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Creating Projects</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Go to the Projects view and click &quot;Add Project&quot;. Projects help organize related tasks together.
            Similar to people, projects can have alternatives and custom colors.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Using in Tasks</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Reference people and projects in your tasks:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">@John</code> - Assign task to John
            </li>
            <li>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">$Sarah</code> - Mark Sarah as the source
            </li>
            <li>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">%Website</code> - Link to Website project
            </li>
            <li>Or just mention names - they&apos;ll be auto-detected!</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Archiving</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Archive people or projects you no longer need. Archived items won&apos;t appear in dropdowns but remain
            linked to existing tasks.
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">Shortcut</th>
              <th className="text-left py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <tr>
              <td className="py-2 px-3">
                <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">N</kbd>
              </td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Create new task</td>
            </tr>
            <tr>
              <td className="py-2 px-3">
                <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">/</kbd>
              </td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Focus search</td>
            </tr>
            <tr>
              <td className="py-2 px-3">
                <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">F</kbd>
              </td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Toggle filters</td>
            </tr>
            <tr>
              <td className="py-2 px-3">
                <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">S</kbd>
              </td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Toggle selection mode</td>
            </tr>
            <tr>
              <td className="py-2 px-3">
                <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">1-8</kbd>
              </td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Switch between views</td>
            </tr>
            <tr>
              <td className="py-2 px-3">
                <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Esc</kbd>
              </td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Close overlay / Exit mode</td>
            </tr>
            <tr>
              <td className="py-2 px-3">
                <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">⌘/Ctrl + Z</kbd>
              </td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Undo</td>
            </tr>
            <tr>
              <td className="py-2 px-3">
                <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">
                  ⌘/Ctrl + Shift + Z
                </kbd>
              </td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Redo</td>
            </tr>
            <tr>
              <td className="py-2 px-3">
                <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Shift + ?</kbd>
              </td>
              <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Show shortcuts (console)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mt-4">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">💡 Tip</h4>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Keyboard shortcuts only work when you&apos;re not focused on an input field. Press Escape first if needed.
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
            Save frequently used task configurations as templates. Create templates from existing tasks or from scratch,
            then quickly apply them when creating new tasks.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔄 Recurring Tasks</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Create recurring tasks using patterns like &quot;every monday&quot;, &quot;every 2 weeks&quot;, or
            &quot;every first friday&quot;. When you complete a recurring task, a new instance is automatically created
            for the next occurrence.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔗 Dependencies</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Link tasks together with dependencies. A task with dependencies can only be completed after its blockers are
            done. Set dependencies in the task detail view.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">✅ Batch Processing</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enable selection mode to select multiple tasks at once. Then perform batch operations like completing,
            archiving, deleting, or editing shared properties.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">💾 Backup & Export</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Export your data in various formats (Markdown, CSV, JSON) or create full backups. Import tasks from other
            systems using the Import tab in settings.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🏃 Sprints</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use sprints for agile-style planning. Create time-boxed sprints with goals, assign tasks to sprints, and
            track progress on the Kanban board filtered by sprint.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🍅 Pomodoro Planning</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The Gantt view supports Pomodoro-style planning with configurable short and long breaks. Enable it in
            Settings → Gantt to schedule breaks between tasks automatically.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔔 Notifications</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enable browser notifications for reminders and Pomodoro breaks. Configure notification preferences in
            Settings → Notifications.
          </p>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
        <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">🎛️ Feature Toggles</h4>
        <p className="text-sm text-green-800 dark:text-green-200">
          Don&apos;t need all these features? Go to Settings → General to disable views and tools you don&apos;t use.
          This simplifies the interface by hiding unused options.
        </p>
      </div>
    </div>
  );
}
