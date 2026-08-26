import { TodoModel } from "@/models/TodoModel";
import { TodoMetadata } from "@/types/todo";

/** Which parts of a todo the user ticked when saving it as a template. */
export interface TemplateFieldSelection {
  text: boolean;
  assignedPeople: boolean;
  sourcePeople: boolean;
  projects: boolean;
  priority: boolean;
  tags: boolean;
  dueDate: boolean;
  duration: boolean;
  subtasks: boolean;
}

export interface TemplateDraft {
  name: string;
  description?: string;
  text: string;
  plainText: string;
  metadata: Partial<TodoMetadata>;
  subtasks?: string[];
}

/**
 * Build a template from a todo and the fields the user chose to keep.
 *
 * Two fields are never copied regardless of what was ticked, and the reasons
 * differ. Mentioned people are auto-detected from the text, so copying them
 * would re-assert a detection that the new todo's own text may not support.
 * Dependencies point at specific todos, and a template applied later would
 * carry a dependency on a task that has since been completed or deleted.
 *
 * Everything is copied rather than referenced, so editing the todo afterwards
 * does not silently rewrite the template.
 */
export function buildTemplateFromTodo(
  todo: TodoModel,
  name: string,
  description: string | undefined,
  fields: TemplateFieldSelection,
): TemplateDraft {
  const metadata = todo.metadata;
  return {
    name,
    description,
    text: fields.text ? todo.text : "",
    plainText: fields.text ? todo.plainText : "",
    metadata: {
      assignedPeople: fields.assignedPeople ? [...metadata.assignedPeople] : [],
      sourcePeople: fields.sourcePeople ? [...metadata.sourcePeople] : [],
      mentionedPeople: [],
      projects: fields.projects ? [...metadata.projects] : [],
      dependencies: [],
      priority: fields.priority ? metadata.priority : undefined,
      tags: fields.tags ? [...(metadata.tags ?? [])] : [],
      dueDate: fields.dueDate ? metadata.dueDate : undefined,
      duration: fields.duration ? metadata.duration : undefined,
    },
    subtasks: fields.subtasks ? todo.subtasks?.map((s) => s.text) : undefined,
  };
}
