"use client";

export function PeopleProjectsSection() {
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
