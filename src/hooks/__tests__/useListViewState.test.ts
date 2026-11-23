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
import { getDurationSec } from "@/types/time";
import { getPriorityId } from "@/types/priority";
import { Project, getProjectId, getProjectCategoryId } from "@/types/project";
import { STORAGE_KEYS } from "@/storage/storage";

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

describe("due-date grouping across a DST boundary", () => {
  it("puts tomorrow in Tomorrow on a spring-forward day", () => {
    // US spring-forward is 02:00 on 2026-03-08, so midnight-to-midnight across
    // 03-08 -> 03-09 is 23 hours. Dividing local midnights and flooring gave
    // 0.958 -> 0, grouping tomorrow's todo under Today. Only exercises the DST
    // path in a timezone that observes it; elsewhere it simply asserts the
    // ordinary case.
    jest.useFakeTimers().setSystemTime(new Date(2026, 2, 8, 9, 0, 0));
    try {
      const todos = [makeTodo({ id: "tomorrow", dueDate: getTimestamp(new Date(2026, 2, 9, 12, 0).getTime()) })];
      const { result } = mount(todos);

      act(() => result.current.setGroupBy("dueDate"));
      const groups = result.current.groupTodos(todos);

      expect(groups["Today"] ?? []).toHaveLength(0);
      expect((groups["Tomorrow"] ?? []).map((t) => t.id)).toEqual(["tomorrow"]);
    } finally {
      jest.useRealTimers();
    }
  });
});

// The view options and the presets both load asynchronously, and nothing is
// saved or matched against a preset until they have. The blocks below wait for
// both, which also keeps those state updates inside act().
const settle = () => act(async () => {});

const mountLoaded = async (todos: TodoModel[], projects: ProjectModel[] = [], hookSettings = settings) => {
  const hook = renderHook(() => useListViewState({ todos, projects, settings: hookSettings }));
  await settle();
  return hook;
};

describe("filterOptions", () => {
  const people = (...names: string[]) => names.map(getPersonId);
  const makeProject = (name: string, extra: Partial<Project> = {}): ProjectModel =>
    new ProjectModel({ id: getProjectId(name), name, alternatives: [], comments: [], activity: [], ...extra });

  it("lists each person, project and tag once, in alphabetical order", async () => {
    const todos = [
      makeTodo({ id: "a", assignedPeople: people("Grace", "Ada"), sourcePeople: people("Linus") }),
      makeTodo({ id: "b", assignedPeople: people("Ada", "Alan"), sourcePeople: people("Linus", "Barbara") }),
      makeTodo({ id: "c", mentionedPeople: people("Margaret", "Edsger"), tags: [getTag("urgent"), getTag("billing")] }),
      makeTodo({ id: "d", mentionedPeople: people("Margaret"), projects: [getProjectId("Web"), getProjectId("Api")] }),
      makeTodo({ id: "e", projects: [getProjectId("Web")], tags: [getTag("billing")] }),
    ];
    const { result } = await mountLoaded(todos);

    expect(result.current.filterOptions).toMatchObject({
      assignedPeople: ["Ada", "Alan", "Grace"],
      sourcePeople: ["Barbara", "Linus"],
      mentionedPeople: ["Edsger", "Margaret"],
      projects: ["Api", "Web"],
      tags: ["billing", "urgent"],
    });
  });

  it("lists each priority, duration, recurrence and dependency once", async () => {
    const [high, low] = [getPriorityId("2"), getPriorityId("4")];
    const todos = [
      makeTodo({ id: "a", priority: high, duration: getDurationSec(30 * 60), recurring: "every monday" }),
      makeTodo({ id: "b", priority: low, duration: getDurationSec(2 * 60 * 60), recurring: "every monday" }),
      makeTodo({ id: "c", priority: high, duration: getDurationSec(30 * 60), recurring: "every day" }),
      makeTodo({ id: "d", dependencies: [getTodoId("y"), getTodoId("x")] }),
      makeTodo({ id: "e", dependencies: [getTodoId("x")] }),
    ];
    const { result } = await mountLoaded(todos);
    const { priorities, durations, recurring, dependencies } = result.current.filterOptions;

    // Membership only: the order of the priorities is U0215, and the others
    // sort as text for want of anything better.
    expect([...priorities].sort()).toEqual(["high", "low"]);
    expect([...durations].sort()).toEqual(["2h", "30m"]);
    expect([...recurring].sort()).toEqual(["every day", "every monday"]);
    expect([...dependencies].sort()).toEqual(["x", "y"]);
  });

  it("offers the categories of the projects the todos reference, and no others", async () => {
    const projects = [
      makeProject("Web", { alternatives: ["site"], category: getProjectCategoryId("work") }),
      makeProject("Garden", { category: getProjectCategoryId("personal") }),
      makeProject("Inbox"),
      makeProject("Tax", { category: getProjectCategoryId("finance") }),
    ];
    const todos = [
      makeTodo({ id: "a", projects: [getProjectId("site")] }), // Web, by its alternative name
      makeTodo({ id: "b", projects: [getProjectId("Garden"), getProjectId("Inbox")] }), // Inbox has no category
      makeTodo({ id: "c", projects: [getProjectId("Nowhere")] }), // no such project
    ];
    const { result } = await mountLoaded(todos, projects);

    // "finance" stays out: no todo references Tax. Membership only -- the
    // order is the it.todo below.
    expect([...result.current.filterOptions.categories].sort()).toEqual(["personal", "work"]);
  });

  it("draws options from completed and archived todos as well as active ones", async () => {
    const todos = [
      makeTodo({ id: "a", tags: [getTag("live")] }),
      makeTodo({ id: "b", state: "completed", tags: [getTag("shipped")] }),
      makeTodo({ id: "c", state: "archived", tags: [getTag("retired")], assignedPeople: people("Ada") }),
    ];
    const { result } = await mountLoaded(todos);

    expect(result.current.filterOptions.tags).toEqual(["live", "retired", "shipped"]);
    expect(result.current.filterOptions.assignedPeople).toEqual(["Ada"]);
  });

  it.todo("lists priority options in the configured priority order rather than alphabetically (U0215)");
  it.todo("offers due-date options as stable buckets, not relative display text such as 'Tomorrow' (U0253)");
  it.todo("collapses case variants and alternative names of one entity into a single option (U0747)");
  it.todo("lists category options sorted by name like the other options, not ids in first-seen order (U0823)");
});

