# 1. Dead-code removal

87 items: 13 high, 13 medium, 61 low. Each reviewer batch was checked against the code by an adversarial verifier (0 findings refuted outright, others corrected). Every item links to its full text; the unit and batch after each title say where the work is scheduled.

## Context

State of the codebase (HEAD 0596933). The default `npm run typecheck` passes, but `tsc --noEmit --noUnusedLocals --noUnusedParameters` flags about 25 symbols, and reading the code found many more. The repo has a habit of renaming dead code instead of deleting it. Underscore prefixes are used to keep functions, state and props alive that nothing reads, for example GanttView `_parseDuration`, `_getPriorityColor` and `_weekOffset`; KanbanView `_getAllowedTargets` and `_onUpdateKanbanSettings`; ListView `_selectAllInSection`; ReviewsView `_sections`; NoteDetailView `_autoFocusContent`; and AlternativesInput `_showPreview`. Dead code is concentrated in four places:
(1) Settings that are saved but never read.
(2) The model layer. TodoModel uses only about 26 of SettingsModel's 92 members. About 70 getters across TodoModel, NoteModel, ReviewModel, SprintModel and BaseEntityModel have no production caller. NoteModel and ReviewModel are handed a SettingsModel and never use it.
(3) Leftovers from component refactors. TodoItem's inline edit mode has been unreachable since 6eafb29. src/components/shared/Comments.tsx has been orphaned since ae4e6e4. Props are threaded through TodoApp, PeopleView and ProjectsView and never read. Section comments sit above code that no longer exists.
(4) About 30 utils exports used only by their own tests (in autoDetection, notifications, reviewUtils, dateUtils, recurringParser, colors, focusReport and ganttScheduler), plus test doubles living in production source (src/utils/browserApis.ts).

Not everything that looks dead may be deleted. Seven settings controls write fields that nothing reads: Gantt Show Weekends, Kanban Set as Default, the three Notes settings, the auto-assign Recurring default, the notification check interval and the sprint Show Backlog toggle. Several more things are half-built features: CalendarView.onQuickAdd and NoteDetailView.autoFocusContent, useTodos.editTodoComment/deleteTodoComment, useTemplates.updateTemplate, and useServiceWorker.clearCache/getVersion. Under the owner's rule these are needs-decision items, and the recommended path is to finish the feature, not delete it. Removing a visible control removes a feature even when the control does nothing today. Stored settings fields stay in the types either way, because backups, imports and old localStorage data still carry them.

In good shape, leave alone:
- All 30 STORAGE_KEYS are both read and written, and no migration is dead. INTERNAL_STORAGE_KEYS holds two entries that are IndexedDB database names (DEAD-62).
- All 73 icons in src/components/shared/Icons.tsx are rendered.
- Every file in public/ is referenced: favicons, the manifest and all 18 sounds.
- All runtime dependencies (chrono-node, dompurify, next, react, react-dom) and all devDependencies are used. jest-environment-jsdom is used through the @jest-environment docblocks.
- Nothing under build/ is tracked in git, although tsconfig still type-checks the untracked leftover (DEAD-84).
- src/types/viewRegistry.ts is the single authority for views. The Next.js app files and public/sw.js are framework entry points.
- useDebouncedSave's {flush, cancel} return and SharedStore.reset look unused but are deliberate seams (b094a36 and tests).
- Commit 1162756 already deleted some unreachable features and deliberately kept activeSprints, archivedSprints and the selection-history clear and getTopUsed helpers. That is why those are owner questions, not deletions.

What an implementer must know:
- The SettingsModel singleton (DEAD-09) is a real stale-memo bug. It must land before the SettingsModel and test-helper deletions (DEAD-15, DEAD-66, DEAD-83), because removing getInstance and reset_DONOTUSE is part of the fix.
- Decide the inert-settings questions (DEAD-10 to DEAD-13, DEAD-25, DEAD-26) before deleting their unused SettingsModel getters.
- TodoItem.tsx is touched by DEAD-14, -30, -31 and -42; land DEAD-14 first.
- Some apparent dead plumbing hides bugs. The fiscal helpers' ignored `_dt` parameter is a dropped setting (DEAD-06), not dead code. GanttView's unused `_parseDuration` documents the intended day length for DEAD-01, so settle DEAD-01 before DEAD-19 deletes it.
- Deleting tested-but-dead code changes the coverage percentages that jest.config.js enforces as a ratchet. Run `npm run validate` per package and only ever raise the floor.
- There is no prettier config. Collapse blank lines and comments by hand, never with a formatter.
- Items tagged [Cross-dimension] are bugs or unfinished features the dead-code reviewers found along the way. They are carried here so nothing is lost, and should be deduplicated against the owning dimension in the central plan.

## Items, high to low

