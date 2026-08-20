import { Color } from "./types";

// Unique branded type for LinkPattern IDs
export type LinkPatternId = string & { readonly __brand: unique symbol };

// Converts string id to LinkPatternID type
export function getLinkPatternId(id: string): LinkPatternId {
  return id as LinkPatternId;
}

// Link pattern entity representing different link patterns
export interface LinkPattern {
  id: LinkPatternId;
  prefix: string; // e.g., "T", "D", "S"
  urlTemplate: string; // e.g., "http://www.google.com/{id}"
  description: string;
  color: Color; // Color for the link display
}

export const defaultLinkPatterns: LinkPattern[] = [];
