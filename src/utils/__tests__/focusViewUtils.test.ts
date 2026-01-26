/**
 * Tests for Focus View Utility Functions
 */

import {
  formatTime,
  formatClockTime,
  filterActiveScheduledTasks,
  buildFlatSchedule,
  getCurrentItem,
  calculateCurrentTaskNumber,
  calculateProgress,
  createInitialFocusState,
  determineNextState,
  getTechniqueInfo,
  calculateBreakEndTime,
  countTotalTasks,
  shouldAutoComplete,
  ScheduleItem,
  FocusState,
} from "@/utils/focusViewUtils";
import { createTestTodo, resetSettingsModel_DONOTUSE } from "./testHelpers";
import { TodoModel } from "@/models/TodoModel";
import { ScheduledTask } from "@/utils/ganttScheduler";
import { getTodoId } from "@/types/todo";

// Helper to create a scheduled task
function createScheduledTask(
  todo: TodoModel,
  options: Partial<ScheduledTask> = {}
): ScheduledTask {
  return {
    todo,
    startTime: new Date(),
    endTime: new Date(Date.now() + 30 * 60 * 1000),
    durationMinutes: 30,
    segments: [{ durationMinutes: 30, startTime: new Date(), endTime: new Date() }],
    ...options,
  } as ScheduledTask;
}

