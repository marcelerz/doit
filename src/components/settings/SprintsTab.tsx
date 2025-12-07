"use client";

import { useState } from "react";
import { SprintSettings, Sprint, SprintStatus } from "@/types/settings";
import { IconButton } from "@/components/shared/IconButton";

interface SprintsTabProps {
  sprints: SprintSettings;
  onUpdate: (sprints: SprintSettings) => void;
}

const statusColors: Record<SprintStatus, string> = {
  planning: "#60a5fa", // blue
  active: "#4ade80", // green
  completed: "#9ca3af", // gray
  cancelled: "#f87171", // red
};

const statusLabels: Record<SprintStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function SprintsTab({ sprints, onUpdate }: SprintsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
    status: "planning" as SprintStatus,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) {
      // Update existing sprint
      const updatedSprints = sprints.sprints.map((s) =>
        s.id === editingId
          ? {
              ...s,
              name: formData.name.trim(),
              goal: formData.goal.trim() || undefined,
              startDate: formData.startDate || undefined,
              endDate: formData.endDate || undefined,
              status: formData.status,
              completedAt: formData.status === "completed" ? Date.now() : s.completedAt,
            }
          : s,
      );
      onUpdate({ ...sprints, sprints: updatedSprints });
      setEditingId(null);
    } else {
      // Add new sprint
      const newSprint: Sprint = {
        id: `sprint-${Date.now()}`,
        name: formData.name.trim(),
        goal: formData.goal.trim() || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        status: formData.status,
        createdAt: Date.now(),
      };
      onUpdate({ ...sprints, sprints: [...sprints.sprints, newSprint] });
    }

    setFormData({ name: "", goal: "", startDate: "", endDate: "", status: "planning" });
    setIsAdding(false);
  };

  const handleEdit = (sprint: Sprint) => {
    setEditingId(sprint.id);
    setFormData({
      name: sprint.name,
      goal: sprint.goal || "",
      startDate: sprint.startDate || "",
      endDate: sprint.endDate || "",
      status: sprint.status,
    });
    setIsAdding(true);
  };

  const handleDelete = (sprintId: string) => {
    const updatedSprints = sprints.sprints.filter((s) => s.id !== sprintId);
    const newActiveId = sprints.activeSprintId === sprintId ? undefined : sprints.activeSprintId;
    onUpdate({ ...sprints, sprints: updatedSprints, activeSprintId: newActiveId });
  };

  const handleSetActive = (sprintId: string) => {
    // Set the sprint as active and update its status
    const updatedSprints = sprints.sprints.map((s) => ({
      ...s,
      status:
        s.id === sprintId
          ? ("active" as SprintStatus)
          : s.status === "active"
          ? ("planning" as SprintStatus)
          : s.status,
    }));
    onUpdate({ ...sprints, sprints: updatedSprints, activeSprintId: sprintId });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: "", goal: "", startDate: "", endDate: "", status: "planning" });
  };

  // Sort sprints: active first, then by status, then by created date
  const sortedSprints = [...sprints.sprints].sort((a, b) => {
    if (a.id === sprints.activeSprintId) return -1;
    if (b.id === sprints.activeSprintId) return 1;
    const statusOrder: Record<SprintStatus, number> = { active: 0, planning: 1, completed: 2, cancelled: 3 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return b.createdAt - a.createdAt;
  });

  const activeSprint = sprints.sprints.find((s) => s.id === sprints.activeSprintId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Sprints</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Manage sprints for Scrum planning. Assign todos to sprints and track progress.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            New Sprint
          </button>
        )}
      </div>

      {/* Active Sprint Banner */}
      {activeSprint && (
        <div
          className="p-4 rounded-lg border-2"
          style={{
            backgroundColor: `${statusColors[activeSprint.status]}15`,
            borderColor: statusColors[activeSprint.status],
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏃</span>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{activeSprint.name}</h3>
                <span
                  className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: statusColors[activeSprint.status] }}
                >
                  {statusLabels[activeSprint.status]}
                </span>
              </div>
              {activeSprint.goal && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{activeSprint.goal}</p>
              )}
              {(activeSprint.startDate || activeSprint.endDate) && (
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  {activeSprint.startDate && `Start: ${activeSprint.startDate}`}
                  {activeSprint.startDate && activeSprint.endDate && " • "}
                  {activeSprint.endDate && `End: ${activeSprint.endDate}`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Default Sprint Duration (days)
          </label>
          <input
            type="number"
            min="1"
            max="90"
            value={sprints.defaultSprintDuration}
            onChange={(e) => onUpdate({ ...sprints, defaultSprintDuration: parseInt(e.target.value) || 14 })}
            className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showBacklogInSprint"
            checked={sprints.showBacklogInSprint}
            onChange={(e) => onUpdate({ ...sprints, showBacklogInSprint: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="showBacklogInSprint" className="text-sm text-zinc-700 dark:text-zinc-300">
            Show backlog items in sprint view
          </label>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sprint Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sprint 1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as SprintStatus })}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sprint Goal</label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What should be achieved in this sprint?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              {editingId ? "Update" : "Create"} Sprint
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Sprint List */}
      <div className="space-y-2">
        {sortedSprints.length === 0 ? (
          <p className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            No sprints yet. Click "New Sprint" to create your first sprint.
          </p>
        ) : (
          sortedSprints.map((sprint) => (
            <div
              key={sprint.id}
              className={`bg-white dark:bg-zinc-900 p-4 rounded-lg border ${
                sprint.id === sprints.activeSprintId
                  ? "border-green-500 dark:border-green-600"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[sprint.status] }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{sprint.name}</h3>
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded text-white"
                        style={{ backgroundColor: statusColors[sprint.status] }}
                      >
                        {statusLabels[sprint.status]}
                      </span>
                      {sprint.id === sprints.activeSprintId && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Current
                        </span>
                      )}
                    </div>
                    {sprint.goal && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{sprint.goal}</p>}
                    {(sprint.startDate || sprint.endDate) && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                        {sprint.startDate} {sprint.startDate && sprint.endDate && "→"} {sprint.endDate}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sprint.status === "planning" && sprint.id !== sprints.activeSprintId && (
                    <button
                      onClick={() => handleSetActive(sprint.id)}
                      className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-md transition-colors"
                    >
                      Start Sprint
                    </button>
                  )}
                  <IconButton icon="edit" onClick={() => handleEdit(sprint)} />
                  <IconButton icon="delete" onClick={() => handleDelete(sprint.id)} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
