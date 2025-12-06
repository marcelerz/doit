"use client";

import { useState, useEffect, useCallback } from "react";
import { loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";
import { Comment, ActivityEntry } from "@/types/settings";

/**
 * Base entity interface that all managed entities must implement
 */
export interface BaseEntity {
  id: string;
  name: string;
  alternatives: string[];
  color?: string;
  context?: string;
  archived?: boolean;
  comments: Comment[];
  activity?: ActivityEntry[];
}

/**
 * Configuration for the entity manager hook
 */
interface EntityManagerConfig<T extends BaseEntity> {
  storageKey: string;
  entityName: string; // e.g., "Person" or "Project"
  createModels: (rawEntities: T[]) => unknown[];
}

/**
 * Generic hook for managing entities (People, Projects) with CRUD operations,
 * comments, activity tracking, and storage persistence.
 *
 * This hook provides a complete entity management solution with:
 * - Load/save from storage
 * - Add/update/delete entities
 * - Archive/unarchive entities
 * - Comment management with history
 * - Activity tracking for all changes
 */
export function useEntityManager<T extends BaseEntity, M>(
  config: EntityManagerConfig<T>,
  createModelsTyped: (rawEntities: T[]) => M[],
) {
  const [rawEntities, setRawEntities] = useState<T[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load entities from storage on mount
  useEffect(() => {
    // Wait for storage to be initialized before loading data
    waitForStorageInit().then(() => {
      return loadFromStorage<T[]>(config.storageKey, []).then((loaded) => {
        setRawEntities(loaded);
        setIsLoaded(true);
      });
    });
  }, [config.storageKey]);

  // Save entities to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(config.storageKey, rawEntities).catch((error) => {
        console.error(`Failed to save ${config.entityName.toLowerCase()}s:`, error);
      });
    }
  }, [rawEntities, isLoaded, config.storageKey, config.entityName]);

  const addEntity = useCallback(
    (entity: Omit<T, "id" | "comments" | "activity">) => {
      const now = Date.now();
      const newEntity = {
        ...entity,
        id: now.toString(),
        comments: [],
        activity: [
          {
            id: `${now}-created`,
            timestamp: now,
            type: "created",
            description: `${config.entityName} created`,
          },
        ],
      } as unknown as T;
      setRawEntities((prev) => [...prev, newEntity]);
    },
    [config.entityName],
  );

  const updateEntity = useCallback((id: string, updates: Partial<T>) => {
    setRawEntities((prev) =>
      prev.map((entity) => {
        if (entity.id === id) {
          const updatedEntity = { ...entity, ...updates };

          // Add activity entry for edit with specific details
          if (
            updates.name !== undefined ||
            updates.alternatives !== undefined ||
            updates.color !== undefined ||
            updates.context !== undefined
          ) {
            const now = Date.now();
            const changes: string[] = [];

            if (updates.name !== undefined && updates.name !== entity.name) {
              changes.push(`name from "${entity.name}" to "${updates.name}"`);
            }
            if (
              updates.alternatives !== undefined &&
              JSON.stringify(updates.alternatives) !== JSON.stringify(entity.alternatives)
            ) {
              const oldAlts = entity.alternatives.length > 0 ? entity.alternatives.join(", ") : "none";
              const newAlts = updates.alternatives.length > 0 ? updates.alternatives.join(", ") : "none";
              changes.push(`alternatives from ${oldAlts} to ${newAlts}`);
            }
            if (updates.color !== undefined && updates.color !== entity.color) {
              changes.push(`color from ${entity.color} to ${updates.color}`);
            }
            if (updates.context !== entity.context) {
              if (updates.context && !entity.context) {
                changes.push("context added");
              } else if (!updates.context && entity.context) {
                changes.push("context removed");
              } else if (updates.context && entity.context) {
                changes.push("context updated");
              }
            }

            if (changes.length > 0) {
              updatedEntity.activity = [
                ...(entity.activity || []),
                {
                  id: `${now}-edited`,
                  timestamp: now,
                  type: "edited",
                  description: `Updated ${changes.join("; ")}`,
                },
              ];
            }
          }
          return updatedEntity;
        }
        return entity;
      }),
    );
  }, []);

  const archiveEntity = useCallback(
    (id: string) => {
      setRawEntities((prev) =>
        prev.map((entity) => {
          if (entity.id === id) {
            const now = Date.now();
            return {
              ...entity,
              archived: true,
              activity: [
                ...(entity.activity || []),
                {
                  id: `${now}-archived`,
                  timestamp: now,
                  type: "archived",
                  description: `${config.entityName} archived`,
                },
              ],
            };
          }
          return entity;
        }),
      );
    },
    [config.entityName],
  );

  const unarchiveEntity = useCallback(
    (id: string) => {
      setRawEntities((prev) =>
        prev.map((entity) => {
          if (entity.id === id) {
            const now = Date.now();
            return {
              ...entity,
              archived: false,
              activity: [
                ...(entity.activity || []),
                {
                  id: `${now}-unarchived`,
                  timestamp: now,
                  type: "unarchived",
                  description: `${config.entityName} unarchived`,
                },
              ],
            };
          }
          return entity;
        }),
      );
    },
    [config.entityName],
  );

  const deleteEntity = useCallback((id: string) => {
    setRawEntities((prev) => prev.filter((entity) => entity.id !== id));
  }, []);

  const addComment = useCallback((entityId: string, content: string) => {
    const now = Date.now();
    setRawEntities((prev) =>
      prev.map((entity) => {
        if (entity.id === entityId) {
          const newComment: Comment = {
            commentId: now,
            history: [{ date: now, content }],
          };
          return {
            ...entity,
            comments: [...entity.comments, newComment],
          };
        }
        return entity;
      }),
    );
  }, []);

  const editComment = useCallback((entityId: string, commentId: number, content: string) => {
    const now = Date.now();
    setRawEntities((prev) =>
      prev.map((entity) => {
        if (entity.id === entityId) {
          return {
            ...entity,
            comments: entity.comments.map((comment) =>
              comment.commentId === commentId
                ? { ...comment, history: [...comment.history, { date: now, content }] }
                : comment,
            ),
          };
        }
        return entity;
      }),
    );
  }, []);

  const deleteComment = useCallback((entityId: string, commentId: number) => {
    setRawEntities((prev) =>
      prev.map((entity) => {
        if (entity.id === entityId) {
          return {
            ...entity,
            comments: entity.comments.filter((c) => c.commentId !== commentId),
          };
        }
        return entity;
      }),
    );
  }, []);

  return {
    rawEntities,
    isLoaded,
    addEntity,
    updateEntity,
    deleteEntity,
    archiveEntity,
    unarchiveEntity,
    addComment,
    editComment,
    deleteComment,
    // Helper to create wrapped models - consumers should use useMemo with this
    createModels: createModelsTyped,
  };
}
