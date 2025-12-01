"use client";

import { WorkHoursSettings, DaySchedule, BreakPeriod } from "@/types/settings";
import { useState } from "react";

interface WorkHoursTabProps {
  workHours: WorkHoursSettings;
  onUpdate: (workHours: WorkHoursSettings) => void;
}

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const WEEKDAY_LABELS: Record<(typeof WEEKDAYS)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function WorkHoursTab({ workHours, onUpdate }: WorkHoursTabProps) {
  const [useCustomSchedules, setUseCustomSchedules] = useState(false);

  const updateSchedule = (type: "common" | "weekday" | "weekend", schedule: Partial<DaySchedule>) => {
    const scheduleKey =
      type === "common" ? "commonSchedule" : type === "weekday" ? "weekdaySchedule" : "weekendSchedule";
    onUpdate({
      ...workHours,
      [scheduleKey]: { ...workHours[scheduleKey], ...schedule },
    });
  };

  const updateCustomSchedule = (day: (typeof WEEKDAYS)[number], schedule: Partial<DaySchedule>) => {
    const existing = workHours.customSchedules[day] || workHours.weekdaySchedule;
    onUpdate({
      ...workHours,
      customSchedules: {
        ...workHours.customSchedules,
        [day]: { ...existing, ...schedule },
      },
    });
  };

  const addBreak = (type: "common" | "weekday" | "weekend") => {
    const scheduleKey =
      type === "common" ? "commonSchedule" : type === "weekday" ? "weekdaySchedule" : "weekendSchedule";
    const schedule = workHours[scheduleKey];
    const newBreak: BreakPeriod = {
      id: `break-${Date.now()}`,
      name: "Break",
      startTime: "12:00",
      endTime: "13:00",
    };
    onUpdate({
      ...workHours,
      [scheduleKey]: {
        ...schedule,
        breaks: [...schedule.breaks, newBreak],
      },
    });
  };

  const removeBreak = (type: "common" | "weekday" | "weekend", breakId: string) => {
    const scheduleKey =
      type === "common" ? "commonSchedule" : type === "weekday" ? "weekdaySchedule" : "weekendSchedule";
    const schedule = workHours[scheduleKey];
    onUpdate({
      ...workHours,
      [scheduleKey]: {
        ...schedule,
        breaks: schedule.breaks.filter((b) => b.id !== breakId),
      },
    });
  };

  const updateBreak = (type: "common" | "weekday" | "weekend", breakId: string, updates: Partial<BreakPeriod>) => {
    const scheduleKey =
      type === "common" ? "commonSchedule" : type === "weekday" ? "weekdaySchedule" : "weekendSchedule";
    const schedule = workHours[scheduleKey];
    onUpdate({
      ...workHours,
      [scheduleKey]: {
        ...schedule,
        breaks: schedule.breaks.map((b) => (b.id === breakId ? { ...b, ...updates } : b)),
      },
    });
  };

  const renderScheduleEditor = (schedule: DaySchedule, type: "common" | "weekday" | "weekend", title: string) => (
    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{title}</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Start Time</label>
          <input
            type="time"
            value={schedule.startTime}
            onChange={(e) => updateSchedule(type, { startTime: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">End Time</label>
          <input
            type="time"
            value={schedule.endTime}
            onChange={(e) => updateSchedule(type, { endTime: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Break Periods</label>
          <button onClick={() => addBreak(type)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            + Add Break
          </button>
        </div>
        {schedule.breaks.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">No breaks configured</p>
        ) : (
          <div className="space-y-2">
            {schedule.breaks.map((breakPeriod) => (
              <div key={breakPeriod.id} className="bg-white dark:bg-zinc-900 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={breakPeriod.name}
                    onChange={(e) => updateBreak(type, breakPeriod.id, { name: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Break name"
                  />
                  <button
                    onClick={() => removeBreak(type, breakPeriod.id)}
                    className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={breakPeriod.startTime}
                    onChange={(e) => updateBreak(type, breakPeriod.id, { startTime: e.target.value })}
                    className="px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={breakPeriod.endTime}
                    onChange={(e) => updateBreak(type, breakPeriod.id, { endTime: e.target.value })}
                    className="px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Work Hours Configuration</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Configure your daily work schedule for automatic task planning in the Gantt view.
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
              value={workHours.contextSwitchingTime}
              onChange={(e) => onUpdate({ ...workHours, contextSwitchingTime: parseInt(e.target.value) || 0 })}
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
              value={workHours.defaultTaskDuration}
              onChange={(e) => onUpdate({ ...workHours, defaultTaskDuration: parseInt(e.target.value) || 30 })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Used when task has no duration specified</p>
          </div>
        </div>
      </div>

      {/* Schedule Type Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={workHours.useCommonSchedule}
            onChange={() => onUpdate({ ...workHours, useCommonSchedule: true })}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Use same schedule for all days</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!workHours.useCommonSchedule && !useCustomSchedules}
            onChange={() => {
              setUseCustomSchedules(false);
              onUpdate({ ...workHours, useCommonSchedule: false });
            }}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Different schedules for weekdays and weekends
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!workHours.useCommonSchedule && useCustomSchedules}
            onChange={() => {
              setUseCustomSchedules(true);
              onUpdate({ ...workHours, useCommonSchedule: false });
            }}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Custom schedule for each day</span>
        </label>
      </div>

      {/* Schedule Editors */}
      <div className="space-y-4">
        {workHours.useCommonSchedule &&
          renderScheduleEditor(workHours.commonSchedule, "common", "Common Schedule (All Days)")}

        {!workHours.useCommonSchedule && !useCustomSchedules && (
          <>
            {renderScheduleEditor(workHours.weekdaySchedule, "weekday", "Weekday Schedule (Mon-Fri)")}
            {renderScheduleEditor(workHours.weekendSchedule, "weekend", "Weekend Schedule (Sat-Sun)")}
          </>
        )}

        {!workHours.useCommonSchedule && useCustomSchedules && (
          <div className="space-y-4">
            {WEEKDAYS.map((day) => {
              const schedule = workHours.customSchedules[day] || workHours.weekdaySchedule;
              return (
                <div key={day} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{WEEKDAY_LABELS[day]}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => updateCustomSchedule(day, { startTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => updateCustomSchedule(day, { endTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