describe("groupTodos by priority", () => {
  // The default priorities are urgent (id 1), high (2), medium (3) and low (4),
  // listed and ordered in that sequence.
  const withPriority = (id: string, priorityId?: string): TodoModel =>
    makeTodo(priorityId === undefined ? { id } : { id, priority: getPriorityId(priorityId) });

  // Each group as "name: ids", in the order the groups come back.
  const groupByPriority = async (todos: TodoModel[], hookSettings = settings) => {
    const { result } = await mountLoaded(todos, [], hookSettings);
    act(() => result.current.setGroupBy("priority"));
    const groups = Object.entries(result.current.groupTodos(todos));
    return groups.map(([name, members]) => `${name}: ${members.map((t) => t.id).join(" ")}`);
  };

  it("orders the groups by each priority's order value, with No Priority last", async () => {
    // Order values that agree with neither the settings list, the alphabet nor
    // the order the todos arrive in: high 1, low 2, urgent 3, medium 4.
    const order: Record<string, number> = { high: 1, low: 2, urgent: 3, medium: 4 };
    const reordered = {
      ...noAutoAssign,
      priorities: noAutoAssign.priorities.map((p) => ({ ...p, order: order[p.name] })),
    };
    resetSettingsModel_DONOTUSE();
    settingsModel = createSettingsModel(reordered);
    const arrivals: [string, string?][] = [["m", "3"], ["l1", "4"], ["none"], ["u", "1"], ["h", "2"], ["l2", "4"]];
    const todos = arrivals.map(([id, priorityId]) => withPriority(id, priorityId));

    expect(await groupByPriority(todos, reordered)).toEqual([
      "high: h",
      "low: l1 l2",
      "urgent: u",
      "medium: m",
      "No Priority: none",
    ]);
  });

  it("puts a priority the hook's settings do not list after the listed ones and before No Priority", async () => {
    // Only reachable when the settings prop is out of step with the model that
    // names the todo's priority: here the model knows a fifth priority, with
    // the best order of all, that the hook's settings do not have.
    const someday = { id: getPriorityId("5"), name: "someday", alternatives: [], order: 0 };
    resetSettingsModel_DONOTUSE();
    settingsModel = createSettingsModel({ ...noAutoAssign, priorities: [...noAutoAssign.priorities, someday] });
    const todos = [withPriority("n"), withPriority("s", "5"), withPriority("l", "4"), withPriority("u", "1")];

    expect(await groupByPriority(todos)).toEqual(["urgent: u", "low: l", "someday: s", "No Priority: n"]);
  });

  it.todo("groups a todo whose priority was deleted from settings by the rule chosen for deleted priorities (U0306)");
  it.todo("keeps a priority literally named 'No Priority' apart from the todos that have none (U0254)");
});

