/**
 * @jest-environment jsdom
 */

/**
 * Characterization tests for useListViewState.
 *
 * This hook had no test coverage at all despite being 900 lines that drive
 * filtering, sorting and grouping for the main view. These tests pin the
 * behaviour that exists today so it can be refactored against - they describe
 * what the hook does, not what any particular implementation looks like.
 */

import { renderHook, act } from "@testing-library/react";
import { useListViewState } from "../useListViewState";
import { TodoModel } from "@/models/TodoModel";
import { ProjectModel } from "@/models/ProjectModel";
import { SettingsModel, createSettingsModel, resetSettingsModel_DONOTUSE } from "@/models/SettingsModel";
import { defaultSettings, Settings } from "@/types/settings";
import { Todo, getTodoId, getTag } from "@/types/todo";
import { getPersonId } from "@/types/person";
import { getTimestamp } from "@/types/time";

if (typeof structuredClone === "undefined") {
  (global as unknown as Record<string, unknown>).structuredClone = <T>(obj: T): T =>
    JSON.parse(JSON.stringify(obj));
}

// Auto-assign is ON by default and defaults dueDate to "today", so a todo with
// no explicit due date still reports one. Fixtures turn it off so "no due
// date" means what it says; the default behaviour is pinned separately below.
const noAutoAssign: Settings = {
  ...defaultSettings,
  autoAssign: { ...defaultSettings.autoAssign, enabled: false },
};

const settings: Settings = noAutoAssign;

let settingsModel: SettingsModel;
beforeEach(() => {
  resetSettingsModel_DONOTUSE();
  settingsModel = createSettingsModel(noAutoAssign);
  localStorage.clear();
});

const daysFromNow = (days: number): number => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.getTime();
};

const makeTodo = (overrides: { id: string } & Partial<Omit<Todo, "id">>): TodoModel => {
  const { id, ...rest } = overrides;
  const raw = {
    text: overrides.text ?? overrides.id,
    plainText: overrides.plainText ?? overrides.text ?? overrides.id,
    state: "active",
    createdAt: getTimestamp(daysFromNow(-30)),
    assignedPeople: [],
    sourcePeople: [],
    mentionedPeople: [],
    projects: [],
    tags: [],
    comments: [],
    activity: [],
    subtasks: [],
    ...rest,
    id: getTodoId(id),
  } as unknown as Todo;
  return new TodoModel(raw, settingsModel);
};

const mount = (todos: TodoModel[], projects: ProjectModel[] = []) =>
  renderHook(() => useListViewState({ todos, projects, settings }));

