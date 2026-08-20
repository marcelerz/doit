"use client";

import { ThemeMode, defaultFeatureSettings, defaultGeneralSettings } from "@/types/settings";
import { getDurationDay } from "@/types/time";
import { useSettings } from "@/hooks/useSettings";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
import { SettingsIcon, SunIcon, MoonIcon, DesktopIcon, GridIcon } from "@/components/shared/Icons";
import { SettingsLoading } from "./components/SettingsLoading";
import { SettingsHeader } from "./components/SettingsHeader";
import { NoticeBox } from "../shared/NoticeBox";

const themeTooltip = (
  <div className="space-y-2">
    <p>Choose your preferred appearance.</p>
    <ul className="space-y-1">
      <li>
        • <strong>Light</strong>: Bright, clean interface
      </li>
      <li>
        • <strong>Dark</strong>: Easy on the eyes at night
      </li>
      <li>
        • <strong>System</strong>: Matches your device setting
      </li>
    </ul>
  </div>
);

const archiveDaysTooltip = (
  <div className="space-y-2">
    <p>Completed tasks move to Archive after this many days.</p>
    <ul className="space-y-1">
      <li>• Set to 0 to archive immediately</li>
      <li>• Archived tasks stay visible but collapsed</li>
      <li>• Reduces clutter in your active list</li>
    </ul>
  </div>
);

const autoDeleteTooltip = (
  <div className="space-y-2">
    <p>Permanently remove old tasks automatically.</p>
    <ul className="space-y-1">
      <li>• Counts from completion date</li>
      <li>• Affects both completed and archived tasks</li>
      <li>• Cannot be undone - be careful!</li>
    </ul>
  </div>
);

const featuresTooltip = (
  <div className="space-y-2">
    <p>Enable or disable app features.</p>
    <ul className="space-y-1">
      <li>• Toggle views you don&apos;t use</li>
      <li>• Simplify the interface</li>
      <li>• Disabled features hide their tabs</li>
      <li>• Re-enable anytime in Settings</li>
    </ul>
  </div>
);

export function GeneralTab() {
  const { settings, isLoaded, updateGeneralSettings, updateFeatureSettings } = useSettings();

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  const general = settings.general;
  const features = settings.features ?? defaultFeatureSettings;

  const handleArchiveDaysChange = (value: number) => {
    // Ensure value is at least 0
    const days = Math.max(0, value);
    updateGeneralSettings({ archiveDays: getDurationDay(days) });
  };

  const handleAutoDeleteToggle = (enabled: boolean) => {
    updateGeneralSettings({
      autoDelete: {
        ...general.autoDelete,
        enabled,
      },
    });
  };

  const handleAutoDeleteDaysChange = (value: number) => {
    // Ensure value is at least 1
    const days = Math.max(1, value);
    updateGeneralSettings({
      autoDelete: {
        ...general.autoDelete,
        deleteDays: getDurationDay(days),
      },
    });
  };

  const handleThemeChange = (theme: ThemeMode) => {
    updateGeneralSettings({ theme });
  };

  return (
    <div className="space-y-4">
      <SettingsHeader
        title="General Settings"
        description="Configure general application behavior and preferences."
        action={{
          label: "Reset to Defaults",
          onClick: () => updateGeneralSettings(defaultGeneralSettings),
        }}
      />

      <div className="space-y-4">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                <span>Theme</span>
                <InfoTooltip content={themeTooltip} />
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Choose your preferred color scheme. System will automatically match your device settings.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                    general.theme === "light"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                      : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  <SunIcon className="w-5 h-5" />
                  Light
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                    general.theme === "dark"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                      : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  <MoonIcon className="w-5 h-5" />
                  Dark
                </button>
                <button
                  onClick={() => handleThemeChange("system")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                    general.theme === "system"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                      : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  <DesktopIcon className="w-5 h-5" />
                  System
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Archive Settings */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                <span>Archive Completed Tasks</span>
                <InfoTooltip content={archiveDaysTooltip} />
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Automatically move completed tasks to the archived section after a specified number of days. Set to 0 to
                archive immediately upon completion.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={general.archiveDays}
                  onChange={(e) => handleArchiveDaysChange(parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Delete Settings */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                <span>Auto-Delete Tasks</span>
                <InfoTooltip content={autoDeleteTooltip} />
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Automatically delete completed and archived tasks after a specified number of days. This is useful for
                keeping your todo list clean and removing old tasks you no longer need.
              </p>
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={general.autoDelete.enabled}
                  onChange={(e) => handleAutoDeleteToggle(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Enable auto-delete</span>
              </label>
              {general.autoDelete.enabled && (
                <div className="flex items-center gap-4 ml-7">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Delete after</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={general.autoDelete.deleteDays}
                    onChange={(e) => handleAutoDeleteDaysChange(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <NoticeBox
          items={[
            "Active tasks appear in the main 'Active' section",
            "When marked complete, tasks move to the 'Completed' section",
            "After the specified archive days, completed tasks move to the 'Archived' section",
            "Archived tasks are collapsed by default but remain visible",
            "If auto-delete is enabled, both completed and archived tasks are permanently deleted after the specified delete days",
            "Auto-delete countdown starts from completion date for completed tasks, and from archive date for archived tasks",
          ]}
        />

        {/* Feature Toggles */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
            <span>Features</span>
            <InfoTooltip content={featuresTooltip} />
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Enable or disable features to simplify the interface. Disabled features will hide their views and related
            settings.
          </p>

          {/* Views Section */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
              <GridIcon className="w-4 h-4" />
              Views
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.kanbanView}
                  onChange={(e) => updateFeatureSettings({ kanbanView: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Kanban Board</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Visual task board with workflow states</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.ganttView}
                  onChange={(e) => updateFeatureSettings({ ganttView: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Gantt Chart</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Timeline visualization for planning</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.calendarView}
                  onChange={(e) => updateFeatureSettings({ calendarView: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Calendar View</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Monthly calendar with task dots</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.sprintsView}
                  onChange={(e) => updateFeatureSettings({ sprintsView: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sprints</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Scrum-style sprint planning</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.statsView}
                  onChange={(e) => updateFeatureSettings({ statsView: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Statistics</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Charts and task analytics</p>
                </div>
              </label>
            </div>
          </div>

          {/* Tools Section */}
          <div>
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Tools
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.templates}
                  onChange={(e) => updateFeatureSettings({ templates: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Templates</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Create and use task templates</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.batchProcessing}
                  onChange={(e) => updateFeatureSettings({ batchProcessing: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Batch Processing</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Select and edit multiple tasks</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.reordering}
                  onChange={(e) => updateFeatureSettings({ reordering: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Drag & Drop Reordering</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Manual task ordering mode</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.exports}
                  onChange={(e) => updateFeatureSettings({ exports: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Export</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Export to Markdown, CSV, JSON</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.focusMode}
                  onChange={(e) => updateFeatureSettings({ focusMode: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Focus Mode</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Distraction-free task view</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.timeTracking}
                  onChange={(e) => updateFeatureSettings({ timeTracking: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Time Tracking</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Track time spent on tasks</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