describe("presets", () => {
  it("savePreset stores the current view under a name, makes it active and closes the save dialog", async () => {
    const { result } = await mountLoaded([]);
    act(() => {
      result.current.setSortField("title");
      result.current.setGroupBy("project");
      result.current.setActiveQuickFilter("overdue");
      result.current.handleFilterClick("tags", "urgent");
      result.current.setIsSavePresetOpen(true);
      result.current.setPresetName("Urgent");
    });
    expect(result.current.activePreset).toBe("custom");

    act(() => result.current.savePreset("Urgent"));

    expect(result.current.viewPresets).toHaveLength(1);
    expect(result.current.viewPresets[0]).toMatchObject({
      name: "Urgent",
      filters: { searchText: "", tags: ["urgent"], projects: [] },
      sortField: "title",
      sortDirection: "asc",
      groupBy: "project",
      quickFilter: "overdue",
      sections: { activeExpanded: true, completedExpanded: true, archivedExpanded: false },
    });
    expect(result.current.activePreset).toBe("Urgent");
    expect([result.current.isSavePresetOpen, result.current.presetName]).toEqual([false, ""]);
  });

  it("saving under an existing name replaces that preset where it stands", async () => {
    const { result } = await mountLoaded([]);
    act(() => result.current.savePreset("First"));
    act(() => result.current.setSortField("title"));
    act(() => result.current.savePreset("Second"));
    act(() => result.current.setSortField("created"));

    act(() => result.current.savePreset("First"));

    const saved = result.current.viewPresets.map((p) => `${p.name}: ${p.sortField}`);
    expect(saved).toEqual(["First: created", "Second: title"]);
    expect(result.current.activePreset).toBe("First");
  });

  it("deletePreset removes only the named preset, and falls back to custom when that was the active one", async () => {
    const { result } = await mountLoaded([]);
    act(() => result.current.savePreset("First"));
    act(() => result.current.setSortField("title"));
    act(() => result.current.savePreset("Second"));

    act(() => result.current.deletePreset("First"));
    expect(result.current.viewPresets.map((p) => p.name)).toEqual(["Second"]);
    expect(result.current.activePreset).toBe("Second");

    act(() => result.current.deletePreset("Second"));
    expect(result.current.viewPresets).toEqual([]);
    expect(result.current.activePreset).toBe("custom");
  });

  it("loadPreset restores the saved filters, sort, grouping, quick filter and sections", async () => {
    const { result } = await mountLoaded([]);
    act(() => {
      result.current.setFilters({ ...result.current.filters, searchText: "report", tags: new Set(["urgent"]) });
      result.current.setSortField("title");
      result.current.setSortDirection("desc");
      result.current.setGroupBy("project");
      result.current.setActiveQuickFilter("overdue");
      result.current.setCompletedExpanded(false);
      result.current.setArchivedExpanded(true);
    });
    act(() => result.current.savePreset("Review"));
    act(() => {
      result.current.handleClearAllFilters();
      result.current.setSortField("priority");
      result.current.setSortDirection("asc");
      result.current.setGroupBy("none");
      result.current.setCompletedExpanded(true);
      result.current.setArchivedExpanded(false);
    });
    expect(result.current.activePreset).toBe("custom");

    act(() => result.current.loadPreset(result.current.viewPresets[0]));

    const view = result.current;
    expect([view.filters.searchText, [...view.filters.tags]]).toEqual(["report", ["urgent"]]);
    expect([view.sortField, view.sortDirection, view.groupBy]).toEqual(["title", "desc", "project"]);
    expect(view.activeQuickFilter).toBe("overdue");
    expect([view.activeExpanded, view.completedExpanded, view.archivedExpanded]).toEqual([true, false, true]);
    expect(view.activePreset).toBe("Review");
  });

  it("writes presets to storage and reads them back on the next mount", async () => {
    const first = await mountLoaded([]);
    act(() => first.result.current.setSortField("title"));
    act(() => first.result.current.savePreset("Mine"));
    await settle();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIEW_PRESETS) ?? "null");
    expect(stored).toMatchObject([{ name: "Mine", sortField: "title" }]);
    first.unmount();

    const { result } = await mountLoaded([]);

    expect(result.current.viewPresets.map((p) => p.name)).toEqual(["Mine"]);
    // The view options were stored too, so the restored view still matches.
    expect([result.current.sortField, result.current.activePreset]).toEqual(["title", "Mine"]);
  });

  it.todo("shows a preset saved without sections as active in the default view, where completed is expanded (U0252)");
  it.todo("treats a preset the user named 'custom' as a real preset, not as 'no preset' (U0254)");
});
