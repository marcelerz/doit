"use client";

import { useCallback } from "react";
import { TodoMetadata } from "@/types/todo";
import { TodoTemplate, getTodoTemplateId } from "@/types/todoTemplate";
import { getTimestamp } from "@/types/time";
import { STORAGE_KEYS } from "@/storage/storage";
import { usePersistedState } from "./usePersistedState";

export function useTemplates() {
  const [templates, setTemplates, isLoaded] = usePersistedState<TodoTemplate[]>(
    STORAGE_KEYS.TEMPLATES,
    []
  );

  const addTemplate = useCallback(
    (template: {
      name: string;
      text: string;
      plainText: string;
      metadata: Partial<TodoMetadata>;
      subtasks?: TodoTemplate["subtasks"];
      description?: string;
    }) => {
      const now = Date.now();
      const newTemplate: TodoTemplate = {
        id: getTodoTemplateId(`template-${now}`),
        name: template.name,
        description: template.description,
        text: template.text,
        plainText: template.plainText,
        metadata: template.metadata,
        subtasks: template.subtasks,
        createdAt: getTimestamp(now),
        usageCount: 0,
      };
      setTemplates((prev) => [...prev, newTemplate]);
      return newTemplate.id;
    },
    [],
  );

  const updateTemplate = useCallback(
    (id: string, updates: Partial<Omit<TodoTemplate, "id" | "createdAt" | "usageCount">>) => {
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    },
    [],
  );

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const incrementUsage = useCallback((id: string) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t)));
  }, []);

  // Get templates sorted by usage (most used first)
  const sortedTemplates = [...templates].sort((a, b) => b.usageCount - a.usageCount);

  return {
    templates: sortedTemplates,
    isLoaded,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
  };
}
