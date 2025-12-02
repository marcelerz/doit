"use client";

import { MarkerColors } from "@/types/settings";

interface MarkersTabProps {
  markerColors: MarkerColors;
  onUpdate: (colors: Partial<MarkerColors>) => void;
}

const markerInfo = [
  {
    key: "assigned" as keyof MarkerColors,
    symbol: "@/$^",
    label: "People (Default)",
    description: "Default color for new people (assigned, source, mentioned)",
  },
  {
    key: "project" as keyof MarkerColors,
    symbol: "#",
    label: "Project (Default)",
    description: "Default color for new projects",
  },
  {
    key: "priority" as keyof MarkerColors,
    symbol: "!!",
    label: "Priority (Default)",
    description: "Default color for new priorities",
  },
  {
    key: "dueDate" as keyof MarkerColors,
    symbol: "~",
    label: "Due Date",
    description: "Color for due dates",
  },
  {
    key: "duration" as keyof MarkerColors,
    symbol: "*",
    label: "Duration",
    description: "Color for task durations",
  },
  {
    key: "recurring" as keyof MarkerColors,
    symbol: "%",
    label: "Recurring",
    description: "Color for recurring task patterns",
  },
  {
    key: "dependency" as keyof MarkerColors,
    symbol: ">",
    label: "Dependency",
    description: "Color for task dependencies",
  },
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
        Configure default colors used when creating new items. Individual people, projects, and priorities can have
        their own colors set in their respective tabs.
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
