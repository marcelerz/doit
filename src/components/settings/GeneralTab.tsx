"use client";

import { GeneralSettings } from "@/types/settings";

interface GeneralTabProps {
  general: GeneralSettings;
  onUpdate: (settings: Partial<GeneralSettings>) => void;
}

export function GeneralTab({ general, onUpdate }: GeneralTabProps) {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">General Settings</h2>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Configure general application behavior and preferences.
      </p>

      <div className="space-y-4">
        {/* Archive Settings */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Archive Completed Tasks</h3>
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
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Auto-Delete Completed Tasks</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Automatically delete completed tasks after a specified number of days. This is useful for keeping your
                todo list clean and removing old tasks you no longer need.
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
              "Tasks marked as complete will appear in the 'Completed' section",
              "After the specified number of days, they will move to the 'Archived' section",
              "Archived tasks remain visible but are collapsed by default",
            ].map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
