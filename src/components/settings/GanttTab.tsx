"use client";

import { Gantt } from "@/types/settings";

interface GanttTabProps {
  gantt: Gantt;
  onUpdate: (gantt: Gantt) => void;
}

export function GanttTab({ gantt, onUpdate }: GanttTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Gantt View Settings</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Configure settings for task planning and scheduling in the Gantt view.
        </p>
      </div>

      {/* Planning Settings */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Planning Settings</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Context Switching Time (minutes)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={gantt.contextSwitchingTime}
              onChange={(e) => onUpdate({ ...gantt, contextSwitchingTime: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Buffer time added between tasks for context switching
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Default Task Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="480"
              step="5"
              value={gantt.defaultTaskDuration}
              onChange={(e) => onUpdate({ ...gantt, defaultTaskDuration: parseInt(e.target.value) || 30 })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Used when task has no duration specified</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Duration Multiplier
            </label>
            <input
              type="number"
              min="0.5"
              max="5"
              step="0.1"
              value={gantt.durationMultiplier}
              onChange={(e) => onUpdate({ ...gantt, durationMultiplier: parseFloat(e.target.value) || 1.0 })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Multiplier for scheduling (e.g., 2.0 if tasks typically take twice as long due to meetings)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
