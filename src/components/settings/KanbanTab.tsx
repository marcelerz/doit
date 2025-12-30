"use client";

import { KanbanSettings } from "@/types/settings";
import { KanbanState, defaultKanbanStates, getKanbanStateId } from "@/types/kanbanState";
import { KanbanTransition, defaultKanbanTransitions } from "@/types/kanbanTransition";
import { KanbanView, defaultKanbanViews, getKanbanViewId } from "@/types/kanbanView";
import { getColor } from "@/types/types";
import { useState } from "react";
import { SettingsModel } from "@/models/SettingsModel";
import { useSettings } from "@/hooks/useSettings";
import { IconButton } from "@/components/shared/IconButton";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
import { SettingsLoading } from "./SettingsLoading";
import { SettingsHeader } from "./SettingsHeader";

const kanbanStatesTooltip = (
  <div className="space-y-2">
    <p>Workflow columns for the Kanban board.</p>
    <ul className="space-y-1">
      <li>• Drag tasks between states</li>
      <li>• "Backlog", "Completed", and "Archived" are system states</li>
      <li>• Set WIP (Work-In-Progress) limits on non-system states</li>
      <li>• Columns turn red when over WIP limit</li>
      <li>• Configure allowed transitions</li>
    </ul>
  </div>
);

const kanbanTransitionsTooltip = (
  <div className="space-y-2">
    <p>Define allowed state-to-state transitions.</p>
    <ul className="space-y-1">
      <li>• Control which states can move to others</li>
      <li>• Prevents invalid workflow jumps</li>
      <li>• Check = transition allowed</li>
    </ul>
  </div>
);

const kanbanViewsTooltip = (
  <div className="space-y-2">
    <p>Create filtered views of your Kanban board.</p>
    <ul className="space-y-1">
      <li>• Show only selected states</li>
      <li>• Create views like "Active Work" or "Done"</li>
      <li>• Set a default view</li>
    </ul>
  </div>
);

const AVAILABLE_ICONS = ["📋", "📝", "🔄", "👀", "✅", "📦", "🚀", "⏳", "🎯", "💡", "🔥", "⭐", "🏷️", "📌"];

