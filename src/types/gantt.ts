import { defaultGanttPresets, GanttPreset, GanttPresetId, SchedulingTechnique } from "./ganttPreset";
import { DurationMin, getDurationMin } from "./time";

// Gantt Tab Settings
export type GanttZoomLevel = "15min" | "30min" | "1hour" | "2hour";

export interface Gantt {
  // Active Technique
  schedulingTechnique: SchedulingTechnique; // Which technique is active

  // Common Settings
  defaultTaskDuration: DurationMin; // Default duration in minutes when not specified
  durationMultiplier: number; // Multiplier for task durations during scheduling
  minimumRemainingDuration: DurationMin; // Minimum duration left when time is tracked (default 1 min)

  // Sequential Settings
  contextSwitchingTime: DurationMin; // Minutes between tasks for context switching

  // Pomodoro Settings
  pomodoroWorkDuration: DurationMin; // Work duration in minutes (default 25)
  pomodoroShortBreak: DurationMin; // Short break in minutes (default 5)
  pomodoroLongBreak: DurationMin; // Long break in minutes (default 15)
  pomodoroLongBreakInterval: number; // Number of work sessions before long break (default 4)

  // Flow Settings
  flowWorkDuration: DurationMin; // Work duration in minutes (default 52)
  flowBreakDuration: DurationMin; // Break duration in minutes (default 17)
  flowContextSwitchingTime: DurationMin; // Context switch between tasks in minutes (default 10)

  // View Settings
  zoomLevel: GanttZoomLevel; // Timeline zoom level
  showWeekends: boolean; // Show weekend days in week view
  showDependencies: boolean; // Show dependency arrows between tasks
  taskRowHeight: "compact" | "normal" | "comfortable"; // Height of task rows
  showBufferZones: boolean; // Show buffer/overdue indicators
  showNowLine: boolean; // Show current time indicator
  collapseCompleted: boolean; // Collapse completed tasks section

  // Presets
  presets: GanttPreset[];
  activePresetId?: GanttPresetId; // Currently active preset
}

export const defaultGantt: Gantt = {
  schedulingTechnique: "sequential", // Sequential by default
  contextSwitchingTime: getDurationMin(15), // 15 minutes between tasks
  defaultTaskDuration: getDurationMin(30), // 30 minutes default
  durationMultiplier: 1.0, // 1.0 = no adjustment
  minimumRemainingDuration: getDurationMin(1), // 1 minute minimum to keep tasks visible
  // Pomodoro defaults
  pomodoroWorkDuration: getDurationMin(25), // Standard Pomodoro work duration
  pomodoroShortBreak: getDurationMin(5), // Standard short break
  pomodoroLongBreak: getDurationMin(15), // Standard long break
  pomodoroLongBreakInterval: 4, // Long break every 4 sessions
  // Flow defaults (52/17 method)
  flowWorkDuration: getDurationMin(52),
  flowBreakDuration: getDurationMin(17),
  flowContextSwitchingTime: getDurationMin(10),
  // View settings
  zoomLevel: "1hour",
  showWeekends: true,
  showDependencies: true,
  taskRowHeight: "normal",
  showBufferZones: true,
  showNowLine: true,
  collapseCompleted: false,
  presets: defaultGanttPresets,
  activePresetId: undefined,
};
