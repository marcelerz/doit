"use client";

import { ViewPreset } from "@/hooks/useListViewState";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";
import { CloseIcon, TrashIcon } from "@/components/shared/Icons";

export interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetName: string;
  onPresetNameChange: (name: string) => void;
  onSave: (name: string) => void;
  onDelete: (name: string) => void;
  viewPresets: ViewPreset[];
}

export function SavePresetModal({
  isOpen,
  onClose,
  presetName,
  onPresetNameChange,
  onSave,
  onDelete,
  viewPresets,
}: SavePresetModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Save View Preset</span>
              <InfoTooltip content={tooltipContent.viewPresets} />
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Input for new preset name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Preset Name</label>
            <input
              type="text"
              value={presetName}
              onChange={(e) => onPresetNameChange(e.target.value)}
              placeholder="Enter preset name..."
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && presetName.trim()) {
                  onSave(presetName.trim());
                }
              }}
            />
          </div>

          <button
            onClick={() => presetName.trim() && onSave(presetName.trim())}
            disabled={!presetName.trim()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors mb-4"
          >
            Save as New Preset
          </button>

          {/* Existing presets */}
          {viewPresets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Or overwrite existing:</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {viewPresets.map((preset) => (
                  <div
                    key={preset.name}
                    className="group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all"
                  >
                    <button
                      onClick={() => onSave(preset.name)}
                      className="flex-1 text-left font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => onDelete(preset.name)}
                      className="ml-2 p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete preset"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
