# Batch 5 — Dead-code removal

44 units, 50 items: 0 high, 5 medium, 39 low. 7 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## Medium priority

- [ ] **U0193** Delete TodoItem's unreachable inline edit mode and its props · dead-code · medium · `none` · S · [todos-core](../workstreams/todos-core.md#u0193) · DEAD-14, LOG-69
- [ ] **U0124** Delete the orphaned Comments.tsx component · dead-code · medium · `none` · S · [activity-comments](../workstreams/activity-comments.md#u0124) · DEAD-20
- [ ] **U0162** Delete about 70 model getters and methods with no production caller · dead-code · medium · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0162) · DEAD-16, STRUCT-71
- [ ] **U0348** Delete underscore-named dead functions and state in Gantt, Kanban, List, Reviews · dead-code · medium · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0348) · DEAD-19
- [ ] **U0583** Remove unused SettingsModel from NoteModel, ReviewModel and TodoModel · dead-code · medium · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0583) · STRUCT-76, DEAD-17

## Low priority

- [ ] **U0080** Delete IndexedDBAdapter.close() and the unreachable isOpening retry · dead-code · low · `none` · S · [storage-core](../workstreams/storage-core.md#u0080) · DEAD-61
- [ ] **U0056** Remove dead backup re-exports, fixed source parameters and unreachable return · dead-code · low · `none` · S · [backup](../workstreams/backup.md#u0056) · DEAD-63
- [ ] **U0105** Remove the unused CSV field mapping and ImportedTodo raw fields · dead-code · low · `none` · S · [import-export](../workstreams/import-export.md#u0105) · DEAD-72 · **question**
- [ ] **U0006** Remove shadowed _next/static branch and redundant root-path checks in sw.js · dead-code · low · `none` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0006) · DEAD-49 · **question**
- [ ] **U0011** Delete unreachable offline auto-hide effect and wasOffline in ServiceWorkerProvider · dead-code · low · `none` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0011) · DEAD-46
- [ ] **U0046** Delete or surface useServiceWorker clearCache and getVersion · dead-code · low · `needs-decision` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0046) · DEAD-47, DUP-86 · **question**
- [ ] **U0503** Remove unread token fields and the unused 'dependency' type from SmartInput · dead-code · low · `none` · S · [smart-input](../workstreams/smart-input.md#u0503) · DEAD-35
- [ ] **U0524** Delete test-only autoDetection helpers and decide on detectAssignedPeople · dead-code · low · `needs-decision` · S · [smart-input](../workstreams/smart-input.md#u0524) · DEAD-69 · **question**
- [ ] **U0136** Clean up useTodos internals and route archive refusals through notifyDependencyBlock · dead-code · low · `none` · S · [todos-core](../workstreams/todos-core.md#u0136) · DEAD-60, STRUCT-83
- [ ] **U0178** Delete deprecated and no-op compatibility getters from TodoModel · dead-code · low · `none` · S · [todos-core](../workstreams/todos-core.md#u0178) · DEAD-54
- [ ] **U0159** Remove unused options and members from useUndoableActions · dead-code · low · `none` · S · [undo-confirm](../workstreams/undo-confirm.md#u0159) · DEAD-56
- [ ] **U0600** Delete unused getCurrentDay/Month/YearPeriod wrappers in reviewUtils · dead-code · low · `none` · S · [reviews](../workstreams/reviews.md#u0600) · DEAD-68
- [ ] **U0379** Remove unused availablePriorities and schedulingMode parameters from ganttScheduler · dead-code · low · `none` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0379) · DEAD-41
- [ ] **U0394** Remove write-only taskStartTime and actualTimeSpent from FocusView state · dead-code · low · `none` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0394) · DEAD-29
- [ ] **U0762** Delete five test-only notification exports and their tests · dead-code · low · `none` · S · [notifications](../workstreams/notifications.md#u0762) · DEAD-70
- [ ] **U0287** Remove settings-tab fallbacks for fields migrateSettings already fills · dead-code · low · `none` · S · [settings](../workstreams/settings.md#u0287) · DEAD-45, STRUCT-100
- [ ] **U0232** Drop unused isDragMode and toggleDragMode from ListViewHandle · dead-code · low · `none` · S · [view-state](../workstreams/view-state.md#u0232) · DEAD-36
- [ ] **U0767** Delete dead and redundant rules from globals.css · dead-code · low · `none` · S · [visual-system](../workstreams/visual-system.md#u0767) · DEAD-51
- [ ] **U0630** Delete unused e2e fixture helper methods and types · dead-code · low · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0630) · DEAD-82
- [ ] **U0645** Delete leftover Playwright comments, redundant npm script and unused image option · dead-code · low · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0645) · DEAD-85
- [ ] **U0740** Delete unused test helpers and dead locals in test files · dead-code · low · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0740) · DEAD-83
- [ ] **U0191** Settle unused optional props on NoteListItem, TodoListItem and TodoItem · dead-code · low · `needs-decision` · S · [code-hygiene](../workstreams/code-hygiene.md#u0191) · DEAD-42 · **question**
- [ ] **U0214** Inline three pass-through alias variables left from refactors · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0214) · DEAD-80
- [ ] **U0349** Delete useRef objects that are attached but never read · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0349) · DEAD-30
- [ ] **U0350** Stop computing render values nobody consumes in Gantt, Stats, Kanban, Sprints · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0350) · DEAD-28
- [ ] **U0351** Delete unused locals, destructures and always-false flags in views · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0351) · DEAD-38
- [ ] **U0507** Delete unreachable branches across input, overlays, items and views · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0507) · DEAD-31
- [ ] **U0512** Delete dead Duration types, the timeBlock alias and unused review activity members · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0512) · DEAD-64
- [ ] **U0519** Remove unreachable branches and repeated guards in utils · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0519) · DEAD-33
- [ ] **U0533** Remove unused locals, parameters and return fields in utils · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0533) · DEAD-40
- [ ] **U0549** Delete test-only date, recurring, review, colour, focus and Gantt helpers · dead-code · low · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0549) · DEAD-71
- [ ] **U0551** Remove unused aliases and re-export shims in utils and TutorialOverlay · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0551) · DEAD-65
- [ ] **U0576** Drop hook return members that no consumer reads · dead-code · low · `needs-decision` · S · [code-hygiene](../workstreams/code-hygiene.md#u0576) · DEAD-57 · **question**
- [ ] **U0663** Delete optional props and variants no shared-component caller passes · dead-code · low · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0663) · DEAD-43 · **question**
- [ ] **U0664** Remove unused React import in Icons and StorageTab locals · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0664) · DEAD-39
- [ ] **U0671** Remove unreachable branches and always-true guards in shared components · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0671) · DEAD-32
- [ ] **U0678** Remove SearchableDropdown's unused searchValue sync effect · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0678) · DEAD-44
- [ ] **U0706** Remove unused React imports and ignored filter-button parameters · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0706) · DEAD-37
- [ ] **U0725** Drop export from symbols nothing outside their file imports · dead-code · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0725) · DEAD-78
