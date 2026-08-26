"use client";

import { useState, useEffect, useCallback } from "react";
import { appendComment, amendComment, removeComment } from "@/utils/commentMutations";
import { loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storage";
import { Comment, ActivityEntry, getActivityId } from "@/types/types";
import { getTimestamp } from "@/types/time";
import { createActivityId } from "@/utils/idGenerator";

/**
 * Base entity interface that all managed entities must implement
 * Generic parameters:
 * - IdType: The type for the entity's id (can be branded string types like PersonId, ProjectId)
 * - ActivityType: The type for activity entry types (e.g., PersonActivityType, ProjectActivityType)
 * - ColorType: The type for color (can be branded Color type or plain string)
 */
export interface BaseEntity<
  IdType extends string = string,
  ActivityType extends string = string,
  ColorType extends string = string,
> {
  id: IdType;
  name: string;
  alternatives: string[];
  color?: ColorType;
  context?: string;
  archived?: boolean;
  comments: Comment[];
  activity: ActivityEntry<ActivityType>[];
}

/**
 * Configuration for the entity manager hook
 */
interface EntityManagerConfig<T extends BaseEntity<string, string, string>> {
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
export function useEntityManager<T extends BaseEntity<string, string, string>, M>(
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
        // Migrate entities to ensure all required fields exist
        const migrated = loaded.map((entity) => ({
          ...entity,
          alternatives: entity.alternatives || [],
          comments: entity.comments || [],
          activity: entity.activity || [],
        }));
        setRawEntities(migrated as T[]);
      });
    })
      .catch((error) => {
        console.error(`Failed to load ${config.entityName.toLowerCase()}s:`, error);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, [config.storageKey, config.entityName]);

  // Save entities to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(config.storageKey, rawEntities);
    }
  }, [rawEntities, isLoaded, config.storageKey, config.entityName]);

  const addEntity = useCallback(
    (entity: Omit<T, "id" | "comments" | "activity">, entityId: string) => {
      const now = Date.now();
      const newEntity = {
        ...entity,
        id: entityId,
        comments: [],
        activity: [
          {
            id: getActivityId(createActivityId()),
            timestamp: getTimestamp(now),
            type: "created",
            description: `${config.entityName} created`,
          },
        ],
      } as unknown as T;
      setRawEntities((prev) => [...prev, newEntity]);
    },
    [config.entityName],
  );

  const updateEntity = useCallback((id: T["id"], updates: Partial<T>) => {
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
                  id: getActivityId(createActivityId()),
                  timestamp: getTimestamp(now),
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
    (id: T["id"]) => {
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
                  id: getActivityId(createActivityId()),
                  timestamp: getTimestamp(now),
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
    (id: T["id"]) => {
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
                  id: getActivityId(createActivityId()),
                  timestamp: getTimestamp(now),
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

  const deleteEntity = useCallback((id: T["id"]) => {
    setRawEntities((prev) => prev.filter((entity) => entity.id !== id));
  }, []);

  const addComment = useCallback((entityId: string, content: string) => {
    const now = Date.now();
    setRawEntities((prev) =>
      prev.map((entity) => {
        if (entity.id === entityId) {
          return { ...entity, comments: appendComment(entity.comments, content, now) };
        }
        return entity;
      }),
    );
  }, []);

  const editComment = useCallback((entityId: string, commentId: string, content: string) => {
    const now = Date.now();
    setRawEntities((prev) =>
      prev.map((entity) => {
        if (entity.id === entityId) {
          return { ...entity, comments: amendComment(entity.comments, commentId, content, now) };
        }
        return entity;
      }),
    );
  }, []);

  const deleteComment = useCallback((entityId: string, commentId: string) => {
    setRawEntities((prev) =>
      prev.map((entity) => {
        if (entity.id === entityId) {
          return { ...entity, comments: removeComment(entity.comments, commentId) };
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
