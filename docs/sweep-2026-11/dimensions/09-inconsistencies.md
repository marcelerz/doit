# 9. Inconsistencies across the codebase

91 items: 24 high, 33 medium, 34 low. Each reviewer batch was checked against the code by an adversarial verifier (1 finding refuted outright, others corrected). Every item links to its full text; the unit and batch after each title say where the work is scheduled.

## Context

I merged the three slices (across views, across entities, data and platform) into 91 items. The verifier corrected or narrowed several findings and refuted one sub-claim. Most problems share one root: a concept is computed where it is used instead of once in the model. Overdue, due today and due this week are computed in TodoModel getters, again with inline diffDays in useListViewState.groupTodos, and again in CalendarView and KanbanView. 'Done' means state === 'completed' in SprintsView, SprintItem, SprintDetailsOverlay and StatisticsView, but isCompleted || isArchived in GanttView and in the Stats completion rate. Week start has five sources: calendar.weekStartDay, dateTime.workWeekStart, a hard-coded Monday in GanttView, `|| 1` in chronoCustom and `|| 0` in TimeReportsView. Priority colour has four sources: findPriorityColor, the TodoListItem marker colour, a hard-coded switch in CalendarView and a case-insensitive lookup in the Gantt tooltip. Name resolution splits between matchesAnyName / findByNameOrAlternatives and case-sensitive lookups in colors.ts, Stats and TimeReports. Search fields and archived visibility also differ per view. The problems concentrate in src/components/views (KanbanView, CalendarView, GanttView, StatisticsView and TimeReportsView each keep their own copies), in useListViewState and useNotesViewState, and in TodoApp.tsx.

TodoApp.tsx is the hub, and it is only half a hub. Some cross-cutting UI exists once there: ConfirmDialogComponent, the global TodoDetailsOverlay and the document keydown listener. Other pieces live in individual views. The todo UndoNotificationStack and the dependency-block banner exist only in ListView, and the review undo stack only in ReviewsView. Kanban, Calendar and Gantt render their own reduced TodoDetailsOverlay copies. Gantt (window), Calendar (container) and NoteDetailView (window) register their own key listeners. So the same action behaves differently depending on where it starts. Deleting a person from a list row asks for confirmation; deleting it from its overlay does not. Undo is visible only in List. Typing inside an overlay is swallowed in Calendar and Gantt. Moving this UI up into TodoApp (INC-06, INC-25, INC-08, INC-15) is the highest-leverage change in this dimension and unblocks several Kanban and keyboard items.

In the data layer, todo values exist in three representations. The stored Todo holds a PriorityId, a millisecond Timestamp and DurationSec. TodoModel.metadata produces display strings (priority name, a local date string, '1.3h'). todoToMetadata produces another set (the id, a UTC ISO string, '1h30m'). The export writes yet another shape. Round-trips between them lose data: editing rewrites durations (INC-03), saving logs spurious activity (INC-19), and the app cannot re-import its own export (INC-10). Auto-assign defaults are applied twice, persisted in TodoApp.handleSubmit and again on every read by the TodoModel getters, while display code reads the raw value (INC-20). Date-only due dates are stored as local midnight but compared as instants (INC-21). Every collection hook has its own load and save code. useTodos is the most mature, but it still saves [] after a failed load. Both adapters turn read errors into null. Only settings use sharedStore, switching back to localStorage never sticks, and getStorageType breaks under minification (INC-01, INC-04, INC-05, INC-11).

People and project references are names, not ids. The rename cascade (renameReferences.ts, cascadeEntityRename.ts, renameInStoredFilters.ts, useEntityRenameSync, useEntityRenamePresetSync) is the most carefully built part of this area: well commented, tested and deliberate. It is the template to copy, not something to rewrite. The gaps sit at its edges: no empty-name guard (INC-02, which can corrupt free text), no validation on create (INC-12), an in-memory selection history the rename never updates (INC-30), no cascade at all for priorities, which todos store as ids but defaults and filters store as names (INC-33), and deletes that clean up nothing: sprint ids, auto-assign defaults and dependencies are all left behind (INC-09, INC-31, INC-14).

Leave these alone and reuse them:
- the rename cascade, and commit 47291e3's decision not to keep the old name as an alternative;
- the waitForStorageInit gating in usePersistedViewOptions and useViewPresets;
- isTypingTarget and isActivationTarget, already used by FocusView and OpenFocusView;
- findByNameOrAlternatives in filterHelpers.ts (do not add another resolver);
- SmartInput's canonicalisation of marker tokens;
- the EmptyState and FilterSection components, and parseLocalDate;
- the day-bounded rewrite of TodoModel.isDueThisWeek;
- duplicateTodo's omission of sortOrder and renameEntityReferences' rule of not bumping updatedAt, both precedents to copy;
- settingsStore and sharedStore;
- Kanban's placement of completed and archived cards by state, which is deliberate per its comment (fix it with a helper, do not reverse the order);
- service-worker registration in dev, which is also deliberate.

Before touching anything, an implementer needs to know the following.
- Owner decisions recorded in git: commit ae4e6e4 removed the todo comment edit/delete UI and calls restoring it a product change, so INC-47 is marked feature-extension. Commit 1162756 removed review comments on purpose; do not build them. Commit b823476 made the auto-assign getter fallbacks work on purpose, so INC-20 is a decision, not cleanup.
- 27 items are needs-decision and must not be implemented as cleanup.
- KanbanView has no unit coverage, as its own comment admits. Add characterisation tests before INC-16, INC-26 and INC-51.
- Tests run in the ambient timezone (UTC on CI, UTC-8 locally). Land the timezone pin (INC-90) before any date fix.
- The visual suite tolerates 1-2% pixel difference. INC-82, INC-74 and INC-75 need deleted and regenerated baselines.
- Most cited lines are in TodoApp.tsx (2359 lines) and will shift as packages land. Re-locate by symbol, not line number.
- Several bugfixes change numbers users see (INC-17, INC-52, INC-60, INC-32). They are fixes, but call them out in the changelog.
- No reviewer ran anything. Every claim comes from reading the code.

