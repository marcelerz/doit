"use client";

export function WorkflowsSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">📖 Workflows & Tutorials</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Learn how to use Doit effectively with these common workflows and step-by-step guides.
      </p>

      {/* Workflow 1: Daily Planning */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3">
          <h4 className="font-semibold">☀️ Daily Planning Workflow</h4>
          <p className="text-sm text-blue-100 mt-1">Start each day organized and focused</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Review overdue tasks</p>
              <p className="text-xs mt-0.5">Open List view → Filter by &quot;Overdue&quot; in Due Dates section</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Check today&apos;s tasks</p>
              <p className="text-xs mt-0.5">Filter by &quot;Today&quot; to see what&apos;s due</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Plan in Gantt view</p>
              <p className="text-xs mt-0.5">Press 3 for Gantt → See your day laid out on a timeline</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Start Focus Mode</p>
              <p className="text-xs mt-0.5">Click &quot;Start Focus&quot; on any task to work with a timer</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Use the Pomodoro scheduling technique for structured work sessions with breaks
          </div>
        </div>
      </div>

      {/* Workflow 2: Team Task Assignment */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3">
          <h4 className="font-semibold">👥 Team Task Assignment</h4>
          <p className="text-sm text-purple-100 mt-1">Delegate and track work for your team</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Set up your team</p>
              <p className="text-xs mt-0.5">People view (5) → Add each team member with role in Context field</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create project tasks</p>
              <p className="text-xs mt-0.5">
                Use:{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">
                  Task name @John %Project !!high tomorrow
                </code>
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">View by person</p>
              <p className="text-xs mt-0.5">Group by &quot;Person&quot; to see each team member&apos;s workload</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Track in Kanban</p>
              <p className="text-xs mt-0.5">Press 2 for Kanban → Drag tasks through workflow stages</p>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Use $name to track who requested a task (e.g.,{" "}
            <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Fix bug $Sarah</code>)
          </div>
        </div>
      </div>

      {/* Workflow 3: Sprint Planning */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3">
          <h4 className="font-semibold">🏃 Sprint Planning (Agile)</h4>
          <p className="text-sm text-green-100 mt-1">Plan and execute time-boxed sprints</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create a sprint</p>
              <p className="text-xs mt-0.5">Sprints view (7) → Add Sprint → Set name, goal, dates (usually 2 weeks)</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Assign tasks to sprint</p>
              <p className="text-xs mt-0.5">
                Open task detail → Set &quot;Sprint&quot; dropdown, or batch-select tasks
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Activate the sprint</p>
              <p className="text-xs mt-0.5">Click &quot;Set Active&quot; on the sprint to start working</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Track on Kanban</p>
              <p className="text-xs mt-0.5">Kanban view (2) → Filter by sprint → Move tasks through columns</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
              5
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Complete sprint</p>
              <p className="text-xs mt-0.5">Mark sprint as &quot;Completed&quot; → Review in Statistics view (8)</p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Group by Sprint in List view to see all sprint tasks at once
          </div>
        </div>
      </div>

      {/* Workflow 4: Project Management */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3">
          <h4 className="font-semibold">📁 Project Management</h4>
          <p className="text-sm text-orange-100 mt-1">Organize work into projects with dependencies</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create the project</p>
              <p className="text-xs mt-0.5">Projects view (6) → Add Project → Set category (Work, Personal, etc.)</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Break down into tasks</p>
              <p className="text-xs mt-0.5">
                Create tasks with <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">%ProjectName</code> marker
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Add dependencies</p>
              <p className="text-xs mt-0.5">
                Open task detail → &quot;Blocked By&quot; field → Select prerequisite tasks
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Use subtasks for complex items</p>
              <p className="text-xs mt-0.5">Open task detail → Add subtasks → Check off as completed</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
              5
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Visualize in Gantt</p>
              <p className="text-xs mt-0.5">
                Gantt view (3) → Enable &quot;Group by Project&quot; → See dependencies as arrows
              </p>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Use{" "}
            <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">on ProjectName</code> or{" "}
            <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">for ProjectName</code> for auto-detection
            without markers
          </div>
        </div>
      </div>

      {/* Workflow 5: Recurring Tasks */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-3">
          <h4 className="font-semibold">🔄 Setting Up Recurring Tasks</h4>
          <p className="text-sm text-cyan-100 mt-1">Automate repetitive tasks</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create with &quot;every&quot; pattern</p>
              <p className="text-xs mt-0.5">
                Type: <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Weekly review every friday</code>
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">The pattern auto-detects</p>
              <p className="text-xs mt-0.5">
                Watch &quot;every friday&quot; highlight → First due date is set automatically
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Complete and regenerate</p>
              <p className="text-xs mt-0.5">When you complete the task, a new one is created for next Friday</p>
            </div>
          </div>
          <div className="mt-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
            <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Supported patterns:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every day</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every 2 weeks</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every monday</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every workday</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every first monday</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every last friday</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every 3 months</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every year</code>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow 6: Batch Operations */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-3">
          <h4 className="font-semibold">⚡ Batch Operations</h4>
          <p className="text-sm text-pink-100 mt-1">Edit multiple tasks at once</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Enter selection mode</p>
              <p className="text-xs mt-0.5">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">S</kbd> → Round
                checkboxes appear
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Select tasks</p>
              <p className="text-xs mt-0.5">
                Click tasks to select, or use &quot;Select All&quot; / &quot;Clear All&quot;
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Choose action</p>
              <p className="text-xs mt-0.5">
                Use toolbar: Complete, Archive, Delete, or &quot;Edit&quot; for more options
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Batch edit metadata</p>
              <p className="text-xs mt-0.5">
                Click &quot;Edit&quot; → Change assignee, project, priority, sprint, or due date for all
              </p>
            </div>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Use filters first to show only the tasks you want to batch edit
          </div>
        </div>
      </div>

      {/* Workflow 7: Time Blocking */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-3">
          <h4 className="font-semibold">📅 Time Blocking Your Day</h4>
          <p className="text-sm text-indigo-100 mt-1">Schedule tasks around meetings and breaks</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Set up work hours</p>
              <p className="text-xs mt-0.5">Settings → Work Hours → Set your daily start/end times</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Add time blocks</p>
              <p className="text-xs mt-0.5">Add blocks for: Lunch 🍴, Meetings 👥, Focus Time 🎯, Breaks ☕</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Set task durations</p>
              <p className="text-xs mt-0.5">Open each task → Set estimated duration (e.g., 30m, 1h)</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">View in Gantt</p>
              <p className="text-xs mt-0.5">Tasks auto-schedule around your blocks → See your planned day</p>
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Choose a scheduling technique (Sequential, Pomodoro, or Flow) in Gantt settings
          </div>
        </div>
      </div>

      {/* Workflow 8: Backup Strategy */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3">
          <h4 className="font-semibold">💾 Backup Your Data</h4>
          <p className="text-sm text-amber-100 mt-1">Keep your tasks safe</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Open backup settings</p>
              <p className="text-xs mt-0.5">Settings (gear icon) → Backup tab</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create a full backup</p>
              <p className="text-xs mt-0.5">Click &quot;Export Backup&quot; → Download JSON file</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Store safely</p>
              <p className="text-xs mt-0.5">Save to cloud storage (Drive, Dropbox) or email to yourself</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">To restore</p>
              <p className="text-xs mt-0.5">Settings → Backup → &quot;Import Backup&quot; → Select your file</p>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-xs">
            <strong>⚠️ Important:</strong> All data is stored locally. If you clear browser data, your tasks are gone
            unless you have a backup!
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">💡 More Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
          <li>Use templates for tasks you create often (Settings → Templates)</li>
          <li>Create view presets for different contexts (work, personal, urgent)</li>
          <li>Use categories to separate work and personal projects</li>
          <li>Check Statistics view (8) to see your productivity trends</li>
        </ul>
      </div>
    </div>
  );
}
