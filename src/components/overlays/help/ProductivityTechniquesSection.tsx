"use client";

export function ProductivityTechniquesSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">💡 Productivity Techniques</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Popular productivity methods you can implement with this app:
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🍅 Pomodoro Technique</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Work in focused 25-minute sessions with 5-minute breaks. After 4 sessions, take a longer 15-30 minute break.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Use Pomodoro scheduling mode in Gantt view</li>
            <li>Great for maintaining focus and preventing burnout</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📅 Time Blocking</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Schedule parts of the day for specific categories (deep work, admin, meetings, etc.).
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Block working time in the Work Hours tab in Settings</li>
            <li>Great for managers and people with varied responsibilities</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📥 Getting Things Done (GTD)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Capture everything → clarify → organize → review → do.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Use the Kanban board and customize states/transitions to mimic this workflow</li>
            <li>Excellent for people juggling many projects</li>
            <li>More about organization than session timing</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🐸 Eat That Frog</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Do your hardest/most important task first thing in the day.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Assign the priority &quot;Urgent&quot; or &quot;Critical&quot; to prioritize these work items</li>
            <li>Good when prioritization is your main challenge</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📊 Eisenhower Matrix</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Categorize tasks into four quadrants:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>With Due Date + High Priority</strong> → do now
            </li>
            <li>
              <strong>High Priority, no due date</strong> → plan
            </li>
            <li>
              <strong>With Due Date, not high priority</strong> → delegate
            </li>
            <li>
              <strong>Neither</strong> → delete
            </li>
          </ul>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">Works well for quickly triaging a long list.</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            ⏱️ The &quot;Just 5 Minutes&quot; Rule
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Commit to working for just five minutes.</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Use Flow in Kanban settings with 5-minute work time and a short break</li>
            <li>Often breaks the resistance of starting</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔗 Don&apos;t Break the Chain</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Put an &quot;X&quot; on a calendar for each day you make progress.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Track your streaks in the Stats tab—don&apos;t break your streak!</li>
            <li>Useful for habits, learning, coding, daily writing</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⚡ The 2-Minute Rule</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            If something takes less than two minutes, do it immediately.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Use sorting by duration to prioritize short todos</li>
            <li>Good for clearing micro-tasks that create mental clutter</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🎯 MIT Method (Most Important Tasks)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Pick 2–3 critical tasks for the day. Everything else is secondary.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Good for people overwhelmed by long lists</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📦 Task Batching</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Group similar tasks together to reduce context switching.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Example: email all at once, admin all at once, coding in one chunk</li>
            <li>Block times in Work Hours settings to do batch work</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📋 Kanban / Personal Kanban</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Visual board with To Do → Doing → Done.</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Limits the number of tasks &quot;in progress&quot; (WIP limits)</li>
            <li>Reduces overwhelm and context switching</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⏰ 52/17 Method</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Work 52 minutes, rest 17 minutes.</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Based on a study of high-performing employees</li>
            <li>Ideal if Pomodoro&apos;s short breaks feel too choppy</li>
            <li>Use Flow scheduling mode in Gantt with 52/17 preset</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🌊 Ultradian Rhythm Cycles</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Humans naturally work in 90–120 minute energy cycles.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Deep work for 90 minutes → 20–30 minute break</li>
            <li>Amazing for high-concentration tasks like coding, writing, or studying</li>
            <li>Use Flow scheduling mode in Gantt with Ultradian Rhythm preset</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
