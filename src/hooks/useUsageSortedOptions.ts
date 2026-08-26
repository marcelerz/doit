"use client";

import { useMemo } from "react";
import { sortByUsage, sortStringsByUsage, useSelectionHistory } from "@/hooks/useSelectionHistory";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { TodoModel } from "@/models/TodoModel";
import { Priority } from "@/types/priority";

interface UsageSortedOptions {
  /** Unarchived people, most-used first -- for pickers. */
  sortedPeople: PersonModel[];
  /** Unarchived projects, most-used first. */
  sortedProjects: ProjectModel[];
  sortedPriorities: Priority[];
  /** Every tag in use, most-used first. */
  sortedTags: string[];
  /** Everyone, archived included, for the People tab. */
  allPeople: PersonModel[];
  /** Every project, archived included, for the Projects tab. */
  allProjects: ProjectModel[];
  recordSelections: ReturnType<typeof useSelectionHistory>["recordSelections"];
}

/**
 * The pick-lists, ordered by how often this user has chosen each value.
 *
 * A person's assigned, sourced and mentioned counts are added together before
 * sorting: they are three ways of referring to the same person, and keeping
 * them apart would put someone you mention constantly below someone you
 * assigned once.
 *
 * Pickers get the unarchived lists; the People and Projects tabs get everyone,
 * since archived entities still have to be findable there.
 */
export function useUsageSortedOptions(
  people: PersonModel[],
  projects: ProjectModel[],
  priorities: Priority[],
  todos: TodoModel[],
): UsageSortedOptions {
  const { usageStats, recordSelections } = useSelectionHistory();

  const combinedPeopleUsage = useMemo(() => {
    const combined = new Map<string, number>();
    [usageStats.assignedPeople, usageStats.sourcePeople, usageStats.mentionedPeople].forEach((stats) => {
      stats.forEach((count, name) => combined.set(name, (combined.get(name) || 0) + count));
    });
    return combined;
  }, [usageStats]);

  const sortedPeople = useMemo(
    () => sortByUsage(people.filter((p) => !p.archived), combinedPeopleUsage),
    [people, combinedPeopleUsage],
  );

  const sortedProjects = useMemo(
    () => sortByUsage(projects.filter((p) => !p.archived), usageStats.projects),
    [projects, usageStats.projects],
  );

  const sortedPriorities = useMemo(
    () => sortByUsage(priorities, usageStats.priorities),
    [priorities, usageStats.priorities],
  );

  const sortedTags = useMemo(() => {
    const allTags = new Set<string>();
    todos.forEach((todo) => todo.tags.forEach((tag) => allTags.add(tag)));
    return sortStringsByUsage(Array.from(allTags), usageStats.tags);
  }, [todos, usageStats.tags]);

  const allPeople = useMemo(() => sortByUsage(people, combinedPeopleUsage), [people, combinedPeopleUsage]);
  const allProjects = useMemo(() => sortByUsage(projects, usageStats.projects), [projects, usageStats.projects]);

  return { sortedPeople, sortedProjects, sortedPriorities, sortedTags, allPeople, allProjects, recordSelections };
}