- [DEAD-01](../workstreams/durations.md#dead-01) · high · `bugfix` · S — [Cross-dimension: Logic bugs] parseDuration drops d/w units and compound strings: '2d' is stored as 2 minutes, '1h30m' as 60 · U0377, batch 2B
- [DEAD-02](../workstreams/keyboard-help.md#dead-02) · high · `bugfix` · S — [Cross-dimension: Logic bugs] The tutorial button on the Stats and Time tabs crashes the app (empty steps array) · U0446, batch 3C
- [DEAD-03](../workstreams/notes.md#dead-03) · high · `bugfix` · S — [Cross-dimension: Logic bugs] The note buildMetadata switches never match SmartInput's token types, so title markers are dropped · U0409, batch 3B
- [DEAD-04](../workstreams/overlays-dialogs.md#dead-04) · high · `bugfix` · S — [Cross-dimension: Logic bugs] The add-todo overlay's backdrop and X button bypass closeAddOverlay, so stale hidden text gets submitted · U0461, batch 3C
- [DEAD-05](../workstreams/settings.md#dead-05) · high · `needs-decision` · M — [Cross-dimension: Logic bugs] Work-hours per-day mode is not persisted; custom schedules silently override weekday/weekend edits · U0309, batch 3B
- [DEAD-06](../workstreams/dates-time.md#dead-06) · high · `bugfix` · S — [Cross-dimension: Logic bugs] The date parser ignores the fiscal-year-start setting (the fiscal helpers' unused `_dt` is a dropped setting, not dead code) · U0535, batch 3A
- [DEAD-07](../workstreams/storage-core.md#dead-07) · high · `bugfix` · S — [Cross-dimension: Logic bugs] getStorageType() always reports localStorage in production builds (class name is minified) · U0084, batch 2A
- [DEAD-08](../workstreams/stats-time-focus.md#dead-08) · high · `bugfix` · S — [Cross-dimension: Logic bugs] TimeReportsView print CSS targets a nonexistent #time-reports-view, so Print shows only the header · U0372, batch 3B
- [DEAD-09](../workstreams/settings.md#dead-09) · high · `bugfix` · M — [Cross-dimension: Logic bugs] The SettingsModel singleton keeps todo memos from updating on a settings change (blocker for the SettingsModel cleanup) · U0319, batch 3A
- [DEAD-10](../workstreams/gantt-scheduling.md#dead-10) · high · `needs-decision` · M — [Cross-dimension: Partly implemented] The Gantt 'Show Weekends' setting is saved but never read · U0286, batch 10
- [DEAD-11](../workstreams/notes.md#dead-11) · high · `needs-decision` · M — [Cross-dimension: Partly implemented] The Notes settings (pin new notes, show archived, sort order) are never read, and NotesView drops its notesSettings prop · U0299, batch 10
- [DEAD-12](../workstreams/kanban.md#dead-12) · high · `needs-decision` · M — [Cross-dimension: Partly implemented] Kanban 'Set as Default' and settings.kanban.activeViewId are write-only · U0292, batch 10
- [DEAD-13](../workstreams/settings.md#dead-13) · high · `needs-decision` · S — [Cross-dimension: Partly implemented] The auto-assign 'Recurring' default is saved but never applied to new todos · U0270, batch 10
- [DEAD-14](../workstreams/todos-core.md#dead-14) · medium · `none` · S — TodoItem's inline edit mode is unreachable (about 150 lines) since 6eafb29 · U0193, batch 5
- [DEAD-15](../workstreams/settings.md#dead-15) · medium · `none` · M — About 66 of SettingsModel's 92 members have no production caller · U0321, batch 10
- [DEAD-16](../workstreams/code-hygiene.md#dead-16) · medium · `none` · M — About 70 model getters and methods have no production caller (Todo, Note, Review, Sprint, BaseEntity) · U0162, batch 5
- [DEAD-17](../workstreams/code-hygiene.md#dead-17) · medium · `none` · S — NoteModel and ReviewModel never use the SettingsModel they are given; TodoModel.settings/updateSettings are unused · U0583, batch 5
- [DEAD-18](../workstreams/code-hygiene.md#dead-18) · medium · `none` · S — Props declared (and usually passed) but never read · U0210, batch 10
- [DEAD-19](../workstreams/code-hygiene.md#dead-19) · medium · `none` · S — Dead functions and state kept under underscore names in the views · U0348, batch 5
- [DEAD-20](../workstreams/activity-comments.md#dead-20) · medium · `none` · S — src/components/shared/Comments.tsx is orphaned: nothing imports it · U0124, batch 5
- [DEAD-21](../workstreams/activity-comments.md#dead-21) · medium · `needs-decision` · M — Task comments cannot be edited or deleted: useTodos.editTodoComment/deleteTodoComment have no UI caller · U0151, batch 10
- [DEAD-22](../workstreams/durations.md#dead-22) · medium · `none` · S — formatters.formatDuration and formatElapsed are never imported, while five local copies exist · U0376, batch 7B
- [DEAD-23](../workstreams/notes.md#dead-23) · medium · `needs-decision` · S — NoteDetailView.autoFocusContent was never implemented; the TodoApp plumbing and contentEditorRef are dead · U0691, batch 10
- [DEAD-24](../workstreams/notes.md#dead-24) · medium · `needs-decision` · S — CalendarView quick-add (onQuickAdd) is never wired: the double-click, + hint, Add button and help text do nothing · U0691, batch 10
- [DEAD-25](../workstreams/notifications.md#dead-25) · medium · `needs-decision` · S — [Cross-dimension: Partly implemented] The notification 'Check for due tasks every' setting is ignored · U0737, batch 6B
- [DEAD-26](../workstreams/sprints.md#dead-26) · medium · `needs-decision` · M — [Cross-dimension: Partly implemented] The sprint 'Show backlog items in sprint view' setting has no consumer, and its help text describes behaviour that already always happens · U0308, batch 10
- [DEAD-27](../workstreams/sprints.md#dead-27) · low · `none` · S — SprintItem's deprecated todoCount/completedTodoCount props and their fallback bar are unreachable · U0362, batch 7B
- [DEAD-28](../workstreams/code-hygiene.md#dead-28) · low · `none` · S — Values computed on every render that nothing consumes · U0350, batch 5
- [DEAD-29](../workstreams/stats-time-focus.md#dead-29) · low · `none` · S — FocusView state fields taskStartTime and actualTimeSpent are write-only · U0394, batch 5
- [DEAD-30](../workstreams/code-hygiene.md#dead-30) · low · `none` · S — useRef objects attached to the DOM but never read · U0349, batch 5
- [DEAD-31](../workstreams/code-hygiene.md#dead-31) · low · `none` · S — Unreachable branches and always-true conditions in input, overlays, items and views · U0507, batch 5
- [DEAD-32](../workstreams/code-hygiene.md#dead-32) · low · `none` · S — Unreachable branches and always-true guards in shared and settings components · U0671, batch 5
- [DEAD-33](../workstreams/code-hygiene.md#dead-33) · low · `none` · S — Unreachable branches and repeated guards in utils · U0519, batch 5
- [DEAD-34](../workstreams/feedback-states.md#dead-34) · low · `needs-decision` · S — The ReviewsView 'No Reviews' empty state can never render · U0702, batch 6C
- [DEAD-35](../workstreams/smart-input.md#dead-35) · low · `none` · S — SmartInput writes token fields nothing reads (detectedDateIndex, allDetectedDates, the 'dependency' type) · U0503, batch 5
- [DEAD-36](../workstreams/view-state.md#dead-36) · low · `none` · S — ListViewHandle exposes isDragMode and toggleDragMode, which no caller uses · U0232, batch 5
- [DEAD-37](../workstreams/code-hygiene.md#dead-37) · low · `none` · S — Unused React default imports and ignored parameters in the Review, List and Notes views · U0706, batch 5
- [DEAD-38](../workstreams/code-hygiene.md#dead-38) · low · `none` · S — Unused locals, destructures and always-false flags in views and overlays · U0351, batch 5
- [DEAD-39](../workstreams/code-hygiene.md#dead-39) · low · `none` · S — Unused locals in shared and settings (Icons React import, StorageTab locals) · U0664, batch 5
- [DEAD-40](../workstreams/code-hygiene.md#dead-40) · low · `none` · S — Unused locals, parameters and return fields in utils (the fiscal helpers' `_dt` is excluded; see DEAD-06) · U0533, batch 5
- [DEAD-41](../workstreams/gantt-scheduling.md#dead-41) · low · `none` · S — ganttScheduler ignores availablePriorities and schedulingMode, but GanttView still passes them and memoises on them · U0379, batch 5
- [DEAD-42](../workstreams/code-hygiene.md#dead-42) · low · `needs-decision` · S — Optional props on items and overlays that every caller leaves at the default or makes redundant · U0191, batch 5
- [DEAD-43](../workstreams/code-hygiene.md#dead-43) · low · `none` · M — Optional props and variants that no caller of the shared components passes · U0663, batch 5
- [DEAD-44](../workstreams/code-hygiene.md#dead-44) · low · `none` · S — SearchableDropdown: searchValue and allowAdd are never passed · U0678, batch 5
- [DEAD-45](../workstreams/settings.md#dead-45) · low · `none` · S — Settings tabs guard against missing fields that migrateSettings already fills · U0287, batch 5
- [DEAD-46](../workstreams/pwa-service-worker.md#dead-46) · low · `none` · S — ServiceWorkerProvider: the auto-hide effect and wasOffline state are unreachable; empty debug-logging stub · U0011, batch 5
- [DEAD-47](../workstreams/pwa-service-worker.md#dead-47) · low · `needs-decision` · S — useServiceWorker clearCache/getVersion and their sw.js handlers are reached only by tests (test-only) · U0046, batch 5
- DEAD-48 · low · `needs-decision` · S — held back with security unit U0008 · batch 4
- [DEAD-49](../workstreams/pwa-service-worker.md#dead-49) · low · `none` · S — sw.js: the _next/static fetch branch is shadowed by isStaticAsset, and the root-path operands are redundant · U0006, batch 5
- [DEAD-50](../workstreams/accessibility.md#dead-50) · low · `needs-decision` · S — Icons.tsx declares a default aria-hidden that is never applied · U0665, batch 8B
- [DEAD-51](../workstreams/visual-system.md#dead-51) · low · `none` · S — Dead or redundant rules in globals.css · U0767, batch 5
- [DEAD-52](../workstreams/accessibility.md#dead-52) · low · `none` · S — InfoTooltip uses animation classes that no CSS defines · U0667, batch 8B
- [DEAD-53](../workstreams/visual-system.md#dead-53) · low · `needs-decision` · S — Geist Sans is downloaded and preloaded, but body forces Arial · U0768, batch 8C
- [DEAD-54](../workstreams/todos-core.md#dead-54) · low · `none` · S — TodoModel keeps deprecated and no-op compatibility getters · U0178, batch 5
- [DEAD-55](../workstreams/code-hygiene.md#dead-55) · low · `none` · S — useEntityManager's createModels plumbing is never read · U0557, batch 7A
- [DEAD-56](../workstreams/undo-confirm.md#dead-56) · low · `none` · S — useUndoableActions: clearAll, the timing options, the returned id and timestamp are unused · U0159, batch 5
- [DEAD-57](../workstreams/code-hygiene.md#dead-57) · low · `needs-decision` · S — Hook return members no consumer reads (some test-only) · U0576, batch 5
- [DEAD-58](../workstreams/todos-core.md#dead-58) · low · `needs-decision` · S — useTemplates.updateTemplate is test-only: there is no template edit UI · U0129, batch 10
- [DEAD-59](../workstreams/storage-core.md#dead-59) · low · `none` · S — usePersistedState: options nobody passes, an unreachable .catch, stale examples · U0137, batch 2A
- [DEAD-60](../workstreams/todos-core.md#dead-60) · low · `none` · S — useTodos: a redundant filter, an unreachable branch and leftover assignments · U0136, batch 5
- [DEAD-61](../workstreams/storage-core.md#dead-61) · low · `none` · S — IndexedDBAdapter.close() is never called, and the isOpening retry branch is unreachable · U0080, batch 5
- [DEAD-62](../workstreams/storage-core.md#dead-62) · low · `none` · S — storage.ts: nothing reads initializeStorage's result; factory and constant exports are file-internal; two non-key entries in INTERNAL_STORAGE_KEYS · U0074, batch 2A
- [DEAD-63](../workstreams/backup.md#dead-63) · low · `none` · S — backup.ts and useBackups: dead re-exports, fixed parameters, an unreachable return · U0056, batch 5
- [DEAD-64](../workstreams/code-hygiene.md#dead-64) · low · `none` · S — Dead type declarations and an in-repo compatibility alias in src/types · U0512, batch 5
- [DEAD-65](../workstreams/code-hygiene.md#dead-65) · low · `none` · S — Unused aliases and re-export shims in utils, plus the tutorialSteps alias · U0551, batch 5
- [DEAD-66](../workstreams/code-hygiene.md#dead-66) · low · `none` · S — Test-only: singular model factories, raw_DONOTUSE getters and getCurrentVersion · U0578, batch 7A
- [DEAD-67](../workstreams/tests-ci-tooling.md#dead-67) · low · `none` · S — Test-only: MockBrowserApis and MockAudioElement live in production source and call the jest global; IBrowserApis.clearTimeout is never called · U0742, batch 1
- [DEAD-68](../workstreams/reviews.md#dead-68) · low · `none` · S — reviewUtils getCurrentDayPeriod, getCurrentMonthPeriod and getCurrentYearPeriod are referenced nowhere, not even by tests · U0600, batch 5
- [DEAD-69](../workstreams/smart-input.md#dead-69) · low · `needs-decision` · S — Test-only: autoDetection helpers, including the never-wired detectAssignedPeople · U0524, batch 5
- [DEAD-70](../workstreams/notifications.md#dead-70) · low · `none` · S — Test-only: notifications setAmbientVolume, isAmbientPlaying, queueSound, notifyPomodoroBreak, notifyPomodoroWorkStart · U0762, batch 5
- [DEAD-71](../workstreams/code-hygiene.md#dead-71) · low · `none` · M — Test-only: date, recurring, review, colour, focus-report and Gantt helpers with no production caller · U0549, batch 5
- [DEAD-72](../workstreams/import-export.md#dead-72) · low · `none` · S — import.ts: the CSV field-mapping option and ImportedTodo.rawData/originalId are unused in production · U0105, batch 5
- [DEAD-73](../workstreams/keyboard-help.md#dead-73) · low · `none` · S — data-tutorial attributes that no tutorial step targets · U0341, batch 8A
- [DEAD-74](../workstreams/keyboard-help.md#dead-74) · low · `bugfix` · S — [Cross-dimension: Logic bugs] Two Gantt tutorial steps target selectors that do not exist · U0340, batch 6C
- [DEAD-75](../workstreams/keyboard-help.md#dead-75) · low · `bugfix` · S — [Cross-dimension: Inconsistencies] Help's view headings: List looks up the label 'List' (the registry says 'Todos'), Kanban and Gantt hard-code their digits · U0433, batch 3C
- [DEAD-76](../workstreams/settings.md#dead-76) · low · `feature-extension` · S — [Cross-dimension: Partly implemented] The Notes and Reviews feature flags gate views but have no toggle · U0262, batch 3C
- [DEAD-77](../workstreams/settings.md#dead-77) · low · `needs-decision` · S — autoAssign.enabled has no UI, and the write-time and read-time default paths disagree · U0324, batch 10
- [DEAD-78](../workstreams/code-hygiene.md#dead-78) · low · `none` · S — Exported symbols nothing outside their own file imports · U0725, batch 5
- [DEAD-79](../workstreams/settings.md#dead-79) · low · `none` · S — The settings page's hand-written Feature union duplicates keyof FeatureSettings · U0262, batch 3C
- [DEAD-80](../workstreams/code-hygiene.md#dead-80) · low · `none` · S — Pass-through aliases left from earlier refactors · U0214, batch 5
- [DEAD-81](../workstreams/docs.md#dead-81) · low · `none` · S — Orphan comments, misplaced doc blocks and blank-line runs left by removed code · U0057, batch 12
- [DEAD-82](../workstreams/tests-ci-tooling.md#dead-82) · low · `none` · S — e2e fixture: seven helper methods and three types no spec uses · U0630, batch 5
- [DEAD-83](../workstreams/tests-ci-tooling.md#dead-83) · low · `none` · S — Dead code in the utils test helpers and dead test locals · U0740, batch 5
- [DEAD-84](../workstreams/tests-ci-tooling.md#dead-84) · low · `none` · S — tsconfig type-checks the stale, untracked build/ folder left from the removed distDir 'build' · U0652, batch 11
- [DEAD-85](../workstreams/tests-ci-tooling.md#dead-85) · low · `none` · S — Leftover config: a comment about a nonexistent 'chromium' project, an orphan comment, a redundant npm script, an unused next/image option · U0645, batch 5
- [DEAD-86](../workstreams/docs.md#dead-86) · low · `none` · S — Two tracked screenshots in docs/manual-test-evidence are not referenced anywhere · U0620, batch 12
- [DEAD-87](../workstreams/tests-ci-tooling.md#dead-87) · low · `needs-decision` · S — Enable noUnusedLocals/noUnusedParameters as a ratchet once the tree is clean · U0651, batch 11

## Commit groupings suggested by the reviewer

Superseded by the work units where they differ; kept because they show what the reviewer expected to land together.

- **Duration and fiscal date parsing fixes** — DEAD-01, DEAD-06. Both fix how the smart-input parsers turn text into stored dates and durations, and each comes with reproducer tests.
- **Note metadata token fix** — DEAD-03. One shared builder fixes the three note call sites that drop metadata.
- **Tutorial fixes and targets** — DEAD-02, DEAD-73, DEAD-74. Fixes the tutorial crash and cleans up its data-tutorial targets in one pass over the same selector inventory.
- **Add-todo, print and Help heading fixes** — DEAD-04, DEAD-08, DEAD-75. Three small, independent user-visible fixes, each with its own test or screenshot.
- **Work-hours per-day mode** — DEAD-05. Needs the owner's sign-off on semantics and touches five schedule readers; isolate it.
- **Storage backend detection** — DEAD-07. A single production-only bug with its own non-minification test.
- **SettingsModel singleton removal and test-only model helpers** — DEAD-09, DEAD-66. Removing the singleton rewrites the same test setup that uses reset_DONOTUSE, raw_DONOTUSE and the singular factories.
- **SettingsModel dead members** — DEAD-15. Large deletion confined to one model and its test file; split by section if it nears 1000 lines.
- **Model dead getters** — DEAD-16, DEAD-54. Model getter deletions plus their docs; split by model if it nears 1000 lines.
- **Model settings plumbing and entity-manager echo** — DEAD-17, DEAD-55. Both remove constructor and factory parameters that the hooks thread through without reading.
- **Gantt Show Weekends** — DEAD-10. One setting decision with a visible week-grid change.
- **Notes settings** — DEAD-11. Wires (or removes) three related Notes settings and the NotesView prop together.
- **Kanban default view** — DEAD-12. One setting decision confined to KanbanTab and KanbanView.
- **Auto-assign defaults** — DEAD-13, DEAD-77. Both change TodoApp.handleSubmit's auto-assign block and must agree.
- **Notification interval and sprint backlog settings** — DEAD-25, DEAD-26. Two small inert-setting decisions with no shared code; bundled to keep the commit count down.
- **Feature-flag settings** — DEAD-76, DEAD-79. Both concern the FeatureSettings flags on the settings page and GeneralTab.
- **TodoItem dead edit path** — DEAD-14. About 150 lines of removal across TodoItem, ListView and TodoApp; lands before the other TodoItem items.
- **Unread props** — DEAD-18, DEAD-27, DEAD-36, DEAD-44. Interface-and-caller prop removals that typecheck verifies end to end.
- **Dead functions, state, locals and refs in components** — DEAD-19, DEAD-28, DEAD-29, DEAD-30, DEAD-37, DEAD-38. Removals local to each file in views, overlays and items, with no interface changes.
- **Unreachable branches in components** — DEAD-31, DEAD-32, DEAD-34, DEAD-35. Branch and condition pruning in components, verified by the component suites and baselines.
- **Shared component options and settings fallbacks** — DEAD-39, DEAD-43, DEAD-45. Narrows shared and settings component surfaces, with the migrateSettings guard test first.
- **Half-wired view features** — DEAD-23, DEAD-24, DEAD-42. Owner decisions on three partly built view affordances; implement or remove each as decided.
- **Task comments** — DEAD-20, DEAD-21. Delete the orphaned Comments.tsx and restore editing and deleting of task comments through Activity in one coherent change.
- **Formatter consolidation and utils shims** — DEAD-22, DEAD-65. Both repoint imports to their canonical utils and delete the aliases.
- **Service worker** — DEAD-46, DEAD-47, DEAD-48, DEAD-49. All the sw.js and service-worker hook/provider changes verified together against serviceWorkerSource.test and an offline run.
- **Styling, fonts and icon defaults** — DEAD-50, DEAD-51, DEAD-52, DEAD-53. CSS, font and icon-attribute changes checked with one visual-suite run.
- **Hook surface trimming** — DEAD-56, DEAD-57, DEAD-58, DEAD-59, DEAD-60. Hook-local deletions and simplifications covered by the hook test suites.
- **Storage layer cleanup** — DEAD-61, DEAD-62, DEAD-63, DEAD-64. storage.ts, backup.ts and types cleanups verified by the storage and backup suites.
- **Utils test-only exports, part 1** — DEAD-67, DEAD-68, DEAD-69, DEAD-70. Test-only helpers in browserApis, reviewUtils, autoDetection and notifications, deleted with their tests.
- **Utils test-only exports, part 2, and import options** — DEAD-71, DEAD-72. The remaining test-only helpers and import.ts options, keeping the chronoCustom harness intact.
- **Utils locals, parameters and branches** — DEAD-33, DEAD-40, DEAD-41. tsc-flagged and unreachable code in chronoCustom, ganttScheduler, autoDetection, export and richText.
- **Exports and aliases** — DEAD-78, DEAD-80. Cosmetic un-exporting and alias inlining, done after the deletions that change these symbols.
- **Comment sweep** — DEAD-81. Comment- and whitespace-only commit after the code deletions, coordinated with Documentation.
- **Test and tooling cleanup** — DEAD-82, DEAD-83, DEAD-84, DEAD-85, DEAD-86. e2e fixture, test helpers, tsconfig, Playwright and next config, and docs assets: no product code.
- **Unused-code ratchet** — DEAD-87. Turns on the compiler flags once every earlier package has left the tree clean.

## Dependencies

Inside this dimension:
- DEAD-09 (singleton) lands before DEAD-15 (SettingsModel members), DEAD-66 (test-only model helpers) and DEAD-83 (testHelpers). It removes getInstance, reset_DONOTUSE and resetSettingsModel_DONOTUSE and the testHelpers.ts:73 re-export those items would otherwise touch.
- The owner decides DEAD-12, DEAD-13, DEAD-25, DEAD-26 and DEAD-77 before DEAD-15, which deletes their unused getters (activeKanbanView, defaultRecurring, notificationCheckInterval, showBacklogInSprint and the autoAssign.enabled checks).
- DEAD-11 owns NotesView.notesSettings, so DEAD-18 must not remove it independently.
- DEAD-01's day-length decision comes before DEAD-19 deletes GanttView._parseDuration, which documents the 8-hour assumption.
- DEAD-06 comes before DEAD-40, so the fiscal helpers' `_dt` is fixed, not stripped.
- DEAD-02 comes before DEAD-31 (both edit TutorialOverlay). DEAD-74 comes before DEAD-73 (rename gantt-scheduling, then remove the leftovers).
- DEAD-14 comes before DEAD-30, DEAD-31 and DEAD-42, which all edit TodoItem.tsx.
- DEAD-23 owns NoteDetailView.contentEditorRef, so DEAD-30 excludes it.
- DEAD-20 and DEAD-21 land together.
- DEAD-21 and DEAD-31 both change TodoDetailsOverlay's four render sites (comment handlers added; isOpen removed). Land in either order, but rebase carefully.
- DEAD-16 comes before the optional ReviewActivityType narrowing in DEAD-64, and before checking whether utils/commentMutations latestComment has become dead.
- DEAD-47 comes before DEAD-49 (both edit sw.js).
- DEAD-78, DEAD-80 and DEAD-81 come after all deletions.
- DEAD-87 comes last, after DEAD-19, DEAD-37, DEAD-38, DEAD-39, DEAD-40, DEAD-41 and DEAD-83 leave tsc --noUnusedLocals --noUnusedParameters clean.

Against other dimensions:
- Logic and business-logic bugs owns DEAD-01 to DEAD-09, DEAD-74 and the logic side of DEAD-77. Deduplicate them there.
- Partly implemented features owns the decisions and implementations of DEAD-10 to DEAD-13, DEAD-21, DEAD-23, DEAD-24, DEAD-25, DEAD-26, DEAD-58, DEAD-69 (detectAssignedPeople), DEAD-72 (CSV mapping UI) and DEAD-76. Each removal path here waits for that decision.
- Duplication to consolidate: DEAD-22 (formatters) and the backup.ts/useBackups overlap noted in DEAD-63 should be applied once. Run duplication merges that touch the same files (e.g. the List/Notes filter helpers in DEAD-37) after these deletions, so they consolidate less code.
- Documentation cleanup: DEAD-81 overlaps it directly. DEAD-15, DEAD-16, DEAD-17 and DEAD-54 also edit docs/todomodel-*.md and docs/personmodel-projectmodel-summary.md; apply those doc edits in the same commits.
- Error, validation and string messages: the CalendarView hint copy (DEAD-24), the Gantt Zoom tutorial text (DEAD-74) and the misleading sprint help text (DEAD-26) need copy review.
- Missing or wrong logging: DEAD-46 removes an empty '// Debug logging' stub. Any logging added to ServiceWorkerProvider should land after it.
- UI design review: DEAD-34, DEAD-42, DEAD-50, DEAD-52 and DEAD-53 involve visible or accessibility choices. DEAD-43 narrows IconButton and other shared components, so land it before any UI redesign of them, or align the two.
- Opportunities to improve support: DEAD-47 option (b) (version and clear-cache in Settings) and DEAD-48 (Android notifications through registration.showNotification) are support items.
- Restructuring for consistency: DEAD-78 (export conventions) and DEAD-45 (settings access) should follow any restructuring of settings tabs. DEAD-87 sets a repo-wide convention.
- Inconsistencies: DEAD-75 and DEAD-79 are drift between hand-written lists and registries.
- Security review: no direct dependency. DEAD-67 removes jest-global code from the production module graph.

## Open questions

- [ ] Settings controls that save but do nothing: should each be wired up as a feature fix (recommended, following the precedent of 9d3943d for the Focus settings) or removed as a visible control? This applies to Gantt Show Weekends, Kanban Set as Default, the three Notes settings, the auto-assign Recurring default, the notification check interval and sprint Show Backlog.
- [ ] Duration parsing: is a 'd' an 8-hour workday (what GanttView's unused _parseDuration assumed) or 24 hours (SmartInput's range builder), and do the 1m/2m/3m suggestions mean minutes or months?
- [ ] Work hours: should per-day mode be derived from whether any custom schedule exists, or stored as an explicit mode? And should switching back to weekday/weekend mode clear the custom schedules?
- [ ] Should new notes open with the cursor in the body (implement autoFocusContent), or should the unused plumbing be removed?
- [ ] Should double-clicking a day in the Calendar create a todo due that day (wire onQuickAdd), or should the dormant quick-add UI be removed?
- [ ] Should editing and deleting task comments be restored in TodoDetailsOverlay, matching notes, people, projects and sprints?
- [ ] When there are no reviews, should the Reviews view show its 'No Reviews' empty state above the add buttons, or keep today's always-visible sections?
- [ ] Should the note lists in person and project overlays and in NotesView colour markers and links like the other lists, or should those unused props simply be deleted?
- [ ] Service worker: should the app version and a 'clear offline cache' action appear in Settings, or should clearCache, getVersion and their sw.js handlers be deleted? Is server push ever planned, or can the push and notificationclick listeners go?
- [ ] Should icons be aria-hidden by default (accessibility fix), and should the app render in Geist Sans or stay on Arial (dropping the unused Geist download)?
- [ ] Should detectAssignedPeople (ask/tell/cc becomes the assignee) become a feature, or be deleted?
- [ ] Should templates be editable (wire updateTemplate), or should updateTemplate be deleted?
- [ ] Commit 1162756 deliberately kept activeSprints, archivedSprints, clearFieldHistory, clearAllHistory and getTopUsed. Can they go now?
- [ ] Should any test-only utils (for example focusSessionsInPeriod) be kept as planned API rather than deleted with their tests?
- [ ] Should TodoApp honour autoAssign.enabled, or should the field be retired, given it has no UI and defaults to true?
- [ ] Is a CSV column-mapping UI planned? If not, can FieldMapping and DEFAULT_CSV_MAPPING be inlined?
- [ ] Was DYNAMIC_CACHE the intended bucket for _next/static files in sw.js, or can that shadowed branch be deleted?
- [ ] Should the two unreferenced screenshots in docs/manual-test-evidence be embedded in the report or removed?
- [ ] Once the tree is clean, should noUnusedLocals and noUnusedParameters be enabled in tsconfig (or no-unused-vars made an ESLint error) as a ratchet?
- [ ] Should settings.kanban.activeViewId and other retired fields stay in the Settings type for old data, or be stripped by a migration?

## Dropped during synthesis

- HelpOverlay/NoteAddModal/BatchEditModal 'double isOpen' check — The verifier refuted it: both checks execute, and Modal's own check serves its other callers. Stylistic redundancy, not dead code.
- InfoTooltip duration-150 class as dead CSS — Not dead: it is a core Tailwind utility that emits transition-duration. Kept only as a browser check inside DEAD-52.
- Stripping `_dt` from getEndOfFiscalQuarter/Half/Year as unused plumbing — Not dead code. It is the point where the fiscalYearStart setting is dropped, so it became bug item DEAD-06; DEAD-40 explicitly excludes it.
- Deleting DEFAULT_PRIORITIES from src/utils/__tests__/testHelpers.ts — The verifier corrected this: createTestSettings uses it at line 88. Only its export keyword is unused, which DEAD-83 notes as optional.
- FocusTab.tsx:203 blank-line hole — The verifier found a single blank line, not a run.
- Orphan comment at Comments.tsx:11 — Moot: the whole file is deleted by DEAD-20.
- Deleting hideNotification, hideConfirmDialog, recordSelection and activeSprints function bodies — The verifier corrected this: each is used inside its own hook. Only their removal from return objects remains, in DEAD-57.
- Deleting useDebouncedSave's {flush, cancel} return and SharedStore.reset/flush as dead — Deliberate seams: flush/cancel were designed in b094a36 for saving on close, and reset is the documented test seam. Recommended to keep (noted in DEAD-57 and the context).
- Markdown export omitting assignees and projects — A partly implemented feature, not dead code. Forwarded to the Partly implemented features dimension; the stale export.ts:64 note itself is fixed in DEAD-81.
- Gantt Zoom tutorial step text says 'Day view / Week view' — A copy issue, forwarded to the Error, validation and string messages dimension; the selector fix is DEAD-74.
- Pointing the notes tutorial at the notes-* toolbar elements — A feature idea, not cleanup. Left as an owner option inside DEAD-73.
- Drawing SprintDetailsOverlay's computed ideal burndown line — A feature idea. Left as an owner option inside DEAD-28.
- Escape leaving list drag mode, and an H4 toolbar button — Feature ideas raised while proposing DEAD-36 and DEAD-31; not part of dead-code removal.
- Deleting the local untracked build/ directory — An untracked, git-ignored artefact the owner deletes by hand. Mentioned as a manual step in DEAD-84; no commit needed.
- Separate 'unused React import' entries across slices — Merged: the Review views' imports are in DEAD-37, Icons.tsx is in DEAD-39.
- Separate per-slice findings for settings that are never read — Merged: the hooks slice's bundled 'seven settings' finding and the shared slice's per-setting findings were deduplicated into DEAD-10 to DEAD-13, DEAD-25, DEAD-26 and DEAD-77.
- Separate per-slice findings for useServiceWorker helpers and sw.js handlers, and for task-comment edit/delete — Merged into DEAD-47 and DEAD-21 respectively.
- npm scripts bump:major, bump:minor, setup:hooks, test:e2e:headed, test:e2e:debug, test:full, clean — Checked during synthesis and not dead. They are maintainer entry points, and the e2e ones are documented in docs/e2e-testing.md. Only test:smoke:quick is redundant (DEAD-85).

## Coverage gaps

No slice's finder failed; all four slices returned verified findings with no refutations. Areas read only partly or not at all:
- Views slice: TodoApp.tsx about lines 541-600 skimmed; ProjectsView.tsx beyond line 70 checked by grep only, on the assumption it mirrors PeopleView; TutorialOverlay static step data (lines 20-130) and each view's tutorial step arrays skimmed; BatchEditModal.tsx lines 120-317 checked by grep only; help/*Section.tsx prose not read line by line.
- Shared slice: Icons.tsx lines 200-1040 skimmed through the export list (every icon was still checked for a renderer); tests in shared/__tests__, providers/__tests__ and settings/components/__tests__ not read.
- Hooks/models/types/storage slice: __tests__ files grepped, not read.
- Utils/tooling slice: src/utils/__tests__/testHelpers.ts mostly skimmed; the other utils test files only searched; docs/*.md searched for references, not read; public binaries checked by reference only; resources/ (icon design sources), .claude/, .github/copilot-instructions.md and the two claude*.yml workflows not reviewed.
- No reviewer read: src/__tests__/serviceWorkerSource.test.ts and src/__tests__/setup.ts; the Playwright spec files in e2e/ (only searched for references and fixture use); README.md and CHANGELOG.md; .vscode/tasks.json (trivial).
- Dependency usage was checked by the utils slice and re-confirmed during synthesis by grep: all runtime and dev dependencies are referenced.
- CSS outside src/app/globals.css was not looked for, and Tailwind class usage in components was not audited against config beyond the InfoTooltip animation classes.
