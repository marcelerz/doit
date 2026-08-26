"use client";

export function InputSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">✏️ Smart Input</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        The smart input field automatically detects metadata as you type, saving you time and clicks.
      </p>

      {/* Step by Step Input Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-3">
          📝 Step-by-Step: Creating a Task with Metadata
        </h4>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>
              Press <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">N</kbd> or click the
              input field
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>
              Type your task: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">Review PR</code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>
              Add who: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">@John</code> (type @ then the name)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>
              Add when: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">tomorrow</code> (auto-detected!)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">5.</span>
            <span>
              Add project: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">%Website</code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">6.</span>
            <span>
              Press <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Enter</kbd> to create!
            </span>
          </li>
        </ol>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-3 italic">
          Final input:{" "}
          <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">Review PR @John tomorrow %Website</code>
        </p>
      </div>

      {/* Markers Table */}
      <div>
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">🏷️ Available Markers</h4>
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
      </div>

      {/* Auto-Detection Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-3">
          🪄 Auto-Detection (No Markers Needed!)
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
          These patterns are automatically detected without typing any markers:
        </p>

        <div className="space-y-3">
          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">📅 Dates</h5>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                <strong>Natural:</strong> tomorrow, next friday, Dec 25, in 3 days, next week
              </p>
              <p>
                <strong>Shortcuts:</strong> eod (end of day), bow (beginning of week), eom (end of month)
              </p>
              <p>
                <strong>Try it:</strong>{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Call client next tuesday</code>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">🔄 Recurring Patterns</h5>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                <strong>Intervals:</strong> every day, every 2 weeks, every 3 months
              </p>
              <p>
                <strong>Weekdays:</strong> every monday, every friday, every workday
              </p>
              <p>
                <strong>Nth days:</strong> every first monday, every last friday
              </p>
              <p>
                <strong>Try it:</strong>{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Weekly standup every monday</code>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">👤 People Mentions</h5>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                <strong>Direct names:</strong> Just type a person&apos;s name (if they exist)
              </p>
              <p>
                <strong>Source context:</strong> &quot;from John&quot;, &quot;via Sarah&quot;, &quot;per Mike&quot;
              </p>
              <p>
                <strong>Try it:</strong>{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Review feedback from Sarah</code>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">📁 Projects</h5>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                <strong>With context:</strong> &quot;on Project&quot;, &quot;for Project&quot;, &quot;in Project&quot;
              </p>
              <p>
                <strong>Try it:</strong>{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Update docs on Website</code>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">⚡ Priorities</h5>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                <strong>Keywords:</strong> urgent, high, medium, low (and their alternatives)
              </p>
              <p>
                <strong>Try it:</strong>{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Fix security bug urgent</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Shortcuts Reference */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">📅 Date Shorthand Reference</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-green-800 dark:text-green-200">
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

      {/* Tips */}
      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">💡 Input Tips</h4>
        <ul className="text-sm text-amber-800 dark:text-amber-200 list-disc list-inside space-y-1">
          <li>
            <strong>Deactivate auto-detection:</strong> Click on a detected token to turn it off
          </li>
          <li>
            <strong>What stays in text:</strong> People with @/$ markers stay visible in the task
          </li>
          <li>
            <strong>What&apos;s removed:</strong> Dates, recurring patterns, and duration are removed from text
          </li>
          <li>
            <strong>No marker for:</strong> Duration and dependencies - set these in the detail view
          </li>
          <li>
            <strong>Keyboard:</strong> Press Enter to create, Escape to cancel
          </li>
        </ul>
      </div>

      {/* Complex Example */}
      <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-2">🎯 Complex Example</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Try typing this all-in-one task:</p>
        <code className="block bg-white dark:bg-zinc-900 p-3 rounded text-sm border border-zinc-300 dark:border-zinc-700">
          Review homepage design @John %Website !!high tomorrow #design #frontend
        </code>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
          This creates a task assigned to John, linked to Website project, high priority, due tomorrow, with design and
          frontend tags.
        </p>
      </div>
    </div>
  );
}
