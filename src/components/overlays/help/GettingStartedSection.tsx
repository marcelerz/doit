"use client";

export function GettingStartedSection({ onRestartTutorial }: { onRestartTutorial?: () => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">🚀 Getting Started</h3>

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="text-zinc-600 dark:text-zinc-400">
          Welcome to Doit! This powerful todo app helps you manage tasks efficiently with smart input, multiple views,
          and flexible organization. Here&apos;s a quick overview to get you started:
        </p>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg mt-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">🎯 First 5 Minutes</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-2">
            <li>
              <strong>Create a task:</strong> Type in the input field and press Enter
            </li>
            <li>
              <strong>Complete it:</strong> Click the checkbox next to your task
            </li>
            <li>
              <strong>Add details:</strong> Click on a task to open the detail view
            </li>
            <li>
              <strong>Try views:</strong> Press 1-4 to switch between List, Kanban, Gantt, Calendar
            </li>
            <li>
              <strong>Get help:</strong> Press ? anytime to return here
            </li>
          </ol>
        </div>

        <div className="space-y-4 mt-6">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📝 Step 1: Create Your First Task</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>The input field at the top is where everything starts. Here&apos;s how:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Click the input field (or press{" "}
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">N</kbd>)
                </li>
                <li>
                  Type your task:{" "}
                  <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Buy groceries tomorrow</code>
                </li>
                <li>
                  Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">Enter</kbd> to
                  create it
                </li>
                <li>Notice &quot;tomorrow&quot; was auto-detected as a due date! ✨</li>
              </ol>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">✅ Step 2: Complete Tasks</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Mark tasks as done when you finish them:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click the checkbox (circle) next to any task</li>
                <li>The task moves to the &quot;Completed&quot; section</li>
                <li>Completed tasks auto-archive after 7 days (configurable in Settings)</li>
                <li>The checkbox outline color shows the task&apos;s priority</li>
              </ol>
              <p className="mt-2 text-zinc-500 italic">💡 Tip: Deleted the wrong thing? Hit Undo in the notification.</p>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">👁️ Step 3: Explore Views</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Doit offers multiple ways to see your tasks. Try switching views:</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                  <span className="font-medium">📋 List (press 1)</span>
                  <p className="text-xs text-zinc-500">Traditional list with filters</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                  <span className="font-medium">📊 Kanban (press 2)</span>
                  <p className="text-xs text-zinc-500">Drag tasks between columns</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                  <span className="font-medium">📅 Gantt (press 3)</span>
                  <p className="text-xs text-zinc-500">Timeline with scheduling</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                  <span className="font-medium">🗓️ Calendar (press 4)</span>
                  <p className="text-xs text-zinc-500">Monthly calendar view</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">👥 Step 4: Add People & Projects</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Organize tasks with people and projects:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">5</kbd> to go to
                  People view
                </li>
                <li>Click &quot;Add Person&quot; and enter a name (e.g., &quot;John&quot;)</li>
                <li>
                  Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">6</kbd> to go to
                  Projects view
                </li>
                <li>Click &quot;Add Project&quot; and enter a name (e.g., &quot;Website&quot;)</li>
                <li>
                  Now create a task:{" "}
                  <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Review design @John %Website</code>
                </li>
              </ol>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔍 Step 5: Click for Details</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Every task has a rich detail view:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click on any task to open its detail overlay</li>
                <li>Here you can edit the text, add comments, set due dates</li>
                <li>Add duration estimates, subtasks, and dependencies</li>
                <li>View activity history to see all changes</li>
                <li>
                  Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">Esc</kbd> to close
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4 border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">🎓 Next Steps</h4>
          <ul className="text-sm text-green-800 dark:text-green-200 list-disc list-inside space-y-1">
            <li>
              Check out the <strong>Quick Start Guide</strong> tab for a hands-on tutorial
            </li>
            <li>
              Learn about <strong>Smart Input</strong> to add tasks faster
            </li>
            <li>
              Explore <strong>Workflows & Tutorials</strong> for common use cases
            </li>
            <li>
              Press <kbd className="px-1.5 py-0.5 bg-green-200 dark:bg-green-800 rounded text-xs">/</kbd> to search your
              tasks
            </li>
          </ul>
          {onRestartTutorial && (
            <button
              onClick={onRestartTutorial}
              className="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>🎯</span>
              <span>Start Interactive Tutorial</span>
            </button>
          )}
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mt-4 border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">💾 About Your Data</h4>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            All your data is stored locally in your browser (IndexedDB). Nothing is sent to any server.
            <strong> Create regular backups</strong> in Settings → Backup to protect your data. You can export and
            import your entire task database anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
