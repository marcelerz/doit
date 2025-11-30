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

  const handleAutoAssignToggle = (enabled: boolean) => {
    onUpdate({
      autoAssign: {
        ...general.autoAssign,
        enabled,
      },
    });
  };

  const handleAutoAssignFieldChange = (field: keyof GeneralSettings["autoAssign"], value: string) => {
    if (field === "enabled") return; // Skip boolean field

    onUpdate({
      autoAssign: {
        ...general.autoAssign,
        [field]: value || undefined, // Set to undefined if empty
      },
    });
  };

  const handleDateTimeChange = (field: keyof GeneralSettings["dateTime"], value: string | number) => {
    onUpdate({
      dateTime: {
        ...general.dateTime,
        [field]: value,
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

        {/* Auto-Assignment Settings */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Auto-Assign Metadata</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Automatically assign default values to new todos when markers are not explicitly provided.
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={general.autoAssign.enabled}
                  onChange={(e) => handleAutoAssignToggle(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Enable auto-assignment</span>
              </label>
            </div>
          </div>

          {general.autoAssign.enabled && (
            <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              {/* Assigned Person */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Default Assigned Person{" "}
                  <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">@</code>
                </label>
                <input
                  type="text"
                  value={general.autoAssign.assignedPerson || ""}
                  onChange={(e) => handleAutoAssignFieldChange("assignedPerson", e.target.value)}
                  placeholder="e.g., john"
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Source Person */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Default Source Person{" "}
                  <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">$</code>
                </label>
                <input
                  type="text"
                  value={general.autoAssign.sourcePerson || ""}
                  onChange={(e) => handleAutoAssignFieldChange("sourcePerson", e.target.value)}
                  placeholder="e.g., manager"
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mentioned Person */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Default Mentioned Person{" "}
                  <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">^</code>
                </label>
                <input
                  type="text"
                  value={general.autoAssign.mentionedPerson || ""}
                  onChange={(e) => handleAutoAssignFieldChange("mentionedPerson", e.target.value)}
                  placeholder="e.g., team"
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Default Project <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">#</code>
                </label>
                <input
                  type="text"
                  value={general.autoAssign.project || ""}
                  onChange={(e) => handleAutoAssignFieldChange("project", e.target.value)}
                  placeholder="e.g., work"
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Default Priority <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">!!</code>
                </label>
                <select
                  value={general.autoAssign.priority || ""}
                  onChange={(e) => handleAutoAssignFieldChange("priority", e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  <option value="0">0 - UBN (Urgent)</option>
                  <option value="1">1 - High</option>
                  <option value="2">2 - Medium</option>
                  <option value="3">3 - Low</option>
                  <option value="4">4 - Wish</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Default Due Date <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">~</code>
                </label>
                <input
                  type="text"
                  value={general.autoAssign.dueDate || ""}
                  onChange={(e) => handleAutoAssignFieldChange("dueDate", e.target.value)}
                  placeholder="e.g., today, tomorrow, 2024-12-31"
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Default Duration <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">*</code>
                </label>
                <input
                  type="text"
                  value={general.autoAssign.duration || ""}
                  onChange={(e) => handleAutoAssignFieldChange("duration", e.target.value)}
                  placeholder="e.g., 1h, 30m, 2d"
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Date & Time Settings */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Date & Time Configuration</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Configure time boundaries for shorthand date expressions like "eod" (end of day) and "bow" (beginning of
                week).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Start of Day */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Start of Day (BOD)
              </label>
              <input
                type="time"
                value={general.dateTime.startOfDay}
                onChange={(e) => handleDateTimeChange("startOfDay", e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Used when interpreting "bod" or "beginning of day" in due dates
              </p>
            </div>

            {/* End of Day */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                End of Day (EOD)
              </label>
              <input
                type="time"
                value={general.dateTime.endOfDay}
                onChange={(e) => handleDateTimeChange("endOfDay", e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Used when interpreting "eod" or "end of day" in due dates
              </p>
            </div>

            {/* Work Week Start */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Work Week Start Day
              </label>
              <select
                value={general.dateTime.workWeekStart}
                onChange={(e) => handleDateTimeChange("workWeekStart", parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </select>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Used when calculating "bow" (beginning of week) or "eow" (end of week)
              </p>
            </div>

            {/* Fiscal Year Start */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Fiscal Year Start Month
              </label>
              <select
                value={general.dateTime.fiscalYearStart}
                onChange={(e) => handleDateTimeChange("fiscalYearStart", parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Used when calculating fiscal quarters and year boundaries
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">ℹ️ How it works</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Tasks marked as complete will appear in the "Completed" section</li>
            <li>After the specified number of days, they will move to the "Archived" section</li>
            <li>Archived tasks remain visible but are collapsed by default</li>
            <li>When auto-assignment is enabled, default values are applied only if markers are not provided</li>
            <li>Explicitly provided markers always override auto-assignment defaults</li>
            <li>Date/time settings affect shorthand due dates like "eod", "bow", "eom", etc.</li>
            <li>Shorthand dates are converted to actual timestamps when saved</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
