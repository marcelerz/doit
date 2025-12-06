"use client";

import { useMemo } from "react";
import { Person } from "@/types/settings";
import { STORAGE_KEYS } from "@/storage/storage";
import { createPersonModels, PersonModel } from "@/models/PersonModel";
import { useEntityManager } from "./useEntityManager";

/**
 * Hook for managing people with CRUD operations, comments, activity tracking,
 * and storage persistence. Uses the generic useEntityManager under the hood.
 */
export function usePeople() {
  const manager = useEntityManager<Person, PersonModel>(
    {
      storageKey: STORAGE_KEYS.PEOPLE,
      entityName: "Person",
      createModels: createPersonModels,
    },
    createPersonModels,
  );

  // Wrap raw people in PersonModel instances for consumers
  const people = useMemo(() => createPersonModels(manager.rawEntities), [manager.rawEntities]);

  return {
    people,
    isLoaded: manager.isLoaded,
    addPerson: manager.addEntity,
    updatePerson: manager.updateEntity,
    deletePerson: manager.deleteEntity,
    archivePerson: manager.archiveEntity,
    unarchivePerson: manager.unarchiveEntity,
    addPersonComment: manager.addComment,
    editPersonComment: manager.editComment,
    deletePersonComment: manager.deleteComment,
  };
}
