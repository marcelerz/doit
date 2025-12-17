import { Timestamp } from "./time";
import { TodoMetadata } from "./todo";

// Unique branded type for TodoTemplate IDs
export type TodoTemplateId = string & { readonly __brand: unique symbol };

// Converts string id to TodoTemplateId type
export function getTodoTemplateId(id: string): TodoTemplateId {
  return id as TodoTemplateId;
}

// Task templates for recurring patterns
export interface TodoTemplate {
  id: TodoTemplateId;
  name: string;
  description?: string;
  text: string;
  plainText: string;
  metadata: Partial<TodoMetadata>;
  subtasks?: string[]; // Subtask texts to create
  createdAt: Timestamp;
  usageCount: number;
}
