"use client";

import { ViewShortcuts, shortcutFor } from "./shortcuts";

export function ViewsSection({ shortcuts }: { shortcuts: ViewShortcuts }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">👁️ Views</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Doit offers multiple views to visualize and manage your tasks. Switch views using tabs or number keys{" "}
        <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">{shortcuts.range}</kbd>.
      </p>

      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"📋 List View"}{shortcutFor(shortcuts, "List")}</h4>
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
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"🗓️ Calendar View"}{shortcutFor(shortcuts, "Calendar")}</h4>
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
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"👥 People View"}{shortcutFor(shortcuts, "People")}</h4>
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
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"📁 Projects View"}{shortcutFor(shortcuts, "Projects")}</h4>
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
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"🏃 Sprints View"}{shortcutFor(shortcuts, "Sprints")}</h4>
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
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"📈 Statistics View"}{shortcutFor(shortcuts, "Stats")}</h4>
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
