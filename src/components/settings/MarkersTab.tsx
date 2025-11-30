"use client";

import { MarkerColors } from "@/types/settings";

interface MarkersTabProps {
  markerColors: MarkerColors;
  onUpdate: (colors: Partial<MarkerColors>) => void;
}

const markerInfo = [
  {
    key: "assigned" as keyof MarkerColors,
    symbol: "@",
    label: "Assigned Person",
    description: "Person assigned to the task",
  },
  { key: "source" as keyof MarkerColors, symbol: "$", label: "Source Person", description: "Where the task came from" },
  {
    key: "mentioned" as keyof MarkerColors,
    symbol: "^",
    label: "Mentioned Person",
    description: "Person mentioned in the task",
  },
  { key: "project" as keyof MarkerColors, symbol: "#", label: "Project", description: "Project assignment" },
  { key: "priority" as keyof MarkerColors, symbol: "!!", label: "Priority", description: "Task priority level" },
  { key: "dueDate" as keyof MarkerColors, symbol: "~", label: "Due Date", description: "Target completion date" },
  { key: "duration" as keyof MarkerColors, symbol: "*", label: "Duration", description: "Estimated time to complete" },
];

export function MarkersTab({ markerColors, onUpdate }: MarkersTabProps) {
  const handleColorChange = (key: keyof MarkerColors, color: string) => {
    onUpdate({ [key]: color });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Marker Colors</h2>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Customize the colors used for each marker type in the smart input and todo display.
      </p>

      <div className="space-y-3">
        {markerInfo.map((marker) => (
          <div
            key={marker.key}
            className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl flex-shrink-0"
                style={{ backgroundColor: markerColors[marker.key], color: "#333" }}
              >
                {marker.symbol}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{marker.label}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{marker.description}</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={markerColors[marker.key]}
                    onChange={(e) => handleColorChange(marker.key, e.target.value)}
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={markerColors[marker.key]}
                    onChange={(e) => handleColorChange(marker.key, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="#cce5ff"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
