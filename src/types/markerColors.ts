import { Color, getColor } from "./types";

export interface MarkerColors extends Record<string, Color> {
  assigned: Color; // @
  source: Color; // $
  mentioned: Color; // (auto-detected)
  project: Color; // %
  priority: Color; // !!
  dueDate: Color; // (auto-detected)
  duration: Color; // (auto-detected)
  recurring: Color; // ~ (auto-detected)
  dependency: Color; // (via field)
  tag: Color; // #
  sprint: Color; // 🏃 (sprint selector)
}

export const defaultMarkerColors: MarkerColors = {
  assigned: getColor("#cce5ff"), // Blue
  source: getColor("#d4fdd4"), // Green
  mentioned: getColor("#ffe5b4"), // Yellow/Orange
  project: getColor("#e2ccff"), // Purple
  priority: getColor("#ffd4d4"), // Red
  dueDate: getColor("#fce4ec"), // Pink
  duration: getColor("#d4faff"), // Cyan
  recurring: getColor("#e1f5e1"), // Light green
  dependency: getColor("#fff4e6"), // Light orange
  tag: getColor("#ffe4cc"), // Light orange
  sprint: getColor("#dbeafe"), // Light blue
};
