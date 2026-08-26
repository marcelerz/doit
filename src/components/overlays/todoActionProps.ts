import { TodoId, SubtaskId, TimeEntryId } from "@/types/todo";

/**
 * The task actions a view forwards to TodoDetailsOverlay.
 *
 * CalendarView, GanttView and KanbanView each declared these ten props
 * verbatim, purely to hand them on -- none of the three uses any of them
 * itself. Declared once here so the three cannot drift, which they had already
 * begun to: the optional markers were not consistent between them.
 */
export interface TodoActionProps {
  onAddPriority: (name: string) => void;
  onAddSubtask?: (todoId: TodoId, text: string) => void;
  onToggleSubtask?: (todoId: TodoId, subtaskId: SubtaskId) => void;
  onEditSubtask?: (todoId: TodoId, subtaskId: SubtaskId, text: string) => void;
  onDeleteSubtask?: (todoId: TodoId, subtaskId: SubtaskId) => void;
  onStartTimeTracking?: (todoId: TodoId, note?: string) => void;
  onStopTimeTracking?: (todoId: TodoId) => void;
  onAddManualTimeEntry?: (todoId: TodoId, minutes: number, note?: string) => void;
  onDeleteTimeEntry?: (todoId: TodoId, entryId: TimeEntryId) => void;
  onCreateTemplate?: (todoId: TodoId) => void;
}
