"use client";

import { GeneralSettings, ThemeMode, FeatureSettings, defaultFeatureSettings } from "@/types/settings";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";

interface GeneralTabProps {
  general: GeneralSettings;
  features?: FeatureSettings;
  onUpdate: (settings: Partial<GeneralSettings>) => void;
  onUpdateFeatures?: (settings: Partial<FeatureSettings>) => void;
}

export function GeneralTab({
  general,
  features = defaultFeatureSettings,
  onUpdate,
  onUpdateFeatures,
}: GeneralTabProps) {
  const handleArchiveDaysChange = (value: number) => {
    // Ensure value is at least 0
    const days = Math.max(0, value);
    onUpdate({ archiveDays: days });
  };

  const handleAutoDeleteToggle = (enabled: boolean) => {
    onUpdate({
      autoDelete: {
        ...general.autoDelete,
        enabled,
      },
    });
  };

  const handleAutoDeleteDaysChange = (value: number) => {
    // Ensure value is at least 1
    const days = Math.max(1, value);
    onUpdate({
      autoDelete: {
        ...general.autoDelete,
        deleteDays: days,
      },
    });
  };

  const handleThemeChange = (theme: ThemeMode) => {
    onUpdate({ theme });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">General Settings</h2>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Configure general application behavior and preferences.
      </p>

      <div className="space-y-4">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                <span>Theme</span>
                <InfoTooltip content={tooltipContent.theme} />
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
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
                <InfoTooltip content={tooltipContent.archiveDays} />
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
                <InfoTooltip content={tooltipContent.autoDelete} />
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

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">ℹ️ How it works</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            {[
              "Active tasks appear in the main 'Active' section",
              "When marked complete, tasks move to the 'Completed' section",
              "After the specified archive days, completed tasks move to the 'Archived' section",
              "Archived tasks are collapsed by default but remain visible",
              "If auto-delete is enabled, both completed and archived tasks are permanently deleted after the specified delete days",
              "Auto-delete countdown starts from completion date for completed tasks, and from archive date for archived tasks",
            ].map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>

        {/* Feature Toggles */}
        {onUpdateFeatures && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <span>Features</span>
              <InfoTooltip content={tooltipContent.features} />
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Enable or disable features to simplify the interface. Disabled features will hide their views and related
              settings.
            </p>

            {/* Views Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Views
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={features.kanbanView}
                    onChange={(e) => onUpdateFeatures({ kanbanView: e.target.checked })}
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
                    onChange={(e) => onUpdateFeatures({ ganttView: e.target.checked })}
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
                    onChange={(e) => onUpdateFeatures({ calendarView: e.target.checked })}
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
                    onChange={(e) => onUpdateFeatures({ sprintsView: e.target.checked })}
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
                    onChange={(e) => onUpdateFeatures({ statsView: e.target.checked })}
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Tools
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={features.templates}
                    onChange={(e) => onUpdateFeatures({ templates: e.target.checked })}
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
                    onChange={(e) => onUpdateFeatures({ batchProcessing: e.target.checked })}
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
                    onChange={(e) => onUpdateFeatures({ reordering: e.target.checked })}
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
                    onChange={(e) => onUpdateFeatures({ exports: e.target.checked })}
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
                    onChange={(e) => onUpdateFeatures({ focusMode: e.target.checked })}
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
                    onChange={(e) => onUpdateFeatures({ timeTracking: e.target.checked })}
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
        )}
      </div>
    </div>
  );
}
