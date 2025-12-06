"use client";

import { Gantt, GanttZoomLevel, GanttPreset, defaultGantt, defaultGanttPresets } from "@/types/settings";
import { useState } from "react";

interface GanttTabProps {
  gantt: Gantt;
  onUpdate: (gantt: Gantt) => void;
}

export function GanttTab({ gantt, onUpdate }: GanttTabProps) {
  const [newPresetName, setNewPresetName] = useState("");
  const [showNewPresetForm, setShowNewPresetForm] = useState(false);

  const handleApplyPreset = (preset: GanttPreset) => {
    onUpdate({
      ...gantt,
      contextSwitchingTime: preset.contextSwitchingTime,
      defaultTaskDuration: preset.defaultTaskDuration,
      durationMultiplier: preset.durationMultiplier,
      activePresetId: preset.id,
    });
  };

  const handleSaveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset: GanttPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      contextSwitchingTime: gantt.contextSwitchingTime,
      defaultTaskDuration: gantt.defaultTaskDuration,
      durationMultiplier: gantt.durationMultiplier,
    };

    onUpdate({
      ...gantt,
      presets: [...(gantt.presets || defaultGanttPresets), newPreset],
      activePresetId: newPreset.id,
    });

    setNewPresetName("");
    setShowNewPresetForm(false);
  };

  const handleDeletePreset = (presetId: string) => {
    // Don't allow deleting default presets
    if (["focus", "planning", "realistic"].includes(presetId)) return;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Gantt View Settings</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Configure settings for task planning and scheduling in the Gantt view.
          </p>
        </div>
        <button
          onClick={handleResetToDefaults}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Presets */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Quick Presets</h4>
          <button
            onClick={() => setShowNewPresetForm(!showNewPresetForm)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showNewPresetForm ? "Cancel" : "Save Current as Preset"}
          </button>
        </div>

        {showNewPresetForm && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Preset name..."
              className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveCurrentAsPreset}
              disabled={!newPresetName.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const isActive = gantt.activePresetId === preset.id;
            const isCustom = !["focus", "planning", "realistic"].includes(preset.id);

            return (
              <div key={preset.id} className="relative group">
                <button
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600"
                  }`}
                  title={`Context: ${preset.contextSwitchingTime}m, Duration: ${preset.defaultTaskDuration}m, Multiplier: ${preset.durationMultiplier}x`}
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

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Hover over a preset to see its settings. Click to apply.
        </p>
      </div>

      {/* Planning Settings */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Planning Settings</h4>

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
