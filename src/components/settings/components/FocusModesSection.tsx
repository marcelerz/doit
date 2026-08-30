"use client";

import { FocusMode, FocusModeId, FOCUS_MODE_MINUTE_LIMITS, getFocusModeId } from "@/types/focusMode";
import { getDurationMin } from "@/types/time";
import { getColor } from "@/types/types";
import { clampModeMinutes, sortedModes } from "@/utils/focusModes";
import { AMBIENT_SOUNDS, SOUND_TYPES } from "@/utils/notifications";
import { createFocusModeId } from "@/utils/idGenerator";
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from "@/components/shared/Icons";

/**
 * Full configuration for the ad-hoc timer's modes.
 *
 * The timer's own setup screen edits the things you change often -- name,
 * length, sound. This is where the rest lives: the colour, the end chime, and
 * the chain that decides where a finished mode hands over to, which is what
 * reproduces "a long break every fourth pomodoro" now that the timer no longer
 * reads the Gantt settings.
 */

interface FocusModesSectionProps {
  modes: FocusMode[];
  onChange: (modes: FocusMode[]) => void;
}

const NEW_MODE_COLOR = "#6366f1";

export function FocusModesSection({ modes, onChange }: FocusModesSectionProps) {
  const ordered = sortedModes(modes);

  const replace = (id: FocusModeId, changes: Partial<FocusMode>) =>
    onChange(modes.map((mode) => (mode.id === id ? { ...mode, ...changes } : mode)));

  const move = (index: number, delta: number) => {
    const next = [...ordered];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((mode, i) => ({ ...mode, order: i })));
  };

  const add = () => {
    onChange([
      ...modes,
      {
        id: getFocusModeId(createFocusModeId()),
        name: "New mode",
        kind: "work",
        durationMinutes: getDurationMin(25),
        ambientSound: "",
        endSound: "short-break",
        color: getColor(NEW_MODE_COLOR),
        order: modes.length,
        nextEvery: 0,
      },
    ]);
  };

  const remove = (id: FocusModeId) => {
    onChange(
      modes
        .filter((mode) => mode.id !== id)
        // Nothing may be left pointing at a mode that no longer exists, or the
        // timer would try to hand over to nothing.
        .map((mode, i) => ({
          ...mode,
          order: i,
          nextModeId: mode.nextModeId === id ? undefined : mode.nextModeId,
          nextAltModeId: mode.nextAltModeId === id ? undefined : mode.nextAltModeId,
        })),
    );
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-4">
      <div>
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Timer Modes</h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
          The named stretches the timer runs. A mode with no length counts up instead of down.
        </p>
      </div>

      <div className="space-y-3">
        {ordered.map((mode, index) => (
          <div
            key={mode.id}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 space-y-3"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="color"
                value={mode.color}
                onChange={(e) => replace(mode.id, { color: getColor(e.target.value) })}
                aria-label={`Colour for ${mode.name}`}
                className="w-8 h-8 rounded cursor-pointer border border-zinc-300 dark:border-zinc-600"
              />
              <input
                value={mode.name}
                onChange={(e) => replace(mode.id, { name: e.target.value })}
                aria-label={`Name of ${mode.name}`}
                className="flex-1 min-w-[8rem] px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
              />
              <select
                value={mode.kind}
                onChange={(e) => replace(mode.id, { kind: e.target.value as FocusMode["kind"] })}
                aria-label={`Counts as, for ${mode.name}`}
                className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="work">Work</option>
                <option value="break">Break</option>
              </select>
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${mode.name} up`}
                className="p-1.5 rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30"
              >
                <ChevronUpIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === ordered.length - 1}
                aria-label={`Move ${mode.name} down`}
                className="p-1.5 rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30"
              >
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => remove(mode.id)}
                disabled={modes.length === 1}
                aria-label={`Delete ${mode.name}`}
                title={modes.length === 1 ? "The timer needs at least one mode" : undefined}
                className="p-1.5 rounded text-zinc-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-zinc-400"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="block">
                <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Minutes (blank counts up)
                </span>
                <input
                  type="number"
                  min={FOCUS_MODE_MINUTE_LIMITS.min}
                  max={FOCUS_MODE_MINUTE_LIMITS.max}
                  value={mode.durationMinutes ?? ""}
                  placeholder="counts up"
                  aria-label={`Minutes for ${mode.name}`}
                  onChange={(e) => {
                    const raw = e.target.value;
                    replace(mode.id, {
                      durationMinutes:
                        raw === "" ? undefined : getDurationMin(clampModeMinutes(Number.parseInt(raw, 10))),
                    });
                  }}
                  className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Ambient sound</span>
                <select
                  value={mode.ambientSound}
                  onChange={(e) => replace(mode.id, { ambientSound: e.target.value })}
                  aria-label={`Ambient sound for ${mode.name}`}
                  className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <option value="">No sound</option>
                  {AMBIENT_SOUNDS.map((sound) => (
                    <option key={sound.id} value={sound.id}>
                      {sound.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">End chime</span>
                <select
                  value={mode.endSound}
                  onChange={(e) => replace(mode.id, { endSound: e.target.value })}
                  aria-label={`End chime for ${mode.name}`}
                  className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  {SOUND_TYPES.map((sound) => (
                    <option key={sound} value={sound}>
                      {sound}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Then go to</span>
                <select
                  value={mode.nextModeId ?? ""}
                  onChange={(e) =>
                    replace(mode.id, {
                      nextModeId: e.target.value === "" ? undefined : getFocusModeId(e.target.value),
                    })
                  }
                  aria-label={`Next mode after ${mode.name}`}
                  className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <option value="">Stop and wait</option>
                  {ordered
                    .filter((other) => other.id !== mode.id)
                    .map((other) => (
                      <option key={other.id} value={other.id}>
                        {other.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            {mode.nextModeId !== undefined && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                <label className="block">
                  <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    …but every Nth time (0 = never)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={mode.nextEvery}
                    aria-label={`Alternate interval for ${mode.name}`}
                    onChange={(e) => {
                      const parsed = Number.parseInt(e.target.value, 10);
                      replace(mode.id, { nextEvery: Number.isNaN(parsed) ? 0 : Math.max(0, parsed) });
                    }}
                    className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">…go to</span>
                  <select
                    value={mode.nextAltModeId ?? ""}
                    onChange={(e) =>
                      replace(mode.id, {
                        nextAltModeId: e.target.value === "" ? undefined : getFocusModeId(e.target.value),
                      })
                    }
                    aria-label={`Alternate mode after ${mode.name}`}
                    className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">Nothing different</option>
                    {ordered
                      .filter((other) => other.id !== mode.id)
                      .map((other) => (
                        <option key={other.id} value={other.id}>
                          {other.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
      >
        <PlusIcon className="w-4 h-4" />
        Add mode
      </button>
    </div>
  );
}
