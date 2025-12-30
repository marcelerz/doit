"use client";

import { SprintSettings, defaultSprintSettings } from "@/types/settings";
import { getDurationDay } from "@/types/time";
import { useSettings } from "@/hooks/useSettings";
import { SettingsLoading } from "./SettingsLoading";
import { SettingsHeader } from "./SettingsHeader";
import { NoticeBox } from "../shared/NoticeBox";

const tooltip = (
  <div className="space-y-2">
    <p>Time-boxed periods for agile planning.</p>
    <ul className="space-y-1">
      <li>• Create sprints with goals and dates</li>
      <li>• Assign tasks to sprints</li>
      <li>• Filter Kanban by sprint</li>
      <li>• Track sprint progress</li>
    </ul>
  </div>
);

export function SprintsTab() {
  const { settings, isLoaded, updateSprintSettings } = useSettings();

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  const sprints = settings.sprints;

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Sprint Settings"
        tooltip={tooltip}
        description="Configure default settings for sprints. Manage individual sprints in the Sprints tab on the main view."
        action={{
          label: "Reset to Defaults",
          onClick: () => updateSprintSettings(defaultSprintSettings),
        }}
      />

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
            onChange={(e) =>
              updateSprintSettings({
                ...sprints,
                defaultSprintDuration: getDurationDay(parseInt(e.target.value) || 14),
              })
            }
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
            onChange={(e) => updateSprintSettings({ ...sprints, showBacklogInSprint: e.target.checked })}
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
      <NoticeBox title="Managing Sprints">
        <p>
          To create, start, complete, or archive sprints, go to the <strong>Sprints</strong> tab on the main view. The
          Sprints tab provides full sprint lifecycle management, including burndown charts and velocity tracking.
        </p>
      </NoticeBox>
    </div>
  );
}
