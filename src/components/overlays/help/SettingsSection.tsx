"use client";

export function SettingsSection() {
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
              <strong>Fiscal Year Start:</strong> Month when the fiscal year begins, used for Review periods
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
