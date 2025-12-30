"use client";

import { DateTimeSettings, defaultDateTimeSettings } from "@/types/settings";
import { useSettings } from "@/hooks/useSettings";
import { SettingsLoading } from "./SettingsLoading";
import { SettingsHeader } from "./SettingsHeader";
import { NoticeBox } from "../shared/NoticeBox";

const tooltip = (
  <div className="space-y-2">
    <p>Customize time shortcuts and calendar settings.</p>
    <ul className="space-y-1">
      <li>• Define what &quot;morning&quot;, &quot;noon&quot;, etc. mean</li>
      <li>• Configure BOD/EOD times</li>
      <li>• Set your work week start/end days</li>
      <li>• Configure fiscal year start</li>
    </ul>
  </div>
);

export function DateTimeTab() {
  const { settings, isLoaded, updateDateTimeSettings } = useSettings();

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  const dateTime = settings.dateTime;

  const handleDateTimeChange = (field: keyof DateTimeSettings, value: string | number) => {
    updateDateTimeSettings({
      ...dateTime,
      [field]: value,
    });
  };

  const handleResetToDefaults = () => {
    updateDateTimeSettings(defaultDateTimeSettings);
  };

  return (
    <div className="space-y-4">
      <SettingsHeader
        title="Date & Time Settings"
        tooltip={tooltip}
        description="Configure time boundaries for shorthand date expressions."
        action={{
          label: "Reset to Defaults",
          onClick: handleResetToDefaults,
        }}
      />

      <div className="space-y-4">
        {/* Date & Time Settings */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="space-y-4">
            {/* Morning */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Morning</label>
              <input
                type="time"
                value={dateTime.morning}
                onChange={(e) => handleDateTimeChange("morning", e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Used when interpreting "morning" in due dates
              </p>
            </div>

            {/* Noon */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Noon</label>
              <input
                type="time"
                value={dateTime.noon}
                onChange={(e) => handleDateTimeChange("noon", e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Used when interpreting "noon" in due dates (typically 12:00)
              </p>
            </div>

            {/* Afternoon */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Afternoon</label>
              <input
                type="time"
                value={dateTime.afternoon}
                onChange={(e) => handleDateTimeChange("afternoon", e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Used when interpreting "afternoon" in due dates
              </p>
            </div>

            {/* Evening */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Evening</label>
              <input
                type="time"
                value={dateTime.evening}
                onChange={(e) => handleDateTimeChange("evening", e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Used when interpreting "evening" in due dates
              </p>
            </div>

            {/* BOD - Beginning of Day */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Beginning of Day (BOD)
              </label>
              <input
                type="time"
                value={dateTime.bod}
                onChange={(e) => handleDateTimeChange("bod", e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Used when interpreting "bod" (beginning of day) in due dates
              </p>
            </div>

            {/* EOD - End of Day */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                End of Day (EOD)
              </label>
              <input
                type="time"
                value={dateTime.eod}
                onChange={(e) => handleDateTimeChange("eod", e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Used when interpreting "eod" (end of day) in due dates
              </p>
            </div>

            {/* Work Week Start */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Work Week Start Day
              </label>
              <select
                value={dateTime.workWeekStart}
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
                Used when calculating "bow" (beginning of week)
              </p>
            </div>

            {/* Work Week End */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Work Week End Day
              </label>
              <select
                value={dateTime.workWeekEnd}
                onChange={(e) => handleDateTimeChange("workWeekEnd", parseInt(e.target.value))}
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
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Used when calculating "eow" (end of week)</p>
            </div>

            {/* Fiscal Year Start */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Fiscal Year Start Month
              </label>
              <select
                value={dateTime.fiscalYearStart}
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

        <NoticeBox
          title="Shorthand Date Examples"
          items={[
            "bod, eod - Beginning/End of day",
            "morning, noon, afternoon, evening - Time-of-day shortcuts",
            "bow, eow - Beginning/End of week (uses workWeekStart/workWeekEnd)",
            "bom, eom - Beginning/End of month",
            "boy, eoy - Beginning/End of year",
            "bofy, eofy - Beginning/End of fiscal year (uses fiscalYearStart)",
            "today, tomorrow, yesterday - Day-relative dates",
            "mon, tue, wed, thu, fri, sat, sun - Next occurrence of weekday",
          ]}
        />
      </div>
    </div>
  );
}