export function KanbanTab() {
  const { settings, isLoaded, updateKanbanSettings } = useSettings();
  const [activeSection, setActiveSection] = useState<"states" | "transitions" | "views">("states");
  const [editingState, setEditingState] = useState<KanbanState | null>(null);
  const [editingView, setEditingView] = useState<KanbanView | null>(null);
  const [showNewStateForm, setShowNewStateForm] = useState(false);
  const [showNewViewForm, setShowNewViewForm] = useState(false);
  const [newStateName, setNewStateName] = useState("");
  const [newStateColor, setNewStateColor] = useState("#6366f1");
  const [newStateIcon, setNewStateIcon] = useState("📋");
  const [newViewName, setNewViewName] = useState("");
  const [newViewDescription, setNewViewDescription] = useState("");
  const [newViewStates, setNewViewStates] = useState<string[]>([]);

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  const kanban = settings.kanban;

  const handleResetToDefaults = () => {
    updateKanbanSettings({
      ...kanban,
      states: defaultKanbanStates,
      allowedTransitions: defaultKanbanTransitions,
      views: defaultKanbanViews,
      activeViewId: "all",
    });
  };

  // State management
  const handleAddState = () => {
    if (newStateName.trim() === "") return;

    const newState: KanbanState = {
      id: SettingsModel.createKanbanStateId(),
      name: newStateName.trim(),
      color: getColor(newStateColor),
      icon: newStateIcon,
      order: kanban.states.length,
    };

    updateKanbanSettings({
      ...kanban,
      states: [...kanban.states, newState],
    });

    setNewStateName("");
    setNewStateColor("#6366f1");
    setNewStateIcon("📋");
    setShowNewStateForm(false);
  };

  const handleUpdateState = (state: KanbanState) => {
    updateKanbanSettings({
      ...kanban,
      states: kanban.states.map((s) => (s.id === state.id ? state : s)),
    });
    setEditingState(null);
  };

  const handleDeleteState = (stateId: string) => {
    const state = kanban.states.find((s) => s.id === stateId);
    if (state?.isSystem) return; // Can't delete system states

    // Remove state and any transitions involving it
    updateKanbanSettings({
      ...kanban,
      states: kanban.states.filter((s) => s.id !== stateId),
      allowedTransitions: kanban.allowedTransitions.filter((t) => t.fromStateId !== stateId && t.toStateId !== stateId),
      views: kanban.views.map((v) => ({
        ...v,
        stateIds: v.stateIds.filter((id) => id !== stateId),
      })),
    });
  };

  const handleMoveState = (stateId: string, direction: "up" | "down") => {
    const states = [...kanban.states];
    const index = states.findIndex((s) => s.id === stateId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= states.length) return;

    // Swap
    [states[index], states[newIndex]] = [states[newIndex], states[index]];

    // Update order values
    const updatedStates = states.map((s, i) => ({ ...s, order: i }));

    updateKanbanSettings({
      ...kanban,
      states: updatedStates,
    });
  };

  // Transition management
  const handleToggleTransition = (fromStateId: string, toStateId: string) => {
    const exists = kanban.allowedTransitions.some((t) => t.fromStateId === fromStateId && t.toStateId === toStateId);

    if (exists) {
      updateKanbanSettings({
        ...kanban,
        allowedTransitions: kanban.allowedTransitions.filter(
          (t) => !(t.fromStateId === fromStateId && t.toStateId === toStateId),
        ),
      });
    } else {
      updateKanbanSettings({
        ...kanban,
        allowedTransitions: [
          ...kanban.allowedTransitions,
          { fromStateId: getKanbanStateId(fromStateId), toStateId: getKanbanStateId(toStateId) },
        ],
      });
    }
  };

  // View management
  const handleAddView = () => {
    if (!newViewName.trim() || newViewStates.length === 0) return;

    const newView: KanbanView = {
      id: SettingsModel.createKanbanViewId(),
      name: newViewName.trim(),
      description: newViewDescription.trim() || undefined,
      stateIds: newViewStates.map(getKanbanStateId),
    };

    updateKanbanSettings({
      ...kanban,
      views: [...kanban.views, newView],
    });

    setNewViewName("");
    setNewViewDescription("");
    setNewViewStates([]);
    setShowNewViewForm(false);
  };

  const handleUpdateView = (view: KanbanView) => {
    updateKanbanSettings({
      ...kanban,
      views: kanban.views.map((v) => (v.id === view.id ? view : v)),
    });
    setEditingView(null);
  };

  const handleDeleteView = (viewId: string) => {
    // Don't allow deleting the last view
    if (kanban.views.length <= 1) return;

    updateKanbanSettings({
      ...kanban,
      views: kanban.views.filter((v) => v.id !== viewId),
      activeViewId: kanban.activeViewId === viewId ? kanban.views[0].id : kanban.activeViewId,
    });
  };

  const handleSetDefaultView = (viewId: string) => {
    updateKanbanSettings({
      ...kanban,
      views: kanban.views.map((v) => ({
        ...v,
        isDefault: v.id === viewId,
      })),
    });
  };

  // Options management
  const handleToggleOption = (option: "showEmptyColumns" | "showTaskCount") => {
    updateKanbanSettings({
      ...kanban,
      [option]: !kanban[option],
    });
  };

  const sortedStates = [...kanban.states].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Kanban Board Settings"
        tooltip={kanbanStatesTooltip}
        description="Configure workflow states, transitions, and views for your Kanban board."
        action={{
          label: "Reset to Defaults",
          onClick: handleResetToDefaults,
        }}
      />

      {/* Section Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setActiveSection("states")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeSection === "states"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          Workflow States
          <InfoTooltip content={kanbanStatesTooltip} asSpan />
        </button>
        <button
          onClick={() => setActiveSection("transitions")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeSection === "transitions"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          Transitions
          <InfoTooltip content={kanbanTransitionsTooltip} asSpan />
        </button>
        <button
          onClick={() => setActiveSection("views")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeSection === "views"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          Views
          <InfoTooltip content={kanbanViewsTooltip} asSpan />
        </button>
      </div>

      {/* Workflow States Section */}
      {activeSection === "states" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Define the workflow states for your Kanban board. System states (Completed, Archived) cannot be deleted.
            </p>
            <button
              onClick={() => setShowNewStateForm(!showNewStateForm)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showNewStateForm ? "Cancel" : "Add State"}
            </button>
          </div>

          {/* New State Form */}
          {showNewStateForm && (
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">State Name</label>
                <input
                  type="text"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  placeholder="e.g., In Review"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={newStateColor}
                      onChange={(e) => setNewStateColor(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-zinc-300 dark:border-zinc-700"
                    />
                    <input
                      type="text"
                      value={newStateColor}
                      onChange={(e) => setNewStateColor(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Icon</label>
                  <div className="flex flex-wrap gap-1">
                    {AVAILABLE_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewStateIcon(icon)}
                        className={`w-8 h-8 text-lg rounded ${
                          newStateIcon === icon
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddState}
                disabled={!newStateName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add State
              </button>
            </div>
          )}

          {/* States List */}
          <div className="space-y-2">
            {sortedStates.map((state, index) => (
              <div key={state.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveState(state.id, "up")}
                    disabled={index === 0}
                    className="p-0.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveState(state.id, "down")}
                    disabled={index === sortedStates.length - 1}
                    className="p-0.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                {/* Color indicator */}
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: state.color }} />

                {/* Icon and name */}
                <span className="text-lg">{state.icon}</span>
                <span className="flex-1 font-medium text-zinc-900 dark:text-zinc-100">{state.name}</span>

                {/* WIP Limit badge - only for non-system states */}
                {!state.isSystem && state.wipLimit !== undefined && state.wipLimit > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                    WIP: {state.wipLimit}
                  </span>
                )}

                {/* System badge */}
                {state.isSystem && (
                  <span className="px-2 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded">
                    System
                  </span>
                )}

                {/* Maps to badge */}
                {state.mapsToTodoState && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    → {state.mapsToTodoState}
                  </span>
                )}

                {/* Actions */}
                {!state.isSystem && (
                  <>
                    <IconButton icon="edit" onClick={() => setEditingState(state)} />
                    <IconButton icon="delete" onClick={() => handleDeleteState(state.id)} />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Edit State Modal */}
          {editingState && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Edit State</h4>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingState.name}
                    onChange={(e) => setEditingState({ ...editingState, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={editingState.color}
                      onChange={(e) => setEditingState({ ...editingState, color: getColor(e.target.value) })}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-zinc-300 dark:border-zinc-700"
                    />
                    <input
                      type="text"
                      value={editingState.color}
                      onChange={(e) => setEditingState({ ...editingState, color: getColor(e.target.value) })}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Icon</label>
                  <div className="flex flex-wrap gap-1">
                    {AVAILABLE_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setEditingState({ ...editingState, icon })}
                        className={`w-8 h-8 text-lg rounded ${
                          editingState.icon === icon
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                {/* WIP Limit - only for non-system states */}
                {!editingState.isSystem && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      WIP Limit (Work-In-Progress)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={editingState.wipLimit ?? ""}
                        onChange={(e) =>
                          setEditingState({
                            ...editingState,
                            wipLimit: e.target.value ? parseInt(e.target.value, 10) : undefined,
                          })
                        }
                        placeholder="No limit"
                        className="w-24 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm"
                      />
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">Leave empty for no limit</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingState(null)}
                    className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateState(editingState)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transitions Section */}
      {activeSection === "transitions" && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Define which state transitions are allowed. Click a cell to toggle the transition.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">From ↓ / To →</th>
                  {sortedStates.map((state) => (
                    <th key={state.id} className="p-2 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      <div className="flex flex-col items-center gap-1">
                        <span>{state.icon}</span>
                        <span className="text-xs">{state.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStates.map((fromState) => (
                  <tr key={fromState.id}>
                    <td className="p-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <span>{fromState.icon}</span>
                        <span>{fromState.name}</span>
                      </div>
                    </td>
                    {sortedStates.map((toState) => {
                      const isAllowed = kanban.allowedTransitions.some(
                        (t) => t.fromStateId === fromState.id && t.toStateId === toState.id,
                      );
                      const isSame = fromState.id === toState.id;

                      return (
                        <td key={toState.id} className="p-2 text-center">
                          {isSame ? (
                            <span className="text-zinc-300 dark:text-zinc-600">—</span>
                          ) : (
                            <button
                              onClick={() => handleToggleTransition(fromState.id, toState.id)}
                              className={`w-8 h-8 rounded-md transition-colors ${
                                isAllowed ? "bg-green-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
                              }`}
                            >
                              {isAllowed ? "✓" : ""}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Allowed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
              <span>Not Allowed</span>
            </div>
          </div>
        </div>
      )}

      {/* Views Section */}
      {activeSection === "views" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Create views to show specific combinations of workflow states.
            </p>
            <button
              onClick={() => setShowNewViewForm(!showNewViewForm)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showNewViewForm ? "Cancel" : "Add View"}
            </button>
          </div>

          {/* New View Form */}
          {showNewViewForm && (
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">View Name</label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="e.g., Daily Standup"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newViewDescription}
                  onChange={(e) => setNewViewDescription(e.target.value)}
                  placeholder="e.g., Tasks currently in progress"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Include States
                </label>
                <div className="flex flex-wrap gap-2">
                  {sortedStates.map((state) => (
                    <button
                      key={state.id}
                      onClick={() => {
                        if (newViewStates.includes(state.id)) {
                          setNewViewStates(newViewStates.filter((id) => id !== state.id));
                        } else {
                          setNewViewStates([...newViewStates, state.id]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-colors ${
                        newViewStates.includes(state.id)
                          ? "text-white"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                      }`}
                      style={newViewStates.includes(state.id) ? { backgroundColor: state.color } : undefined}
                    >
                      <span>{state.icon}</span>
                      <span>{state.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddView}
                disabled={!newViewName.trim() || newViewStates.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add View
              </button>
            </div>
          )}

          {/* Views List */}
          <div className="space-y-2">
            {kanban.views.map((view) => (
              <div key={view.id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{view.name}</span>
                    {view.isDefault && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!view.isDefault && (
                      <button
                        onClick={() => handleSetDefaultView(view.id)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Set as Default
                      </button>
                    )}
                    <IconButton icon="edit" onClick={() => setEditingView(view)} />
                    {kanban.views.length > 1 && <IconButton icon="delete" onClick={() => handleDeleteView(view.id)} />}
                  </div>
                </div>
                {view.description && <p className="text-sm text-zinc-600 dark:text-zinc-400">{view.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {view.stateIds.map((stateId) => {
                    const state = kanban.states.find((s) => s.id === stateId);
                    if (!state) return null;
                    return (
                      <span
                        key={stateId}
                        className="px-2 py-0.5 rounded-full text-xs text-white flex items-center gap-1"
                        style={{ backgroundColor: state.color }}
                      >
                        <span>{state.icon}</span>
                        <span>{state.name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Edit View Modal */}
          {editingView && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Edit View</h4>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingView.name}
                    onChange={(e) => setEditingView({ ...editingView, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingView.description || ""}
                    onChange={(e) => setEditingView({ ...editingView, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Include States
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sortedStates.map((state) => (
                      <button
                        key={state.id}
                        onClick={() => {
                          if (editingView.stateIds.includes(state.id)) {
                            setEditingView({
                              ...editingView,
                              stateIds: editingView.stateIds.filter((id) => id !== state.id),
                            });
                          } else {
                            setEditingView({
                              ...editingView,
                              stateIds: [...editingView.stateIds, state.id],
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-colors ${
                          editingView.stateIds.includes(state.id)
                            ? "text-white"
                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        }`}
                        style={editingView.stateIds.includes(state.id) ? { backgroundColor: state.color } : undefined}
                      >
                        <span>{state.icon}</span>
                        <span>{state.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingView(null)}
                    className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateView(editingView)}
                    disabled={editingView.stateIds.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Display Options */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Display Options</h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={kanban.showEmptyColumns}
            onChange={() => handleToggleOption("showEmptyColumns")}
            className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Show empty columns</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={kanban.showTaskCount}
            onChange={() => handleToggleOption("showTaskCount")}
            className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Show task count in column headers</span>
        </label>
      </div>
    </div>
  );
}
