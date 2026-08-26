"use client";

import { useState, useEffect } from "react";
import { defaultFocusSettings } from "@/types/settings";
import { getDurationMin, getDurationSec } from "@/types/time";
import { playNotificationSound, AMBIENT_SOUNDS, playAmbientSound, stopAmbientSound } from "@/utils/notifications";
import { useSettings } from "@/hooks/useSettings";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
import { CloseIcon } from "@/components/shared/Icons";
import { SettingsLoading } from "./components/SettingsLoading";
import { SettingsHeader } from "./components/SettingsHeader";

const focusSoundsTooltip = (
  <div className="space-y-2">
    <p>Audio cues for Focus Mode transitions.</p>
    <ul className="space-y-1">
      <li>• 🎯 Task Start - begin work</li>
      <li>• ✅ Task Complete - finished</li>
      <li>• ☕ Short Break - quick rest</li>
      <li>• 🧘 Long Break - extended rest</li>
      <li>• ⏰ Break End - back to work</li>
    </ul>
    <p className="text-zinc-400 dark:text-zinc-600 pt-1">3 second delay between sounds for natural flow.</p>
  </div>
);

const ambientSoundsTooltip = (
  <div className="space-y-2">
    <p>Background sounds for focus sessions.</p>
    <ul className="space-y-1">
      <li>• Choose different sounds for work & breaks</li>
      <li>• Rain, nature, city ambiance, and more</li>
      <li>• Sounds loop continuously</li>
      <li>• Separate volume control</li>
    </ul>
    <p className="text-zinc-400 dark:text-zinc-600 pt-1">Only plays during active Focus Mode.</p>
  </div>
);

