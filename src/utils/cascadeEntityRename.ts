/**
 * Applying a person or project rename across everything that refers to it.
 *
 * People and projects are referenced by NAME rather than by id, so a rename
 * that does not rewrite those references orphans every todo, note, review,
 * template and saved filter that mentioned the entity.
 *
 * This lives outside the component that used to hold it so the ordering rules
 * below can be unit tested. The participants are passed in rather than
 * discovered, because each one is a React hook's mutator and only the
 * component has them in scope.
 */

import { EntityKind, isNameTaken } from "./renameReferences";

/** One store that holds name references and can rewrite them. */
export type RenameParticipant = (kind: EntityKind, previousName: string, nextName: string) => void | Promise<void>;

export interface AutoAssignNames {
  assignedPerson?: string;
  sourcePerson?: string;
  project?: string;
}

export interface CascadeRenameOptions {
  kind: EntityKind;
  previousName: string;
  nextName: string;
  /** Every store holding name references. Order within the list does not matter. */
  participants: RenameParticipant[];
  autoAssign: AutoAssignNames;
  updateAutoAssign: (updates: Partial<AutoAssignNames>) => void;
}

/**
 * The auto-assign defaults are live: a todo with no explicit assignee still
 * resolves through them, so a stale name here silently re-points every such
 * todo.
 */
export function renameInAutoAssign(
  kind: EntityKind,
  autoAssign: AutoAssignNames,
  previousName: string,
  nextName: string,
): Partial<AutoAssignNames> {
  const updates: Partial<AutoAssignNames> = {};
  if (kind === "person") {
    if (autoAssign.assignedPerson === previousName) updates.assignedPerson = nextName;
    if (autoAssign.sourcePerson === previousName) updates.sourcePerson = nextName;
  } else if (autoAssign.project === previousName) {
    updates.project = nextName;
  }
  return updates;
}

/**
 * Rewrite every reference to `previousName`.
 *
 * Resolves once all participants have finished, so the caller can rename the
 * entity itself afterwards. That ordering matters: there is no transaction
 * across these stores, so rewriting references while the entity still holds the
 * old name means every intermediate state resolves under one name or the other,
 * and a failure part-way through orphans nothing.
 */
export async function cascadeEntityRename({
  kind,
  previousName,
  nextName,
  participants,
  autoAssign,
  updateAutoAssign,
}: CascadeRenameOptions): Promise<void> {
  await Promise.all(participants.map((rewrite) => rewrite(kind, previousName, nextName)));

  const autoAssignUpdates = renameInAutoAssign(kind, autoAssign, previousName, nextName);
  if (Object.keys(autoAssignUpdates).length > 0) {
    updateAutoAssign(autoAssignUpdates);
  }
}

/** Why a rename was refused, or null when it may proceed. */
export function rejectRename(
  entities: Array<{ id: string; name: string; alternatives?: string[] }>,
  kind: EntityKind,
  nextName: string,
  exceptId: string,
): string | null {
  if (isNameTaken(entities, nextName, exceptId)) {
    return `A ${kind} named "${nextName}" already exists.`;
  }
  return null;
}
