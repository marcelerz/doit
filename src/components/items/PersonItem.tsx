"use client";

import { PersonModel } from "@/models/PersonModel";
import { PersonId } from "@/types/person";
import { EntityItem, EntityCounts, PERSON_CONFIG } from "./EntityItem";

interface PersonItemProps {
  person: PersonModel;
  onClick: () => void;
  onDelete: (id: PersonId) => void;
  onArchive?: (id: PersonId) => void;
  onUnarchive?: (id: PersonId) => void;
  onRequestDeleteConfirm: (id: PersonId, name: string) => void;
  onCreateNote?: (id: PersonId) => void;
  counts?: EntityCounts;
}

export function PersonItem({
  person,
  onClick,
  onDelete,
  onArchive,
  onUnarchive,
  onRequestDeleteConfirm,
  onCreateNote,
  counts,
}: PersonItemProps) {
  return (
    <EntityItem<PersonId>
      entity={person}
      config={PERSON_CONFIG}
      onClick={onClick}
      onDelete={onDelete}
      onArchive={onArchive}
      onUnarchive={onUnarchive}
      onRequestDeleteConfirm={onRequestDeleteConfirm}
      onCreateNote={onCreateNote}
      counts={counts}
    />
  );
}