export function FocusTab() {
  const { settings, isLoaded, updateFocusSettings } = useSettings();
  // Track which ambient sound is being previewed
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);

  // Stop ambient sound when component unmounts or preview ends
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  const focus = settings.focus;

  const handlePreviewAmbientSound = (soundId: string) => {
    if (previewingSound === soundId) {
      // Stop if same sound is clicked
      stopAmbientSound();
      setPreviewingSound(null);
    } else {
      // Play the new sound
      const sound = AMBIENT_SOUNDS.find((s) => s.id === soundId);
      if (sound) {
        playAmbientSound(sound.file, focus.ambientVolume);
        setPreviewingSound(soundId);
      }
    }
  };

  const handleResetToDefaults = () => {
    updateFocusSettings(defaultFocusSettings);
  };

  const handleUpdateExtendOptions = (index: number, value: number) => {
    const newOptions = [...focus.extendOptions];
    newOptions[index] = getDurationMin(value);
    // Sort and dedupe
    const sorted = [...new Set(newOptions.filter((v) => v > 0))].sort((a, b) => a - b);
    updateFocusSettings({ ...focus, extendOptions: sorted });
  };

  const handleAddExtendOption = () => {
    const newValue = getDurationMin(Math.max(...focus.extendOptions) + 5);
    updateFocusSettings({ ...focus, extendOptions: [...focus.extendOptions, newValue].sort((a, b) => a - b) });
  };

  const handleRemoveExtendOption = (index: number) => {
    if (focus.extendOptions.length <= 1) return;
    const newOptions = focus.extendOptions.filter((_, i) => i !== index);
    updateFocusSettings({ ...focus, extendOptions: newOptions });
  };

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Focus Mode Settings"
        description="Configure timer behavior, sounds, and time tracking for Focus Mode."
        action={{
          label: "Reset to Defaults",
          onClick: handleResetToDefaults,
        }}
      />

      {/* Transition Confirmation Section */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Transition Confirmation
              <InfoTooltip content="When enabled, the timer pauses between work and break phases until you confirm. Reminder sounds will repeat until you acknowledge the transition." />
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Pause and wait for confirmation when transitioning between work and break phases.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={focus.requireConfirmation}
              onChange={(e) => updateFocusSettings({ ...focus, requireConfirmation: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {focus.requireConfirmation && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Reminder Interval
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="120"
                  step="5"
                  value={focus.confirmationRepeatInterval}
                  onChange={(e) =>
                    updateFocusSettings({
                      ...focus,
                      confirmationRepeatInterval: getDurationSec(parseInt(e.target.value) || 30),
                    })
                  }
                  className="w-24 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">seconds</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                How often to repeat the notification sound
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Max Repeats</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="1"
                  value={focus.confirmationMaxRepeats}
                  onChange={(e) =>
                    updateFocusSettings({ ...focus, confirmationMaxRepeats: parseInt(e.target.value) || 0 })
                  }
                  className="w-24 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">times</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">0 = infinite (never auto-proceed)</p>
            </div>
          </div>
        )}
      </div>

      {/* Time Tracking Section */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Auto Time Tracking
              <InfoTooltip content="Automatically track time spent on each task while in Focus Mode. Time tracking starts when you begin a task and stops when you complete or pause it." />
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Automatically start/stop time tracking when working on tasks.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={focus.autoTimeTracking}
              onChange={(e) => updateFocusSettings({ ...focus, autoTimeTracking: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

      </div>

      {/* Timer Controls Section */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          Timer Controls
          <InfoTooltip content="Configure options for extending task time and completing tasks early. Extend time if your estimate was too short, or complete early if you finish ahead of schedule." />
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Default Extend Time
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="60"
                step="1"
                value={focus.defaultExtendMinutes}
                onChange={(e) =>
                  updateFocusSettings({ ...focus, defaultExtendMinutes: getDurationMin(parseInt(e.target.value) || 5) })
                }
                className="w-24 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">minutes</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Time added when using quick extend</p>
          </div>



          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Auto-Extend on Overtime
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Automatically extend duration when tracked time exceeds estimate
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={focus.autoExtendOnOvertime !== false}
                onChange={(e) => updateFocusSettings({ ...focus, autoExtendOnOvertime: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Quick Extend Options
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {focus.extendOptions.map((minutes, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md"
              >
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={minutes}
                  onChange={(e) => handleUpdateExtendOptions(index, parseInt(e.target.value) || 5)}
                  className="w-12 text-center bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
                <span className="text-xs text-zinc-500">m</span>
                {focus.extendOptions.length > 1 && (
                  <button
                    onClick={() => handleRemoveExtendOption(index)}
                    className="ml-1 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddExtendOption}
              className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            >
              + Add
            </button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
            Quick options shown in the extend menu during focus mode
          </p>
        </div>
      </div>

      {/* Notifications & Sound Settings Section */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          Notifications & Sound
          <InfoTooltip content={focusSoundsTooltip} />
        </h4>

        {/* Browser Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              🔔 Browser Notifications
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Show browser notifications for breaks and task events
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={focus.notificationsEnabled}
              onChange={(e) => updateFocusSettings({ ...focus, notificationsEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">🔊 Sound Effects</label>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Play audio cues for task and break transitions
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={focus.soundEnabled}
              onChange={(e) => updateFocusSettings({ ...focus, soundEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Volume Control & Sound Tests */}
        {focus.soundEnabled && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Volume</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={focus.soundVolume}
                  onChange={(e) => updateFocusSettings({ ...focus, soundVolume: parseFloat(e.target.value) })}
                  className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400 w-12 text-right">
                  {Math.round(focus.soundVolume * 100)}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Test Sounds</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => playNotificationSound("task-start")}
                  className="px-3 py-1.5 text-xs rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                  title="Played when starting a new task"
                >
                  🎯 Task Start
                </button>
                <button
                  type="button"
                  onClick={() => playNotificationSound("task-complete")}
                  className="px-3 py-1.5 text-xs rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                  title="Played when completing a task"
                >
                  ✅ Task Complete
                </button>
                <button
                  type="button"
                  onClick={() => playNotificationSound("short-break")}
                  className="px-3 py-1.5 text-xs rounded bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-800/50 transition-colors"
                  title="Played when a short break starts"
                >
                  ☕ Short Break
                </button>
                <button
                  type="button"
                  onClick={() => playNotificationSound("long-break")}
                  className="px-3 py-1.5 text-xs rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
                  title="Played when a long break starts"
                >
                  🧘 Long Break
                </button>
                <button
                  type="button"
                  onClick={() => playNotificationSound("break-end")}
                  className="px-3 py-1.5 text-xs rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
                  title="Played when a break ends"
                >
                  ⏰ Break End
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">Click to preview each sound effect</p>
            </div>
          </div>
        )}
      </div>

      {/* Ambient Sounds Section */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              🎧 Ambient Sounds
              <InfoTooltip content={ambientSoundsTooltip} />
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Play background sounds during work and break periods.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={focus.ambientSoundEnabled}
              onChange={(e) => updateFocusSettings({ ...focus, ambientSoundEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {focus.ambientSoundEnabled && (
          <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            {/* Volume Control */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Ambient Volume</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={focus.ambientVolume}
                  onChange={(e) => updateFocusSettings({ ...focus, ambientVolume: parseFloat(e.target.value) })}
                  className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400 w-12 text-right">
                  {Math.round(focus.ambientVolume * 100)}%
                </span>
              </div>
            </div>

            {/* Work Phase Sound */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                🎯 Work Phase Sound
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={focus.ambientWorkSound}
                  onChange={(e) => updateFocusSettings({ ...focus, ambientWorkSound: e.target.value })}
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm"
                >
                  <option value="">None</option>
                  {AMBIENT_SOUNDS.map((sound) => (
                    <option key={sound.id} value={sound.id}>
                      {sound.name}
                    </option>
                  ))}
                </select>
                {focus.ambientWorkSound && (
                  <button
                    type="button"
                    onClick={() => handlePreviewAmbientSound(focus.ambientWorkSound)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      previewingSound === focus.ambientWorkSound
                        ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                        : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50"
                    }`}
                  >
                    {previewingSound === focus.ambientWorkSound ? "⏹ Stop" : "▶ Preview"}
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Plays during work sessions</p>
            </div>

            {/* Break Phase Sound */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                ☕ Break Phase Sound
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={focus.ambientBreakSound}
                  onChange={(e) => updateFocusSettings({ ...focus, ambientBreakSound: e.target.value })}
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm"
                >
                  <option value="">None</option>
                  {AMBIENT_SOUNDS.map((sound) => (
                    <option key={sound.id} value={sound.id}>
                      {sound.name}
                    </option>
                  ))}
                </select>
                {focus.ambientBreakSound && (
                  <button
                    type="button"
                    onClick={() => handlePreviewAmbientSound(focus.ambientBreakSound)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      previewingSound === focus.ambientBreakSound
                        ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                        : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50"
                    }`}
                  >
                    {previewingSound === focus.ambientBreakSound ? "⏹ Stop" : "▶ Preview"}
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Plays during short and long breaks</p>
            </div>
          </div>
        )}
      </div>

      {/* Display Settings Section */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Display Settings</h4>

        <div className="space-y-3">


          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Show Keyboard Hints</label>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">Display keyboard shortcuts at bottom</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={focus.showKeyboardHints}
                onChange={(e) => updateFocusSettings({ ...focus, showKeyboardHints: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
