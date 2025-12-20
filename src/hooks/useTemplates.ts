"use client";

import { useState, useEffect, useCallback } from "react";
import { TodoTemplate, TodoMetadata } from "@/types/todo";
import { getTodoTemplateId } from "@/types/todoTemplate";
import { getTimestamp } from "@/types/settings";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";

export function useTemplates() {
  const [templates, setTemplates] = useState<TodoTemplate[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load templates from storage on mount
  useEffect(() => {
    const loadTemplates = async () => {
      await waitForStorageInit();
      const loaded = await loadFromStorage<TodoTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
      setTemplates(loaded);
      setIsLoaded(true);
    };
    loadTemplates();
  }, []);

  // Save templates whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.TEMPLATES, templates).catch((error) => {
        console.error("Failed to save templates:", error);
      });
    }
  }, [templates, isLoaded]);

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
