/**
 * Token Parser
 *
 * Converts SmartInput tokens into structured TodoMetadata format.
 * Handles all token types: assigned, source, mentioned, project, priority,
 * dueDate, duration, recurring, dependency, and tag.
 */

import { TodoMetadata } from "@/types/todo";
import { TokenMatch } from "@/components/input/SmartInput";

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
        metadata.dependencies.push(token.value);
        break;
      case "tag":
        metadata.tags.push(token.value);
        break;
    }
  });

  return metadata;
}
