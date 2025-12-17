import { getKanbanStateId, KanbanStateId } from "./kanbanState";

// Unique branded type for KanbanView IDs
export type KanbanViewId = string & { readonly __brand: unique symbol };

// Converts string id to KanbanViewID type
export function getKanbanViewId(id: string): KanbanViewId {
  return id as KanbanViewId;
}

export interface KanbanView {
  id: KanbanViewId;
  name: string;
  description?: string;
  stateIds: KanbanStateId[]; // Which states to show in this view (in order)
  isDefault?: boolean;
}

// Default Kanban views
export const defaultKanbanViews: KanbanView[] = [
  {
    id: getKanbanViewId("all"),
    name: "All Tasks",
    description: "Full workflow view",
    stateIds: [
      getKanbanStateId("backlog"),
      getKanbanStateId("todo"),
      getKanbanStateId("in-progress"),
      getKanbanStateId("review"),
      getKanbanStateId("completed"),
      getKanbanStateId("rejected"),
    ],
    isDefault: true,
  },
  {
    id: getKanbanViewId("active-work"),
    name: "Active Work",
    description: "Focus on current work",
    stateIds: [
      getKanbanStateId("todo"),
      getKanbanStateId("in-progress"),
      getKanbanStateId("review"),
      getKanbanStateId("completed"),
    ],
  },
  {
    id: getKanbanViewId("intake"),
    name: "Intake",
    description: "Triage and prioritize new tasks",
    stateIds: [getKanbanStateId("backlog"), getKanbanStateId("todo"), getKanbanStateId("rejected")],
  },
  {
    id: getKanbanViewId("retrospective"),
    name: "Retrospective",
    description: "Review completed and rejected work",
    stateIds: [getKanbanStateId("completed"), getKanbanStateId("rejected"), getKanbanStateId("archived")],
  },
];
