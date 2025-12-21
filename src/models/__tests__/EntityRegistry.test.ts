import { EntityRegistry, createEntityRegistry } from "../EntityRegistry";
import { SettingsModel, createSettingsModel } from "../SettingsModel";
import type { Todo } from "@/types/todo";
import type { Person } from "@/types/person";
import type { Project } from "@/types/project";
import type { Settings } from "@/types/settings";
import { getTodoId, getTag } from "@/types/todo";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import { getPriorityId } from "@/types/priority";
import { getTimestamp, getDurationSec } from "@/types/time";
import { defaultSettings } from "@/types/settings";

// Helper to create a minimal valid Todo
function createTestTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: getTodoId("todo-1"),
    text: "Test todo",
    plainText: "Test todo",
    state: "active",
    createdAt: getTimestamp(Date.now()),
    context: "",
    tags: [],
    dependencies: [],
    assignedPeople: [],
    sourcePeople: [],
    mentionedPeople: [],
    projects: [],
    comments: [],
    activity: [],
    subtasks: [],
    ...overrides,
  };
}

// Helper to create a minimal valid Person
function createTestPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: getPersonId("person-1"),
    name: "John Doe",
    alternatives: [],
    comments: [],
    activity: [],
    ...overrides,
  };
}

// Helper to create a minimal valid Project
function createTestProject(overrides: Partial<Project> = {}): Project {
  return {
    id: getProjectId("project-1"),
    name: "Test Project",
    alternatives: [],
    comments: [],
    activity: [],
    ...overrides,
  };
}

