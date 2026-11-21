# 11. Partly implemented features

72 items: 19 high, 32 medium, 21 low. Each reviewer batch was checked against the code by an adversarial verifier (4 findings refuted outright, others corrected). Every item links to its full text; the unit and batch after each title say where the work is scheduled.

## Context

Three slices fed this dimension: the UI surface, the data layer, and a parity matrix of entities against capabilities. An adversarial verifier checked all three. The pattern behind almost every partly implemented feature in Doit is "built but not wired". The storage, hook and model half of a feature exists, often with unit tests, and the last connection is missing: a prop passed, a setting read, a handler called.

The evidence is consistent:
- SettingsModel getters with no callers: defaultRecurring, notificationCheckInterval, showBacklogInSprint, activeKanbanView.
- Hook functions that are returned but never destructured: editTodoComment and deleteTodoComment (useTodos), updateTemplate (useTemplates), getSuggestions (useSearchHistory), clearAllHistory (useSelectionHistory), focusSessionsInPeriod (focusReport).
- Optional props that no caller passes: CalendarView.onQuickAdd, EmptyState.actionLabel/onAction, NoteItem.linkPatterns.
- Props that are accepted and then underscored: NoteDetailView.autoFocusContent, KanbanView.onUpdateKanbanSettings.
- createSharedStore, which has exactly one caller (settingsStore).

To a grep every one of these looks like dead code, but each is the intended read path of a feature the UI already advertises. The Dead-code dimension must not remove them while this backlog is open.

The problems concentrate in four places.

1. TodoApp.tsx, where most of the missing wiring lives:
   - handleSubmit ignores templates, the default recurrence, the auto-assign master switch and a calendar quick-add date.
   - The document key handler covers N, /, F and D on only some views and checks no feature flags.
   - The command palette and the hand-written viewFeatureMap ignore the view registry.
   - The detail overlays get raw delete functions.
   - The note-conversion closures read stale state.

2. The settings tabs hold about ten controls that are stored but do nothing (NotesTab ×3, KanbanTab default view, GanttTab showWeekends, SprintsTab showBacklogInSprint, NotificationsTab checkInterval, AutoAssignTab recurring/enabled), do half their job (KanbanTab showEmptyColumns, WorkHoursTab custom mode and disabled days), or apply only once (the CalendarTab default view and the GanttTab collapse setting).

3. View parity. List received features first: the undo toast, select-all, filtered export, a global details overlay with every prop. Kanban, Gantt, Calendar and Notes lag behind. Kanban, Gantt and Calendar each render a local TodoDetailsOverlay that has drifted; src/components/overlays/todoActionProps.ts exists precisely to stop that drift and should carry every new overlay prop. Help and the tutorials also lag the view registry: digits are hard-coded, cards are missing, and Stats and Time have no tutorial steps, which crashes the page.

4. Data layer. The highest-value gaps are:
   - Persistence robustness: a failed load overwrites stored data, switching back to localStorage is undone on reload, and two tabs overwrite each other.
   - The import/export round trip: exports write relative dates, and import does not recognise its own format.

Leave these alone; they are in good shape:
- Backups are prefix-based and cover every doit- key.
- The rename cascade covers filters, presets, auto-assign, templates and action items. The one gap is the in-memory selection history (PART-47).
- viewRegistry.ts itself is sound; the fix is to make more consumers use it.
- NotesView.selectAllVisible and ListView.handleExport are the patterns to copy.
- usePersistedViewOptions works as written.

Deliberate omissions that must not be rebuilt as "completion":
- Review comments, removed in 1162756 (D8).
- The TemplatesManager 'Use' button, removed in 213b082.
- Sprint story points, a deferral noted in a comment.
- Probably deliberate as well: sprint edits allowed only while planning, and completing a review having no undo.

Commit 70 deleted other no-op settings. The owner's rule for this sweep forbids that route for the ones that remain, so each one is completed or put to the owner.

An implementer must understand the following before touching anything:
1. Making a dormant setting live changes behaviour for users who set it long ago and saw nothing happen. Such items are marked feature-extension or needs-decision, and defaults should reproduce today's behaviour.
2. usePersistedViewOptions writes the merged defaults back as soon as it loads. Any "seed from settings when nothing is persisted" therefore applies effectively once, and PART-20, PART-24 and PART-31 need one shared rule.
3. Person and project ids hold names.
4. TodoModel.isCompleted excludes archived todos, and migrateTodos auto-archives completed todos after archiveDays, which may be 0.
5. useConfirmDialog holds a single dialog slot, so it must never be called in a loop.
6. TodoApp's key handler is on document, GanttView's is on window, and FocusView and OpenFocusView listen on document. Window listeners fire after document listeners and nothing checks defaultPrevented.
7. TodoDetailsOverlay is mounted four times.
8. Schedule resolution is copied in five places: ganttScheduler.getScheduleForDate, SettingsModel.getScheduleForDate, dateUtils.getBodEodFromWorkHours, and chronoCustom getBod and getEod. Custom mode and the disabled-day flag have to be fixed through one helper.
9. Run Playwright with PLAYWRIGHT_PORT set. The visual suite tolerates a 1-2% difference, so regenerate baselines when a layout really changes.

