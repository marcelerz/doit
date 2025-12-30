"use client";

import { MarkerColors, defaultMarkerColors } from "@/types/markerColors";
import { getColor } from "@/types/types";
import { useSettings } from "@/hooks/useSettings";
import { SettingsLoading } from "./SettingsLoading";
import { SettingsHeader } from "./SettingsHeader";
import { CalendarIcon, ClockIcon, RepeatIcon, LinkIcon, LightningIcon } from "@/components/shared/Icons";
import { ReactNode } from "react";

const tooltip = (
  <div className="space-y-2">
    <p>Customize colors for metadata markers.</p>
    <ul className="space-y-1">
      <li>• @assigned, $source people</li>
      <li>• %project, !!priority, #tags</li>
      <li>• Dates, durations, recurring</li>
    </ul>
  </div>
);

const markerInfo: {
  key: keyof MarkerColors;
  symbol: string | ReactNode;
  label: string;
  description: string;
}[] = [
  {
    key: "assigned",
    symbol: "@/$",
    label: "People (Default)",
    description: "Default color for new people (assigned, source, mentioned)",
  },
  {
    key: "project",
    symbol: "%",
    label: "Project (Default)",
    description: "Default color for new projects",
  },
  {
    key: "priority",
    symbol: "!!",
    label: "Priority (Default)",
    description: "Default color for new priorities",
  },
  {
    key: "sprint",
    symbol: <LightningIcon className="w-6 h-6" />,
    label: "Sprint (Default)",
    description: "Default color for new sprints",
  },
  {
    key: "dueDate",
    symbol: <CalendarIcon className="w-6 h-6" />,
    label: "Due Date",
    description: "Color for auto-detected due dates",
  },
  {
    key: "duration",
    symbol: <ClockIcon className="w-6 h-6" />,
    label: "Duration",
    description: "Color for task durations",
  },
  {
    key: "recurring",
    symbol: <RepeatIcon className="w-6 h-6" />,
    label: "Recurring",
    description: "Color for auto-detected recurring patterns",
  },
  {
    key: "dependency",
    symbol: <LinkIcon className="w-6 h-6" />,
    label: "Dependency",
    description: "Color for task dependencies",
  },
  {
    key: "tag",
    symbol: "#",
    label: "Tag",
    description: "Color for free-form tags",
  },
];

export function MarkersTab() {
  const { settings, isLoaded, updateMarkerColors } = useSettings();

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  const markerColors = settings.markerColors;

  const handleColorChange = (key: keyof MarkerColors, color: string) => {
    updateMarkerColors({ [key]: getColor(color) } as Partial<MarkerColors>);
  };

  const handleResetToDefaults = () => {
    updateMarkerColors(defaultMarkerColors);
  };

  return (
    <div className="space-y-4">
      <SettingsHeader
        title="Marker Colors"
        tooltip={tooltip}
        description="Configure default colors used when creating new items."
        action={{
          label: "Reset to Defaults",
          onClick: handleResetToDefaults,
        }}
      />

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
