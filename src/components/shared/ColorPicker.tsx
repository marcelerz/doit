"use client";

interface ColorPickerProps {
  value: string | undefined;
  onChange: (color: string | undefined) => void;
  defaultColor: string;
  label?: string;
  showLabel?: boolean;
}

export function ColorPicker({ value, onChange, defaultColor, label = "Color", showLabel = true }: ColorPickerProps) {
  return (
    <div>
      {showLabel && (
        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
          {label} (optional - defaults to {defaultColor})
        </label>
      )}
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || defaultColor}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 h-10 rounded-lg cursor-pointer border border-zinc-300 dark:border-zinc-700"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`${defaultColor} (default)`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="px-3 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
          >
            Use Default
          </button>
        )}
      </div>
    </div>
  );
}
