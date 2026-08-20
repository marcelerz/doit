/**
 * Utility functions for resolving entity IDs to display names.
 * Extracts the common ID-to-name resolution pattern from TodoModel, NoteModel, etc.
 */

import type { PersonId } from "@/types/person";
import type { ProjectId } from "@/types/project";
import type { EntityRegistry } from "./EntityRegistry";

/**
 * Resolve an array of PersonIds to their display names.
 * Falls back to the ID as a string if the person is not found in the registry.
 *
 * @param ids - Array of PersonIds to resolve
 * @param registry - Optional EntityRegistry for looking up people
 * @returns Array of person names (or IDs as fallback)
 *
 * @example
 * const names = resolvePersonIds(todo.assignedPeopleIds, registry);
 * // Returns: ["John Doe", "Jane Smith"] or ["person-123"] if not found
 */
export function resolvePersonIds(ids: PersonId[], registry?: EntityRegistry): string[] {
  if (!registry) {
    return ids.map((id) => id as string);
  }
  return ids.map((id) => {
    const person = registry.getPerson(id);
    return person ? person.name : (id as string);
  });
}

/**
 * Resolve an array of ProjectIds to their display names.
 * Falls back to the ID as a string if the project is not found in the registry.
 *
 * @param ids - Array of ProjectIds to resolve
 * @param registry - Optional EntityRegistry for looking up projects
 * @returns Array of project names (or IDs as fallback)
 *
 * @example
 * const names = resolveProjectIds(todo.projectIds, registry);
 * // Returns: ["Frontend", "Backend"] or ["project-456"] if not found
 */
export function resolveProjectIds(ids: ProjectId[], registry?: EntityRegistry): string[] {
  if (!registry) {
    return ids.map((id) => id as string);
  }
  return ids.map((id) => {
    const project = registry.getProject(id);
    return project ? project.name : (id as string);
  });
}

/**
 * Resolve a single PersonId to its display name.
 * Returns the ID as string if person is not found.
 *
 * @param id - PersonId to resolve
 * @param registry - Optional EntityRegistry for looking up the person
 * @returns Person name or ID as fallback
 */
export function resolvePersonId(id: PersonId, registry?: EntityRegistry): string {
  if (!registry) {
    return id as string;
  }
  const person = registry.getPerson(id);
  return person ? person.name : (id as string);
}

/**
 * Resolve a single ProjectId to its display name.
 * Returns the ID as string if project is not found.
 *
 * @param id - ProjectId to resolve
 * @param registry - Optional EntityRegistry for looking up the project
 * @returns Project name or ID as fallback
 */
export function resolveProjectId(id: ProjectId, registry?: EntityRegistry): string {
  if (!registry) {
    return id as string;
  }
  const project = registry.getProject(id);
  return project ? project.name : (id as string);
}

/**
 * Check if any person in an array matches a search query.
 * Uses the registry to search person names and other attributes.
 *
 * @param ids - Array of PersonIds to search
 * @param search - Search query (lowercase)
 * @param registry - EntityRegistry for looking up people
 * @returns True if any person matches the search
 */
export function searchPersonIds(ids: PersonId[], search: string, registry: EntityRegistry): boolean {
  for (const personId of ids) {
    const person = registry.getPerson(personId);
    if (person && person.matchesSearch(search)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if any project in an array matches a search query.
 * Uses the registry to search project names and other attributes.
 *
 * @param ids - Array of ProjectIds to search
 * @param search - Search query (lowercase)
 * @param registry - EntityRegistry for looking up projects
 * @returns True if any project matches the search
 */
export function searchProjectIds(ids: ProjectId[], search: string, registry: EntityRegistry): boolean {
  for (const projectId of ids) {
    const project = registry.getProject(projectId);
    if (project && project.matchesSearch(search)) {
      return true;
    }
  }
  return false;
}

/**
 * Resolve multiple entity arrays at once for a common display pattern.
 * Useful when you need to display assigned people, source people, and projects together.
 *
 * @param entity - Object containing the ID arrays
 * @param registry - Optional EntityRegistry for looking up entities
 * @returns Object with resolved name arrays
 */
export function resolveEntityMetadata(
  entity: {
    assignedPeople?: PersonId[];
    sourcePeople?: PersonId[];
    mentionedPeople?: PersonId[];
    projects?: ProjectId[];
  },
  registry?: EntityRegistry,
): {
  assignedPeople: string[];
  sourcePeople: string[];
  mentionedPeople: string[];
  projects: string[];
} {
  return {
    assignedPeople: resolvePersonIds(entity.assignedPeople || [], registry),
    sourcePeople: resolvePersonIds(entity.sourcePeople || [], registry),
    mentionedPeople: resolvePersonIds(entity.mentionedPeople || [], registry),
    projects: resolveProjectIds(entity.projects || [], registry),
  };
}
