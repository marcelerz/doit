"use client";

export function FilteringSection() {
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