## Items, high to low

- [PART-01](../workstreams/storage-core.md#part-01) · high · `bugfix` · M — A failed load lets entity hooks write an empty list over stored data · U0137, batch 2A
- [PART-02](../workstreams/storage-core.md#part-02) · high · `bugfix` · M — Switching to localStorage is reverted on reload, and everything written in between is wiped · U0087, batch 2A
- [PART-03](../workstreams/undo-confirm.md#part-03) · high · `bugfix` · S — Person and project detail overlays delete on one click, with no confirm · U0480, batch 3C
- [PART-04](../workstreams/undo-confirm.md#part-04) · high · `bugfix` · S — Deleting a sprint asks for no confirm and leaves todos pointing at it · U0415, batch 3A
- [PART-05](../workstreams/todos-core.md#part-05) · high · `bugfix` · S — List 'Select all' also selects filtered-out and hidden todos · U0236, batch 3A
- [PART-06](../workstreams/undo-confirm.md#part-06) · high · `bugfix` · M — The todo undo toast and the dependency-block notice appear only in List view · U0247, batch 3A
- [PART-07](../workstreams/cross-tab.md#part-07) · high · `bugfix` · L — Cross-tab sync reaches settings only, so other collections overwrite each other across tabs · U0071, batch 2C
- [PART-08](../workstreams/keyboard-help.md#part-08) · high · `bugfix` · S — The view tutorial button crashes the app on Stats and Time · U0446, batch 3C
- [PART-09](../workstreams/keyboard-help.md#part-09) · high · `bugfix` · M — Gantt's window key handler eats typing in overlays and fires alongside other handlers · U0337, batch 3C
- [PART-10](../workstreams/import-export.md#part-10) · high · `bugfix` · S — Notes export ignores active filters, although the menu says 'Exports filtered notes' · U0485, batch 2B
- [PART-11](../workstreams/notes.md#part-11) · high · `bugfix` · S — Notes bulk delete deletes only the last selected note · U0703, batch 3B
- [PART-12](../workstreams/import-export.md#part-12) · high · `bugfix` · M — Import cannot read the app's own JSON or CSV export · U0099, batch 2B
- [PART-13](../workstreams/import-export.md#part-13) · high · `bugfix` · M — Exports write relative due-date text and leave out most todo fields · U0097, batch 2B
- [PART-14](../workstreams/todos-core.md#part-14) · high · `bugfix` · M — Applying a template ignores its stored metadata and subtasks · U0459, batch 3A
- [PART-15](../workstreams/notes.md#part-15) · high · `bugfix` · M — Todos converted from action items lose their people, project, date and priority markers · U0654, batch 3B
- [PART-16](../workstreams/stats-time-focus.md#part-16) · high · `bugfix` · S — Completion stats and sprint velocity and burndown ignore archived todos · U0363, batch 3B
- [PART-17](../workstreams/kanban.md#part-17) · high · `bugfix` · S — The Kanban 'Rejected' column never shows a card · U0219, batch 3B
- [PART-18](../workstreams/settings.md#part-18) · high · `bugfix` · S — Work Hours' 'Custom schedule for each day' mode is not saved, but custom schedules still apply · U0309, batch 3B
- [PART-19](../workstreams/settings.md#part-19) · high · `bugfix` · M — Days marked 'Disabled' in Work Hours are still scheduled · U0311, batch 3B
- [PART-20](../workstreams/notes.md#part-20) · medium · `feature-extension` · S — Notes settings (pin new notes, show archived, default sort) are never read · U0299, batch 10
- [PART-21](../workstreams/activity-comments.md#part-21) · medium · `feature-extension` · S — Todo comments can be added but not edited or deleted · U0151, batch 10
- [PART-22](../workstreams/overlays-dialogs.md#part-22) · medium · `feature-extension` · M — Detail overlays opened from Kanban, Gantt and Calendar lack sprints, tag suggestions, selection history and the note link · U0212, batch 3C
- [PART-23](../workstreams/notes.md#part-23) · medium · `feature-extension` · S — Calendar quick-add is built but never wired up · U0691, batch 10
- [PART-24](../workstreams/kanban.md#part-24) · medium · `feature-extension` · S — Kanban's 'Set as Default' view and kanban.activeViewId are never read · U0292, batch 10
- [PART-25](../workstreams/kanban.md#part-25) · medium · `bugfix` · S — Kanban's 'Show empty columns' setting only hides the 'No tasks' text · U0294, batch 6B
- [PART-26](../workstreams/kanban.md#part-26) · medium · `feature-extension` · S — Kanban's filter panel lists only the first five people, projects and tags · U0215, batch 6B
- [PART-27](../workstreams/settings.md#part-27) · medium · `bugfix` · S — Auto-assign's 'Default Recurring' is never applied · U0270, batch 10
- [PART-28](../workstreams/gantt-scheduling.md#part-28) · medium · `feature-extension` · S — Gantt's 'Show Weekends' setting is never read · U0286, batch 10
- [PART-29](../workstreams/sprints.md#part-29) · medium · `needs-decision` · S — The Sprints setting 'Show backlog items in sprint view' does nothing · U0308, batch 10
- [PART-30](../workstreams/notifications.md#part-30) · medium · `needs-decision` · S — The notification setting 'Check for due tasks every' is ignored · U0737, batch 6B
- [PART-31](../workstreams/view-state.md#part-31) · medium · `needs-decision` · S — Calendar's 'Default View' and Gantt's 'Collapse Completed' apply only on the very first visit · U0729, batch 6C
- [PART-32](../workstreams/settings.md#part-32) · medium · `bugfix` · S — The templates, batch and reordering flags hide toolbar buttons only · U0469, batch 6C
- [PART-33](../workstreams/app-shell.md#part-33) · medium · `bugfix` · S — The disabled-view redirect keeps its own feature map and misses Time · U0447, batch 6C
- [PART-34](../workstreams/search.md#part-34) · medium · `bugfix` · S — The command palette returns items from disabled views · U0494, batch 6C
- [PART-35](../workstreams/settings.md#part-35) · medium · `feature-extension` · S — There is no toggle for the Notes and Reviews views · U0262, batch 3C
- [PART-36](../workstreams/keyboard-help.md#part-36) · medium · `feature-extension` · M — The shortcuts N, /, F, D and Escape work on only some views · U0467, batch 3C
- [PART-37](../workstreams/keyboard-help.md#part-37) · medium · `bugfix` · S — Hard-coded view digits in Help and the main tutorial point to the wrong views · U0433, batch 3C
- [PART-38](../workstreams/accessibility.md#part-38) · medium · `feature-extension` · M — List, note, person, project, sprint and review rows cannot be opened or toggled from the keyboard · U0197, batch 8B
- [PART-39](../workstreams/notes.md#part-39) · medium · `bugfix` · S — Converting a note to a todo never opens the new todo · U0460, batch 3B
- [PART-40](../workstreams/reviews.md#part-40) · medium · `bugfix` · M — Review entry notes: edited as plain text but shown as HTML, logged per keystroke, and completed reviews get rewritten · U0591, batch 3B
- [PART-41](../workstreams/reviews.md#part-41) · medium · `feature-extension` · M — Review projects and tags are shown, searched and renamed, but nothing can set them · U0592, batch 10
- [PART-42](../workstreams/search.md#part-42) · medium · `feature-extension` · S — Todo search skips context, subtasks, comments and recurrence, and the Sprints view searches differently from the palette · U0580, batch 6C
- [PART-43](../workstreams/stats-time-focus.md#part-43) · medium · `needs-decision` · S — 'Auto-extend duration' runs only on checkbox completion, and also shrinks estimates · U0145, batch 3B
- [PART-44](../workstreams/notifications.md#part-44) · medium · `needs-decision` · S — Due-task notifications fire once per todo, not once per kind or per due date · U0738, batch 3B
- [PART-45](../workstreams/notifications.md#part-45) · medium · `feature-extension` · M — Due-task notifications bypass the service worker: clicking does nothing, and the Android PWA shows none · U0743, batch 3B
- [PART-46](../workstreams/storage-core.md#part-46) · medium · `bugfix` · S — Storage initialization deletes the localStorage settings copy the theme script needs · U0776, batch 2A
- [PART-47](../workstreams/entity-names.md#part-47) · medium · `bugfix` · S — Renames update stored selection history but not the copy in memory, which then writes it back · U0569, batch 6A
- [PART-48](../workstreams/settings.md#part-48) · medium · `needs-decision` · S — Deleting a priority leaves todos pointing at it, and they show raw ids · U0306, batch 3B
- [PART-49](../workstreams/activity-comments.md#part-49) · medium · `feature-extension` · S — Activity links cover only recurrence and action items; other metadata prints as raw JSON · U0117, batch 3A
- [PART-50](../workstreams/todos-core.md#part-50) · medium · `feature-extension` · M — Templates cannot be edited, delete is hover-only and unconfirmed, and Help promises 'from scratch' · U0129, batch 10
- [PART-51](../workstreams/tests-ci-tooling.md#part-51) · medium · `none` · L — The E2E suite does not cover reviews, sprints, templates, import and export, backup, or undo · U0713, batch 1
- [PART-52](../workstreams/keyboard-help.md#part-52) · low · `feature-extension` · S — Help's Views section is only partly driven by the view registry · U0443, batch 3C
- [PART-53](../workstreams/keyboard-help.md#part-53) · low · `none` · S — Implemented shortcuts are missing from Help, the tutorial and the focus hints · U0439, batch 8A
- [PART-54](../workstreams/keyboard-help.md#part-54) · low · `feature-extension` · S — Tutorial anchors are broken or unused, so the Notes and Gantt tutorials cover only part of their UI · U0341, batch 8A
- [PART-55](../workstreams/keyboard-help.md#part-55) · low · `needs-decision` · M — Tutorials and tooltips describe behaviour that does not exist · U0209, batch 8A
- [PART-56](../workstreams/notes.md#part-56) · low · `feature-extension` · S — New notes do not put the cursor in their content, although TodoApp asks for it · U0691, batch 10
- [PART-57](../workstreams/settings.md#part-57) · low · `feature-extension` · S — Auto-assign's master 'enabled' switch has no control and is ignored when todos are created · U0324, batch 10
- [PART-58](../workstreams/code-hygiene.md#part-58) · low · `needs-decision` · S — Props that are accepted and silently ignored · U0210, batch 10
- [PART-59](../workstreams/reviews.md#part-59) · low · `feature-extension` · S — Reviews: archived reviews cannot be hidden, and the 'Other…' picker is missing for half-years and years · U0718, batch 10
- [PART-60](../workstreams/rich-text-html.md#part-60) · low · `feature-extension` · S — Link patterns are not applied in the Notes list or in Reviews · U0188, batch 10
- [PART-61](../workstreams/feedback-states.md#part-61) · low · `feature-extension` · S — EmptyState's call-to-action button is never used · U0660, batch 8A
- [PART-62](../workstreams/search.md#part-62) · low · `feature-extension` · M — Search and selection history are built but only partly used · U0733, batch 10
- [PART-63](../workstreams/visual-system.md#part-63) · low · `feature-extension` · S — Configured colours are ignored on Kanban card chips and the Stats priority bars · U0229, batch 8C
- [PART-64](../workstreams/stats-time-focus.md#part-64) · low · `needs-decision` · S — Stats shows time-tracking cards while Time Tracking is turned off · U0368, batch 8C
- [PART-65](../workstreams/entity-names.md#part-65) · low · `feature-extension` · S — A project's category cannot be set when creating it, and Projects neither shows nor filters by category · U0490, batch 10
- [PART-66](../workstreams/gantt-scheduling.md#part-66) · low · `needs-decision` · L — Help promises category-specific time blocks, and BreakPeriod.allowedCategories is declared but never wired · U0783, batch 10
- [PART-67](../workstreams/stats-time-focus.md#part-67) · low · `feature-extension` · M — Focus sessions cannot be tied to a task, and Time Reports has no session list · U0785, batch 10
- [PART-68](../workstreams/recurrence.md#part-68) · low · `needs-decision` · M — SmartInput misses recurrence phrases the parser accepts · U0520, batch 6A
- [PART-69](../workstreams/smart-input.md#part-69) · low · `feature-extension` · M — Usage history recorded for due dates, durations, recurrence and sprints is never used · U0472, batch 10
- [PART-70](../workstreams/import-export.md#part-70) · low · `feature-extension` · S — Import references people and projects without creating them · U0109, batch 10
- [PART-71](../workstreams/activity-comments.md#part-71) · low · `needs-decision` · S — Activity logging follows different rules for each entity · U0564, batch 6A
- [PART-72](../workstreams/storage-core.md#part-72) · low · `bugfix` · S — The storage usage breakdown leaves out templates, focus sessions and other app keys · U0093, batch 2A

## Commit groupings suggested by the reviewer

Superseded by the work units where they differ; kept because they show what the reviewer expected to land together.

- **Storage: never overwrite stored data after a failed load** — PART-01. Touches the load and save effects of all five entity hooks and the adapters' reads. It is the foundation for every other storage change, so it lands alone with its tests.
- **Storage backend switching and usage reporting** — PART-02, PART-46, PART-72. All three live in initializeStorage, the migration functions and StorageTab, so they share one set of fake-indexeddb tests.
- **Cross-tab sync rollout** — PART-07. L effort, touches every collection hook. Keep it in its own commit (split per hook if it nears 1000 lines) after PART-01.
- **Delete confirmations and reference cleanup** — PART-03, PART-04, PART-11. One confirm-flow change in TodoApp covering the entity overlays, sprint deletes and notes bulk delete, plus the bulk reference-clearing helper in useTodos.
- **List safety: select-all scope and app-level undo** — PART-05, PART-06. Both change ListView. Hoisting the undo stack and fixing select-all together keeps ListView's bulk-action code consistent.
- **Tutorials: missing steps and broken anchors** — PART-08, PART-54. Both edit TutorialOverlay and the per-view step arrays. One anchor-consistency test covers both.
- **Keyboard handler ownership and coverage** — PART-09, PART-36. Both rework the TodoApp and Gantt key handlers. Settle ownership first, then extend coverage, in one tested change.
- **Notes view completion** — PART-10, PART-20, PART-56. Filtered export, Notes settings and new-note focus all go through NotesView, useNotesViewState, useNotes and NoteDetailView.
- **Machine-readable export** — PART-13. Self-contained in export.ts. It must land before the import round trip relies on ISO dates.
- **Import round trip** — PART-12, PART-70. Both live in import.ts and ImportTab.handleImport, and are proven by the same round-trip tests.
- **Template apply** — PART-14. A bugfix in handleSubmit and buildTemplateFromTodo, kept apart from the feature-extension edit UI.
- **Template management** — PART-50. Edit mode, visible actions and delete confirm in Templates.tsx. A feature extension on its own.
- **Note-to-todo conversion** — PART-15, PART-39, PART-49. All three change the same conversion handlers in TodoApp: the metadata extractor, opening the new todo, and sourceNoteId with its Activity links.
- **Statistics correctness** — PART-16, PART-63, PART-64. All three change StatisticsView. The wasCompleted getter also feeds the sprint charts.
- **Kanban column correctness** — PART-17, PART-25. Both change the Kanban column resolver and the visibleStates computation.
- **Kanban settings and filters** — PART-24, PART-26, PART-29. Default view, full filter lists and the backlog setting all sit in KanbanView's options and filter panel.
- **Work-hours schedule resolution** — PART-18, PART-19. Both need one shared schedule resolver to replace five copies, fixed once.
- **TodoDetailsOverlay prop parity** — PART-21, PART-22. Both extend TodoActionProps and thread the new props through Kanban, Gantt and Calendar.
- **Auto-assign completion** — PART-27, PART-57. Both change handleSubmit's defaults block and AutoAssignTab.
- **Calendar and Gantt settings** — PART-23, PART-28, PART-31. Calendar quick-add, Gantt weekends and the default-view and collapse-on-every-open rule all concern these two views' settings.
- **Notification timing** — PART-30, PART-44. Both are in useTaskNotifications and notifications.ts, and are tested with the same fake timers.
- **Notifications through the service worker** — PART-45. Touches browserApis, sw.js and TodoApp's URL handling. Separate, because it needs its own validation and security review.
- **Feature-flag enforcement** — PART-32, PART-33, PART-34, PART-35. Gate the entry points, the redirect and the palette before shipping the Notes and Reviews toggles, all in TodoApp and GeneralTab.
- **Help derives from the registry** — PART-37, PART-52, PART-53. Help copy only. Land it after the keyboard package so it documents the final key map.
- **Tutorial and tooltip claims** — PART-55. Shift+click selection plus copy fixes, waiting on the owner's build-or-correct decision.
- **Keyboard-operable rows** — PART-38. One accessibility change applied across the item components.
- **Review editing** — PART-40, PART-41. Both change ReviewEditView, editReview and the review activity logging.
- **Reviews list and link patterns** — PART-59, PART-60. Additions to ReviewsView, ReviewDetailView and NotesView that do not touch the editing logic.
- **Todo search parity** — PART-42. A change to model search methods, with focused unit tests.
- **History-driven suggestions** — PART-62, PART-69. Both surface data that useSearchHistory and useSelectionHistory already record. Land after PART-47.
- **Auto-extend on completion** — PART-43. One rule helper, called from two completion paths, waiting on an owner decision.
- **Reference integrity** — PART-47, PART-48. Rename sync of the in-memory selection history, and priority-delete cleanup that reuses the PART-04 helper.
- **E2E coverage** — PART-51. New smoke specs, likely split into 2 to 3 commits, each landing after the fix it covers.
- **Unused props and empty-state actions** — PART-58, PART-61. Small prop-wiring decisions spread across components.
- **Project categories** — PART-65, PART-66. Both concern the project-category feature and the help text that promises it.
- **Focus session history** — PART-67. Confined to TimeReportsView and useFocusSession.
- **SmartInput recurrence detection** — PART-68. A regex change in autoDetection.ts with its own test table.
- **Activity logging rule** — PART-71. One rule applied across all entity hooks once the owner picks it.

## Dependencies

Inside this dimension:
- PART-01 lands before PART-07. Sync re-loads must respect the loadError guard, and both edit the same save effects.
- PART-02 and PART-46 both edit initializeStorage's cleanup loop, so they land together.
- PART-13 (ISO dates, full JSON) lands before PART-12 (import round trip).
- PART-04 adds the bulk reference-clearing helper that PART-48 reuses.
- PART-18 and PART-19 share one schedule resolver and land together.
- PART-21 and PART-22 both extend TodoActionProps and land together.
- PART-33 replaces viewFeatureMap with getEnabledViews, and PART-34 gates the palette. Both land before or with PART-35, so the Notes and Reviews toggles never ship with ungated entry points.
- PART-09 and PART-36 settle the key map before PART-37, PART-52 and PART-53 document it.
- PART-08 (and PART-54) land before PART-51's 'tutorial on every tab' spec. Likewise PART-06, PART-12 and PART-14 land before the undo, round-trip and template specs, unless those specs are written first as failing reproducers.
- PART-24 wires onUpdateKanbanSettings before PART-58 decides the remaining ignored props.
- PART-47 lands before PART-62 and PART-69, which all edit useSelectionHistory.
- PART-15's text-to-metadata extractor could be reused by PART-70's name matching.
- PART-20, PART-24 and PART-31 must follow one owner decision on how 'default' settings interact with persisted view options.
- PART-39 and PART-49 edit the same note-conversion handlers as PART-15.
- PART-10, PART-20 and PART-60 all touch NotesView; sequence them to avoid conflicts.

Against other dimensions:
- Dead-code removal: must run after this backlog, or must explicitly exclude these symbols, which look unused but are the intended read paths:
  - SettingsModel getters: defaultRecurring, notificationCheckInterval, showBacklogInSprint, activeKanbanView, and the auto-assign getters.
  - Hook functions: editTodoComment, deleteTodoComment, updateTemplate, getSuggestions, clearAllHistory, clearFieldHistory, focusSessionsInPeriod, getRecentSelections, _selectAllInSection, _deselectAllInSection.
  - Model, store and util members: TodoModel.dueDateISO, createSharedStore, getRecurringSuggestions.
  - Props: CalendarView.onQuickAdd, EmptyState.actionLabel and onAction, NoteItem.linkPatterns, NoteDetailView.autoFocusContent.
  - Fields: FocusSession.todoId, and BreakPeriod.allowedCategories until PART-66 is decided.
  Conversely, Dead-code owns AlternativesInput.showPreview, the review-comment leftovers (Review.comments, the ReviewModel comment getters, the empty block at useReviews.ts:392) and the orphan 'Background sync' comment if PART-45 drops it.
- Duplication: consolidating the five schedule resolvers should land with or before PART-18 and PART-19. The three local TodoDetailsOverlay copies (PART-22's larger option), one entity-delete confirm helper (PART-03, PART-04), Kanban's filter sections moving onto FilterSection (PART-26) and useSprints moving onto commentMutations (PART-71) overlap with that dimension; agree one owner per change.
- Restructuring for consistency: TodoActionProps as the single overlay contract, and getEnabledViews replacing viewFeatureMap (PART-33).
- Logic and business-logic bugs: PART-01, PART-02, PART-05, PART-11, PART-16, PART-17, PART-39 and PART-46 are also bugs; dedupe them in the central plan, keeping one id each. The raw sprint id shown as the List sprint group header, re-scoped out of PART-04, belongs to that dimension.
- Documentation cleanup: PART-37, PART-52, PART-53, PART-55, PART-66 and the help and README promises cited in PART-14, PART-21, PART-42 and PART-50 overlap. Land the behaviour first, then the copy, or agree that this dimension owns these help strings.
- Error, validation and string messages: the new confirm texts (PART-03, PART-04, PART-11), the calendar hint copy (PART-23) and the setting descriptions that depend on owner decisions (PART-29, PART-30, PART-31, PART-43) should not be rewritten by the strings dimension until those decisions land.
- Logging: PART-01 should log load and read failures, and PART-45 replaces a swallowed constructor error. Coordinate with the logging conventions.
- UI design review: PART-26, PART-38, PART-50 and PART-23 touch interaction design. Align with that dimension's patterns, such as focus-within reveal and touch targets.
- Security review:
  - PART-40 must keep sanitizeHtml on render when it moves to RichTextEditor.
  - PART-12 parses untrusted JSON and CSV, so it needs shape validation.
  - PART-45's ?todo= parameter must be validated.
  - PART-07's BroadcastChannel messages should carry only keys, never data.
- Opportunities to improve support: PART-02, PART-46 and PART-72 (storage diagnostics) overlap.
- Inconsistencies: most parity items here (PART-21, PART-22, PART-32, PART-36, PART-42, PART-60) are also inconsistencies; keep them here and cross-reference.

## Open questions

- [ ] Settings that seed view options (Notes sort and show-archived, the Kanban default view, the Calendar default view, Gantt's collapse-completed): should they apply only when nothing has been persisted, which in practice means once, because usePersistedViewOptions writes on the first load? Or should they override the persisted state on every open, with the view's own toggle lasting only for the session?
- [ ] Notification check interval: should the 5–60 minute setting be honoured, which notifies later than today's 1-minute polling? Or should a 1-minute option become the default, or the control be relabelled?
- [ ] Should due-soon, due-today and overdue each notify once per due date, which means more notifications than today, and should rescheduling re-arm a todo?
- [ ] 'Show backlog items in sprint view': which meaning is intended? (a) Additive: also list unsprinted todos when a specific sprint is selected. (b) Change the default to on, migrate existing settings, and then make the Backlog option depend on it. Hiding Backlog by default is ruled out.
- [ ] 'Auto-extend duration': extend only when tracked time exceeds the estimate (matching the label)? Or keep 'set the duration to the tracked time on completion' and relabel the setting?
- [ ] Disabled work days: should BOD/EOD shortcuts that land on a disabled day ('Saturday EOD') keep the stored times, or roll forward to the next enabled day?
- [ ] Template due dates are stored as absolute dates. When a template is applied, should the date be used as stored, skipped, or replaced by a relative offset?
- [ ] Deleting a priority that todos use: refuse while it is in use, or clear the field on those todos?
- [ ] Review projects and tags: add pickers to the review editor, or prefill them from the review's included tasks?
- [ ] The Kanban in-column reordering and Gantt drag-to-reschedule promised by the tutorials: build them, or correct the copy?
- [ ] Category-specific time blocks (Help text plus the unwired BreakPeriod.allowedCategories): build the feature, or correct Help and retire the field?
- [ ] With Time Tracking off, should Statistics hide its time-tracking cards or keep showing historical data?
- [ ] Ignored props: should FocusView gain Archive and Delete in its task menu? Should ReviewsView show completed-task counts on its period buttons? Should CreateTemplateModal use initialText for a preview? Or should each be removed?
- [ ] Should the 'workday' recurrence follow the configured work week instead of Monday to Friday?
- [ ] Activity logging: should comment events appear in the activity log for every entity, or for none, given that the timeline already shows comments?
- [ ] Which meaning should 't' have on Gantt: jump to today, or open the focus timer?
- [ ] Cross-tab sync: is the small notify-and-reload approach enough, or should every collection move onto createSharedStore with coalesced writes?
- [ ] Should Notes and Reviews get on/off toggles like the other optional views (a feature extension), or are they meant to be always on?
- [ ] Templates 'from scratch' (promised in Help): add a 'New template' entry, or correct the copy?

## Dropped during synthesis

- Sprint velocity counts tasks; story-point weighting was left for later — The verifier refuted this: no story-point field exists anywhere, and the comment at SprintDetailsOverlay.tsx:138 records a deliberate deferral, not a half-built feature. The real velocity defect, archived todos being dropped, is covered by PART-16.
- Migration normalisers cover only todos and settings; notes and reviews load raw — Refuted: the Note and Review shapes have not changed since they were introduced, so no older stored shape lacks their arrays. The only crash path is a hand-crafted or corrupt file, which is an input-validation question for the Security dimension.
- Review comments: deliberately removed, with scaffolding left behind (data-layer and parity slices) — Refuted twice as a partly implemented feature: commit 1162756 removed review comments on purpose (D8). The leftover Review.comments field, the ReviewModel comment getters and the empty block at useReviews.ts:392 belong to the Dead-code dimension. The persisted field must stay readable.
- Reviews part of the 'N, / and F do nothing' finding — The verifier removed it: ReviewsView has no search box, and reviews are created per period, so no single target exists. The rest of the finding is merged into PART-36.
- Claim that a deleted sprint's todos group under a raw id in List — Re-scoped by the verifier: List's sprint grouping uses the raw sprint id as the header for every sprint, deleted or not. That is a display bug for the Logic-bugs dimension, not part of PART-04.
- The parity matrix's 'probably deliberate' cells: sprint edits only while planning, no undo for completing a review — The reviewer judged both as deliberate product choices, not unfinished rollouts, and raised no finding for either.
- Parity-matrix gaps raised without a finding: no undo for person, project, sprint or template deletes; templates missing from the command palette; review activity showing only the last 5 entries; no in-view search, sort or presets for reviews, people, projects or sprints — These are capability gaps between entities, not started-and-unfinished features. The reviewer raised no finding, and no evidence shows a partial implementation. The delete-safety part is covered by PART-03, PART-04 and PART-50 (confirm dialogs). The remaining gaps are better weighed by the Inconsistencies dimension.
- Separate findings merged rather than dropped — No finding was removed by merging. The tutorial crash, templates, notes settings, todo comments, notes export, Kanban default view, backlog setting, recurring default, check interval and showWeekends were each reported by two or three slices and kept once with their locations combined. Bundled findings were split: the parity slice's Help finding became PART-37, PART-52 and PART-53; the ui-surface feature-toggle finding became PART-32, PART-33 and PART-64; the overlay-delete finding became PART-03, PART-04 and PART-48; the templates findings became PART-14 and PART-50; the Reviews finding became PART-59 and PART-60; the small-capabilities finding became PART-60 and PART-61; the project-category finding became PART-65 and PART-66.

## Coverage gaps

All three slices returned findings; no finder failed. Combining the three coverage notes, no reviewer read the following in full, and some not at all:

- Settings tabs: BackupTab, CategoriesTab, LinksTab, MarkersTab and DateTimeTab, plus everything under src/components/settings/components/. PrioritiesTab and FocusTab were read only at the cited lines.
- src/components/input/RichTextEditor.tsx: the body and internals, beyond the autofocus and link-pattern lines.
- Overlays only skimmed or searched: BatchEditModal, NoteAddModal and OpenFocusSetup. FocusView and OpenFocusView were read only around their key handlers. NoteDetailView was read only at its props, autofocus and Activity lines.
- src/components/shared, most of it: FilterSection, SearchableDropdown, MarkedText, Subtasks, TimeTracking and the rest.
- Item components other than TodoItem: NoteItem, EntityItem, SprintItem and ReviewItem were seen only by grep.
- Views read only in part: TimeReportsView after line 420, and most of CalendarView and GanttView, which were read in targeted sections.
- Help sections read only in part or not at all: FilteringSection, InputSection, ProductivitySection, SettingsSection and TimeTrackingSection.
- Hooks no reviewer reached: useViewPresets, useUndoableActions, useEntityCounts, useDebouncedSave, useServiceWorker, usePomodoroTimer, useDragReorder and the other UI-only hooks. useListViewState, useNotesViewState and useSettings were read only in part.
- Models: the PersonModel, ProjectModel and BaseEntityModel bodies were read only for matchesSearch and canDelete. TodoModel was read to about 60%, and NoteModel and ReviewModel only by grep.
- Utils: focusModes, noteTemplates, activityLogger and src/utils/richText/ were not reached. dateUtils and chronoCustom were read only for their schedule resolvers, autoDetection only for recurrence detection, and ganttScheduler only for its scheduling and break-skipping sections.
- Types read only at the head or not at all: time.ts, priority, linkPattern, markerColors, token and selectionHistory.
- public/sw.js: only the push, notificationclick and background-sync lines.
- scripts/, .github/workflows/ and most of docs/: no reviewer read them. Only README.md, CHANGELOG.md and docs/due-date-feature.md were compared against the code.
- e2e/: spec titles were listed and grepped; specs were not read in full.
- src/app: only settings/page.tsx was read in full, with the cited lines of layout.tsx and error.tsx.

No reviewer could run the app or any tests. All findings come from reading the code, including the Gantt keyboard conflict and the tutorial crash.