describe("focusViewUtils", () => {
  beforeEach(() => {
    resetSettingsModel_DONOTUSE();
  });

  describe("formatTime", () => {
    it("should format seconds to MM:SS", () => {
      expect(formatTime(65)).toBe("1:05");
      expect(formatTime(120)).toBe("2:00");
      expect(formatTime(0)).toBe("0:00");
    });

    it("should format to HH:MM:SS for times over an hour", () => {
      expect(formatTime(3661)).toBe("1:01:01");
      expect(formatTime(7200)).toBe("2:00:00");
    });

    it("should handle negative times", () => {
      expect(formatTime(-65)).toBe("-1:05");
      expect(formatTime(-3661)).toBe("-1:01:01");
    });

    it("should pad seconds and minutes", () => {
      expect(formatTime(5)).toBe("0:05");
      expect(formatTime(65)).toBe("1:05");
    });
  });

  describe("formatClockTime", () => {
    it("should format date to clock time", () => {
      const date = new Date(2024, 5, 15, 14, 30);
      const result = formatClockTime(date);

      expect(result).toMatch(/2:30/);
    });
  });

  describe("filterActiveScheduledTasks", () => {
    it("should filter out completed tasks", () => {
      const activeTodo = createTestTodo({ id: "1", state: "active" });
      const completedTodo = createTestTodo({ id: "2", state: "completed" });
      const tasks = [
        createScheduledTask(activeTodo),
        createScheduledTask(completedTodo),
      ];

      const result = filterActiveScheduledTasks(tasks);

      expect(result).toHaveLength(1);
      expect(result[0].todo.id).toBe(getTodoId("1"));
    });

    it("should filter out archived tasks", () => {
      const activeTodo = createTestTodo({ id: "1", state: "active" });
      const archivedTodo = createTestTodo({ id: "2", state: "archived" });
      const tasks = [
        createScheduledTask(activeTodo),
        createScheduledTask(archivedTodo),
      ];

      const result = filterActiveScheduledTasks(tasks);

      expect(result).toHaveLength(1);
    });

    it("should filter out actual time entries", () => {
      const todo = createTestTodo({ id: "1", state: "active" });
      const tasks = [
        createScheduledTask(todo),
        createScheduledTask(todo, { isActualTime: true }),
      ];

      const result = filterActiveScheduledTasks(tasks);

      expect(result).toHaveLength(1);
      expect(result[0].isActualTime).toBeFalsy();
    });
  });

  describe("buildFlatSchedule", () => {
    it("should create schedule items for task segments", () => {
      const todo = createTestTodo({ id: "1" });
      const task = createScheduledTask(todo, {
        segments: [{ durationMinutes: 25, startTime: new Date(), endTime: new Date() }],
      });

      const schedule = buildFlatSchedule([task]);

      expect(schedule).toHaveLength(1);
      expect(schedule[0].type).toBe("task");
      expect(schedule[0].durationSeconds).toBe(25 * 60);
    });

    it("should insert breaks between segments", () => {
      const todo = createTestTodo({ id: "1" });
      const task = createScheduledTask(todo, {
        segments: [
          { durationMinutes: 25, startTime: new Date(), endTime: new Date(), nextBreak: { durationMinutes: 5, label: "Short break" } },
          { durationMinutes: 25, startTime: new Date(), endTime: new Date() },
        ],
      });

      const schedule = buildFlatSchedule([task]);

      expect(schedule).toHaveLength(3); // segment, break, segment
      expect(schedule[0].type).toBe("task");
      expect(schedule[1].type).toBe("break");
      expect(schedule[2].type).toBe("task");
    });

    it("should mark last segment of task", () => {
      const todo = createTestTodo({ id: "1" });
      const task = createScheduledTask(todo, {
        segments: [
          { durationMinutes: 25, startTime: new Date(), endTime: new Date() },
          { durationMinutes: 25, startTime: new Date(), endTime: new Date() },
        ],
      });

      const schedule = buildFlatSchedule([task]);

      expect(schedule[0].isLastSegment).toBe(false);
      expect(schedule[1].isLastSegment).toBe(true);
    });

    it("should not add break after last segment of last task", () => {
      const todo = createTestTodo({ id: "1" });
      const task = createScheduledTask(todo, {
        segments: [{ durationMinutes: 25, startTime: new Date(), endTime: new Date() }],
        nextBreak: { durationMinutes: 5, label: "Break" },
      });

      const schedule = buildFlatSchedule([task]);

      expect(schedule).toHaveLength(1); // Just the segment, no break
    });

    it("should add break between tasks", () => {
      const todo1 = createTestTodo({ id: "1" });
      const todo2 = createTestTodo({ id: "2" });
      const tasks = [
        createScheduledTask(todo1, {
          segments: [{ durationMinutes: 25, startTime: new Date(), endTime: new Date() }],
          nextBreak: { durationMinutes: 5, label: "Break" },
        }),
        createScheduledTask(todo2, {
          segments: [{ durationMinutes: 25, startTime: new Date(), endTime: new Date() }],
        }),
      ];

      const schedule = buildFlatSchedule(tasks);

      expect(schedule).toHaveLength(3); // task1, break, task2
      expect(schedule[1].type).toBe("break");
    });
  });

  describe("getCurrentItem", () => {
    const schedule: ScheduleItem[] = [
      { type: "task", durationSeconds: 1500 },
      { type: "break", durationSeconds: 300 },
      { type: "task", durationSeconds: 1500 },
    ];

    it("should return item at index", () => {
      expect(getCurrentItem(schedule, 0)?.type).toBe("task");
      expect(getCurrentItem(schedule, 1)?.type).toBe("break");
    });

    it("should return null for out of bounds index", () => {
      expect(getCurrentItem(schedule, 10)).toBeNull();
      expect(getCurrentItem(schedule, -1)).toBeNull();
    });
  });

  describe("calculateCurrentTaskNumber", () => {
    it("should count unique tasks", () => {
      const todo1 = createTestTodo({ id: "1" });
      const todo2 = createTestTodo({ id: "2" });
      const task1 = createScheduledTask(todo1);
      const task2 = createScheduledTask(todo2);

      const schedule: ScheduleItem[] = [
        { type: "task", task: task1, durationSeconds: 1500 },
        { type: "break", durationSeconds: 300 },
        { type: "task", task: task2, durationSeconds: 1500 },
      ];

      expect(calculateCurrentTaskNumber(schedule, 0)).toBe(1);
      expect(calculateCurrentTaskNumber(schedule, 2)).toBe(2);
    });

    it("should handle being on a break", () => {
      const todo = createTestTodo({ id: "1" });
      const task = createScheduledTask(todo);

      const schedule: ScheduleItem[] = [
        { type: "task", task, durationSeconds: 1500 },
        { type: "break", durationSeconds: 300 },
      ];

      // On break after first task
      expect(calculateCurrentTaskNumber(schedule, 1)).toBe(1);
    });

    it("should return 0 for empty schedule", () => {
      expect(calculateCurrentTaskNumber([], 0)).toBe(0);
    });
  });

  describe("calculateProgress", () => {
    it("should calculate progress percentage", () => {
      const item: ScheduleItem = { type: "task", durationSeconds: 1500 };

      expect(calculateProgress(item, 1500)).toBe(0); // Just started
      expect(calculateProgress(item, 750)).toBe(50); // Halfway
      expect(calculateProgress(item, 0)).toBe(100); // Complete
    });

    it("should return 0 for null item", () => {
      expect(calculateProgress(null, 0)).toBe(0);
    });
  });

  describe("createInitialFocusState", () => {
    it("should create state for task as first item", () => {
      const schedule: ScheduleItem[] = [
        { type: "task", durationSeconds: 1500 },
      ];

      const state = createInitialFocusState(schedule);

      expect(state.phase).toBe("work");
      expect(state.currentItemIndex).toBe(0);
      expect(state.timeRemaining).toBe(1500);
      expect(state.isRunning).toBe(false);
    });

    it("should create state for break as first item", () => {
      const schedule: ScheduleItem[] = [
        { type: "break", durationSeconds: 300 },
      ];

      const state = createInitialFocusState(schedule);

      expect(state.phase).toBe("break");
    });

    it("should handle empty schedule", () => {
      const state = createInitialFocusState([]);

      expect(state.timeRemaining).toBe(0);
    });
  });

  describe("determineNextState", () => {
    it("should indicate completion when no more items", () => {
      const schedule: ScheduleItem[] = [
        { type: "task", durationSeconds: 1500 },
      ];
      const state: FocusState = {
        phase: "work",
        currentItemIndex: 0,
        timeRemaining: 0,
        isRunning: true,
        totalWorkTime: 1500,
        totalBreakTime: 0,
        tasksCompleted: 0,
        breakEndTime: null,
        pendingPhase: null,
        confirmationRepeats: 0,
        taskStartTime: null,
        actualTimeSpent: 0,
      };

      const next = determineNextState(state, schedule);

      expect(next.isComplete).toBe(true);
    });

    it("should provide next state info", () => {
      const schedule: ScheduleItem[] = [
        { type: "task", durationSeconds: 1500 },
        { type: "break", durationSeconds: 300 },
      ];
      const state: FocusState = {
        phase: "work",
        currentItemIndex: 0,
        timeRemaining: 0,
        isRunning: true,
        totalWorkTime: 1500,
        totalBreakTime: 0,
        tasksCompleted: 0,
        breakEndTime: null,
        pendingPhase: null,
        confirmationRepeats: 0,
        taskStartTime: null,
        actualTimeSpent: 0,
      };

      const next = determineNextState(state, schedule);

      expect(next.isComplete).toBe(false);
      expect(next.nextIndex).toBe(1);
      expect(next.nextPhase).toBe("break");
      expect(next.nextDuration).toBe(300);
    });
  });

  describe("getTechniqueInfo", () => {
    it("should return pomodoro info", () => {
      const info = getTechniqueInfo("pomodoro");
      expect(info.icon).toBe("🍅");
      expect(info.name).toBe("Pomodoro");
    });

    it("should return flow info", () => {
      const info = getTechniqueInfo("flow");
      expect(info.icon).toBe("🌊");
      expect(info.name).toBe("Flow");
    });

    it("should return sequential info as default", () => {
      const info = getTechniqueInfo("sequential");
      expect(info.icon).toBe("📋");
      expect(info.name).toBe("Sequential");
    });
  });

  describe("calculateBreakEndTime", () => {
    it("should calculate break end time", () => {
      const now = new Date(2024, 5, 15, 12, 0, 0);
      const endTime = calculateBreakEndTime(300, now); // 5 minutes

      expect(endTime.getMinutes()).toBe(5);
    });
  });

  describe("countTotalTasks", () => {
    it("should count tasks", () => {
      const tasks = [
        createScheduledTask(createTestTodo({ id: "1" })),
        createScheduledTask(createTestTodo({ id: "2" })),
        createScheduledTask(createTestTodo({ id: "3" })),
      ];

      expect(countTotalTasks(tasks)).toBe(3);
    });
  });

  describe("shouldAutoComplete", () => {
    it("should return null for break items", () => {
      const item: ScheduleItem = { type: "break", durationSeconds: 300 };
      expect(shouldAutoComplete(item)).toBeNull();
    });

    it("should return null for non-last segments", () => {
      const todo = createTestTodo({ id: "1" });
      const task = createScheduledTask(todo);
      const item: ScheduleItem = {
        type: "task",
        task,
        isLastSegment: false,
        durationSeconds: 1500,
      };

      expect(shouldAutoComplete(item)).toBeNull();
    });

    it("should return todo ID for last segment", () => {
      const todo = createTestTodo({ id: "1" });
      const task = createScheduledTask(todo);
      const item: ScheduleItem = {
        type: "task",
        task,
        isLastSegment: true,
        durationSeconds: 1500,
      };

      expect(shouldAutoComplete(item)).toBe(getTodoId("1"));
    });

    it("should return null for null item", () => {
      expect(shouldAutoComplete(null)).toBeNull();
    });
  });
});