describe("EntityRegistry", () => {
  let settings: SettingsModel;

  beforeEach(() => {
    settings = createSettingsModel(defaultSettings);
  });

  describe("constructor", () => {
    it("should create registry with todos, people, and projects", () => {
      const todos = [createTestTodo()];
      const people = [createTestPerson()];
      const projects = [createTestProject()];

      const registry = createEntityRegistry(todos, people, projects, settings);

      expect(registry.todoCount).toBe(1);
      expect(registry.personCount).toBe(1);
      expect(registry.projectCount).toBe(1);
    });

    it("should handle empty arrays", () => {
      const registry = createEntityRegistry([], [], [], settings);

      expect(registry.todoCount).toBe(0);
      expect(registry.personCount).toBe(0);
      expect(registry.projectCount).toBe(0);
    });
  });

  describe("direct lookups", () => {
    it("should find todo by ID", () => {
      const todoId = getTodoId("todo-1");
      const todos = [createTestTodo({ id: todoId, plainText: "My todo" })];
      const registry = createEntityRegistry(todos, [], [], settings);

      const found = registry.getTodo(todoId);

      expect(found).not.toBeNull();
      expect(found?.plainText).toBe("My todo");
    });

    it("should return null for non-existent todo", () => {
      const registry = createEntityRegistry([], [], [], settings);

      const found = registry.getTodo(getTodoId("non-existent"));

      expect(found).toBeNull();
    });

    it("should find person by ID", () => {
      const personId = getPersonId("person-1");
      const people = [createTestPerson({ id: personId, name: "Alice" })];
      const registry = createEntityRegistry([], people, [], settings);

      const found = registry.getPerson(personId);

      expect(found).not.toBeNull();
      expect(found?.name).toBe("Alice");
    });

    it("should return null for non-existent person", () => {
      const registry = createEntityRegistry([], [], [], settings);

      const found = registry.getPerson(getPersonId("non-existent"));

      expect(found).toBeNull();
    });

    it("should find project by ID", () => {
      const projectId = getProjectId("project-1");
      const projects = [createTestProject({ id: projectId, name: "My Project" })];
      const registry = createEntityRegistry([], [], projects, settings);

      const found = registry.getProject(projectId);

      expect(found).not.toBeNull();
      expect(found?.name).toBe("My Project");
    });

    it("should return null for non-existent project", () => {
      const registry = createEntityRegistry([], [], [], settings);

      const found = registry.getProject(getProjectId("non-existent"));

      expect(found).toBeNull();
    });
  });

  describe("bulk lookups", () => {
    it("should get multiple people by IDs", () => {
      const person1 = createTestPerson({ id: getPersonId("p1"), name: "Alice" });
      const person2 = createTestPerson({ id: getPersonId("p2"), name: "Bob" });
      const person3 = createTestPerson({ id: getPersonId("p3"), name: "Charlie" });
      const registry = createEntityRegistry([], [person1, person2, person3], [], settings);

      const found = registry.getPeople([getPersonId("p1"), getPersonId("p3")]);

      expect(found).toHaveLength(2);
      expect(found.map((p) => p.name)).toEqual(["Alice", "Charlie"]);
    });

    it("should exclude non-existent IDs from bulk lookup", () => {
      const person1 = createTestPerson({ id: getPersonId("p1"), name: "Alice" });
      const registry = createEntityRegistry([], [person1], [], settings);

      const found = registry.getPeople([getPersonId("p1"), getPersonId("non-existent")]);

      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("Alice");
    });

    it("should get multiple projects by IDs", () => {
      const project1 = createTestProject({ id: getProjectId("proj1"), name: "Project A" });
      const project2 = createTestProject({ id: getProjectId("proj2"), name: "Project B" });
      const registry = createEntityRegistry([], [], [project1, project2], settings);

      const found = registry.getProjects([getProjectId("proj1"), getProjectId("proj2")]);

      expect(found).toHaveLength(2);
    });

    it("should get multiple todos by IDs", () => {
      const todo1 = createTestTodo({ id: getTodoId("t1"), plainText: "Todo 1" });
      const todo2 = createTestTodo({ id: getTodoId("t2"), plainText: "Todo 2" });
      const registry = createEntityRegistry([todo1, todo2], [], [], settings);

      const found = registry.getTodos([getTodoId("t1"), getTodoId("t2")]);

      expect(found).toHaveLength(2);
    });
  });

  describe("relationship queries", () => {
    it("should find todos assigned to a person", () => {
      const personId = getPersonId("p1");
      const todo1 = createTestTodo({
        id: getTodoId("t1"),
        plainText: "Assigned todo",
        assignedPeople: [personId],
      });
      const todo2 = createTestTodo({
        id: getTodoId("t2"),
        plainText: "Unassigned todo",
        assignedPeople: [],
      });
      const registry = createEntityRegistry([todo1, todo2], [], [], settings);

      const found = registry.getTodosAssignedTo(personId);

      expect(found).toHaveLength(1);
      expect(found[0].plainText).toBe("Assigned todo");
    });

    it("should find todos from a source person", () => {
      const personId = getPersonId("p1");
      const todo1 = createTestTodo({
        id: getTodoId("t1"),
        plainText: "From source",
        sourcePeople: [personId],
      });
      const todo2 = createTestTodo({
        id: getTodoId("t2"),
        plainText: "No source",
        sourcePeople: [],
      });
      const registry = createEntityRegistry([todo1, todo2], [], [], settings);

      const found = registry.getTodosFromSource(personId);

      expect(found).toHaveLength(1);
      expect(found[0].plainText).toBe("From source");
    });

    it("should find todos mentioning a person", () => {
      const personId = getPersonId("p1");
      const todo1 = createTestTodo({
        id: getTodoId("t1"),
        plainText: "Mentions person",
        mentionedPeople: [personId],
      });
      const registry = createEntityRegistry([todo1], [], [], settings);

      const found = registry.getTodosMentioning(personId);

      expect(found).toHaveLength(1);
    });

    it("should find todos for a project", () => {
      const projectId = getProjectId("proj1");
      const todo1 = createTestTodo({
        id: getTodoId("t1"),
        plainText: "Project todo",
        projects: [projectId],
      });
      const todo2 = createTestTodo({
        id: getTodoId("t2"),
        plainText: "No project",
        projects: [],
      });
      const registry = createEntityRegistry([todo1, todo2], [], [], settings);

      const found = registry.getTodosForProject(projectId);

      expect(found).toHaveLength(1);
      expect(found[0].plainText).toBe("Project todo");
    });

    it("should find todos with a specific priority", () => {
      const priorityId = getPriorityId("1");
      const todo1 = createTestTodo({
        id: getTodoId("t1"),
        plainText: "High priority",
        priority: priorityId,
      });
      const todo2 = createTestTodo({
        id: getTodoId("t2"),
        plainText: "No priority",
      });
      const registry = createEntityRegistry([todo1, todo2], [], [], settings);

      const found = registry.getTodosWithPriority(priorityId);

      expect(found).toHaveLength(1);
      expect(found[0].plainText).toBe("High priority");
    });

    it("should find dependent todos", () => {
      const blockerTodoId = getTodoId("blocker");
      const dependentTodo = createTestTodo({
        id: getTodoId("dependent"),
        plainText: "Depends on blocker",
        dependencies: [blockerTodoId],
      });
      const blockerTodo = createTestTodo({
        id: blockerTodoId,
        plainText: "Blocker",
      });
      const registry = createEntityRegistry([blockerTodo, dependentTodo], [], [], settings);

      const found = registry.getDependentTodos(blockerTodoId);

      expect(found).toHaveLength(1);
      expect(found[0].plainText).toBe("Depends on blocker");
    });
  });

  describe("all entities", () => {
    it("should return all todos", () => {
      const todos = [createTestTodo({ id: getTodoId("t1") }), createTestTodo({ id: getTodoId("t2") })];
      const registry = createEntityRegistry(todos, [], [], settings);

      expect(registry.allTodos).toHaveLength(2);
    });

    it("should return all people", () => {
      const people = [createTestPerson({ id: getPersonId("p1") }), createTestPerson({ id: getPersonId("p2") })];
      const registry = createEntityRegistry([], people, [], settings);

      expect(registry.allPeople).toHaveLength(2);
    });

    it("should return all projects", () => {
      const projects = [
        createTestProject({ id: getProjectId("proj1") }),
        createTestProject({ id: getProjectId("proj2") }),
      ];
      const registry = createEntityRegistry([], [], projects, settings);

      expect(registry.allProjects).toHaveLength(2);
    });
  });

  describe("settings access", () => {
    it("should provide access to settings model", () => {
      const registry = createEntityRegistry([], [], [], settings);

      expect(registry.settings).toBe(settings);
    });
  });

  describe("name-based lookups", () => {
    it("should find person by exact name (case-insensitive)", () => {
      const person = createTestPerson({
        id: getPersonId("p1"),
        name: "John Doe",
        alternatives: ["Johnny"],
      });
      const registry = createEntityRegistry([], [person], [], settings);

      // Exact match
      expect(registry.findPersonByName("John Doe")?.id).toBe(person.id);
      // Case-insensitive
      expect(registry.findPersonByName("john doe")?.id).toBe(person.id);
      expect(registry.findPersonByName("JOHN DOE")?.id).toBe(person.id);
    });

    it("should find person by alternative name", () => {
      const person = createTestPerson({
        id: getPersonId("p1"),
        name: "John Doe",
        alternatives: ["Johnny", "JD"],
      });
      const registry = createEntityRegistry([], [person], [], settings);

      expect(registry.findPersonByName("Johnny")?.id).toBe(person.id);
      expect(registry.findPersonByName("JD")?.id).toBe(person.id);
      expect(registry.findPersonByName("jd")?.id).toBe(person.id);
    });

    it("should return null for non-existent person", () => {
      const registry = createEntityRegistry([], [], [], settings);

      expect(registry.findPersonByName("Unknown Person")).toBeNull();
    });

    it("should find project by exact name (case-insensitive)", () => {
      const project = createTestProject({
        id: getProjectId("proj1"),
        name: "Website Redesign",
        alternatives: ["WR"],
      });
      const registry = createEntityRegistry([], [], [project], settings);

      // Exact match
      expect(registry.findProjectByName("Website Redesign")?.id).toBe(project.id);
      // Case-insensitive
      expect(registry.findProjectByName("website redesign")?.id).toBe(project.id);
      expect(registry.findProjectByName("WEBSITE REDESIGN")?.id).toBe(project.id);
    });

    it("should find project by alternative name", () => {
      const project = createTestProject({
        id: getProjectId("proj1"),
        name: "Website Redesign",
        alternatives: ["WR", "Web Redo"],
      });
      const registry = createEntityRegistry([], [], [project], settings);

      expect(registry.findProjectByName("WR")?.id).toBe(project.id);
      expect(registry.findProjectByName("Web Redo")?.id).toBe(project.id);
      expect(registry.findProjectByName("wr")?.id).toBe(project.id);
    });

    it("should return null for non-existent project", () => {
      const registry = createEntityRegistry([], [], [], settings);

      expect(registry.findProjectByName("Unknown Project")).toBeNull();
    });
  });
});
