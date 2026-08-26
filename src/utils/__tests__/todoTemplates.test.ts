import { buildTemplateFromTodo, TemplateFieldSelection } from "../todoTemplates";
import { TodoModel } from "@/models/TodoModel";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import { getTag } from "@/types/todo";

const allFields: TemplateFieldSelection = {
  text: true,
  assignedPeople: true,
  sourcePeople: true,
  projects: true,
  priority: true,
  tags: true,
  dueDate: true,
  duration: true,
  subtasks: true,
};

const noFields: TemplateFieldSelection = {
  text: false,
  assignedPeople: false,
  sourcePeople: false,
  projects: false,
  priority: false,
  tags: false,
  dueDate: false,
  duration: false,
  subtasks: false,
};

/** A stand-in exposing only the getters the builder reads. */
const todo = () =>
  ({
    text: "Call <b>dentist</b>",
    plainText: "Call dentist",
    metadata: {
      assignedPeople: [getPersonId("Marcel")],
      sourcePeople: [getPersonId("Ada")],
      mentionedPeople: [getPersonId("Grace")],
      projects: [getProjectId("Health")],
      dependencies: ["todo-1"],
      priority: "high",
      tags: [getTag("errand")],
      dueDate: "tomorrow",
      duration: "30m",
    },
    subtasks: [{ text: "find number" }, { text: "book slot" }],
  }) as unknown as TodoModel;

describe("buildTemplateFromTodo", () => {
  it("copies everything that was ticked", () => {
    const draft = buildTemplateFromTodo(todo(), "Dentist", "yearly", allFields);

    expect(draft).toMatchObject({
      name: "Dentist",
      description: "yearly",
      text: "Call <b>dentist</b>",
      plainText: "Call dentist",
      subtasks: ["find number", "book slot"],
    });
    expect(draft.metadata).toMatchObject({
      assignedPeople: [getPersonId("Marcel")],
      sourcePeople: [getPersonId("Ada")],
      projects: [getProjectId("Health")],
      priority: "high",
      tags: [getTag("errand")],
      dueDate: "tomorrow",
      duration: "30m",
    });
  });

  it("leaves out everything that was not ticked", () => {
    const draft = buildTemplateFromTodo(todo(), "Blank", undefined, noFields);

    expect(draft.text).toBe("");
    expect(draft.plainText).toBe("");
    expect(draft.subtasks).toBeUndefined();
    expect(draft.metadata).toMatchObject({
      assignedPeople: [],
      sourcePeople: [],
      projects: [],
      tags: [],
      priority: undefined,
      dueDate: undefined,
      duration: undefined,
    });
  });

  it("never copies mentioned people, even with everything ticked", () => {
    // They are auto-detected from the text. Copying them would re-assert a
    // detection the new todo's own text may not support.
    expect(buildTemplateFromTodo(todo(), "x", undefined, allFields).metadata.mentionedPeople).toEqual([]);
  });

  it("never copies dependencies, even with everything ticked", () => {
    // A dependency points at one specific todo, which may be long gone by the
    // time the template is applied.
    expect(buildTemplateFromTodo(todo(), "x", undefined, allFields).metadata.dependencies).toEqual([]);
  });

  it("copies the arrays rather than referencing them", () => {
    const source = todo();
    const draft = buildTemplateFromTodo(source, "x", undefined, allFields);

    draft.metadata.assignedPeople!.push(getPersonId("Someone"));
    draft.metadata.tags!.push(getTag("added"));

    expect(source.metadata.assignedPeople).toHaveLength(1);
    expect(source.metadata.tags).toHaveLength(1);
  });

  it("tolerates a todo with no subtasks and no tags", () => {
    const bare = { text: "t", plainText: "t", metadata: { assignedPeople: [], sourcePeople: [], projects: [] } } as unknown as TodoModel;

    const draft = buildTemplateFromTodo(bare, "x", undefined, allFields);
    expect(draft.metadata.tags).toEqual([]);
    expect(draft.subtasks).toBeUndefined();
  });
});
