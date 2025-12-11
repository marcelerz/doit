"use client";

import { SprintSettings, defaultSprintSettings } from "@/types/settings";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";

interface SprintsTabProps {
  sprints: SprintSettings;
  onUpdate: (sprints: SprintSettings) => void;
}

export function SprintsTab({ sprints, onUpdate }: SprintsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Sprint Settings</span>
            <InfoTooltip content={tooltipContent.sprints} />
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Configure default settings for sprints. Manage individual sprints in the Sprints tab on the main view.
          </p>
        </div>
        <button
          onClick={() => onUpdate(defaultSprintSettings)}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Default Sprint Duration (days)
          </label>
          <input
            type="number"
            min="1"
            max="90"
            value={sprints.defaultSprintDuration}
            onChange={(e) => onUpdate({ ...sprints, defaultSprintDuration: parseInt(e.target.value) || 14 })}
            className="w-full max-w-xs px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            New sprints will default to this duration (typically 7-14 days for Scrum)
          </p>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="showBacklogInSprint"
            checked={sprints.showBacklogInSprint}
            onChange={(e) => onUpdate({ ...sprints, showBacklogInSprint: e.target.checked })}
            className="h-4 w-4 mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <label htmlFor="showBacklogInSprint" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Show backlog items in sprint view
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              When enabled, tasks without a sprint assigned will appear in the Kanban "Backlog" filter
            </p>
          </div>
        </div>
      </div>

      {/* Info card pointing to main sprints view */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">Managing Sprints</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              To create, start, complete, or archive sprints, go to the <strong>Sprints</strong> tab on the main view.
              The Sprints tab provides full sprint lifecycle management, including burndown charts and velocity
              tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
