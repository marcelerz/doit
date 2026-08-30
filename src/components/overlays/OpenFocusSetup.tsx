"use client";

import { useMemo } from "react";
import { FocusMode, FocusModeId, FOCUS_MODE_MINUTE_LIMITS } from "@/types/focusMode";
import { getDurationMin } from "@/types/time";
import { getColor } from "@/types/types";
import { clampModeMinutes, sortedModes } from "@/utils/focusModes";
import { AMBIENT_SOUNDS } from "@/utils/notifications";
import { createFocusModeId } from "@/utils/idGenerator";
import { getFocusModeId } from "@/types/focusMode";
import { formatTime } from "@/utils/formatters";
import { CloseIcon, PlusIcon, TrashIcon, PlayIcon, VolumeOnIcon, VolumeOffIcon } from "@/components/shared/Icons";

/**
 * What the ad-hoc timer shows before it starts.
 *
 * There was nothing here before: the timer opened straight into a countdown
 * whose length came from settings.gantt, so changing it meant leaving, editing
 * the number that also reschedules the whole Gantt chart, and coming back.
 *
 * Fully controlled -- every edit goes out through a callback -- so the running
 * view keeps owning the session and this stays testable without a store.
 */

interface OpenFocusSetupProps {
  modes: FocusMode[];
  /** Which mode Start will begin in. */
  selectedModeId: FocusModeId | null;
  onSelectMode: (id: FocusModeId) => void;
  onChangeModes: (modes: FocusMode[]) => void;
  onStart: () => void;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  /** Set while a session is open, whether reached mid-session or after a reload. */
  resumable?: { workSeconds: number; breakSeconds: number } | null;
  onResume?: () => void;
  onDiscardResumable?: () => void;
}

const NEW_MODE_COLOR = "#6366f1";

export function OpenFocusSetup({
  modes,
  selectedModeId,
  onSelectMode,
  onChangeModes,
  onStart,
  onClose,
  soundEnabled,
  onToggleSound,
  resumable,
  onResume,
  onDiscardResumable,
}: OpenFocusSetupProps) {
  const ordered = useMemo(() => sortedModes(modes), [modes]);

  const replaceMode = (id: FocusModeId, changes: Partial<FocusMode>) => {
    onChangeModes(modes.map((mode) => (mode.id === id ? { ...mode, ...changes } : mode)));
  };

  const addMode = () => {
    const id = getFocusModeId(createFocusModeId());
    onChangeModes([
      ...modes,
      {
        id,
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
    onSelectMode(id);
  };

  const removeMode = (id: FocusModeId) => {
    const remaining = modes
      .filter((mode) => mode.id !== id)
      // A deleted mode must not stay referenced as somewhere to go next, or the
      // timer would try to advance into nothing.
      .map((mode) => ({
        ...mode,
        nextModeId: mode.nextModeId === id ? undefined : mode.nextModeId,
        nextAltModeId: mode.nextAltModeId === id ? undefined : mode.nextAltModeId,
      }));
    onChangeModes(remaining);
    if (selectedModeId === id && remaining.length > 0) {
      onSelectMode(sortedModes(remaining)[0].id);
    }
  };

  const selected = ordered.find((mode) => mode.id === selectedModeId) ?? ordered[0] ?? null;
  const previewSeconds = selected?.durationMinutes === undefined ? undefined : selected.durationMinutes * 60;

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Exit (Esc)"
            aria-label="Exit timer"
          >
            <CloseIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">⏱️ Timer</h1>
        </div>
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-lg transition-colors ${
            soundEnabled
              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              : "text-zinc-400 dark:text-zinc-600"
          }`}
          title={soundEnabled ? "Mute sounds (M)" : "Enable sounds (M)"}
          aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? <VolumeOnIcon className="w-5 h-5" /> : <VolumeOffIcon className="w-5 h-5" />}
        </button>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {resumable && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              A session is open — {formatTime(resumable.workSeconds)} worked,{" "}
              {formatTime(resumable.breakSeconds)} on break.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={onResume}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
              >
                Back to session
              </button>
              <button
                onClick={onDiscardResumable}
                className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-sm font-medium transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {previewSeconds === undefined ? "∞" : formatTime(previewSeconds)}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {selected === null
              ? "Add a mode to get started"
              : previewSeconds === undefined
                ? `${selected.name} counts up until you switch`
                : `Starting in ${selected.name}`}
          </p>
        </div>

        <div className="space-y-3">
          {ordered.map((mode) => {
            const isSelected = selected?.id === mode.id;
            return (
              <div
                key={mode.id}
                className={`rounded-lg border p-3 transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onSelectMode(mode.id)}
                    aria-pressed={isSelected}
                    className="w-4 h-4 rounded-full border-2 shrink-0"
                    style={{
                      backgroundColor: isSelected ? mode.color : "transparent",
                      borderColor: mode.color,
                    }}
                    title={`Begin the session in ${mode.name}`}
                    aria-label={`Begin the session in ${mode.name}`}
                  />
                  <input
                    value={mode.name}
                    onChange={(e) => replaceMode(mode.id, { name: e.target.value })}
                    aria-label={`Name of mode ${mode.name}`}
                    className="flex-1 min-w-[8rem] bg-transparent text-sm font-medium text-zinc-900 dark:text-zinc-100 border-b border-transparent focus:border-blue-500 focus:outline-none"
                  />

                  <button
                    onClick={() => replaceMode(mode.id, { kind: mode.kind === "work" ? "break" : "work" })}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      mode.kind === "work"
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                        : "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                    }`}
                    title="Which total this mode's time counts towards"
                  >
                    {mode.kind === "work" ? "Work" : "Break"}
                  </button>

                  <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <input
                      type="number"
                      min={FOCUS_MODE_MINUTE_LIMITS.min}
                      max={FOCUS_MODE_MINUTE_LIMITS.max}
                      value={mode.durationMinutes ?? ""}
                      placeholder="∞"
                      aria-label={`Minutes for ${mode.name}`}
                      onChange={(e) => {
                        // An empty field is the count-up mode, which is why this
                        // cannot use the parseInt(x) || fallback idiom.
                        const raw = e.target.value;
                        replaceMode(mode.id, {
                          durationMinutes:
                            raw === "" ? undefined : getDurationMin(clampModeMinutes(Number.parseInt(raw, 10))),
                        });
                      }}
                      className="w-16 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    />
                    min
                  </label>

                  <select
                    value={mode.ambientSound}
                    onChange={(e) => replaceMode(mode.id, { ambientSound: e.target.value })}
                    aria-label={`Ambient sound for ${mode.name}`}
                    className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 max-w-[10rem]"
                  >
                    <option value="">No sound</option>
                    {AMBIENT_SOUNDS.map((sound) => (
                      <option key={sound.id} value={sound.id}>
                        {sound.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => removeMode(mode.id)}
                    disabled={modes.length === 1}
                    className="p-1.5 rounded text-zinc-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                    title={modes.length === 1 ? "The timer needs at least one mode" : `Delete ${mode.name}`}
                    aria-label={`Delete ${mode.name}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={addMode}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            Add mode
          </button>

          <button
            onClick={onStart}
            disabled={selected === null}
            className="px-8 py-3 rounded-full font-semibold text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <PlayIcon className="w-5 h-5" />
            Start
          </button>
        </div>

        <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
          Changes are saved for next time. Full mode settings live in Settings → Focus.
        </p>
      </div>
    </div>
  );
}
