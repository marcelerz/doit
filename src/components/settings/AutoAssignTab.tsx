"use client";

import { AutoAssignSettings, defaultAutoAssignSettings } from "@/types/settings";
import { usePeople } from "@/hooks/usePeople";
import { useProjects } from "@/hooks/useProjects";
import { useSettings } from "@/hooks/useSettings";
import { SettingsLoading } from "./SettingsLoading";
import { SettingsHeader } from "./SettingsHeader";
import { AutoAssignField } from "./AutoAssignField";
import { NoticeBox } from "../shared/NoticeBox";
import { getTextColor } from "@/utils/colors";
import { dueDateDefaultItems, durationDefaultItems, recurringDefaultItems } from "@/types/time";

const tooltip = (
  <div className="space-y-2">
    <p>Default values for new tasks.</p>
    <ul className="space-y-1">
      <li>• Auto-assign person, project</li>
      <li>• Default priority, due date</li>
      <li>• Applied when not specified</li>
    </ul>
  </div>
);

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
  const priorityItems = priorities.sort((a, b) => a.order - b.order).map((p) => ({ id: p.id, label: p.name }));

  // Suggestion items for free-form fields
  const dueDateItems = dueDateDefaultItems.map((s) => ({ id: s, label: s }));
  const durationItems = durationDefaultItems.map((s) => ({ id: s, label: s }));
  const recurringItems = recurringDefaultItems.map((s) => ({ id: s, label: s }));

  return (
    <div className="space-y-4">
      <SettingsHeader
        title="Auto-Assign Metadata"
        tooltip={tooltip}
        description="Automatically assign default values to new todos when markers are not explicitly provided."
        action={{
          label: "Reset to Defaults",
          onClick: () => updateAutoAssignSettings(defaultAutoAssignSettings),
        }}
      />

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

      <NoticeBox
        items={[
          "Auto-assignment default values are applied only if markers are not provided",
          "Explicitly provided markers always override auto-assignment defaults",
          "Leave fields empty if you don't want automatic assignment for that metadata type",
        ]}
      />
    </div>
  );
}
