"use client";

import { AutoAssignSettings, defaultAutoAssignSettings } from "@/types/settings";
import { usePeople } from "@/hooks/usePeople";
import { useProjects } from "@/hooks/useProjects";
import { useSettings } from "@/hooks/useSettings";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";
import { SettingsLoading } from "./SettingsLoading";
import { AutoAssignField } from "./AutoAssignField";
import { InfoBox } from "./InfoBox";
import { getTextColor } from "@/utils/colors";

export function AutoAssignTab() {
  const { people, isLoaded: peopleLoaded } = usePeople();
  const { projects, isLoaded: projectsLoaded } = useProjects();
  const { settings, isLoaded: settingsLoaded, updateAutoAssignSettings } = useSettings();
  const priorities = settings.priorities;
  const autoAssign = settings.autoAssign;
  const markerColors = settings.markerColors;

  const isLoaded = peopleLoaded && projectsLoaded && settingsLoaded;

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  // Helper to get badge styles from marker color
  const getBadgeStyle = (colorKey: keyof typeof markerColors) => {
    const bgColor = markerColors[colorKey];
    const textColor = getTextColor(bgColor);
    return {
      backgroundColor: bgColor,
      color: textColor,
      borderColor: textColor === "#000000" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)",
    };
  };

  const handleAutoAssignFieldChange = (field: keyof AutoAssignSettings, value: string) => {
    if (field === "enabled") return; // Skip boolean field

    updateAutoAssignSettings({
      ...autoAssign,
      [field]: value || undefined, // Set to undefined if empty
    });
  };

  // Convert data to dropdown items
  const peopleItems = people.map((p) => ({ id: p.id, label: p.name }));
  const projectItems = projects.map((p) => ({ id: p.id, label: p.name }));
  const priorityItems = priorities
    .sort((a, b) => a.order - b.order)
    .map((p) => ({ id: p.id, label: p.name }));

  // Suggestion items for free-form fields
  const dueDateItems = [
    "today", "tomorrow", "next week", "next month",
    "next monday", "next tuesday", "next wednesday", "next thursday", "next friday", "next saturday", "next sunday",
    "in 2 days", "in 3 days", "in 5 days", "in 1 week", "in 2 weeks", "in 3 weeks",
    "in 1 month", "in 2 months", "in 3 months", "in 6 months",
  ].map((s) => ({ id: s, label: s }));

  const durationItems = [
    "15m", "30m", "45m", "1h", "1.5h", "2h", "3h", "4h", "5h", "6h", "7h", "10h",
    "1d", "2d", "3d", "5d", "1w", "2w", "3w", "1m", "2m", "3m",
  ].map((s) => ({ id: s, label: s }));

  const recurringItems = [
    "daily", "weekly", "monthly", "yearly",
    "every day", "every weekday", "every week", "every 2 weeks", "every month", "every year",
    "every monday", "every tuesday", "every wednesday", "every thursday", "every friday", "every saturday", "every sunday",
  ].map((s) => ({ id: s, label: s }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>Auto-Assign Metadata</span>
          <InfoTooltip content={tooltipContent.autoAssign} />
        </h2>
        <button
          onClick={() => updateAutoAssignSettings(defaultAutoAssignSettings)}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Automatically assign default values to new todos when markers are not explicitly provided.
      </p>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="space-y-4">
          <AutoAssignField
            label="Default Assigned Person"
            marker="@"
            value={autoAssign.assignedPerson}
            badgeStyle={getBadgeStyle("assigned")}
            placeholder="Search people..."
            items={peopleItems}
            onSelect={(value) => handleAutoAssignFieldChange("assignedPerson", value)}
            onClear={() => handleAutoAssignFieldChange("assignedPerson", "")}
            emptyMessage="No people found"
          />

          <AutoAssignField
            label="Default Source Person"
            marker="$"
            value={autoAssign.sourcePerson}
            badgeStyle={getBadgeStyle("source")}
            placeholder="Search people..."
            items={peopleItems}
            onSelect={(value) => handleAutoAssignFieldChange("sourcePerson", value)}
            onClear={() => handleAutoAssignFieldChange("sourcePerson", "")}
            emptyMessage="No people found"
          />

          <AutoAssignField
            label="Default Project"
            marker="%"
            value={autoAssign.project}
            badgeStyle={getBadgeStyle("project")}
            placeholder="Search projects..."
            items={projectItems}
            onSelect={(value) => handleAutoAssignFieldChange("project", value)}
            onClear={() => handleAutoAssignFieldChange("project", "")}
            emptyMessage="No projects found"
          />

          <AutoAssignField
            label="Default Priority"
            marker="!!"
            value={autoAssign.priority}
            badgeStyle={getBadgeStyle("priority")}
            placeholder="Search priorities..."
            items={priorityItems}
            onSelect={(value) => handleAutoAssignFieldChange("priority", value)}
            onClear={() => handleAutoAssignFieldChange("priority", "")}
            emptyMessage="No priorities found"
          />

          <AutoAssignField
            label="Default Due Date"
            value={autoAssign.dueDate}
            badgeStyle={getBadgeStyle("dueDate")}
            placeholder="e.g., today, tomorrow, next week"
            items={dueDateItems}
            onSelect={(value) => handleAutoAssignFieldChange("dueDate", value)}
            onClear={() => handleAutoAssignFieldChange("dueDate", "")}
            allowCustomValue
          />

          <AutoAssignField
            label="Default Duration"
            value={autoAssign.duration}
            badgeStyle={getBadgeStyle("duration")}
            placeholder="e.g., 2h, 30m, 1d"
            items={durationItems}
            onSelect={(value) => handleAutoAssignFieldChange("duration", value)}
            onClear={() => handleAutoAssignFieldChange("duration", "")}
            allowCustomValue
          />

          <AutoAssignField
            label="Default Recurring"
            value={autoAssign.recurring}
            badgeStyle={getBadgeStyle("recurring")}
            placeholder="e.g., daily, weekly, every monday"
            items={recurringItems}
            onSelect={(value) => handleAutoAssignFieldChange("recurring", value)}
            onClear={() => handleAutoAssignFieldChange("recurring", "")}
            allowCustomValue
          />
        </div>
      </div>

      <InfoBox
        items={[
          "Auto-assignment default values are applied only if markers are not provided",
          "Explicitly provided markers always override auto-assignment defaults",
          "Leave fields empty if you don't want automatic assignment for that metadata type",
        ]}
      />
    </div>
  );
}
