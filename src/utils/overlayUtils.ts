/**
 * Overlay Utility Functions
 *
 * Pure business logic extracted from TodoDetailsOverlay.tsx for better testability.
 */

import { TodoMetadata, TodoId } from "@/types/todo";

/**
 * Token match structure from smart input
 */
export interface TokenMatch {
  type:
    | "assigned"
    | "source"
    | "mentioned"
    | "project"
    | "priority"
    | "dueDate"
    | "duration"
    | "recurring"
    | "tag"
    | "dependency";
  value: string;
  match: string;
  index: number;
}

/**
 * Link extraction result
 */
export interface ExtractedLink {
  pattern: string;
  url: string;
  text: string;
}

/**
 * Build metadata from smart input tokens
 * This is an additive approach - arrays are taken from tokens, singular fields
 * use token value if present or preserve existing value.
 *
 * @param tokens - Array of token matches from smart input
 * @param existingMetadata - Current metadata to preserve non-token fields
 * @returns New metadata object
 */
export function buildMetadataFromTokens(
  tokens: TokenMatch[],
  existingMetadata: TodoMetadata
): TodoMetadata {
  return {
    // Arrays: use values directly from tokens
    assignedPeople: tokens.filter((t) => t.type === "assigned").map((t) => t.value),
    sourcePeople: tokens.filter((t) => t.type === "source").map((t) => t.value),
    mentionedPeople: tokens.filter((t) => t.type === "mentioned").map((t) => t.value),
    projects: tokens.filter((t) => t.type === "project").map((t) => t.value),
    dependencies: tokens.filter((t) => t.type === "dependency").map((t) => t.value),
    tags: tokens.filter((t) => t.type === "tag").map((t) => t.value),
    // Singular fields: use token value if found, otherwise preserve existing
    priority: tokens.find((t) => t.type === "priority")?.value || existingMetadata.priority,
    dueDate: tokens.find((t) => t.type === "dueDate")?.value || existingMetadata.dueDate,
    duration: tokens.find((t) => t.type === "duration")?.value || existingMetadata.duration,
    recurring: tokens.find((t) => t.type === "recurring")?.value || existingMetadata.recurring,
    // Preserve fields not in tokens
    sprint: existingMetadata.sprint,
    context: existingMetadata.context,
  };
}

/**
 * Merge metadata changes without modifying task text
 * Used when editing metadata through property fields rather than smart input.
 *
 * @param currentMetadata - Current metadata from todo
 * @param changes - Partial metadata changes to apply
 * @returns New merged metadata object
 */
export function mergeMetadataChanges(
  currentMetadata: TodoMetadata,
  changes: Partial<TodoMetadata>
): TodoMetadata {
  return {
    ...currentMetadata,
    ...changes,
    // Ensure arrays are properly cloned if changed
    assignedPeople: changes.assignedPeople
      ? [...changes.assignedPeople]
      : [...currentMetadata.assignedPeople],
    sourcePeople: changes.sourcePeople
      ? [...changes.sourcePeople]
      : [...currentMetadata.sourcePeople],
    mentionedPeople: changes.mentionedPeople
      ? [...changes.mentionedPeople]
      : [...currentMetadata.mentionedPeople],
    projects: changes.projects ? [...changes.projects] : [...currentMetadata.projects],
    dependencies: changes.dependencies
      ? [...changes.dependencies]
      : [...(currentMetadata.dependencies ?? [])],
    tags: changes.tags ? [...changes.tags] : [...(currentMetadata.tags ?? [])],
  };
}

/**
 * Normalize a date value from shorthand to ISO format
 * This is a wrapper that just passes through - actual implementation
 * should be in dateUtils.ts
 *
 * @param dueDate - Date value that might be shorthand
 * @returns Normalized date string or original value
 */
export function normalizeDueDate(dueDate: string | undefined): string | undefined {
  // Pass through - actual normalization happens in dateUtils.ts
  return dueDate;
}

/**
 * Link pattern for extraction
 */
export interface LinkPattern {
  name: string;
  pattern: string;
  url: string;
}

/**
 * Extract links from task text based on patterns
 * @param text - Task text to search
 * @param patterns - Array of link patterns
 * @returns Array of extracted links
 */
export function extractLinks(
  text: string,
  patterns: LinkPattern[]
): ExtractedLink[] {
  const links: ExtractedLink[] = [];

  patterns.forEach((pattern) => {
    try {
      const regex = new RegExp(pattern.pattern, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        // Build URL from pattern and match groups
        let url = pattern.url;

        // Replace $1, $2, etc. with matched groups
        match.forEach((group, index) => {
          if (index > 0 && group !== undefined) {
            url = url.replace(`$${index}`, group);
          }
        });

        links.push({
          pattern: pattern.name,
          url,
          text: match[0],
        });
      }
    } catch (_e) {
      // Invalid regex pattern - skip silently
    }
  });

  return links;
}

/**
 * Selection history data for recording
 */
export interface SelectionHistoryData {
  assignedPeople?: string[];
  sourcePeople?: string[];
  mentionedPeople?: string[];
  projects?: string[];
  priorities?: string;
  tags?: string[];
  dueDates?: string;
  durations?: string;
  recurring?: string;
  sprints?: string;
}

/**
 * Build selection history data from metadata
 * @param metadata - Todo metadata
 * @returns Selection history data for recording
 */
