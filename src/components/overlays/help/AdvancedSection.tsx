"use client";

export function AdvancedSection() {
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
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">↩️ Undo</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Mistakes happen:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Completing, archiving or deleting shows an Undo button for ten seconds</li>
            <li>Creating and editing are not undoable -- edit again to change them back</li>
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
