"use client";

export function QuickStartSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">⚡ Quick Start Guide</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Follow this step-by-step tutorial to learn the basics in 10 minutes. Try each step as you read!
      </p>

      {/* Tutorial 1: Creating Tasks */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-blue-500 text-white px-4 py-2 font-semibold">📝 Tutorial 1: Creating Tasks (2 minutes)</div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              1
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Press N or click the input field</p>
              <p className="mt-1">The cursor should be in the &quot;Add a new todo...&quot; field at the top.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              2
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Type a simple task</p>
              <p className="mt-1">
                Try: <code className="bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded">Call dentist</code>
              </p>
              <p className="mt-1">Press Enter. Your task appears in the list!</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              3
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Now try a task with a date</p>
              <p className="mt-1">
                Type: <code className="bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded">Buy milk tomorrow</code>
              </p>
              <p className="mt-1">
                Notice how &quot;tomorrow&quot; gets highlighted? It&apos;s auto-detected as a due date!
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              4
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Try more date formats</p>
              <p className="mt-1">
                These all work: <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">next friday</code>,{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">in 3 days</code>,{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Dec 25</code>,{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">eod</code> (end of day)
              </p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm text-green-800 dark:text-green-200">
            ✅ <strong>You learned:</strong> Creating tasks with automatic date detection
          </div>
        </div>
      </div>

      {/* Tutorial 2: Using Markers */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-purple-500 text-white px-4 py-2 font-semibold">🏷️ Tutorial 2: Using Markers (3 minutes)</div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
              1
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">First, create a person</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">5</kbd> to go to
                People view → Click &quot;Add Person&quot; → Enter &quot;John&quot; → Save
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
              2
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create a project</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">6</kbd> to go to
                Projects view → Click &quot;Add Project&quot; → Enter &quot;Website&quot; → Save
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
              3
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Go back to List view</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">1</kbd> to return to
                the task list.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
              4
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Use markers in your task</p>
              <p className="mt-1">
                Type:{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded">
                  Review homepage @John %Website !!high
                </code>
              </p>
              <p className="mt-1">Watch the text highlight as you type each marker!</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-3">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-2 px-2 font-medium text-zinc-900 dark:text-zinc-100">Marker</th>
                  <th className="text-left py-2 px-2 font-medium text-zinc-900 dark:text-zinc-100">Meaning</th>
                  <th className="text-left py-2 px-2 font-medium text-zinc-900 dark:text-zinc-100">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400">
                <tr>
                  <td className="py-2 px-2 font-mono text-blue-600 dark:text-blue-400">@</td>
                  <td className="py-2 px-2">Assign to person</td>
                  <td className="py-2 px-2">
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">@John</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-mono text-green-600 dark:text-green-400">$</td>
                  <td className="py-2 px-2">Source/requester</td>
                  <td className="py-2 px-2">
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">$Sarah</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-mono text-purple-600 dark:text-purple-400">%</td>
                  <td className="py-2 px-2">Project</td>
                  <td className="py-2 px-2">
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">%Website</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-mono text-red-600 dark:text-red-400">!!</td>
                  <td className="py-2 px-2">Priority</td>
                  <td className="py-2 px-2">
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">!!urgent</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-mono text-cyan-600 dark:text-cyan-400">#</td>
                  <td className="py-2 px-2">Tag</td>
                  <td className="py-2 px-2">
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">#frontend</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm text-green-800 dark:text-green-200">
            ✅ <strong>You learned:</strong> Using @, $, %, !!, and # markers to add metadata
          </div>
        </div>
      </div>

      {/* Tutorial 3: Managing Tasks */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-green-500 text-white px-4 py-2 font-semibold">✅ Tutorial 3: Managing Tasks (2 minutes)</div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
              1
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Complete a task</p>
              <p className="mt-1">Click the checkbox (circle) next to &quot;Call dentist&quot; to mark it complete.</p>
              <p className="mt-1">The task moves to the &quot;Completed&quot; section with a strikethrough.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
              2
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Undo a mistake</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">Undo</kbd> in the
                notification that appears.
              </p>
              <p className="mt-1">The task returns to Active. The button stays for ten seconds.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
              3
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Open task details</p>
              <p className="mt-1">Click on any task text to open the detail overlay.</p>
              <p className="mt-1">Here you can edit everything: text, dates, duration, comments, subtasks.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
              4
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Add a comment</p>
              <p className="mt-1">In the detail overlay, scroll to &quot;Comments&quot; section.</p>
              <p className="mt-1">Type a note and press Enter. Comments are great for tracking progress!</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
              5
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Close the overlay</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">Esc</kbd> or click
                outside to close.
              </p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm text-green-800 dark:text-green-200">
            ✅ <strong>You learned:</strong> Completing tasks, undo/redo, and using the detail view
          </div>
        </div>
      </div>

      {/* Tutorial 4: Filtering */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-orange-500 text-white px-4 py-2 font-semibold">🔍 Tutorial 4: Finding Tasks (3 minutes)</div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              1
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Search for tasks</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">/</kbd> to focus the
                search bar.
              </p>
              <p className="mt-1">Type part of a task name. Results filter instantly!</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              2
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Open the filters panel</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">F</kbd> or click the
                filter button.
              </p>
              <p className="mt-1">You&apos;ll see filter buttons for people, projects, priorities, and more.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              3
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Filter by person</p>
              <p className="mt-1">Click on &quot;John&quot; in the Assigned filter section.</p>
              <p className="mt-1">Only tasks assigned to John are shown. Click again to remove the filter.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              4
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Change grouping</p>
              <p className="mt-1">Find the &quot;Group by&quot; dropdown (usually says &quot;None&quot;).</p>
              <p className="mt-1">Change it to &quot;Project&quot; or &quot;Priority&quot; to organize your view.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              5
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Save as a preset (optional)</p>
              <p className="mt-1">Like this view? Click the presets icon (star/bookmark) to save it.</p>
              <p className="mt-1">Give it a name like &quot;John&apos;s Tasks&quot; for quick access later.</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm text-green-800 dark:text-green-200">
            ✅ <strong>You learned:</strong> Searching, filtering, grouping, and saving view presets
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">🎉 You&apos;re Ready!</h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          You now know the basics of Doit! Explore the other help sections to learn about:
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside mt-2 space-y-1">
          <li>
            <strong>Views:</strong> Kanban boards, Gantt charts, and Calendar
          </li>
          <li>
            <strong>Time & Focus:</strong> Time tracking and Pomodoro techniques
          </li>
          <li>
            <strong>Advanced:</strong> Recurring tasks, dependencies, subtasks, sprints
          </li>
          <li>
            <strong>Workflows:</strong> Common use cases and best practices
          </li>
        </ul>
      </div>
    </div>
  );
}