export function buildSelectionHistoryData(
  metadata: TodoMetadata
): SelectionHistoryData {
  return {
    assignedPeople: metadata.assignedPeople,
    sourcePeople: metadata.sourcePeople,
    mentionedPeople: metadata.mentionedPeople,
    projects: metadata.projects,
    priorities: metadata.priority,
    tags: metadata.tags,
    dueDates: metadata.dueDate,
    durations: metadata.duration,
    recurring: metadata.recurring,
    sprints: metadata.sprint,
  };
}

/**
 * Check if metadata has any value set
 * @param metadata - Todo metadata to check
 * @returns True if any metadata field has a value
 */
export function hasAnyMetadata(metadata: TodoMetadata): boolean {
  return (
    metadata.assignedPeople.length > 0 ||
    metadata.sourcePeople.length > 0 ||
    metadata.mentionedPeople.length > 0 ||
    metadata.projects.length > 0 ||
    (metadata.dependencies?.length ?? 0) > 0 ||
    (metadata.tags?.length ?? 0) > 0 ||
    metadata.priority !== undefined ||
    metadata.dueDate !== undefined ||
    metadata.duration !== undefined ||
    metadata.recurring !== undefined ||
    metadata.sprint !== undefined ||
    metadata.context !== undefined
  );
}

/**
 * Count the number of metadata fields with values
 * @param metadata - Todo metadata to count
 * @returns Number of fields with values
 */
export function countMetadataFields(metadata: TodoMetadata): number {
  let count = 0;

  if (metadata.assignedPeople.length > 0) count++;
  if (metadata.sourcePeople.length > 0) count++;
  if (metadata.mentionedPeople.length > 0) count++;
  if (metadata.projects.length > 0) count++;
  if ((metadata.dependencies?.length ?? 0) > 0) count++;
  if ((metadata.tags?.length ?? 0) > 0) count++;
  if (metadata.priority !== undefined) count++;
  if (metadata.dueDate !== undefined) count++;
  if (metadata.duration !== undefined) count++;
  if (metadata.recurring !== undefined) count++;
  if (metadata.sprint !== undefined) count++;
  if (metadata.context !== undefined) count++;

  return count;
}

/**
 * Add a person to the assigned list if not already present
 * @param metadata - Current metadata
 * @param person - Person to add
 * @returns Updated metadata
 */
export function addAssignedPerson(
  metadata: TodoMetadata,
  person: string
): TodoMetadata {
  if (metadata.assignedPeople.includes(person)) {
    return metadata;
  }
  return {
    ...metadata,
    assignedPeople: [...metadata.assignedPeople, person],
  };
}

/**
 * Remove a person from the assigned list
 * @param metadata - Current metadata
 * @param person - Person to remove
 * @returns Updated metadata
 */
export function removeAssignedPerson(
  metadata: TodoMetadata,
  person: string
): TodoMetadata {
  return {
    ...metadata,
    assignedPeople: metadata.assignedPeople.filter((p) => p !== person),
  };
}

/**
 * Add a project if not already present
 * @param metadata - Current metadata
 * @param project - Project to add
 * @returns Updated metadata
 */
export function addProject(metadata: TodoMetadata, project: string): TodoMetadata {
  if (metadata.projects.includes(project)) {
    return metadata;
  }
  return {
    ...metadata,
    projects: [...metadata.projects, project],
  };
}

/**
 * Remove a project
 * @param metadata - Current metadata
 * @param project - Project to remove
 * @returns Updated metadata
 */
export function removeProject(
  metadata: TodoMetadata,
  project: string
): TodoMetadata {
  return {
    ...metadata,
    projects: metadata.projects.filter((p) => p !== project),
  };
}

/**
 * Add a tag if not already present
 * @param metadata - Current metadata
 * @param tag - Tag to add
 * @returns Updated metadata
 */
export function addTag(metadata: TodoMetadata, tag: string): TodoMetadata {
  const currentTags = metadata.tags ?? [];
  if (currentTags.includes(tag)) {
    return metadata;
  }
  return {
    ...metadata,
    tags: [...currentTags, tag],
  };
}

/**
 * Remove a tag
 * @param metadata - Current metadata
 * @param tag - Tag to remove
 * @returns Updated metadata
 */
export function removeTag(metadata: TodoMetadata, tag: string): TodoMetadata {
  return {
    ...metadata,
    tags: (metadata.tags ?? []).filter((t) => t !== tag),
  };
}

/**
 * Add a dependency if not already present
 * @param metadata - Current metadata
 * @param dependencyId - Dependency todo ID to add
 * @returns Updated metadata
 */
export function addDependency(
  metadata: TodoMetadata,
  dependencyId: TodoId
): TodoMetadata {
  const currentDeps = metadata.dependencies ?? [];
  if (currentDeps.includes(dependencyId)) {
    return metadata;
  }
  return {
    ...metadata,
    dependencies: [...currentDeps, dependencyId],
  };
}

/**
 * Remove a dependency
 * @param metadata - Current metadata
 * @param dependencyId - Dependency todo ID to remove
 * @returns Updated metadata
 */
export function removeDependency(
  metadata: TodoMetadata,
  dependencyId: TodoId
): TodoMetadata {
  return {
    ...metadata,
    dependencies: (metadata.dependencies ?? []).filter((d) => d !== dependencyId),
  };
}
