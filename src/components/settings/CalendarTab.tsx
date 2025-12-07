"use client";

import { Calendar, CalendarView, CalendarDotColorBy } from "@/types/settings";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";

interface CalendarTabProps {
  calendar: Calendar;
  onUpdate: (calendar: Partial<Calendar>) => void;
}

export function CalendarTab({ calendar, onUpdate }: CalendarTabProps) {
  return (
    <div className="space-y-8">
      {/* View Settings */}
      <section>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <span>View Settings</span>
          <InfoTooltip content={tooltipContent.calendarView} />
        </h3>
        <div className="space-y-4">
          {/* Week Start Day */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-zinc-900 dark:text-zinc-100">Week Start Day</label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Choose which day the week starts on</p>
            </div>
            <select
              value={calendar.weekStartDay}
              onChange={(e) => onUpdate({ weekStartDay: Number(e.target.value) as 0 | 1 })}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
            </select>
          </div>

          {/* Default View */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-zinc-900 dark:text-zinc-100">Default View</label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">The view shown when opening the calendar</p>
            </div>
            <select
              value={calendar.defaultView}
              onChange={(e) => onUpdate({ defaultView: e.target.value as CalendarView })}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="agenda">Agenda</option>
            </select>
          </div>

          {/* Show Week Numbers */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-zinc-900 dark:text-zinc-100">Show Week Numbers</label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Display week numbers in the calendar sidebar</p>
            </div>
            <button
              onClick={() => onUpdate({ showWeekNumbers: !calendar.showWeekNumbers })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                calendar.showWeekNumbers ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
              role="switch"
              aria-checked={calendar.showWeekNumbers}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  calendar.showWeekNumbers ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Task Display Settings */}
      <section>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Task Display</h3>
        <div className="space-y-4">
          {/* Dot Color By */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-zinc-900 dark:text-zinc-100">Dot Color Based On</label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">How to color the task indicator dots</p>
            </div>
            <select
              value={calendar.dotColorBy}
              onChange={(e) => onUpdate({ dotColorBy: e.target.value as CalendarDotColorBy })}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="state">Task State (Active/Completed)</option>
              <option value="priority">Priority Level</option>
              <option value="project">Project Color</option>
            </select>
          </div>

          {/* Task Dot Limit */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-zinc-900 dark:text-zinc-100">Maximum Dots Per Day</label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                How many task dots to show before showing "+X more"
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="10"
                value={calendar.taskDotLimit}
                onChange={(e) => onUpdate({ taskDotLimit: Number(e.target.value) })}
                className="w-24"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-6 text-center">
                {calendar.taskDotLimit}
              </span>
            </div>
          </div>

          {/* Show Task Count */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-zinc-900 dark:text-zinc-100">Show Task Count Badge</label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Display the number of tasks as a badge on each day
              </p>
            </div>
            <button
              onClick={() => onUpdate({ showTaskCount: !calendar.showTaskCount })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                calendar.showTaskCount ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
              role="switch"
              aria-checked={calendar.showTaskCount}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  calendar.showTaskCount ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Indicator Settings */}
      <section>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Indicators</h3>
        <div className="space-y-4">
          {/* Show Overdue Badge */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-zinc-900 dark:text-zinc-100">Highlight Overdue Tasks</label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Show visual indicator for tasks past their due date
              </p>
            </div>
            <button
              onClick={() => onUpdate({ showOverdueBadge: !calendar.showOverdueBadge })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                calendar.showOverdueBadge ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
              role="switch"
              aria-checked={calendar.showOverdueBadge}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  calendar.showOverdueBadge ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Show Recurring Indicator */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-zinc-900 dark:text-zinc-100">Show Recurring Indicator</label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Display a symbol for tasks that repeat</p>
            </div>
            <button
              onClick={() => onUpdate({ showRecurringIndicator: !calendar.showRecurringIndicator })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                calendar.showRecurringIndicator ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
              role="switch"
              aria-checked={calendar.showRecurringIndicator}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  calendar.showRecurringIndicator ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Preview</h3>
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Dots:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(calendar.taskDotLimit, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      calendar.dotColorBy === "state"
                        ? i < 2
                          ? "bg-blue-500"
                          : i < 4
                          ? "bg-green-500"
                          : "bg-zinc-400"
                        : calendar.dotColorBy === "priority"
                        ? i === 0
                          ? "bg-red-500"
                          : i === 1
                          ? "bg-orange-500"
                          : i === 2
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        : "bg-purple-500"
                    }`}
                  />
                ))}
                {calendar.taskDotLimit > 5 && (
                  <span className="text-xs text-zinc-500">+{calendar.taskDotLimit - 5}</span>
                )}
              </div>
            </div>

            {calendar.showTaskCount && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Count badge:</span>
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                  3
                </span>
              </div>
            )}

            {calendar.showOverdueBadge && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Overdue:</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  2
                </span>
              </div>
            )}

            {calendar.showRecurringIndicator && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Recurring:</span>
                <span className="text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
