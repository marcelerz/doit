import { Color, getColor } from "./types";

// Unique branded type for TimeBlock IDs
export type TimeBlockId = string & { readonly __brand: unique symbol };

// Converts string id to TimeBlockID type
export function getTimeBlockId(id: string): TimeBlockId {
  return id as TimeBlockId;
}

export type TimeBlockType = "break" | "meeting" | "focus" | "lunch" | "commute" | "personal" | "custom";

export interface TimeBlockTypeConfig {
  id: TimeBlockId;
  name: string;
  color: Color;
  icon?: string; // emoji or icon identifier
}

export const defaultTimeBlock: TimeBlockTypeConfig[] = [
  { id: getTimeBlockId("break"), name: "Break", color: getColor("#d1d5db"), icon: "☕" }, // gray-300 (light gray)
  { id: getTimeBlockId("lunch"), name: "Lunch", color: getColor("#d1d5db"), icon: "🍴" }, // gray-300 (light gray)
  { id: getTimeBlockId("meeting"), name: "Meeting", color: getColor("#a78bfa"), icon: "👥" }, // violet-400
  { id: getTimeBlockId("focus"), name: "Focus Time", color: getColor("#4ade80"), icon: "🎯" }, // green-400
  { id: getTimeBlockId("commute"), name: "Commute", color: getColor("#60a5fa"), icon: "🚗" }, // blue-400
  { id: getTimeBlockId("personal"), name: "Personal", color: getColor("#f472b6"), icon: "🏠" }, // pink-400
];
