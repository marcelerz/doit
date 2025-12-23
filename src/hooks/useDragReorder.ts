"use client";

import { useState, useCallback } from "react";
import { TodoModel } from "@/models/TodoModel";

export interface UseDragReorderOptions {
  todos: TodoModel[];
  reorderTodos: (newOrder: string[]) => void;
}

export interface UseDragReorderResult {
  // State
  isDragMode: boolean;
  draggedTodoId: string | null;
  dragOverTodoId: string | null;

  // Actions
  toggleDragMode: () => void;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, id: string) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, targetId: string) => void;
}

export function useDragReorder({ todos, reorderTodos }: UseDragReorderOptions): UseDragReorderResult {
  const [isDragMode, setIsDragMode] = useState(false);
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverTodoId, setDragOverTodoId] = useState<string | null>(null);

  const toggleDragMode = useCallback(() => {
    setIsDragMode((prev) => !prev);
    setDraggedTodoId(null);
    setDragOverTodoId(null);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedTodoId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTodoId(null);
    setDragOverTodoId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault();
      if (draggedTodoId && draggedTodoId !== id) {
        setDragOverTodoId(id);
      }
    },
    [draggedTodoId],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverTodoId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const sourceId = draggedTodoId;

      if (!sourceId || sourceId === targetId) {
        setDraggedTodoId(null);
        setDragOverTodoId(null);
        return;
      }

      // Get current active todos in order (filtered by active state)
      const activeTodosList = todos.filter((t) => t.isActive);
      const activeTodoIds = activeTodosList.map((t) => t.id);

      // Find positions
      const sourceIndex = activeTodoIds.indexOf(sourceId);
      const targetIndex = activeTodoIds.indexOf(targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        setDraggedTodoId(null);
        setDragOverTodoId(null);
        return;
      }

      // Create new order by moving source to target position
      const newOrder = [...activeTodoIds];
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, sourceId);

      // Apply new order
      reorderTodos(newOrder);

      setDraggedTodoId(null);
      setDragOverTodoId(null);
    },
    [draggedTodoId, todos, reorderTodos],
  );

  return {
    isDragMode,
    draggedTodoId,
    dragOverTodoId,
    toggleDragMode,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
