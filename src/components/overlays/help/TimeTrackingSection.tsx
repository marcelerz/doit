"use client";

export function TimeTrackingSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">⏱️ Time Tracking & Focus Mode</h3>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⏱️ Time Tracking</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Track time spent on tasks directly from the task detail view:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Click &quot;Start Timer&quot; to begin tracking</li>
            <li>Pause and resume as needed</li>
            <li>Add manual time entries</li>
            <li>View total time tracked per task</li>
            <li>Compare actual vs. estimated time</li>
            <li>Time entries are stored with timestamps and optional notes</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🎯 Focus Mode</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enter a distraction-free mode to work through your tasks sequentially:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Start from the Gantt view by clicking &quot;Start Focus&quot; on any task</li>
            <li>Full-screen timer with task details</li>
            <li>Automatic time tracking</li>
            <li>Notifications when tasks complete or breaks start</li>
            <li>Preview of the next task during breaks</li>
            <li>Session statistics (tasks completed, time worked)</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⏱️ Focus Timer</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            A timer that is not attached to any task. Press <strong>T</strong>, or use the Timer button in the header:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Runs on your own modes -- name them, give each one a length and its own ambient sound</li>
            <li>A mode with no length counts up instead of down</li>
            <li>Switch modes at any time; work and break totals are kept apart</li>
            <li>Sessions survive a reload, and the time shows up in Statistics and Time Reports</li>
            <li>Set the modes up in Settings → Focus, or edit them on the timer&apos;s own screen</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🍅 Scheduling Techniques</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The Gantt view supports three scheduling techniques:
          </p>
          <div className="mt-3 space-y-3">
            <div className="pl-3 border-l-2 border-blue-500">
              <h5 className="font-medium text-zinc-900 dark:text-zinc-100">📋 Sequential</h5>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Simple task-to-task scheduling with configurable context switching time between tasks.
              </p>
            </div>
            <div className="pl-3 border-l-2 border-red-500">
              <h5 className="font-medium text-zinc-900 dark:text-zinc-100">🍅 Pomodoro</h5>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Work in focused sessions (default 25 min) with short breaks (5 min) and long breaks (15 min) after every
                4 sessions. Includes audio notifications.
              </p>
            </div>
            <div className="pl-3 border-l-2 border-green-500">
              <h5 className="font-medium text-zinc-900 dark:text-zinc-100">🌊 Flow</h5>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Extended focus sessions (default 52 min) with longer breaks (17 min). Based on the 52/17 method or
                Ultradian rhythm.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔔 Notifications & Sounds</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Configure alerts in Settings → Focus:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Browser notifications for breaks and task events</li>
            <li>Sound alerts (different tones for short/long breaks)</li>
            <li>Optional confirmation before starting breaks</li>
            <li>Ambient sounds during work and break phases</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⏰ Time Blocks</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Block out parts of your day in Settings → Work Hours:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Set work hours for each day</li>
            <li>Add blocks: Break ☕, Lunch 🍴, Meeting 👥, Focus Time 🎯, Commute 🚗, Personal 🏠</li>
            <li>Custom colors per block type</li>
            <li>Different schedules for weekdays vs. weekends</li>
            <li>Tasks automatically schedule around your blocks</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">💡 Time Tracking Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
          <li>Set duration estimates on tasks to compare actual vs. planned time</li>
          <li>Use Focus Mode to automatically track time while working</li>
          <li>Review tracked time in the Statistics view</li>
          <li>Extend the timer if you need more time (press + in Focus Mode)</li>
        </ul>
      </div>
    </div>
  );
}
