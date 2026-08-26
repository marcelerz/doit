/**
 * @jest-environment jsdom
 */

/**
 * Tests for the pick-lists ordered by how often each value has been chosen.
 *
 * These were seven memos in TodoApp with no coverage. The one that carries a
 * real decision is combinedPeopleUsage: a person's assigned, sourced and
 * mentioned counts add together, because they are three ways of referring to
 * the same person.
 */

import { renderHook } from "@testing-library/react";
import { useUsageSortedOptions } from "../useUsageSortedOptions";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { Person, getPersonId } from "@/types/person";
import { Project, getProjectId } from "@/types/project";
import { TodoModel } from "@/models/TodoModel";
import { Priority } from "@/types/priority";

const usageStats = {
  assignedPeople: new Map<string, number>(),
  sourcePeople: new Map<string, number>(),
  mentionedPeople: new Map<string, number>(),
  projects: new Map<string, number>(),
  priorities: new Map<string, number>(),
  tags: new Map<string, number>(),
};

jest.mock("@/hooks/useSelectionHistory", () => {
  const actual = jest.requireActual("@/hooks/useSelectionHistory");
  return {
    ...actual,
    useSelectionHistory: () => ({ usageStats, recordSelections: jest.fn() }),
  };
});

const person = (name: string, archived = false) =>
  new PersonModel({ id: getPersonId(name), name, alternatives: [], archived, comments: [], activity: [] } as unknown as Person);

const project = (name: string, archived = false) =>
  new ProjectModel({ id: getProjectId(name), name, alternatives: [], archived, comments: [], activity: [] } as unknown as Project);

const todoWithTags = (tags: string[]) => ({ tags }) as unknown as TodoModel;

const priority = (name: string): Priority => ({ name }) as Priority;

beforeEach(() => {
  Object.values(usageStats).forEach((map) => map.clear());
});

const mount = (
  people: PersonModel[] = [],
  projects: ProjectModel[] = [],
  priorities: Priority[] = [],
  todos: TodoModel[] = [],
) => renderHook(() => useUsageSortedOptions(people, projects, priorities, todos));

describe("people", () => {
  it("adds a person's three usage counts together before sorting", () => {
    usageStats.assignedPeople.set("Ada", 1);
    usageStats.mentionedPeople.set("Ada", 5);
    usageStats.assignedPeople.set("Marcel", 3);

    // Ada is 6 across three relationships, Marcel is 3 in one. Keeping the
    // three apart would rank Marcel first.
    const { result } = mount([person("Marcel"), person("Ada")]);

    expect(result.current.sortedPeople.map((p) => p.name)).toEqual(["Ada", "Marcel"]);
  });

  it("hides archived people from the picker but not from the tab", () => {
    const { result } = mount([person("Marcel"), person("Gone", true)]);

    expect(result.current.sortedPeople.map((p) => p.name)).toEqual(["Marcel"]);
    expect(result.current.allPeople.map((p) => p.name)).toContain("Gone");
  });
});

describe("projects", () => {
  it("orders by usage", () => {
    usageStats.projects.set("Website", 2);
    const { result } = mount([], [project("Other"), project("Website")]);

    expect(result.current.sortedProjects[0].name).toBe("Website");
  });

  it("hides archived projects from the picker but not from the tab", () => {
    const { result } = mount([], [project("Website"), project("Old", true)]);

    expect(result.current.sortedProjects.map((p) => p.name)).toEqual(["Website"]);
    expect(result.current.allProjects.map((p) => p.name)).toContain("Old");
  });
});

describe("tags", () => {
  it("collects every tag in use, once each", () => {
    const { result } = mount([], [], [], [todoWithTags(["work", "home"]), todoWithTags(["work"])]);

    expect(result.current.sortedTags.sort()).toEqual(["home", "work"]);
  });

  it("orders tags by usage", () => {
    usageStats.tags.set("home", 9);
    const { result } = mount([], [], [], [todoWithTags(["work", "home"])]);

    expect(result.current.sortedTags[0]).toBe("home");
  });

  it("is empty with no todos", () => {
    expect(mount().result.current.sortedTags).toEqual([]);
  });
});

describe("priorities", () => {
  it("orders by usage, keeping every one", () => {
    usageStats.priorities.set("low", 4);
    const { result } = mount([], [], [priority("high"), priority("low")]);

    expect(result.current.sortedPriorities.map((p) => p.name)).toEqual(["low", "high"]);
  });
});