describe("initial state", () => {
  it("starts unfiltered, sorted by priority ascending, grouped by due date", () => {
    const { result } = mount([]);

    expect(result.current.sortField).toBe("priority");
    expect(result.current.sortDirection).toBe("asc");
    expect(result.current.groupBy).toBe("dueDate");
    expect(result.current.activeQuickFilter).toBe("all");
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("reports no active filters until one is set", () => {
    const { result } = mount([]);
    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.setFilters({ ...result.current.filters, searchText: "anything" });
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });
});

describe("applyFilters", () => {
  const alpha = () => makeTodo({ id: "a", text: "Alpha report" });
  const beta = () => makeTodo({ id: "b", text: "Beta launch" });

  it("returns everything when nothing is filtered", () => {
    const todos = [alpha(), beta()];
    const { result } = mount(todos);

    expect(result.current.applyFilters(todos)).toHaveLength(2);
  });

  it("filters by search text", () => {
    const todos = [alpha(), beta()];
    const { result } = mount(todos);

    act(() => {
      result.current.setFilters({ ...result.current.filters, searchText: "alpha" });
    });

    expect(result.current.applyFilters(todos).map((t) => t.id)).toEqual([getTodoId("a")]);
  });

  it("filters by assigned person", () => {
    const assigned = makeTodo({ id: "a", assignedPeople: [getPersonId("Ada")] });
    const todos = [assigned, beta()];
    const { result } = mount(todos);

    act(() => {
      result.current.setFilters({
        ...result.current.filters,
        assignedPeople: new Set(["Ada"]),
      });
    });

    expect(result.current.applyFilters(todos).map((t) => t.id)).toEqual([getTodoId("a")]);
  });

  it("uses OR logic within a filter category", () => {
    const ada = makeTodo({ id: "a", assignedPeople: [getPersonId("Ada")] });
    const grace = makeTodo({ id: "b", assignedPeople: [getPersonId("Grace")] });
    const other = makeTodo({ id: "c", assignedPeople: [getPersonId("Alan")] });
    const todos = [ada, grace, other];
    const { result } = mount(todos);

    act(() => {
      result.current.setFilters({
        ...result.current.filters,
        assignedPeople: new Set(["Ada", "Grace"]),
      });
    });

    expect(result.current.applyFilters(todos).map((t) => t.id)).toEqual([
      getTodoId("a"),
      getTodoId("b"),
    ]);
  });

  it("uses AND logic across filter categories", () => {
    const both = makeTodo({ id: "a", assignedPeople: [getPersonId("Ada")], tags: [getTag("urgent")] });
    const onlyPerson = makeTodo({ id: "b", assignedPeople: [getPersonId("Ada")] });
    const todos = [both, onlyPerson];
    const { result } = mount(todos);

    act(() => {
      result.current.setFilters({
        ...result.current.filters,
        assignedPeople: new Set(["Ada"]),
        tags: new Set(["urgent"]),
      });
    });

    expect(result.current.applyFilters(todos).map((t) => t.id)).toEqual([getTodoId("a")]);
  });

  it("applies the overdue quick filter to active todos", () => {
    const overdue = makeTodo({ id: "a", dueDate: getTimestamp(daysFromNow(-2)) });
    const future = makeTodo({ id: "b", dueDate: getTimestamp(daysFromNow(5)) });
    const todos = [overdue, future];
    const { result } = mount(todos);

    act(() => {
      result.current.setActiveQuickFilter("overdue");
    });

    expect(result.current.applyFilters(todos).map((t) => t.id)).toEqual([getTodoId("a")]);
  });

  it("applies the noDueDate quick filter", () => {
    const withDue = makeTodo({ id: "a", dueDate: getTimestamp(daysFromNow(5)) });
    const without = makeTodo({ id: "b" });
    const todos = [withDue, without];
    const { result } = mount(todos);

    act(() => {
      result.current.setActiveQuickFilter("noDueDate");
    });

    expect(result.current.applyFilters(todos).map((t) => t.id)).toEqual([getTodoId("b")]);
  });
});

describe("filter handlers", () => {
  it("handleFilterClick toggles a value into and out of a category", () => {
    const { result } = mount([]);

    act(() => {
      result.current.handleFilterClick("tags", "urgent");
    });
    expect(result.current.filters.tags.has("urgent")).toBe(true);

    act(() => {
      result.current.handleFilterClick("tags", "urgent");
    });
    expect(result.current.filters.tags.has("urgent")).toBe(false);
  });

  it("handleClearAllFilters resets every category and the search text", () => {
    const { result } = mount([]);

    act(() => {
      result.current.handleFilterClick("tags", "urgent");
      result.current.setFilters({
        ...result.current.filters,
        searchText: "something",
        tags: new Set(["urgent"]),
      });
    });
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.handleClearAllFilters();
    });

    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.filters.searchText).toBe("");
    expect(result.current.filters.tags.size).toBe(0);
  });
});

describe("sortTodos", () => {
  it("sorts by due date ascending, and reverses on descending", () => {
    const soon = makeTodo({ id: "soon", dueDate: getTimestamp(daysFromNow(1)) });
    const later = makeTodo({ id: "later", dueDate: getTimestamp(daysFromNow(9)) });
    const todos = [later, soon];
    const { result } = mount(todos);

    act(() => {
      result.current.setSortField("dueDate");
      result.current.setSortDirection("asc");
    });
    const ascending = result.current.sortTodos(todos).map((t) => t.id);

    act(() => {
      result.current.setSortDirection("desc");
    });
    const descending = result.current.sortTodos(todos).map((t) => t.id);

    expect(ascending).toEqual([getTodoId("soon"), getTodoId("later")]);
    expect(descending).toEqual([...ascending].reverse());
  });

  it("does not mutate the array it is given", () => {
    const a = makeTodo({ id: "a", dueDate: getTimestamp(daysFromNow(9)) });
    const b = makeTodo({ id: "b", dueDate: getTimestamp(daysFromNow(1)) });
    const todos = [a, b];
    const { result } = mount(todos);

    act(() => {
      result.current.setSortField("dueDate");
    });
    result.current.sortTodos(todos);

    expect(todos.map((t) => t.id)).toEqual([getTodoId("a"), getTodoId("b")]);
  });
});

