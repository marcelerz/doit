import { TodoMetadata } from "@/types/todo";
import { TokenMatch } from "@/components/input/SmartInput";

/**
 * Parse tokens into TodoMetadata structure
 * Converts SmartInput tokens into the structured metadata format
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
