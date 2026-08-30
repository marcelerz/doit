/**
 * Token Parser
 *
 * Converts SmartInput tokens into structured TodoMetadata format.
 * Handles all token types: assigned, source, mentioned, project, priority,
 * dueDate, duration, recurring, dependency, and tag.
 */

import { TodoMetadata } from "@/types/todo";
import { TokenMatch } from "@/types/token";

/**
 * Parse tokens into TodoMetadata structure
 */
export function parseTokensToMetadata(tokens: TokenMatch[]): TodoMetadata {
  const metadata: TodoMetadata = {
    assignedPeople: [],
    sourcePeople: [],
    mentionedPeople: [],
    projects: [],
    dependencies: [],
    tags: [],
  };

  tokens.forEach((token) => {
    switch (token.type) {
      case "assigned":
        metadata.assignedPeople.push(token.value);
        break;
      case "source":
        metadata.sourcePeople.push(token.value);
        break;
      case "mentioned":
        metadata.mentionedPeople.push(token.value);
        break;
      case "project":
        metadata.projects.push(token.value);
        break;
      case "priority":
        metadata.priority = token.value;
        break;
      case "dueDate":
        metadata.dueDate = token.value;
        break;
      case "duration":
        metadata.duration = token.value;
        break;
      case "recurring":
        metadata.recurring = token.value;
        break;
      case "dependency":
        // Safe to use ! here since we initialized it above
        metadata.dependencies!.push(token.value);
        break;
      case "tag":
        // Safe to use ! here since we initialized it above
        metadata.tags!.push(token.value);
        break;
    }
  });

  return metadata;
}

/**
 * The text a todo should be titled with.
 *
 * Auto-detection strips what it consumes, so an input made entirely of
 * detectable tokens -- "Payday", "Someday", "tomorrow" -- leaves an empty
 * plainText. Falling back to the raw text keeps the user's words instead of
 * dropping the todo, while the detected metadata still applies.
 */
export function resolveTodoTitle(fullText: string, plainText: string): string {
  return plainText.trim() !== "" ? plainText.trim() : fullText.trim();
}