describe("groupTodos", () => {
  it("buckets a todo due today under Today", () => {
    const today = makeTodo({ id: "a", dueDate: getTimestamp(daysFromNow(0)) });
    const { result } = mount([today]);

    act(() => {
      result.current.setGroupBy("dueDate");
    });
    const grouped = result.current.groupTodos([today]);

    expect(Object.keys(grouped)).toContain("Today");
    expect(grouped["Today"].map((t) => t.id)).toEqual([getTodoId("a")]);
  });

  it("buckets a todo due tomorrow under Tomorrow, not Today", () => {
    // The UTC/local bug put next-day items in Today in negative-offset zones.
    const tomorrow = makeTodo({ id: "a", dueDate: getTimestamp(daysFromNow(1)) });
    const { result } = mount([tomorrow]);

    const grouped = result.current.groupTodos([tomorrow]);

    expect(grouped["Tomorrow"]?.map((t) => t.id)).toEqual([getTodoId("a")]);
    expect(grouped["Today"]).toBeUndefined();
  });

  it("buckets an overdue todo under Overdue", () => {
    const overdue = makeTodo({ id: "a", dueDate: getTimestamp(daysFromNow(-3)) });
    const { result } = mount([overdue]);

    expect(result.current.groupTodos([overdue])["Overdue"]?.map((t) => t.id)).toEqual([
      getTodoId("a"),
    ]);
  });

  it("buckets a todo with no due date under No Due Date", () => {
    const none = makeTodo({ id: "a" });
    const { result } = mount([none]);

    expect(result.current.groupTodos([none])["No Due Date"]?.map((t) => t.id)).toEqual([
      getTodoId("a"),
    ]);
  });

  it("keeps every todo when grouping", () => {
    const todos = [
      makeTodo({ id: "a", dueDate: getTimestamp(daysFromNow(0)) }),
      makeTodo({ id: "b", dueDate: getTimestamp(daysFromNow(1)) }),
      makeTodo({ id: "c", dueDate: getTimestamp(daysFromNow(-3)) }),
      makeTodo({ id: "d" }),
    ];
    const { result } = mount(todos);

    const grouped = result.current.groupTodos(todos);
    const total = Object.values(grouped).reduce((sum, group) => sum + group.length, 0);

    expect(total).toBe(todos.length);
  });
});

describe("auto-assign interaction", () => {
  it("treats every todo as having a due date when auto-assign defaults it", () => {
    // defaultSettings.autoAssign is enabled with dueDate "today", so a todo
    // with no explicit due date is still bucketed as due today and the
    // noDueDate quick filter matches nothing at all.
    resetSettingsModel_DONOTUSE();
    const autoModel = createSettingsModel(defaultSettings);
    const none = new TodoModel(
      {
        id: getTodoId("none"),
        text: "none",
        plainText: "none",
        state: "active",
        createdAt: getTimestamp(daysFromNow(-30)),
        assignedPeople: [],
        sourcePeople: [],
        mentionedPeople: [],
        projects: [],
        tags: [],
        comments: [],
        activity: [],
        subtasks: [],
      } as unknown as Todo,
      autoModel
    );

    expect(none.hasDueDate).toBe(true);

    const { result } = renderHook(() =>
      useListViewState({ todos: [none], projects: [], settings: defaultSettings })
    );
    expect(result.current.quickFilterCounts.noDueDate).toBe(0);
  });
});

describe("quickFilterCounts", () => {
  it("counts each bucket over the supplied todos", () => {
    // isOverdue compares the full timestamp (`dueDate < new Date()`), and
    // daysFromNow(0) is today at 12:00, so this counted the "today" todo as
    // overdue whenever the suite ran after noon. Freeze the clock rather than
    // letting the assertion depend on the time of day.
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 15, 9, 0, 0));
    try {
      const todos = [
        makeTodo({ id: "today", dueDate: getTimestamp(daysFromNow(0)) }),
        makeTodo({ id: "overdue", dueDate: getTimestamp(daysFromNow(-1)) }),
        makeTodo({ id: "none" }),
      ];
      const { result } = mount(todos);

      const counts = result.current.quickFilterCounts;

      expect(counts.overdue).toBe(1);
      expect(counts.noDueDate).toBe(1);
      expect(counts.all).toBe(3);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("section expansion", () => {
  it("defaults active and completed open, archived closed", () => {
    const { result } = mount([]);

    expect(result.current.activeExpanded).toBe(true);
    expect(result.current.completedExpanded).toBe(true);
    expect(result.current.archivedExpanded).toBe(false);
  });
});

describe("manual sort", () => {
  it("orders by sortOrder rather than the order todos arrive in", () => {
    // reorderTodos only writes a sortOrder field; it never reorders the
    // underlying array. Relying on input order meant dragging a row changed
    // nothing, on screen or after a reload.
    const todos = [
      makeTodo({ id: "c", sortOrder: 2 }),
      makeTodo({ id: "a", sortOrder: 0 }),
      makeTodo({ id: "b", sortOrder: 1 }),
    ];
    const { result } = mount(todos);

    act(() => result.current.setSortField("manual"));

    expect(result.current.sortTodos(todos).map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("puts todos with no sortOrder after those that have one", () => {
    const todos = [
      makeTodo({ id: "none" }),
      makeTodo({ id: "first", sortOrder: 0 }),
    ];
    const { result } = mount(todos);

    act(() => result.current.setSortField("manual"));

    expect(result.current.sortTodos(todos).map((t) => t.id)).toEqual(["first", "none"]);
  });
});
