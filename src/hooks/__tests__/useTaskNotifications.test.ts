/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useTaskNotifications } from "../useTaskNotifications";
import { TodoModel } from "@/models/TodoModel";
import { NotificationSettings } from "@/types/settings";
import { getDurationHour, getDurationMin } from "@/types/time";
import * as notifications from "@/utils/notifications";

// Mock the notifications utils
jest.mock("@/utils/notifications", () => ({
  checkAndNotifyDueTasks: jest.fn(() => new Set<string>()),
  getNotificationPermission: jest.fn(() => "granted"),
}));

// Suppress console output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe("useTaskNotifications", () => {
  // The notified-id set is now restored from storage before the first check,
  // so the initial pass lands a microtask after mount rather than during the
  // mount commit. Flush that before asserting.
  const flushHydration = async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  const mockCheckAndNotifyDueTasks = notifications.checkAndNotifyDueTasks as jest.Mock;
  const mockGetNotificationPermission = notifications.getNotificationPermission as jest.Mock;

  const defaultSettings: NotificationSettings = {
    enabled: true,
    notifyOverdue: true,
    notifyDueToday: true,
    notifyDueSoon: true,
    dueSoonHours: getDurationHour(24),
    checkInterval: getDurationMin(15),
  };

  const createMockTodo = (id: string, isActive: boolean = true): TodoModel => {
    return {
      id,
      isActive,
      isCompleted: !isActive,
      isArchived: false,
      isDeleted: false,
    } as TodoModel;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // The notified-id set is persisted now, so without this each test inherits
    // whatever the previous one wrote.
    localStorage.clear();
    mockGetNotificationPermission.mockReturnValue("granted");
    mockCheckAndNotifyDueTasks.mockReturnValue(new Set<string>());
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("initialization", () => {
    it("should not run if notifications are disabled", async () => {
      const disabledSettings = { ...defaultSettings, enabled: false };

      renderHook(() => useTaskNotifications([], disabledSettings));

      await flushHydration();

      expect(mockCheckAndNotifyDueTasks).not.toHaveBeenCalled();
    });

    it("should not run if permission is not granted", async () => {
      mockGetNotificationPermission.mockReturnValue("denied");

      renderHook(() => useTaskNotifications([], defaultSettings));

      await flushHydration();

      expect(mockCheckAndNotifyDueTasks).not.toHaveBeenCalled();
    });

    it("should run immediately when notifications are enabled and permission granted", async () => {
      const todos = [createMockTodo("1"), createMockTodo("2")];

      renderHook(() => useTaskNotifications(todos, defaultSettings));

      await flushHydration();

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(1);
    });

    it("should pass only active todos to checkAndNotifyDueTasks", async () => {
      const todos = [
        createMockTodo("1", true),
        createMockTodo("2", false), // not active
        createMockTodo("3", true),
      ];

      renderHook(() => useTaskNotifications(todos, defaultSettings));

      await flushHydration();

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: "1" }), expect.objectContaining({ id: "3" })]),
        expect.any(Set),
        expect.any(Object),
      );

      // Should not include inactive todo
      const activeTodosArg = mockCheckAndNotifyDueTasks.mock.calls[0][0];
      expect(activeTodosArg.length).toBe(2);
    });

    it("should pass notification settings to checkAndNotifyDueTasks", async () => {
      const todos = [createMockTodo("1")];

      renderHook(() => useTaskNotifications(todos, defaultSettings));

      await flushHydration();

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledWith(expect.any(Array), expect.any(Set), {
        notifyOverdue: true,
        notifyDueToday: true,
        notifyDueSoon: true,
        dueSoonHours: 24,
      });
    });
  });

  describe("periodic checks", () => {
    it("should check every minute", async () => {
      const todos = [createMockTodo("1")];

      renderHook(() => useTaskNotifications(todos, defaultSettings));

      await flushHydration();

      // Initial call
      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(1);

      // Advance 1 minute
      act(() => {
        jest.advanceTimersByTime(60 * 1000);
      });

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(2);

      // Advance another minute
      act(() => {
        jest.advanceTimersByTime(60 * 1000);
      });

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(3);
    });

    it("should clear interval on unmount", async () => {
      const todos = [createMockTodo("1")];

      const { unmount } = renderHook(() => useTaskNotifications(todos, defaultSettings));

      await flushHydration();

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(1);

      unmount();

      // Advance timer - should not trigger more calls
      act(() => {
        jest.advanceTimersByTime(60 * 1000);
      });

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(1);
    });
  });

  describe("notified IDs tracking", () => {
    it("should pass previously notified IDs to checkAndNotifyDueTasks", async () => {
      const todos = [createMockTodo("1")];
      const notifiedSet = new Set(["1"]);
      mockCheckAndNotifyDueTasks.mockReturnValue(notifiedSet);

      renderHook(() => useTaskNotifications(todos, defaultSettings));

      await flushHydration();

      // First call passes empty set
      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledWith(expect.any(Array), new Set(), expect.any(Object));

      // Advance timer for second call
      act(() => {
        jest.advanceTimersByTime(60 * 1000);
      });

      // Second call should pass the updated notified set
      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledWith(expect.any(Array), notifiedSet, expect.any(Object));
    });

    it("should update notified IDs from checkAndNotifyDueTasks return value", async () => {
      const todos = [createMockTodo("1"), createMockTodo("2")];

      // First call returns ids that were notified
      const firstNotified = new Set(["1"]);
      const secondNotified = new Set(["1", "2"]);

      mockCheckAndNotifyDueTasks.mockReturnValueOnce(firstNotified).mockReturnValueOnce(secondNotified);

      renderHook(() => useTaskNotifications(todos, defaultSettings));

      await flushHydration();

      // First call
      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledWith(
        expect.any(Array),
        new Set(), // empty initially
        expect.any(Object),
      );

      // Advance for second call
      act(() => {
        jest.advanceTimersByTime(60 * 1000);
      });

      // Second call should receive the updated set from first call
      expect(mockCheckAndNotifyDueTasks).toHaveBeenLastCalledWith(expect.any(Array), firstNotified, expect.any(Object));
    });
  });

  describe("reacting to todo changes", () => {
    it("should re-check when todos change", async () => {
      const initialTodos = [createMockTodo("1")];
      const { rerender } = renderHook(({ todos }) => useTaskNotifications(todos, defaultSettings), {
        initialProps: { todos: initialTodos },
      });
      await flushHydration();

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(1);

      // Change todos
      const newTodos = [createMockTodo("1"), createMockTodo("2")];
      rerender({ todos: newTodos });

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(2);
    });

    it("should re-check when settings change", async () => {
      const todos = [createMockTodo("1")];
      const { rerender } = renderHook(({ settings }) => useTaskNotifications(todos, settings), {
        initialProps: { settings: defaultSettings },
      });
      await flushHydration();

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(1);

      // Change settings
      const newSettings = { ...defaultSettings, dueSoonHours: getDurationHour(12) };
      rerender({ settings: newSettings });

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(2);
    });

    it("should clean up notified IDs when todos become inactive", async () => {
      const todos = [createMockTodo("1"), createMockTodo("2")];

      // Return that both todos were notified
      mockCheckAndNotifyDueTasks.mockReturnValue(new Set(["1", "2"]));

      const { rerender } = renderHook(({ todos: t }) => useTaskNotifications(t, defaultSettings), {
        initialProps: { todos },
      });

      await flushHydration();

      // Advance timer to trigger second check
      act(() => {
        jest.advanceTimersByTime(60 * 1000);
      });

      // Now make todo "2" inactive (completed)
      const updatedTodos = [createMockTodo("1"), createMockTodo("2", false)];

      rerender({ todos: updatedTodos });

      // Advance timer again
      act(() => {
        jest.advanceTimersByTime(60 * 1000);
      });

      // The notified set should only contain "1" now since "2" is no longer active
      const lastCall = mockCheckAndNotifyDueTasks.mock.calls[mockCheckAndNotifyDueTasks.mock.calls.length - 1];
      const passedNotifiedSet = lastCall[1] as Set<string>;

      expect(passedNotifiedSet.has("1")).toBe(true);
      expect(passedNotifiedSet.has("2")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle empty todos array", async () => {
      renderHook(() => useTaskNotifications([], defaultSettings));

      await flushHydration();

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledWith([], expect.any(Set), expect.any(Object));
    });

    it("should handle permission changing to default", async () => {
      mockGetNotificationPermission.mockReturnValue("default");

      renderHook(() => useTaskNotifications([createMockTodo("1")], defaultSettings));

      expect(mockCheckAndNotifyDueTasks).not.toHaveBeenCalled();
    });

    it("should stop checking when notifications are disabled after mount", async () => {
      const todos = [createMockTodo("1")];
      const { rerender } = renderHook(({ settings }) => useTaskNotifications(todos, settings), {
        initialProps: { settings: defaultSettings },
      });
      await flushHydration();

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(1);

      // Disable notifications
      const disabledSettings = { ...defaultSettings, enabled: false };
      rerender({ settings: disabledSettings });

      // Advance timer - should not call since notifications disabled
      act(() => {
        jest.advanceTimersByTime(60 * 1000);
      });

      // Call count should not increase after disabling
      // (There may be a call during rerender, but not from the timer)
      const callsAfterDisable = mockCheckAndNotifyDueTasks.mock.calls.length;

      act(() => {
        jest.advanceTimersByTime(60 * 1000);
      });

      expect(mockCheckAndNotifyDueTasks).toHaveBeenCalledTimes(callsAfterDisable);
    });
  });
});