## Items, high to low

- [INC-01](../workstreams/storage-core.md#inc-01) · high · `bugfix` · M — Failed or corrupt loads are saved over the stored data · U0137, batch 2A
- [INC-02](../workstreams/entity-names.md#inc-02) · high · `bugfix` · S — Clearing an entity's name saves "", and the next rename rewrites stray markers in all text · U0454, batch 3A
- [INC-03](../workstreams/durations.md#inc-03) · high · `bugfix` · M — Editing a todo silently rewrites its duration (80 min becomes 78 min, '1h30m' becomes 60 min) · U0377, batch 2B
- [INC-04](../workstreams/storage-core.md#inc-04) · high · `bugfix` · M — Switching storage back to localStorage never sticks and loses edits on reload · U0087, batch 2A
- [INC-05](../workstreams/storage-core.md#inc-05) · high · `bugfix` · S — Production reports IndexedDB users as on localStorage because the class name is minified · U0084, batch 2A
- [INC-06](../workstreams/undo-confirm.md#inc-06) · high · `bugfix` · S — Todo undo toasts and the dependency-block banner appear only in List view · U0247, batch 3A
- [INC-07](../workstreams/notes.md#inc-07) · high · `bugfix` · S — Bulk-deleting notes deletes only the last selected note · U0703, batch 3B
- [INC-08](../workstreams/undo-confirm.md#inc-08) · high · `bugfix` · S — Deleting a person, project or sprint from its details overlay skips confirmation · U0480, batch 3C
- [INC-09](../workstreams/sprints.md#inc-09) · high · `bugfix` · S — Deleting a sprint leaves its todos pointing at a missing sprint id · U0574, batch 3B
- [INC-10](../workstreams/import-export.md#inc-10) · high · `bugfix` · M — The app's own export cannot be re-imported without losing state and fields · U0099, batch 2B
- [INC-11](../workstreams/cross-tab.md#inc-11) · high · `needs-decision` · L — Only settings are synchronised between tabs; other collections overwrite each other · U0071, batch 2C
- [INC-12](../workstreams/entity-names.md#inc-12) · high · `bugfix` · M — Creating people and projects skips the uniqueness check that rename relies on · U0456, batch 3A
- [INC-13](../workstreams/notes.md#inc-13) · high · `bugfix` · M — Todos created from note action items drop every marker in the item · U0654, batch 3B
- [INC-14](../workstreams/todos-core.md#inc-14) · high · `bugfix` · S — A dependency that was completed and then archived blocks its dependents again · U0171, batch 3A
- [INC-15](../workstreams/keyboard-help.md#inc-15) · high · `bugfix` · S — Calendar and Gantt key handlers swallow typing and button presses · U0337, batch 3C
- [INC-16](../workstreams/kanban.md#inc-16) · high · `bugfix` · M — Kanban places cards by todo.state but evaluates moves from workflowState · U0219, batch 3B
- [INC-17](../workstreams/todos-core.md#inc-17) · high · `bugfix` · S — List 'Select all' selects todos that are not on screen · U0236, batch 3A
- [INC-18](../workstreams/view-state.md#inc-18) · high · `bugfix` · S — List 'Group by Sprint' shows raw sprint ids as group headers · U0259, batch 3B
- [INC-19](../workstreams/activity-comments.md#inc-19) · high · `bugfix` · S — Saving an unchanged todo logs 'changed priority', 'changed due date' and 'changed duration' · U0116, batch 3A
- [INC-20](../workstreams/todos-core.md#inc-20) · high · `needs-decision` · M — Auto-assign defaults are applied at creation and again on every read, while display reads raw values · U0164, batch 3A
- [INC-21](../workstreams/dates-time.md#inc-21) · high · `needs-decision` · S — Date-only due dates are stored as local midnight and turn overdue on their own day · U0166, batch 3A
- [INC-22](../workstreams/dates-time.md#inc-22) · high · `needs-decision` · S — 'today' resolves to 19:00, 17:00 or 'now' depending on the code path · U0538, batch 3A
- [INC-23](../workstreams/durations.md#inc-23) · high · `needs-decision` · S — Day and week durations are offered but parsed as minutes ('2d' is stored as 2 minutes) · U0377, batch 2B
- [INC-24](../workstreams/dates-time.md#inc-24) · high · `needs-decision` · M — 'Today' and 'This week' buckets differ between List, grouping, Calendar and Kanban · U0167, batch 3A
- [INC-25](../workstreams/overlays-dialogs.md#inc-25) · medium · `bugfix` · M — Kanban, Calendar and Gantt render their own Task Details overlay with fewer features · U0212, batch 3C
- [INC-26](../workstreams/kanban.md#inc-26) · medium · `bugfix` · M — Dragging in Kanban skips undo, the archive dependency check and correct WIP counting · U0149, batch 6B
- [INC-27](../workstreams/kanban.md#inc-27) · medium · `bugfix` · S — Kanban's 'Later' due-date filter also matches overdue todos · U0218, batch 6B
- [INC-28](../workstreams/keyboard-help.md#inc-28) · medium · `bugfix` · M — Keyboard shortcuts behave differently by view, and some fire twice · U0467, batch 3C
- [INC-29](../workstreams/view-state.md#inc-29) · medium · `bugfix` · S — Settings that seed Calendar and Gantt defaults stop working after the first visit · U0729, batch 6C
- [INC-30](../workstreams/entity-names.md#inc-30) · medium · `bugfix` · S — Rename rewrites selection history on disk, but the mounted copy writes the old names back · U0569, batch 6A
- [INC-31](../workstreams/undo-confirm.md#inc-31) · medium · `bugfix` · S — Deleting a person or project leaves it set as the auto-assign default · U0594, batch 6A
- [INC-32](../workstreams/undo-confirm.md#inc-32) · medium · `bugfix` · S — The delete warning checks only assigned todos, while counts include every reference · U0585, batch 6A
- [INC-33](../workstreams/settings.md#inc-33) · medium · `bugfix` · M — Renaming or deleting a priority updates none of the stores that hold priority names · U0306, batch 3B
- [INC-34](../workstreams/import-export.md#inc-34) · medium · `bugfix` · S — Notes export ignores active filters and includes notes still in the undo window · U0485, batch 2B
- [INC-35](../workstreams/todos-core.md#inc-35) · medium · `bugfix` · M — List drag-reorder computes positions from storage order, not from the list on screen · U0721, batch 3A
- [INC-36](../workstreams/todos-core.md#inc-36) · medium · `needs-decision` · M — updatedAt is maintained by different rules per entity and per action · U0150, batch 6A
- [INC-37](../workstreams/migrations-versioning.md#inc-37) · medium · `bugfix` · M — Notes, reviews and templates are used exactly as stored, with no normalisation on load · U0063, batch 2A
- [INC-38](../workstreams/reviews.md#inc-38) · medium · `bugfix` · S — Expanding an entry on a completed review is recorded as an edit · U0573, batch 6B
- [INC-39](../workstreams/dates-time.md#inc-39) · medium · `bugfix` · S — Smart-input week shortcuts turn a Sunday week start into Monday · U0531, batch 3A
- [INC-40](../workstreams/dates-time.md#inc-40) · medium · `bugfix` · S — Week numbers are wrong in the calendar and on reviews at the turn of the year · U0335, batch 6A
- [INC-41](../workstreams/dates-time.md#inc-41) · medium · `bugfix` · S — Date-only strings parsed with new Date() show the previous day west of UTC · U0416, batch 3A
- [INC-42](../workstreams/settings.md#inc-42) · medium · `bugfix` · S — Defaults are restated as literals, and chrono's time-of-day fallbacks have drifted · U0530, batch 3A
- [INC-43](../workstreams/backup.md#inc-43) · medium · `bugfix` · S — Imported backups are pruned by their original timestamp and vanish on the next start · U0043, batch 2B
- [INC-44](../workstreams/storage-core.md#inc-44) · medium · `bugfix` · S — IndexedDB users see a theme flash because the theme mirror is deleted on every load · U0776, batch 2A
- [INC-45](../workstreams/storage-core.md#inc-45) · medium · `bugfix` · M — Storage usage and backup sizes are measured in different units over different key sets · U0093, batch 2A
- [INC-46](../workstreams/kanban.md#inc-46) · medium · `bugfix` · S — Kanban's filter panel hides options; List sorts priorities alphabetically and shows dependency ids · U0215, batch 6B
- [INC-47](../workstreams/activity-comments.md#inc-47) · medium · `feature-extension` · M — Comment support differs per entity; todo comments can no longer be edited or deleted · U0151, batch 10
- [INC-48](../workstreams/migrations-versioning.md#inc-48) · medium · `needs-decision` · M — The newer-data version check warns but still migrates and rewrites todos · U0067, batch 2A
- [INC-49](../workstreams/dates-time.md#inc-49) · medium · `needs-decision` · M — Two week-start settings exist, and Gantt ignores both · U0272, batch 10
- [INC-50](../workstreams/view-state.md#inc-50) · medium · `needs-decision` · M — The List due-date filter stores relative display text whose meaning changes every day · U0253, batch 6C
- [INC-51](../workstreams/kanban.md#inc-51) · medium · `needs-decision` · M — List, Notes and Kanban presets follow three different rule sets · U0213, batch 7B
- [INC-52](../workstreams/stats-time-focus.md#inc-52) · medium · `needs-decision` · S — Archived todos count as done in some metrics and not in others · U0363, batch 3B
- [INC-53](../workstreams/view-state.md#inc-53) · medium · `needs-decision` · M — Filter options list case variants and alternatives of one entity as separate values · U0747, batch 6C
- [INC-54](../workstreams/search.md#inc-54) · medium · `needs-decision` · M — Search covers different fields per entity, and Help promises fields todo search skips · U0580, batch 6C
- [INC-55](../workstreams/undo-confirm.md#inc-55) · medium · `needs-decision` · S — Delete safety differs per entity: confirmation, undo, both or neither · U0477, batch 8C
- [INC-56](../workstreams/stats-time-focus.md#inc-56) · medium · `needs-decision` · S — Time Reports and Statistics assign tracked time to categories differently · U0367, batch 6B
- [INC-57](../workstreams/storage-core.md#inc-57) · medium · `none` · S — docs/storage-architecture.md and the build instructions contradict the code · U0625, batch 12
- [INC-58](../workstreams/search.md#inc-58) · low · `bugfix` · S — Global search passes the untrimmed query, and the Sprints view bypasses SprintModel.matchesSearch · U0580, batch 6C
- [INC-59](../workstreams/entity-names.md#inc-59) · low · `bugfix` · S — Colour, category and note-group lookups match names case-sensitively or by id · U0746, batch 6A
- [INC-60](../workstreams/undo-confirm.md#inc-60) · low · `bugfix` · S — Items deleted but still in the undo window leak into counts and lists · U0604, batch 11
- [INC-61](../workstreams/notes.md#inc-61) · low · `bugfix` · S — Note and review detail views navigate differently after delete, convert and archive · U0697, batch 6B
- [INC-62](../workstreams/app-shell.md#inc-62) · low · `bugfix` · S — Time Reports stays reachable after time tracking is turned off · U0447, batch 6C
- [INC-63](../workstreams/calendar.md#inc-63) · low · `bugfix` · S — Calendar's 'Created' sort runs opposite to List and Kanban · U0330, batch 11
- [INC-64](../workstreams/view-state.md#inc-64) · low · `bugfix` · S — Filter badge counts mean different things and can show '0' · U0205, batch 11
- [INC-65](../workstreams/visual-system.md#inc-65) · low · `bugfix` · S — Priority colours come from a different source in each view · U0198, batch 8C
- [INC-66](../workstreams/activity-comments.md#inc-66) · low · `bugfix` · M — Activity logging has different gaps for each entity · U0563, batch 9
- [INC-67](../workstreams/activity-comments.md#inc-67) · low · `bugfix` · S — Todo and note activity entries use different marker symbols for the same change · U0184, batch 3A
- [INC-68](../workstreams/notes.md#inc-68) · low · `bugfix` · S — Duplicating a note copies its manual sort position; duplicating a todo does not · U0571, batch 11
- [INC-69](../workstreams/dates-time.md#inc-69) · low · `bugfix` · S — Reviews compute end of day as midnight + 24h - 1ms, which is wrong on DST days · U0172, batch 6A
- [INC-70](../workstreams/migrations-versioning.md#inc-70) · low · `bugfix` · S — migrateTodo writes shapes the Todo type does not allow · U0064, batch 2B
- [INC-71](../workstreams/pwa-service-worker.md#inc-71) · low · `bugfix` · S — The dev service worker never changes version, and the base path is derived four ways · U0047, batch 3B
- [INC-72](../workstreams/view-state.md#inc-72) · low · `needs-decision` · S — Quick filters narrow different subsets in List, Notes and Calendar · U0256, batch 11
- [INC-73](../workstreams/stats-time-focus.md#inc-73) · low · `needs-decision` · S — 'This week' means a different time window in the List filter, Statistics and Time Reports · U0173, batch 11
- [INC-74](../workstreams/view-state.md#inc-74) · low · `needs-decision` · M — Each view shows or hides archived items in its own way · U0261, batch 8C
- [INC-75](../workstreams/feedback-states.md#inc-75) · low · `needs-decision` · S — Empty and no-results states differ between views, and two can never appear · U0660, batch 8A
- [INC-76](../workstreams/view-state.md#inc-76) · low · `needs-decision` · S — Default list and group order follow no shared rule · U0251, batch 8C
- [INC-77](../workstreams/dates-time.md#inc-77) · low · `needs-decision` · M — Dates use forced en-US in some views, the browser locale in others, and mixed 12/24-hour clocks · U0332, batch 10
- [INC-78](../workstreams/import-export.md#inc-78) · low · `needs-decision` · M — Todo and note exports use different field sets, and note JSON's people lookup never matches · U0095, batch 7B
- [INC-79](../workstreams/entity-names.md#inc-79) · low · `needs-decision` · S — New people and projects get a fixed colour on some paths and follow the marker default on others · U0457, batch 7B
- [INC-80](../workstreams/settings.md#inc-80) · low · `needs-decision` · S — Archived people and projects can be chosen as auto-assign defaults but nowhere else · U0267, batch 11
- [INC-81](../workstreams/migrations-versioning.md#inc-81) · low · `needs-decision` · S — Version numbers disagree across files, and the service worker reports a cache name as its version · U0642, batch 7B
- [INC-82](../workstreams/visual-system.md#inc-82) · low · `needs-decision` · S — globals.css sets Arial on body, overriding the Geist Sans font that layout.tsx loads · U0768, batch 8C
- [INC-83](../workstreams/code-hygiene.md#inc-83) · low · `none` · M — isActive means 'not completed' on todos and 'not archived' on every other model · U0170, batch 12
- [INC-84](../workstreams/code-hygiene.md#inc-84) · low · `none` · M — Entity hooks expose differently shaped APIs and memoise inconsistently · U0140, batch 7A
- [INC-85](../workstreams/code-hygiene.md#inc-85) · low · `none` · S — Templates, time entries, action items and sprints bypass the shared id factories · U0757, batch 7A
- [INC-86](../workstreams/visual-system.md#inc-86) · low · `none` · S — Fallback marker colours differ from defaultMarkerColors · U0744, batch 8C
- [INC-87](../workstreams/smart-input.md#inc-87) · low · `none` · S — The duration and recurrence suggestion lists are defined twice and have drifted apart · U0513, batch 7B
- [INC-88](../workstreams/storage-core.md#inc-88) · low · `none` · S — Storage keys are written as literals outside the registry, and LocalStorageAdapter.clear would wipe the whole site · U0777, batch 1
- [INC-89](../workstreams/backup.md#inc-89) · low · `none` · S — lastBackupDate is stored twice and derived a third time · U0055, batch 2B
- [INC-90](../workstreams/tests-ci-tooling.md#inc-90) · low · `none` · S — Tests have no global timezone pin, so CI (running in UTC) cannot catch local-time bugs · U0638, batch 1
- [INC-91](../workstreams/entity-names.md#inc-91) · low · `none` · S — renameReferences.ts still says the old name is kept as an alternative · U0597, batch 12

## Commit groupings suggested by the reviewer

Superseded by the work units where they differ; kept because they show what the reviewer expected to land together.

- **Pin the test timezone** — INC-90. Test infrastructure only. Land it first so every later date fix is tested in a zone behind UTC, both on CI and locally.
- **Collection load safety** — INC-01. Stops data loss after a failed or corrupt read, and introduces the shared load result and save gate that INC-37 and INC-48 build on.
- **Entity normalisers in migrations.ts** — INC-37, INC-70. Both items change how records are normalised in migrations.ts on load, and both rely on the load helper from the previous package.
- **Storage backend switching** — INC-04, INC-05, INC-88. Fixing INC-05 exposes INC-04's broken path in production, so they must ship together. INC-88's migrated-flag constant touches the same lines.
- **Entity name integrity** — INC-02, INC-12, INC-91. Empty-name and duplicate-name validation share one validator in renameReferences.ts, and that file's stale header is fixed in the same edit.
- **Entity delete confirmations and cascades** — INC-08, INC-09, INC-31, INC-32. All four change TodoApp's delete wiring and what deleting a person, project or sprint cleans up and warns about.
- **App-level undo and detail-view navigation** — INC-06, INC-61. Moving the undo stacks and the dependency banner into TodoApp also fixes the unseen undo after archiving a review.
- **Notes bulk delete and duplicate** — INC-07, INC-68. Two small useNotes and NotesView bugfixes in the same files.
- **Todo metadata round-trip** — INC-03, INC-19. Both stem from the mismatch between the stored, display and todoToMetadata formats in useTodos, TodoModel and activityLogger. They share the new duration helpers.
- **Import round-trip** — INC-10. A self-contained change to export.ts and import.ts, backed by round-trip tests. It uses INC-03's duration formatter.
- **Action items carry their markers** — INC-13. Extracts the creation-time auto-assign helper and reuses token parsing in the conversion path.
- **Dependency satisfaction** — INC-14. A small TodoModel fix that introduces the isDone helper INC-52 later reuses.
- **One task details overlay** — INC-25. Deletes three overlay copies. It must land before the keyboard work so the Calendar overlay is no longer inside calendarRef.
- **Keyboard handling** — INC-15, INC-28. One pass over every keydown handler, using the shared typing and activation guards and the defaultPrevented check.
- **Kanban state, drag rules and due buckets** — INC-16, INC-26, INC-27. Kanban changes that share the characterisation tests and the new getDisplayStateId helper.
- **List view correctness** — INC-17, INC-18, INC-35. Three ListView and useListViewState bugfixes that touch the same visible-rows logic.
- **Date arithmetic bugfixes** — INC-39, INC-40, INC-41, INC-69. Small date fixes in chronoCustom, CalendarView, reviewUtils, SprintDetailsOverlay and TimeReportsView, all tested under the timezone pin.
- **Defaults from one source** — INC-42. Replaces restated literals with imports of the defaults and passes date settings to every smart input. It should land before INC-22.
- **Selection history and name lookups** — INC-30, INC-59. Both resolve names through findByNameOrAlternatives and fix name-reference consistency without a product decision.
- **Priority references and colours** — INC-33, INC-65, INC-86. Covers the priority cascade, one getPriorityColor helper, and fallback colours taken from defaultMarkerColors.
- **Storage tab and backup bookkeeping** — INC-43, INC-45, INC-89. StorageTab, backup.ts and useBackups changes to sizing, retention and lastBackupDate.
- **Theme mirror and base font** — INC-44, INC-82. Both touch layout.tsx, globals.css and theme bootstrapping. INC-82 lands only once the owner has decided.
- **Review collapse and activity log consistency** — INC-38, INC-66, INC-67. activityLogger, useSprints, useEntityManager and useReviews activity rules in one pass.
- **Comments and updatedAt rule** — INC-36, INC-47. The comment-activity and updatedAt rules are the same decision. Reorder no longer bumping updatedAt follows INC-35.
- **View defaults and feature gating** — INC-29, INC-62. Both concern what a view shows when it opens (settings-derived defaults and disabled views).
- **Export scope and field sets** — INC-34, INC-78. Notes export scope first, then aligning the field sets in export.ts.
- **Filter UI consistency** — INC-46, INC-63, INC-64. Filter panel options, badge counts and sort direction across the toolbars.
- **Search consistency** — INC-58, INC-54. The trim and Sprints-view bugfix lands first; the shared matchesText helper follows the owner's decision.
- **Undo-window deletions in counts** — INC-60. Adds isDeleted filtering at the listed count sites, or exposes non-deleted collections from the hooks.
- **Auto-assign layer** — INC-20. One decision with broad effect on TodoModel getters and every read site. It has to come before the shared due-date work.
- **Date-only and 'today' semantics** — INC-21, INC-22. Settles what a due date without a time means and what 'today' means, before any bucket is defined.
- **Shared due-date buckets and List filter** — INC-24, INC-50. Define the day-granular getters once, then rebuild the List due-date filter on them.
- **Duration units and vocabulary** — INC-23, INC-87. Extends INC-03's parser with day and week units, then merges the two suggestion lists.
- **Week start setting** — INC-49. Decision about which week-start setting governs Calendar, Gantt and Time Reports, applied after the Sunday bugfix.
- **Statistics and sprint metric semantics** — INC-52, INC-56, INC-73. Three owner decisions on how StatisticsView, SprintsView and TimeReportsView count; they share the isDone helper.
- **View presets** — INC-51. Needs Kanban preset tests first, then moves Kanban onto useViewPresets with a migration of stored presets.
- **Filter options and group ordering** — INC-53, INC-76. Both change how useListViewState and useNotesViewState build option lists and order groups.
- **What each view shows** — INC-72, INC-74, INC-75. Owner conventions for quick-filter scope, archived visibility and empty states.
- **Delete policy** — INC-55. Extends the confirmation helper from the entity-delete package to templates, priorities and presets once the policy is chosen.
- **Entity defaults decisions** — INC-79, INC-80. Two small owner decisions on entity colour and archived auto-assign defaults.
- **Newer-data read-only guard** — INC-48. Reuses INC-01's save gate to make the app read-only when stored data comes from a newer build.
- **Cross-tab sync for collections** — INC-11. Large and decision-dependent. The docblock correction can land alone; the sync itself may need to be split into two commits to stay under 1000 lines.
- **Locale formatting** — INC-77. One formatters module with an explicit locale policy, replacing about 50 call sites.
- **Model and hook API hygiene** — INC-83, INC-84, INC-85. Refactors with no behaviour change, verified by typecheck and the existing suites.
- **Build, version and docs alignment** — INC-57, INC-71, INC-81. Brings docs, versioning and the service worker's base path in line with the code.

## Dependencies

Within this dimension:
- Timezone pin: INC-90 lands before every date fix (INC-21, INC-22, INC-24, INC-39, INC-40, INC-41, INC-69).
- Storage load and switching:
  - INC-01 comes before INC-37 and INC-70 (shared load helper), before INC-48 (reuses its save gate) and before INC-11 (cross-tab re-reads assume correct load semantics).
  - INC-04 and INC-05 must ship in the same commit, because fixing INC-05 exposes INC-04 in production.
  - INC-88's migrated-flag constant and INC-44's new theme key both edit INTERNAL_STORAGE_KEYS and the inline script in layout.tsx. Land INC-88 first, or have INC-44 use the constant it introduces.
- Entity names and deletes:
  - INC-02 and INC-12 share validateEntityNames.
  - INC-79's single creation helper should build on INC-12's.
  - INC-08 comes before INC-55, which extends the same confirmation helper.
  - INC-09's sprint cascade lands with INC-08's sprint confirmation.
- App-level UI:
  - INC-06 comes before INC-26 (Kanban refusals report through the app-level banner) and before the review-undo option in INC-61.
  - INC-25 comes before INC-15 and INC-28, because removing Calendar's local overlay changes calendarRef's scope.
  - INC-16 comes before INC-26, which uses getDisplayStateId.
- Formats and dates:
  - INC-03 comes before INC-19 (duration activity), INC-10 (export duration format), INC-23 (day and week units) and INC-70 (converting legacy duration strings).
  - INC-23 comes before INC-87.
  - INC-20's decision comes before INC-24, INC-50 and INC-13, because it decides which getters buckets read and whether converted action items persist defaults.
  - INC-42 comes before INC-22, because it removes the drifted 17:00 fallback in chronoCustom.
  - INC-21 and INC-22 come before INC-24, which comes before INC-50.
  - INC-27 can land on its own (daysUntilDue > 7), or be rewritten on INC-24's getter if that lands first.
  - INC-39 comes before INC-49.
  - INC-41 and INC-89 both edit BackupTab.tsx:201, so do them together or in sequence.
- Shared helpers and sequencing:
  - INC-14 and INC-52 share the TodoModel.isDone helper; whichever lands first adds it.
  - INC-35 comes before INC-36, which edits the same reorder functions.
  - INC-34 comes before INC-78.
  - INC-58 comes before INC-54.
  - INC-59 comes before INC-53.
  - INC-60 complements INC-06; land it afterwards so the counts match what the undo toast restores.
- Kanban test coverage: INC-16, INC-26 and INC-51 each need Kanban characterisation tests first. Write them once, in the first Kanban package.

Against other dimensions:
- Logic and business-logic bugs: many items here (INC-02, 03, 04, 05, 07, 09, 10, 14, 16, 17, 18, 19, 26, 35, 39, 40, 41, 69) will also appear there. The central plan should merge them under one id rather than implement them twice.
- Error, validation and string messages: INC-02 and INC-12 ('Name is required', duplicate names), INC-08 and INC-55 (confirmation texts, 'You can undo' vs 'cannot be undone'), INC-26 (refusal messages), INC-32 (reference counts) and INC-28 (Help text) should use that dimension's message catalogue if one is created. Land the catalogue first or coordinate.
- Dead-code removal:
  - These must not be deleted: editTodoComment and deleteTodoComment (INC-47 restores their UI), ListView's toggleDragMode (INC-28 wires it), and getEnabledViews (INC-62 starts using it).
  - These are dead code to hand over: GanttView._parseDuration (INC-23), GanttView._getPriorityColor (INC-65), SprintModel.createId vs createSprintId (INC-85, keep createId), updateTemplate (INC-36), useServiceWorker.getVersion and CACHE_NAME (INC-81), the export peopleMap and projectsMap (INC-78), and the unused 'used' figure in estimateStorageQuota (INC-45).
- Duplication to consolidate: shared helpers introduced here overlap with that dimension's targets: the due-date getters (INC-24), getPriorityColor (INC-65), the duration helpers (INC-03), the start/end-of-day helper (INC-42), findByNameOrAlternatives reuse (INC-59), migratePerson and migrateProject (INC-37), the useSprints comment mutations (INC-47), generateNoteMetadataActivities (INC-67), formatters (INC-77), the suggestion lists (INC-87), Kanban presets moving onto useViewPresets (INC-51) and the three overlay copies (INC-25). Whichever dimension lands first should do the consolidation, and the other should drop its copy of the item.
- Restructuring for consistency: INC-28's shortcut table, INC-83's isActive naming and INC-84's hook API shapes overlap. Agree naming before either side renames anything.
- Missing or wrong logging: INC-01 (report parse and read failures), INC-04 (migration outcome), INC-48 (the 'Refusing to migrate' path) and INC-70 (warning on legacy strings). INC-19, INC-38, INC-66 and INC-67 concern the user-visible activity log, not console logging, but coordinate the conventions.
- UI design review: INC-29, INC-46, INC-64, INC-74, INC-75, INC-77 and INC-82 change visible UI and should follow any layout or design-system decisions from that review. Visual baselines need regenerating.
- Documentation cleanup: INC-57 and INC-91 belong to both dimensions. INC-22 updates docs/due-date-feature.md, INC-28 and INC-54 update the Help sections, and INC-04 and INC-44 add internal storage keys that the 'Key Storage Keys' section of CLAUDE.md must list.
- Security review: INC-88 (LocalStorageAdapter.clear could wipe the shared GitHub Pages origin) and INC-10 (import parser changes) should be reviewed together with any import-validation hardening. INC-11 touches cross-tab messaging.
- Opportunities to improve support: INC-01's recovery-screen behaviour, INC-48's banner and INC-81's displayed version feed support diagnostics.
- Partly implemented features: INC-47 (todo comment editing), INC-13 (action-item conversion), INC-11 (the sharedStore claim), INC-75 ('Show empty columns'), INC-62 (feature gating) and INC-74 (an archived toggle for Reviews and Calendar) overlap. Track each once.

## Open questions

- [ ] INC-20: Should auto-assign defaults be applied once at creation and saved with the todo (recommended), or should TodoModel keep applying them on every read? If the read-time fallback stays, how can a user permanently clear a defaulted due date?
- [ ] INC-21: What does a due date without a time mean: due by the end of the work day (stored as that time), or midnight kept as a 'date only' marker and treated as end of day? Should timed tasks become overdue at the exact minute?
- [ ] INC-22: Should 'today' resolve to the end of the work day (17:00 by default), to the evening time (19:00), or to the current moment?
- [ ] INC-23: How long are '1d' and '1w': an 8-hour day and 5-day week, values derived from the work-hours settings, or 24 hours and 7 days? Do '1m'-'3m' in the suggestion lists mean months, and should they be renamed or removed?
- [ ] INC-24 / INC-73: Should 'This week' for due dates mean today through today+7, or the rest of the calendar week? Should Statistics' rolling windows be relabelled 'Last 7 days' or switched to the calendar week?
- [ ] INC-49: Should calendar.weekStartDay merge into dateTime.workWeekStart, or stay a separate display preference? Which one should Gantt follow?
- [ ] INC-11: For syncing data between tabs, should the latest change win per record (by updatedAt) or per collection? Is correcting the sharedStore docblock acceptable as an interim step?
- [ ] INC-48: When stored data comes from a newer build, may the app open read-only with a reload banner?
- [ ] INC-14 / INC-52: Should a dependency that was archived without being completed, or that was deleted, count as satisfied? Should archived todos that were never completed stay out of completion metrics?
- [ ] INC-55 / INC-51: Should every permanent delete (templates, priorities, presets) ask for confirmation, and should people and projects get undo like notes and reviews?
- [ ] INC-29: For Calendar 'Default View' and Gantt 'Collapse Completed', should the setting apply every time the view opens, or should the view remember the in-view choice and reset only when the setting changes?
- [ ] INC-36: Is updatedAt defined as 'the user changed the content', so reordering does not bump it? Should Person, Project, Sprint and TodoTemplate gain createdAt and updatedAt?
- [ ] INC-47 / INC-38: May todo comment edit and delete be restored (the UI was removed in commit ae4e6e4)? Should the leftover comment fields on the Review type be removed? Should the entry_collapsed and entry_expanded activity types exist?
- [ ] INC-53: Should filter options merge case variants and alternative names into the canonical entity?
- [ ] INC-54: Which fields should search cover for each entity? Should todo search include context and comments as Help says, or should Help be corrected? Should Kanban's search record history?
- [ ] INC-56: How should tracked time for a todo with several projects be split across categories: first project, every project, or proportionally?
- [ ] INC-72: Should quick filters narrow every section (including Completed and Archived), or only active items?
- [ ] INC-74 / INC-75: What is the single convention for archived visibility (collapsed section or a 'Show archived' toggle)? Should Kanban's 'Show empty columns' actually hide empty columns?
- [ ] INC-76: What is the default order for the People and Projects lists (by usage or alphabetical), for reviews (by period), and for name-based groups?
- [ ] INC-77: Should dates follow the browser locale or a new setting, and should there be a 12/24-hour preference?
- [ ] INC-78: Should reviews, people, projects, sprints and templates be exportable?
- [ ] INC-79 / INC-80: Should an entity's colour be stored only when it differs from the marker default? May archived people and projects be auto-assign defaults?
- [ ] INC-81: Should versions be numbered per commit (pre-commit hook) or per plan (CHANGELOG), and should package.json track version.json?
- [ ] INC-82: Should the body font be Geist Sans, which is loaded, or Arial, which is what renders today?
- [ ] INC-68: Should duplicates of todos and notes both get ' (Copy)', or neither?
- [ ] INC-63: When Calendar's Created sort is fixed, should a stored 'asc' be flipped once so existing users keep their current order?
- [ ] INC-66: Should changes to todo subtasks be logged in the activity history?
- [ ] INC-25: After toggling, deleting or archiving from the Task Details overlay, should it close (Kanban's current behaviour) or stay open (TodoApp's)?
- [ ] INC-35: Under a non-manual sort, should entering reorder mode switch to Manual sort, or should reordering be disabled?
- [ ] INC-83: Should TodoModel.isActive be renamed (for example to isOpen), or only documented?

## Dropped during synthesis

- Deleted reviews count in the Reviews period-button check (ReviewsView.tsx:209), part of across-views 'Deleted items still in the undo window…' — The verifier refuted it: hasReviewForPeriod (src/utils/reviewUtils.ts:404-414) already excludes deleted reviews. The rest of the finding is kept as INC-60.
- Build a comment API for reviews (original proposal in across-entities 'Comment support differs per entity') — Dropped. The owner decided in commit 1162756 to delete review comments rather than build the UI. INC-47 keeps only the cleanup of the leftovers.
- Default legacy sprint durations from current settings (original proposal in data-platform 'Entity load-time migration is scattered') — Dropped by the verifier: it would retroactively change the length of existing sprints. INC-37 keeps the legacy 14-day default.
- Disable service-worker registration in dev (original proposal in data-platform service-worker finding) — Dropped: dev registration is deliberate (public/sw.js:14-17). INC-71 keeps registration and only fixes the version stamp and base path.
- getStorageType's UTF-16 sizing consequence — No effect: estimateStorageQuota's 'used' figure is never read. The measurement problem is tracked in INC-45.
- dateUtils.ts:637 as a site where a date-only string is parsed in UTC — Removed by the verifier: convertToDateInputFormat returns date-only input earlier, so that fallback never receives a date-only string.
- 'No test pins a timezone' and 'developer machine is east of UTC' (data-platform timezone finding) — Corrected by the verifier: SprintModel and dateUtils tests pin TZ per case, and the machine is UTC-8. The finding is kept in its corrected form as INC-90 (low).
- TodoModel.sprintId repair for dangling sprint ids (across-entities sprint delete finding) — Not feasible: TodoModel has no access to the sprint list. INC-09 proposes repairing at the display sites or with a one-off cleanup instead.
- Stamp updatedAt on sprint and template edits (across-entities updatedAt finding) — Sprint and TodoTemplate have no updatedAt field. INC-36 reframes this as a schema decision for the owner.
- Reintroduce the old name as an automatic alternative on rename — Not proposed: commit 47291e3 removed it on purpose and added an e2e test against it. INC-91 only fixes the stale comment.
- SmartInput's case-sensitive colour lookup as a divergent matching rule (across-entities name-matching finding) — Corrected by the verifier: SmartInput canonicalises tokens (lines 331-351) before the lookup, so the values are already canonical.
- Dead-code observations: GanttView._parseDuration, GanttView._getPriorityColor, updateTemplate, useServiceWorker.getVersion, CACHE_NAME, export peopleMap/projectsMap, estimateStorageQuota 'used' — Mentioned in INC-23, INC-65, INC-36, INC-81, INC-78 and INC-45 for context only. Removing them belongs to the Dead-code dimension.
- Cross-slice duplicate findings — Merged, not lost: across-views delete-confirm plus across-entities overlay-delete became INC-08; the two export-reimport findings INC-10; the two action-item findings INC-13; failed-load plus read-failure INC-01; entity normalisation plus scattered migration INC-37; raw-vs-effective reads plus auto-assign layers INC-20; the two locale findings INC-77. Others were split into separate jobs: overdue/today/week into INC-21, 22, 24, 27 and 73; week start into INC-39, 40 and 49; name matching into INC-53 and 59; search into INC-54 and 58; drag reorder and updatedAt into INC-35 and 36; notes export into INC-34 and 78.

## Coverage gaps

No reviewer read these areas in depth; only what is listed in brackets was covered:
- ReviewDetailView.tsx and ReviewEditView.tsx in full (only the action wiring and lines 261-268).
- Most of NoteDetailView.tsx (only 172-190, 360-401 and 507/600).
- GanttView.tsx rendering at lines 760-1960.
- TimeReportsView.tsx UI at 335-806 and StatisticsView.tsx UI at 270-618.
- PeopleView.tsx and ProjectsView.tsx (diffed only).
- CommandPalette, ViewTabs, UndoNotificationStack internals and useUndoableActions.
- Most settings tabs. Read: CalendarTab, AutoAssignTab, ImportTab, StorageTab, BackupTab and DateTimeTab, plus parts of GanttTab. Only grepped: PrioritiesTab, CategoriesTab and KanbanTab. Not read: SprintsTab and the rest.
- src/utils/recurringParser.ts and most of ganttScheduler.ts (only 95-175, 338 and 435).
- autoDetection.ts beyond 78-136, 210-235 and 365-373.
- focusModes, focusReport, useFocusSession (except 87-89) and useSearchHistory.
- RichTextEditor and utils/richText.
- notifications.ts beyond 512-578, and import.ts at 165-400.
- migrations.ts at 150-340.
- NoteModel 1-90 and ReviewModel 1-195.
- TodoModel at 420-480 and 590-640.
- Help sections other than Keyboard and Filtering.
- src/app pages other than layout.tsx and globals.css.
- docs other than storage-architecture.md (due-date-feature.md was only grepped).
- All Jest tests and Playwright specs, except the cited test lines.

Nothing was executed: tsc, jest and Playwright were not run, so claims at the typecheck level and runtime behaviour are inferred from reading only. No slice's finder failed.
