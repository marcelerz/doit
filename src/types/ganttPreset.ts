import { DurationMin, getDurationMin } from "./time";

// Unique branded type for GanttPreset IDs
export type GanttPresetId = string & { readonly __brand: unique symbol };

// Converts string id to GanttPresetID type
export function getGanttPresetId(id: string): GanttPresetId {
  return id as GanttPresetId;
}

const _SCHEDULING_TECHNIQUES = ["sequential", "pomodoro", "flow"] as const;
export type SchedulingTechnique = (typeof _SCHEDULING_TECHNIQUES)[number];

export interface GanttPreset {
  id: GanttPresetId;
  name: string;
  technique: SchedulingTechnique;
  // Sequential settings
  contextSwitchingTime: DurationMin;
  defaultTaskDuration: DurationMin;
  durationMultiplier: number;
  // Pomodoro settings
  pomodoroWorkDuration?: DurationMin; // Work duration in minutes (default 25)
  pomodoroShortBreak?: DurationMin; // Short break in minutes (default 5)
  pomodoroLongBreak?: DurationMin; // Long break in minutes (default 15)
  pomodoroLongBreakInterval?: number; // Number of work sessions before long break (default 4)
  // Flow settings
  flowWorkDuration?: DurationMin; // Work duration in minutes (default 52)
  flowBreakDuration?: DurationMin; // Break duration in minutes (default 17)
  flowContextSwitchingTime?: DurationMin; // Context switch between tasks in minutes (default 10)
}

export const defaultGanttPresets: GanttPreset[] = [
  // Sequential presets
  {
    id: getGanttPresetId("sequential-focus"),
    name: "Focus Mode",
    technique: "sequential",
    contextSwitchingTime: getDurationMin(5),
    defaultTaskDuration: getDurationMin(25),
    durationMultiplier: 1.0,
  },
  {
    id: getGanttPresetId("sequential-planning"),
    name: "Planning Mode",
    technique: "sequential",
    contextSwitchingTime: getDurationMin(15),
    defaultTaskDuration: getDurationMin(45),
    durationMultiplier: 1.5,
  },
  {
    id: getGanttPresetId("sequential-realistic"),
    name: "Realistic Mode",
    technique: "sequential",
    contextSwitchingTime: getDurationMin(20),
    defaultTaskDuration: getDurationMin(60),
    durationMultiplier: 2.0,
  },
  // Pomodoro presets
  {
    id: getGanttPresetId("pomodoro-standard"),
    name: "Standard (25/5/15/4)",
    technique: "pomodoro",
    contextSwitchingTime: getDurationMin(0),
    defaultTaskDuration: getDurationMin(25),
    durationMultiplier: 1.0,
    pomodoroWorkDuration: getDurationMin(25),
    pomodoroShortBreak: getDurationMin(5),
    pomodoroLongBreak: getDurationMin(15),
    pomodoroLongBreakInterval: 4,
  },
  {
    id: getGanttPresetId("pomodoro-long"),
    name: "Long Sessions (50/10/30/4)",
    technique: "pomodoro",
    contextSwitchingTime: getDurationMin(0),
    defaultTaskDuration: getDurationMin(50),
    durationMultiplier: 1.0,
    pomodoroWorkDuration: getDurationMin(50),
    pomodoroShortBreak: getDurationMin(10),
    pomodoroLongBreak: getDurationMin(30),
    pomodoroLongBreakInterval: 4,
  },
  // Flow presets
  {
    id: getGanttPresetId("flow-5217"),
    name: "52/17 Method (52/17/10)",
    technique: "flow",
    contextSwitchingTime: getDurationMin(0),
    defaultTaskDuration: getDurationMin(52),
    durationMultiplier: 1.0,
    flowWorkDuration: getDurationMin(52),
    flowBreakDuration: getDurationMin(17),
    flowContextSwitchingTime: getDurationMin(10),
  },
  {
    id: getGanttPresetId("flow-ultradian"),
    name: "Ultradian Rhythm (90/20/10)",
    technique: "flow",
    contextSwitchingTime: getDurationMin(0),
    defaultTaskDuration: getDurationMin(90),
    durationMultiplier: 1.0,
    flowWorkDuration: getDurationMin(90),
    flowBreakDuration: getDurationMin(20),
    flowContextSwitchingTime: getDurationMin(10),
  },
];
