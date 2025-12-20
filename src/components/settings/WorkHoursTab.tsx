"use client";

import {
  WorkHoursSettings,
  DaySchedule,
  BreakPeriod,
  DEFAULT_BLOCK_TYPES,
  TimeBlockType,
  defaultWorkHoursSettings,
  getBreakPeriodId,
  getShortTime,
  getColor,
  getTimeBlockId,
} from "@/types/settings";
import { useState } from "react";
import { getTextColor } from "@/utils/colors";
import { IconButton } from "@/components/shared/IconButton";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";

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

// Helper to get color for a block
function getBlockColor(block: BreakPeriod): string {
  // Use custom color if set
  if (block.color) return block.color;
  // Otherwise look up the block type color
  const blockTypeConfig = DEFAULT_BLOCK_TYPES.find((t) => t.id === block.blockType);
  return blockTypeConfig?.color || DEFAULT_BLOCK_TYPES[0].color;
}

// Helper to get icon for a block type
function getBlockIcon(blockType?: TimeBlockType | string): string {
  const config = DEFAULT_BLOCK_TYPES.find((t) => t.id === blockType);
  return config?.icon || "📅";
}

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
      id: getBreakPeriodId(`block-${Date.now()}`),
      name: "Break",
      startTime: getShortTime("12:00"),
      endTime: getShortTime("13:00"),
      blockType: getTimeBlockId("break"),
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

  const renderScheduleEditor = (schedule: DaySchedule, type: "common" | "weekday" | "weekend", title: string) => {
    const isEnabled = schedule.enabled !== false; // Default to enabled if not specified
    const showToggle = type === "weekday" || type === "weekend";

    return (
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{title}</h4>
          {showToggle && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => updateSchedule(type, { enabled: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{isEnabled ? "Enabled" : "Disabled"}</span>
            </label>
          )}
        </div>

        {isEnabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Start Time</label>
                <input
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) => updateSchedule(type, { startTime: getShortTime(e.target.value) })}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">End Time</label>
                <input
                  type="time"
                  value={schedule.endTime}
                  onChange={(e) => updateSchedule(type, { endTime: getShortTime(e.target.value) })}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <span>Time Blocks</span>
                  <InfoTooltip content={tooltipContent.timeBlocks} size="sm" />
                </label>
                <button
                  onClick={() => addBreak(type)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Add Block
                </button>
              </div>
              {schedule.breaks.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">No time blocks configured</p>
              ) : (
                <div className="space-y-3">
                  {schedule.breaks.map((breakPeriod) => {
                    const blockColor = getBlockColor(breakPeriod);
                    const textColor = getTextColor(blockColor);
                    return (
                      <div
                        key={breakPeriod.id}
                        className="bg-white dark:bg-zinc-900 rounded-lg p-3 space-y-3 border-l-4"
                        style={{ borderLeftColor: blockColor }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {/* Block Type Selector */}
                          <div className="flex items-center gap-2 flex-1">
                            <span
                              className="text-lg"
                              title={`${
                                DEFAULT_BLOCK_TYPES.find((t) => t.id === breakPeriod.blockType)?.name || "Block"
                              }`}
                            >
                              {getBlockIcon(breakPeriod.blockType)}
                            </span>
                            <select
                              value={breakPeriod.blockType || "break"}
                              onChange={(e) => {
                                const newType = getTimeBlockId(e.target.value);
                                const typeConfig = DEFAULT_BLOCK_TYPES.find((t) => t.id === newType);
                                updateBreak(type, breakPeriod.id, {
                                  blockType: newType,
                                  name: typeConfig?.name || breakPeriod.name,
                                  // Clear custom color when changing type
                                  color: undefined,
                                });
                              }}
                              className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {DEFAULT_BLOCK_TYPES.map((blockType) => (
                                <option key={blockType.id} value={blockType.id}>
                                  {blockType.icon} {blockType.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Custom Name Input */}
                          <input
                            type="text"
                            value={breakPeriod.name}
                            onChange={(e) => updateBreak(type, breakPeriod.id, { name: e.target.value })}
                            className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Block name"
                          />

                          <IconButton
                            icon="remove"
                            onClick={() => removeBreak(type, breakPeriod.id)}
                            size="sm"
                            title="Remove block"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Time Range */}
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={breakPeriod.startTime}
                              onChange={(e) =>
                                updateBreak(type, breakPeriod.id, { startTime: getShortTime(e.target.value) })
                              }
                              className="px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-zinc-400">→</span>
                            <input
                              type="time"
                              value={breakPeriod.endTime}
                              onChange={(e) =>
                                updateBreak(type, breakPeriod.id, { endTime: getShortTime(e.target.value) })
                              }
                              className="px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Color Picker */}
                          <div className="flex items-center gap-2 ml-auto">
                            <label className="text-xs text-zinc-500 dark:text-zinc-400">Color:</label>
                            <input
                              type="color"
                              value={breakPeriod.color || getBlockColor(breakPeriod)}
                              onChange={(e) => updateBreak(type, breakPeriod.id, { color: getColor(e.target.value) })}
                              className="w-8 h-6 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                              title="Custom color"
                            />
                            {breakPeriod.color && (
                              <button
                                onClick={() => updateBreak(type, breakPeriod.id, { color: undefined })}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                title="Reset to default color"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Preview */}
                        <div
                          className="px-2 py-1 rounded text-xs font-medium text-center"
                          style={{ backgroundColor: blockColor, color: textColor }}
                        >
                          {getBlockIcon(breakPeriod.blockType)} {breakPeriod.name} ({breakPeriod.startTime} -{" "}
                          {breakPeriod.endTime})
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Work Hours Configuration</span>
            <InfoTooltip content={tooltipContent.workHours} />
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Configure your daily work schedule. These hours are used in the Gantt view for task planning.
          </p>
        </div>
        <button
          onClick={() => onUpdate(defaultWorkHoursSettings)}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
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
              const isEnabled = schedule.enabled !== false; // Default to enabled if not specified
              return (
                <div key={day} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{WEEKDAY_LABELS[day]}</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => updateCustomSchedule(day, { enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {isEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </div>
                  {isEnabled && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => updateCustomSchedule(day, { startTime: getShortTime(e.target.value) })}
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
                            onChange={(e) => updateCustomSchedule(day, { endTime: getShortTime(e.target.value) })}
                            className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Time Blocks
                          </label>
                          <button
                            onClick={() => {
                              const existing = workHours.customSchedules[day] || workHours.weekdaySchedule;
                              const newBreak: BreakPeriod = {
                                id: getBreakPeriodId(`block-${Date.now()}`),
                                name: "Break",
                                startTime: getShortTime("12:00"),
                                endTime: getShortTime("13:00"),
                                blockType: getTimeBlockId("break"),
                              };
                              updateCustomSchedule(day, {
                                breaks: [...existing.breaks, newBreak],
                              });
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            + Add Block
                          </button>
                        </div>
                        {schedule.breaks.length === 0 ? (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">No time blocks configured</p>
                        ) : (
                          <div className="space-y-3">
                            {schedule.breaks.map((breakPeriod) => {
                              const blockColor = getBlockColor(breakPeriod);
                              const textColor = getTextColor(blockColor);
                              return (
                                <div
                                  key={breakPeriod.id}
                                  className="bg-white dark:bg-zinc-900 rounded-lg p-3 space-y-3 border-l-4"
                                  style={{ borderLeftColor: blockColor }}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    {/* Block Type Selector */}
                                    <div className="flex items-center gap-2 flex-1">
                                      <span
                                        className="text-lg"
                                        title={`${
                                          DEFAULT_BLOCK_TYPES.find((t) => t.id === breakPeriod.blockType)?.name ||
                                          "Block"
                                        }`}
                                      >
                                        {getBlockIcon(breakPeriod.blockType)}
                                      </span>
                                      <select
                                        value={breakPeriod.blockType || "break"}
                                        onChange={(e) => {
                                          const newType = getTimeBlockId(e.target.value);
                                          const typeConfig = DEFAULT_BLOCK_TYPES.find((t) => t.id === newType);
                                          const existing = workHours.customSchedules[day] || workHours.weekdaySchedule;
                                          updateCustomSchedule(day, {
                                            breaks: existing.breaks.map((b) =>
                                              b.id === breakPeriod.id
                                                ? {
                                                    ...b,
                                                    blockType: newType,
                                                    name: typeConfig?.name || b.name,
                                                    color: undefined,
                                                  }
                                                : b,
                                            ),
                                          });
                                        }}
                                        className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        {DEFAULT_BLOCK_TYPES.map((blockType) => (
                                          <option key={blockType.id} value={blockType.id}>
                                            {blockType.icon} {blockType.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Custom Name Input */}
                                    <input
                                      type="text"
                                      value={breakPeriod.name}
                                      onChange={(e) => {
                                        const existing = workHours.customSchedules[day] || workHours.weekdaySchedule;
                                        updateCustomSchedule(day, {
                                          breaks: existing.breaks.map((b) =>
                                            b.id === breakPeriod.id ? { ...b, name: e.target.value } : b,
                                          ),
                                        });
                                      }}
                                      className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="Block name"
                                    />

                                    <IconButton
                                      icon="remove"
                                      onClick={() => {
                                        const existing = workHours.customSchedules[day] || workHours.weekdaySchedule;
                                        updateCustomSchedule(day, {
                                          breaks: existing.breaks.filter((b) => b.id !== breakPeriod.id),
                                        });
                                      }}
                                      size="sm"
                                      title="Remove block"
                                    />
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {/* Time Range */}
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="time"
                                        value={breakPeriod.startTime}
                                        onChange={(e) => {
                                          const existing = workHours.customSchedules[day] || workHours.weekdaySchedule;
                                          updateCustomSchedule(day, {
                                            breaks: existing.breaks.map((b) =>
                                              b.id === breakPeriod.id
                                                ? { ...b, startTime: getShortTime(e.target.value) }
                                                : b,
                                            ),
                                          });
                                        }}
                                        className="px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                      <span className="text-zinc-400">→</span>
                                      <input
                                        type="time"
                                        value={breakPeriod.endTime}
                                        onChange={(e) => {
                                          const existing = workHours.customSchedules[day] || workHours.weekdaySchedule;
                                          updateCustomSchedule(day, {
                                            breaks: existing.breaks.map((b) =>
                                              b.id === breakPeriod.id
                                                ? { ...b, endTime: getShortTime(e.target.value) }
                                                : b,
                                            ),
                                          });
                                        }}
                                        className="px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>

                                    {/* Color Picker */}
                                    <div className="flex items-center gap-2 ml-auto">
                                      <label className="text-xs text-zinc-500 dark:text-zinc-400">Color:</label>
                                      <input
                                        type="color"
                                        value={breakPeriod.color || getBlockColor(breakPeriod)}
                                        onChange={(e) => {
                                          const existing = workHours.customSchedules[day] || workHours.weekdaySchedule;
                                          updateCustomSchedule(day, {
                                            breaks: existing.breaks.map((b) =>
                                              b.id === breakPeriod.id ? { ...b, color: getColor(e.target.value) } : b,
                                            ),
                                          });
                                        }}
                                        className="w-8 h-6 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                                        title="Custom color"
                                      />
                                      {breakPeriod.color && (
                                        <button
                                          onClick={() => {
                                            const existing =
                                              workHours.customSchedules[day] || workHours.weekdaySchedule;
                                            updateCustomSchedule(day, {
                                              breaks: existing.breaks.map((b) =>
                                                b.id === breakPeriod.id ? { ...b, color: undefined } : b,
                                              ),
                                            });
                                          }}
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                          title="Reset to default color"
                                        >
                                          Reset
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Preview */}
                                  <div
                                    className="px-2 py-1 rounded text-xs font-medium text-center"
                                    style={{ backgroundColor: blockColor, color: textColor }}
                                  >
                                    {getBlockIcon(breakPeriod.blockType)} {breakPeriod.name} ({breakPeriod.startTime} -{" "}
                                    {breakPeriod.endTime})
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
