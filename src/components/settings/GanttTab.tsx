"use client";

import { Gantt, GanttZoomLevel, GanttPreset, defaultGantt, defaultGanttPresets } from "@/types/settings";

import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";

interface GanttTabProps {
  gantt: Gantt;
  onUpdate: (gantt: Gantt) => void;
}

export function GanttTab({ gantt, onUpdate }: GanttTabProps) {
  const handleApplyPreset = (preset: GanttPreset) => {
    onUpdate({
      ...gantt,
      schedulingTechnique: preset.technique,
      contextSwitchingTime: preset.contextSwitchingTime,
      defaultTaskDuration: preset.defaultTaskDuration,
      durationMultiplier: preset.durationMultiplier,
      // Pomodoro settings
      pomodoroWorkDuration: preset.pomodoroWorkDuration ?? gantt.pomodoroWorkDuration,
      pomodoroShortBreak: preset.pomodoroShortBreak ?? gantt.pomodoroShortBreak,
      pomodoroLongBreak: preset.pomodoroLongBreak ?? gantt.pomodoroLongBreak,
      pomodoroLongBreakInterval: preset.pomodoroLongBreakInterval ?? gantt.pomodoroLongBreakInterval,
      // Flow settings
      flowWorkDuration: preset.flowWorkDuration ?? gantt.flowWorkDuration,
      flowBreakDuration: preset.flowBreakDuration ?? gantt.flowBreakDuration,
      flowContextSwitchingTime: preset.flowContextSwitchingTime ?? gantt.flowContextSwitchingTime,
      activePresetId: preset.id,
    });
  };

  const handleDeletePreset = (presetId: string) => {
    // Don't allow deleting default presets
    const defaultIds = defaultGanttPresets.map((p) => p.id);
    if (defaultIds.includes(presetId)) return;

    onUpdate({
      ...gantt,
      presets: (gantt.presets || defaultGanttPresets).filter((p) => p.id !== presetId),
      activePresetId: gantt.activePresetId === presetId ? undefined : gantt.activePresetId,
    });
  };

  const handleResetToDefaults = () => {
    onUpdate(defaultGantt);
  };

  const presets = gantt.presets || defaultGanttPresets;

  // Group presets by technique
  const sequentialPresets = presets.filter((p) => p.technique === "sequential");
  const pomodoroPresets = presets.filter((p) => p.technique === "pomodoro");
  const flowPresets = presets.filter((p) => p.technique === "flow");

  const getPresetTooltip = (preset: GanttPreset) => {
    switch (preset.technique) {
      case "sequential":
        return `Context: ${preset.contextSwitchingTime}m, Duration: ${preset.defaultTaskDuration}m, Multiplier: ${preset.durationMultiplier}x`;
      case "pomodoro":
        return `${preset.pomodoroWorkDuration}m work, ${preset.pomodoroShortBreak}m short break, ${preset.pomodoroLongBreak}m long break every ${preset.pomodoroLongBreakInterval} sessions`;
      case "flow":
        return `${preset.flowWorkDuration}m work, ${preset.flowBreakDuration}m break, ${preset.flowContextSwitchingTime}m context switch`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Gantt View Settings</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Configure scheduling techniques and settings for the Gantt view.
          </p>
        </div>
        <button
          onClick={handleResetToDefaults}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Common Settings */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Common Settings</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          These settings apply to all scheduling techniques. Switch between techniques in the Gantt view toolbar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Default Task Duration
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="480"
                step="5"
                value={gantt.defaultTaskDuration}
                onChange={(e) =>
                  onUpdate({ ...gantt, defaultTaskDuration: parseInt(e.target.value) || 30, activePresetId: undefined })
                }
                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">min</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">When no duration specified (5-480)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Duration Multiplier
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.5"
                max="5"
                step="0.1"
                value={gantt.durationMultiplier}
                onChange={(e) =>
                  onUpdate({
                    ...gantt,
                    durationMultiplier: parseFloat(e.target.value) || 1.0,
                    activePresetId: undefined,
                  })
                }
                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">×</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Safety factor for scheduling (0.5-5.0)</p>
          </div>
        </div>
      </div>

      {/* Sequential Technique */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Sequential</h4>
          <InfoTooltip content={tooltipContent.sequential} />
          {gantt.schedulingTechnique === "sequential" && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
              Active
            </span>
          )}
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Simple task-to-task scheduling with a fixed context switching buffer between tasks. Good for when you want
          predictable spacing without structured breaks.
        </p>

        {/* Sequential Presets */}
        {sequentialPresets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sequentialPresets.map((preset) => {
              const isActive = gantt.activePresetId === preset.id;
              const isCustom = !defaultGanttPresets.map((p) => p.id).includes(preset.id);

              return (
                <div key={preset.id} className="relative group">
                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600"
                    }`}
                    title={getPresetTooltip(preset)}
                  >
                    {preset.name}
                  </button>
                  {isCustom && (
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      title="Delete preset"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Context Switching Time
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="60"
                value={gantt.contextSwitchingTime}
                onChange={(e) =>
                  onUpdate({ ...gantt, contextSwitchingTime: parseInt(e.target.value) || 0, activePresetId: undefined })
                }
                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">min</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Buffer between tasks (0-60)</p>
          </div>
        </div>
      </div>

      {/* Pomodoro Technique */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍅</span>
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Pomodoro</h4>
          <InfoTooltip content={tooltipContent.pomodoro} />
          {gantt.schedulingTechnique === "pomodoro" && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full">
              Active
            </span>
          )}
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Work in focused sessions with short breaks, and longer breaks after every few sessions. Great for maintaining
          focus and preventing burnout.
        </p>

        {/* Pomodoro Presets */}
        {pomodoroPresets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pomodoroPresets.map((preset) => {
              const isActive = gantt.activePresetId === preset.id;
              const isCustom = !defaultGanttPresets.map((p) => p.id).includes(preset.id);

              return (
                <div key={preset.id} className="relative group">
                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? "bg-red-500 text-white"
                        : "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600"
                    }`}
                    title={getPresetTooltip(preset)}
                  >
                    {preset.name}
                  </button>
                  {isCustom && (
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      title="Delete preset"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Work Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="90"
                step="5"
                value={gantt.pomodoroWorkDuration}
                onChange={(e) =>
                  onUpdate({
                    ...gantt,
                    pomodoroWorkDuration: parseInt(e.target.value) || 25,
                    activePresetId: undefined,
                  })
                }
                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">min</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Focus time per session</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Short Break</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={gantt.pomodoroShortBreak}
                onChange={(e) =>
                  onUpdate({
                    ...gantt,
                    pomodoroShortBreak: parseInt(e.target.value) || 5,
                    activePresetId: undefined,
                  })
                }
                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">min</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Between sessions</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Long Break</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="60"
                value={gantt.pomodoroLongBreak}
                onChange={(e) =>
                  onUpdate({
                    ...gantt,
                    pomodoroLongBreak: parseInt(e.target.value) || 15,
                    activePresetId: undefined,
                  })
                }
                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">min</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">After interval</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Long Break Every</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="2"
                max="10"
                value={gantt.pomodoroLongBreakInterval}
                onChange={(e) =>
                  onUpdate({
                    ...gantt,
                    pomodoroLongBreakInterval: parseInt(e.target.value) || 4,
                    activePresetId: undefined,
                  })
                }
                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">sessions</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Sessions before long break</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Schedule preview:</strong> ({gantt.pomodoroWorkDuration}min work → {gantt.pomodoroShortBreak}min
            short break) × {gantt.pomodoroLongBreakInterval - 1}, then {gantt.pomodoroWorkDuration}min work →{" "}
            {gantt.pomodoroLongBreak}min long break
          </p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            One cycle = {gantt.pomodoroLongBreakInterval} work sessions, {gantt.pomodoroLongBreakInterval - 1} short
            breaks, 1 long break ={" "}
            {gantt.pomodoroWorkDuration * gantt.pomodoroLongBreakInterval +
              gantt.pomodoroShortBreak * (gantt.pomodoroLongBreakInterval - 1) +
              gantt.pomodoroLongBreak}{" "}
            minutes (
            {Math.round(
              ((gantt.pomodoroWorkDuration * gantt.pomodoroLongBreakInterval +
                gantt.pomodoroShortBreak * (gantt.pomodoroLongBreakInterval - 1) +
                gantt.pomodoroLongBreak) /
                60) *
                10,
            ) / 10}{" "}
            hours)
          </p>
        </div>
      </div>

      {/* Flow Technique */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌊</span>
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Flow</h4>
          <InfoTooltip content={tooltipContent.flow} />
          {gantt.schedulingTechnique === "flow" && (
            <span className="px-2 py-0.5 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-full">
              Active
            </span>
          )}
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          A simplified version of Pomodoro with just work time, break, and context switching. Great for longer focus
          sessions like the 52/17 method or Ultradian rhythm cycles.
        </p>

        {/* Flow Presets */}
        {flowPresets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {flowPresets.map((preset) => {
              const isActive = gantt.activePresetId === preset.id;
              const isCustom = !defaultGanttPresets.map((p) => p.id).includes(preset.id);

              return (
                <div key={preset.id} className="relative group">
                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? "bg-cyan-500 text-white"
                        : "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600"
                    }`}
                    title={getPresetTooltip(preset)}
                  >
                    {preset.name}
                  </button>
                  {isCustom && (
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      title="Delete preset"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Work Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="120"
                step="5"
                value={gantt.flowWorkDuration}
                onChange={(e) =>
                  onUpdate({
                    ...gantt,
                    flowWorkDuration: parseInt(e.target.value) || 52,
                    activePresetId: undefined,
                  })
                }
                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">min</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Focus time per session</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Break Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="60"
                value={gantt.flowBreakDuration}
                onChange={(e) =>
                  onUpdate({
                    ...gantt,
                    flowBreakDuration: parseInt(e.target.value) || 17,
                    activePresetId: undefined,
                  })
                }
                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">min</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Rest between sessions</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Context Switch</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="30"
                value={gantt.flowContextSwitchingTime}
                onChange={(e) =>
                  onUpdate({
                    ...gantt,
                    flowContextSwitchingTime: parseInt(e.target.value) || 10,
                    activePresetId: undefined,
                  })
                }
                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">min</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Buffer between tasks</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
          <p className="text-sm text-cyan-800 dark:text-cyan-200">
            <strong>Schedule preview:</strong> {gantt.flowWorkDuration}min work → {gantt.flowBreakDuration}min break →{" "}
            {gantt.flowContextSwitchingTime}min context switch
          </p>
          <p className="text-xs text-cyan-600 dark:text-cyan-300 mt-1">
            One cycle = {gantt.flowWorkDuration + gantt.flowBreakDuration + gantt.flowContextSwitchingTime} minutes (
            {Math.round(
              ((gantt.flowWorkDuration + gantt.flowBreakDuration + gantt.flowContextSwitchingTime) / 60) * 10,
            ) / 10}{" "}
            hours)
          </p>
        </div>
      </div>

      {/* View Settings */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">View Settings</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Timeline Zoom Level
            </label>
            <select
              value={gantt.zoomLevel || "1hour"}
              onChange={(e) => onUpdate({ ...gantt, zoomLevel: e.target.value as GanttZoomLevel })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="15min">15 minutes</option>
              <option value="30min">30 minutes</option>
              <option value="1hour">1 hour</option>
              <option value="2hour">2 hours</option>
            </select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Granularity of time markers</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Task Row Height</label>
            <select
              value={gantt.taskRowHeight || "normal"}
              onChange={(e) =>
                onUpdate({ ...gantt, taskRowHeight: e.target.value as "compact" | "normal" | "comfortable" })
              }
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="compact">Compact (32px)</option>
              <option value="normal">Normal (40px)</option>
              <option value="comfortable">Comfortable (48px)</option>
            </select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Height of task bars</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors">
            <input
              type="checkbox"
              checked={gantt.showWeekends !== false}
              onChange={(e) => onUpdate({ ...gantt, showWeekends: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Show Weekends</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Include Sat/Sun in week view</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors">
            <input
              type="checkbox"
              checked={gantt.showDependencies !== false}
              onChange={(e) => onUpdate({ ...gantt, showDependencies: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Show Dependencies</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Draw arrows between tasks</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors">
            <input
              type="checkbox"
              checked={gantt.showBufferZones !== false}
              onChange={(e) => onUpdate({ ...gantt, showBufferZones: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Show Buffer Zones</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Display buffer/overdue indicators</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors">
            <input
              type="checkbox"
              checked={gantt.showNowLine !== false}
              onChange={(e) => onUpdate({ ...gantt, showNowLine: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Show Now Line</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Current time indicator</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors">
            <input
              type="checkbox"
              checked={gantt.collapseCompleted === true}
              onChange={(e) => onUpdate({ ...gantt, collapseCompleted: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Collapse Completed</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Minimize completed tasks</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
