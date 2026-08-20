import { getKanbanStateId, KanbanStateId } from "./kanbanState";

export interface KanbanTransition {
  fromStateId: KanbanStateId;
  toStateId: KanbanStateId;
}

// Default transitions - most states can move to adjacent states or to completed
export const defaultKanbanTransitions: KanbanTransition[] = [
  // From Backlog
  { fromStateId: getKanbanStateId("backlog"), toStateId: getKanbanStateId("todo") },
  { fromStateId: getKanbanStateId("backlog"), toStateId: getKanbanStateId("in-progress") },
  { fromStateId: getKanbanStateId("backlog"), toStateId: getKanbanStateId("rejected") },
  { fromStateId: getKanbanStateId("backlog"), toStateId: getKanbanStateId("archived") },
  // From To Do
  { fromStateId: getKanbanStateId("todo"), toStateId: getKanbanStateId("backlog") },
  { fromStateId: getKanbanStateId("todo"), toStateId: getKanbanStateId("in-progress") },
  { fromStateId: getKanbanStateId("todo"), toStateId: getKanbanStateId("completed") },
  { fromStateId: getKanbanStateId("todo"), toStateId: getKanbanStateId("rejected") },
  // From In Progress
  { fromStateId: getKanbanStateId("in-progress"), toStateId: getKanbanStateId("todo") },
  { fromStateId: getKanbanStateId("in-progress"), toStateId: getKanbanStateId("review") },
  { fromStateId: getKanbanStateId("in-progress"), toStateId: getKanbanStateId("completed") },
  // From Review
  { fromStateId: getKanbanStateId("review"), toStateId: getKanbanStateId("in-progress") },
  { fromStateId: getKanbanStateId("review"), toStateId: getKanbanStateId("completed") },
  // From Completed
  { fromStateId: getKanbanStateId("completed"), toStateId: getKanbanStateId("archived") },
  { fromStateId: getKanbanStateId("completed"), toStateId: getKanbanStateId("todo") }, // Reopen
  // From Rejected
  { fromStateId: getKanbanStateId("rejected"), toStateId: getKanbanStateId("archived") },
  { fromStateId: getKanbanStateId("rejected"), toStateId: getKanbanStateId("backlog") }, // Reconsider
  // From Archived
  { fromStateId: getKanbanStateId("archived"), toStateId: getKanbanStateId("todo") }, // Unarchive
];
