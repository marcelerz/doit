# 6. Logic and business-logic bugs

231 items: 70 high, 92 medium, 69 low. Each reviewer batch was checked against the code by an adversarial verifier (1 finding refuted outright, others corrected). Every item links to its full text; the unit and batch after each title say where the work is scheduled.

## Context

Logic defects in Doit cluster around five seams. (1) Persistence. Every collection hook (useTodos, useEntityManager, useNotes, useReviews, useSprints, usePersistedState and the view-option hooks) keeps a private in-memory copy and saves the whole array from an effect once isLoaded is true. Because of that, a failed or misread load writes [] over the stored data (BUG-01). Two tabs overwrite each other (BUG-07). The IndexedDB/localStorage switch logic in src/storage/storage.ts can silently discard or revert data (BUG-02, BUG-03). sharedStore.ts is the one correctly coordinated store, and it is the model to copy. Fix the save gate before anything else touches load paths. (2) The TodoModel.metadata string round-trip. Most edit paths spread todo.metadata back through useTodos.metadataToTodoFields. metadata uses lossy formats (duration toFixed(1)h, priority name, local date) while todoToMetadata uses others (id, UTC ISO, XhYm). The result is silent duration drift and fake activity entries on every edit (BUG-05, BUG-06). parseDuration in ganttScheduler.ts only knows h and m, and it is reused by the scheduler, SprintProgress and the auto-assign fallback, so d/w/compound durations are wrong everywhere (BUG-31).

(3) Read-time auto-assign fallbacks in TodoModel (dueDate, priorityId, durationSeconds, assigned people, projects). They coexist with the creation-time defaults in TodoApp.handleSubmit. Cleared fields therefore cannot be cleared, filters disagree with rows, and undated todos are due 'now' (BUG-29, BUG-81). Settings clears are also undone by migrateSettings (BUG-28). The owner must pick one model before anything in this area is touched. (4) Stale closures and snapshot replacement in useTodos: toggleTodo, archiveTodo and deleteTodo build a whole record from the render-time rawTodos and replace by id. Undo prepends copies, and undo restores full snapshots. This drives the focus-mode lost update (BUG-08), duplicate records after undoing a delete (BUG-04) and lost edits during the undo window (BUG-89). FocusView and OpenFocusView add their own snapshot and segment-accounting defects (BUG-09/10, 56-58). (5) Keyboard ownership. TodoApp's document handler, NoteDetailView's window listener, the GanttView and CalendarView global handlers, FocusView, BatchEditModal and the widgets all react to the same key with no defaultPrevented, typing-target or modifier check. One Escape therefore closes several layers, and typing is swallowed (BUG-41, 42, 43, 11, 96-99).

Further concentrations: the date parsing stack (chronoCustom.ts, autoDetection.ts, recurringParser.ts, dateUtils.normalizeDateValue) has about 25 confirmed wrong-date outputs, most reproduced in memory against fixed reference dates. The Gantt scheduler (createTaskSchedulingMap and scheduleDayTasks use two different capacity models, plus a hard break) drops tasks from every day. Kanban column placement versus workflowState is inconsistent. Name-as-id entity handling (empty names, duplicates by case, the '$' replacement bug, prefix collisions) corrupts references. Import and export do not round-trip (relative due dates, own JSON shape unreadable). The 'done' semantics ignore auto-archived completions (Statistics, sprints). Several month-arithmetic sites overflow on the 29th-31st.

In good shape, leave alone: the rename cascade architecture (renameReferences/cascadeEntityRename/renameInStoredFilters plus the ENTITY_RENAMED_EVENT listeners), apart from the specific regex and selection-history gaps listed. sharedStore coalescing and broadcast. The nth-weekday, monthly-on and yearly clamping already fixed in recurringParser. Sanitisation in RichTextEditor rendering. The refuted case-sensitivity concern (SmartInput canonicalises names). Before changing anything, an implementer must know these facts. Person and project ids are names. TodoModel.metadata is the de facto wire format for edits, so changing its formats affects every caller and the activity diff. The /settings route is separate, so TodoApp remounts around settings edits. Several existing tests pin wrong behaviour and must change with the fix: useListViewState.test.ts:331 (noDueDate=0), recurringParser.test.ts:635 (last friday), dateUtils.test.ts:450 (nextweek >6 days), focusModes.test.ts:216 (closed equals completed). No view in src/components/views has unit tests. Write the reproducer test first for every item. Use fake timers and an explicit TZ for date items.

## Items, high to low

- [BUG-01](../workstreams/storage-core.md#bug-01) · high · `bugfix` · M — A failed or misread load auto-saves the default value over stored data · U0137, batch 2A
- [BUG-02](../workstreams/storage-core.md#bug-02) · high · `bugfix` · M — Users on IndexedDB from day one never get the migrated flag, so empty localStorage data overwrites IndexedDB · U0088, batch 2A
- [BUG-03](../workstreams/storage-core.md#bug-03) · high · `bugfix` · M — Switching to localStorage never sticks, and edits made after the switch are wiped on reload · U0087, batch 2A
- [BUG-04](../workstreams/undo-confirm.md#bug-04) · high · `bugfix` · S — Undoing a delete leaves the soft-deleted copy, creating duplicate-id todos, notes and reviews · U0132, batch 3A
- [BUG-05](../workstreams/durations.md#bug-05) · high · `bugfix` · S — Every metadata-based edit silently changes durations of 60 minutes or more (0.1h rounding) · U0377, batch 2B
- [BUG-06](../workstreams/activity-comments.md#bug-06) · high · `bugfix` · S — Every todo edit logs fake priority, due-date and duration changes · U0116, batch 3A
- [BUG-07](../workstreams/cross-tab.md#bug-07) · high · `bugfix` · L — Collections are last-writer-wins across tabs; only settings is coordinated · U0071, batch 2C
- [BUG-08](../workstreams/todos-core.md#bug-08) · high · `bugfix` · M — Completing in Focus mode leaves the time entry running, and the next task goes untracked · U0398, batch 3A
- [BUG-09](../workstreams/stats-time-focus.md#bug-09) · high · `bugfix` · M — Focus Complete and Skip advance one segment only; the leftover segment later re-toggles the task · U0397, batch 3B
- [BUG-10](../workstreams/stats-time-focus.md#bug-10) · high · `bugfix` · S — Focus mode toggles a stale snapshot and can reopen a task already completed · U0396, batch 3B
- [BUG-11](../workstreams/overlays-dialogs.md#bug-11) · high · `bugfix` · S — With task details open over Focus mode, Escape exits Focus mode and letter keys drive the hidden timer · U0404, batch 3C
- [BUG-12](../workstreams/todos-core.md#bug-12) · high · `bugfix` · S — List 'Select all' also selects todos hidden by filters, collapsed sections or the archive threshold · U0236, batch 3A
- [BUG-13](../workstreams/notes.md#bug-13) · high · `bugfix` · S — Notes bulk delete deletes only the last selected note · U0703, batch 3B
- [BUG-14](../workstreams/entity-names.md#bug-14) · high · `bugfix` · S — Clearing a person or project name saves an empty name; retyping then corrupts text · U0454, batch 3A
- [BUG-15](../workstreams/notes.md#bug-15) · high · `bugfix` · S — Saving a note title replaces all of the note's metadata with the title's markers · U0692, batch 3B
- [BUG-16](../workstreams/notes.md#bug-16) · high · `bugfix` · M — NoteDetailView discards unsaved local edits whenever any note changes · U0693, batch 3B
- [BUG-17](../workstreams/reviews.md#bug-17) · high · `bugfix` · M — ReviewEditView saves only on blur, and the summary blur save reads stale state · U0709, batch 3B
- [BUG-18](../workstreams/notes.md#bug-18) · high · `bugfix` · S — Note add and edit never save @people, $sources, %projects or #tags (wrong token type names) · U0409, batch 3B
- [BUG-19](../workstreams/recurrence.md#bug-19) · high · `bugfix` · S — Unchecking a completed recurring task leaves its spawn, and re-completing creates a second next occurrence · U0142, batch 3A
- [BUG-20](../workstreams/todos-core.md#bug-20) · high · `bugfix` · S — A completed dependency blocks its dependents again once it is archived (automatically after 7 days) · U0171, batch 3A
- [BUG-21](../workstreams/todos-core.md#bug-21) · high · `bugfix` · M — List drag-reorder computes positions from storage order, not the order on screen · U0721, batch 3A
- [BUG-22](../workstreams/notes.md#bug-22) · high · `bugfix` · M — Notes reorder mode resets updatedAt, doesn't switch to manual sort, reverses under descending, clashes under filters · U0701, batch 3B
- [BUG-23](../workstreams/kanban.md#bug-23) · high · `bugfix` · S — Kanban places every completed card in Done, so Rejected and custom completed or archived columns stay empty · U0219, batch 3B
- [BUG-24](../workstreams/kanban.md#bug-24) · high · `needs-decision` · M — Kanban move rules read a stale workflowState that toggle, archive, unarchive and duplicate never update · U0219, batch 3B
- [BUG-25](../workstreams/overlays-dialogs.md#bug-25) · high · `bugfix` · S — Closing Add Todo with the backdrop or X keeps the discarded text, and the next Add submits it · U0461, batch 3C
- [BUG-26](../workstreams/undo-confirm.md#bug-26) · high · `bugfix` · S — Deleting a person or project from its details overlay takes one click, with no confirmation · U0480, batch 3C
- [BUG-27](../workstreams/todos-core.md#bug-27) · high · `bugfix` · S — Adding a new priority from the task details dropdown leaves the task with no priority · U0427, batch 3A
- [BUG-28](../workstreams/settings.md#bug-28) · high · `bugfix` · S — Cleared auto-assign defaults come back after a reload · U0269, batch 3B
- [BUG-29](../workstreams/todos-core.md#bug-29) · high · `needs-decision` · M — The read-time due-date default resolves to 'now', so every undated todo is due right now · U0164, batch 3A
- [BUG-30](../workstreams/dates-time.md#bug-30) · high · `needs-decision` · M — Date-only due dates are overdue from midnight on their due day; 'Due Today' never fires · U0166, batch 3A
- [BUG-31](../workstreams/durations.md#bug-31) · high · `needs-decision` · M — Durations in days or weeks, and compound durations, are stored as minutes · U0377, batch 2B
- [BUG-32](../workstreams/dates-time.md#bug-32) · high · `bugfix` · S — 12 of 21 Delay options and Default Due Date presets silently do nothing · U0548, batch 3A
- [BUG-33](../workstreams/smart-input.md#bug-33) · high · `bugfix` · M — Duration detection swallows 'in 2 days' and adds a bogus duration to 'every 2 weeks' · U0517, batch 3A
- [BUG-34](../workstreams/dates-time.md#bug-34) · high · `bugfix` · M — Weekday plus a time-of-day shorthand ('friday morning', 'next friday eod') resolves to today · U0537, batch 3A
- [BUG-35](../workstreams/recurrence.md#bug-35) · high · `bugfix` · M — Recurring text that includes a time range stops recurring · U0523, batch 3A
- [BUG-36](../workstreams/recurrence.md#bug-36) · high · `bugfix` · M — 'every &lt;weekday> at 9am' drops the time and leaves 'at 9am' in the title · U0522, batch 3A
- [BUG-37](../workstreams/recurrence.md#bug-37) · high · `bugfix` · S — Monthly, quarterly and yearly intervals and chrono 'in 1 month' overflow from the 29th-31st · U0553, batch 3A
- [BUG-38](../workstreams/recurrence.md#bug-38) · high · `bugfix` · S — 'every Nth weekday' skips this month's occurrence when it is still ahead · U0555, batch 3A
- [BUG-39](../workstreams/dates-time.md#bug-39) · high · `bugfix` · S — The 'nextweek' shorthand lands a week late on every day except the week start · U0532, batch 3A
- [BUG-40](../workstreams/dates-time.md#bug-40) · high · `bugfix` · S — Weekday time ranges get a 7-day duration · U0521, batch 3A
- [BUG-41](../workstreams/overlays-dialogs.md#bug-41) · high · `bugfix` · M — Escape already handled by a widget also closes the overlay or note underneath · U0466, batch 3C
- [BUG-42](../workstreams/keyboard-help.md#bug-42) · high · `bugfix` · M — Gantt's keyboard handler swallows typing in editors, focus views and modifier shortcuts · U0337, batch 3C
- [BUG-43](../workstreams/keyboard-help.md#bug-43) · high · `bugfix` · S — Calendar's keyboard handler hijacks keys inside its own task-details modal and controls · U0337, batch 3C
- [BUG-44](../workstreams/keyboard-help.md#bug-44) · high · `bugfix` · S — 'Learn about this view' on the Stats or Time tab crashes the app · U0446, batch 3C
- [BUG-45](../workstreams/overlays-dialogs.md#bug-45) · high · `bugfix` · S — Clicking a todo in the Sprint overlay opens its details hidden behind the sprint overlay · U0420, batch 3C
- [BUG-46](../workstreams/smart-input.md#bug-46) · high · `bugfix` · S — SmartInput autocomplete fires mid-word: emails and prices create people, and '!!' or '50%' hijack Enter · U0505, batch 3A
- [BUG-47](../workstreams/smart-input.md#bug-47) · high · `bugfix` · S — People, projects and priorities created from SmartInput's 'Add new' are lowercased · U0506, batch 3A
- [BUG-48](../workstreams/settings.md#bug-48) · high · `needs-decision` · M — Deleting or renaming a priority strands todo ids, '!!' markers and the auto-assign default · U0306, batch 3B
- [BUG-49](../workstreams/settings.md#bug-49) · high · `bugfix` · M — Work hours: the per-day schedule choice isn't saved, overrides stay active, weekends seed from weekdays · U0309, batch 3B
- [BUG-50](../workstreams/gantt-scheduling.md#bug-50) · high · `bugfix` · M — The Gantt day scheduler's 'break' drops tracked time and every later todo once the day is exhausted · U0386, batch 3B
- [BUG-51](../workstreams/gantt-scheduling.md#bug-51) · high · `bugfix` · M — A Gantt task longer than one work day blocks every lower-ranked task from being scheduled · U0384, batch 3B
- [BUG-52](../workstreams/gantt-scheduling.md#bug-52) · high · `bugfix` · L — The Gantt day map and the day scheduler use different capacity models, so work is silently cut · U0382, batch 3B
- [BUG-53](../workstreams/gantt-scheduling.md#bug-53) · high · `bugfix` · M — Gantt ignores the 'Disabled' toggle on weekday, weekend and custom schedules · U0380, batch 3B
- [BUG-54](../workstreams/stats-time-focus.md#bug-54) · high · `bugfix` · S — Focus mode started from Gantt replays already-tracked time as new work · U0356, batch 3B
- [BUG-55](../workstreams/rich-text-html.md#bug-55) · high · `bugfix` · M — Markdown shortcuts replace the whole block with one text node, deleting formatted text · U0804, batch 3B
- [BUG-56](../workstreams/stats-time-focus.md#bug-56) · high · `bugfix` · M — Open timer: Pause then Resume restarts the countdown at full length; paused shows 0:00 · U0748, batch 3B
- [BUG-57](../workstreams/stats-time-focus.md#bug-57) · high · `bugfix` · S — Open timer: Resume starts the first mode instead of the paused one · U0412, batch 3B
- [BUG-58](../workstreams/stats-time-focus.md#bug-58) · high · `needs-decision` · S — Open timer: Start on the setup screen discards the open session without logging it · U0726, batch 3B
- [BUG-59](../workstreams/import-export.md#bug-59) · high · `bugfix` · M — JSON import cannot read the app's own JSON export; every field but the title is lost · U0099, batch 2B
- [BUG-60](../workstreams/import-export.md#bug-60) · high · `bugfix` · S — Exports write relative due dates ('Tomorrow', '3 days ago') and auto-assign defaults as data · U0097, batch 2B
- BUG-61 · high · `bugfix` · S — held back with security unit U0108 · batch 2B
- [BUG-62](../workstreams/storage-core.md#bug-62) · high · `bugfix` · S — Every data load waits on navigator.storage.persist(), which in Firefox waits for the user to answer a prompt · U0089, batch 2A
- [BUG-63](../workstreams/dates-time.md#bug-63) · high · `bugfix` · S — Month navigation overflows on the 29th-31st: Calendar skips months, 'Last Month' report shows this month · U0328, batch 3A
- [BUG-64](../workstreams/stats-time-focus.md#bug-64) · high · `bugfix` · S — Statistics ignores completed-then-archived tasks: the streak caps at about 7 days and counts drop · U0363, batch 3B
- [BUG-65](../workstreams/stats-time-focus.md#bug-65) · high · `needs-decision` · S — Sprint progress, velocity and burndown treat archived completed tasks as unfinished · U0363, batch 3B
- [BUG-66](../workstreams/stats-time-focus.md#bug-66) · high · `bugfix` · S — Printing Time Reports outputs only the header · U0372, batch 3B
- [BUG-67](../workstreams/todos-core.md#bug-67) · high · `feature-extension` · M — Templates store metadata and subtasks that are never applied · U0459, batch 3A
- [BUG-68](../workstreams/todos-core.md#bug-68) · high · `needs-decision` · M — Completed todos older than archiveDays vanish from List view until reload, and Restore hides them again · U0240, batch 3A
- [BUG-69](../workstreams/view-state.md#bug-69) · high · `bugfix` · S — Group by Sprint shows raw sprint ids as headings · U0259, batch 3B
- [BUG-70](../workstreams/notifications.md#bug-70) · high · `bugfix` · M — Due-date notification history is keyed by todo id only, so a postponed task never notifies again · U0738, batch 3B
- [BUG-71](../workstreams/storage-core.md#bug-71) · medium · `bugfix` · S — A failed notes, reviews or sprints load shows empty views with no error and silently discards new edits · U0137, batch 2A
- [BUG-72](../workstreams/migrations-versioning.md#bug-72) · medium · `bugfix` · S — The legacy settings.people migration races the people and projects load, so merged records can be lost · U0138, batch 2A
- [BUG-73](../workstreams/migrations-versioning.md#bug-73) · medium · `bugfix` · S — migrateTodos permanently clears custom priorities whenever settings loaded as defaults · U0068, batch 2A
- [BUG-74](../workstreams/backup.md#bug-74) · medium · `bugfix` · S — An uploaded backup older than the retention period is deleted the next time useTodos mounts · U0043, batch 2B
- [BUG-75](../workstreams/storage-core.md#bug-75) · medium · `bugfix` · S — Every IndexedDB load deletes the localStorage settings mirror, so dark-mode users see a light flash · U0776, batch 2A
- [BUG-76](../workstreams/storage-core.md#bug-76) · medium · `bugfix` · S — getStorageType relies on constructor.name, which production minification likely mangles · U0084, batch 2A
- [BUG-77](../workstreams/storage-core.md#bug-77) · medium · `bugfix` · S — IndexedDBAdapter never reopens after the browser closes its connection · U0081, batch 2A
- [BUG-78](../workstreams/entity-names.md#bug-78) · medium · `bugfix` · S — Rename treats '$' sequences in the new name as replacement patterns · U0599, batch 6A
- [BUG-79](../workstreams/entity-names.md#bug-79) · medium · `bugfix` · M — Renaming a person rewrites the start of another person's longer marker · U0598, batch 6A
- [BUG-80](../workstreams/entity-names.md#bug-80) · medium · `bugfix` · S — Selection history ignores renames, and the next recorded selection writes the old names back · U0569, batch 6A
- [BUG-81](../workstreams/todos-core.md#bug-81) · medium · `needs-decision` · M — Auto-assign defaults are applied both at creation and at read time, so cleared fields can't be cleared · U0164, batch 3A
- [BUG-82](../workstreams/settings.md#bug-82) · medium · `bugfix` · S — The 'Default Recurring' auto-assign setting is never applied · U0270, batch 10
- [BUG-83](../workstreams/settings.md#bug-83) · medium · `bugfix` · M — The SettingsModel singleton never changes identity, so memos keyed on todos go stale · U0319, batch 3A
- [BUG-84](../workstreams/todos-core.md#bug-84) · medium · `bugfix` · M — Circular dependencies are allowed and deadlock both tasks · U0428, batch 6A
- [BUG-85](../workstreams/todos-core.md#bug-85) · medium · `bugfix` · S — The Dependency and Sprint pickers accept free text and store dangling ids · U0673, batch 6A
- [BUG-86](../workstreams/kanban.md#bug-86) · medium · `bugfix` · S — Dragging a card to an archived-mapped Kanban column skips the dependency check · U0149, batch 6B
- [BUG-87](../workstreams/kanban.md#bug-87) · medium · `bugfix` · S — Kanban moves leave stale completedAt and archivedAt timestamps · U0157, batch 6B
- [BUG-88](../workstreams/stats-time-focus.md#bug-88) · medium · `bugfix` · S — 'Auto-Extend on Overtime' shortens durations when less time was tracked · U0145, batch 3B
- [BUG-89](../workstreams/undo-confirm.md#bug-89) · medium · `bugfix` · S — Undo restores a full snapshot and discards edits made during the undo window · U0134, batch 6A
- [BUG-90](../workstreams/sprints.md#bug-90) · medium · `bugfix` · S — Deleting a sprint leaves todos pointing at it, with no confirmation · U0574, batch 3B
- [BUG-91](../workstreams/kanban.md#bug-91) · medium · `bugfix` · S — Kanban keeps filtering by an archived or deleted sprint while showing 'All Sprints' · U0217, batch 6B
- [BUG-92](../workstreams/kanban.md#bug-92) · medium · `bugfix` · S — The Kanban 'Later' due-date filter matches overdue and past completed tasks · U0218, batch 6B
- [BUG-93](../workstreams/kanban.md#bug-93) · medium · `bugfix` · S — Deleting a Kanban state, or resetting to defaults, leaves its todos unmovable · U0219, batch 3B
- [BUG-94](../workstreams/kanban.md#bug-94) · medium · `needs-decision` · S — Kanban WIP limits are checked against the filtered column count · U0149, batch 6B
- [BUG-95](../workstreams/overlays-dialogs.md#bug-95) · medium · `bugfix` · S — Task details opened from Kanban, Calendar or Gantt hide the Sprint field and lose tag suggestions · U0212, batch 3C
- [BUG-96](../workstreams/overlays-dialogs.md#bug-96) · medium · `bugfix` · S — Details overlays owned by Kanban, Calendar and Gantt ignore Escape · U0212, batch 3C
- [BUG-97](../workstreams/keyboard-help.md#bug-97) · medium · `bugfix` · M — Global single-key shortcuts fire while modal dialogs are open; ConfirmDialog ignores Escape · U0463, batch 3C
- [BUG-98](../workstreams/overlays-dialogs.md#bug-98) · medium · `bugfix` · S — Pressing Escape to cancel Batch Edit also clears the selection · U0388, batch 6C
- [BUG-99](../workstreams/keyboard-help.md#bug-99) · medium · `bugfix` · S — Focus, OpenFocus and Tutorial shortcuts fire with Cmd or Ctrl held · U0405, batch 6C
- [BUG-100](../workstreams/keyboard-help.md#bug-100) · medium · `needs-decision` · S — 'T' opens the focus timer and also jumps Gantt and Calendar to today · U0337, batch 3C
- [BUG-101](../workstreams/app-shell.md#bug-101) · medium · `bugfix` · S — The redirect away from disabled views misses Time Reports · U0447, batch 6C
- [BUG-102](../workstreams/app-shell.md#bug-102) · medium · `bugfix` · S — The Notes and Reviews tabs render blank when the selected id no longer resolves · U0482, batch 6C
- [BUG-103](../workstreams/notes.md#bug-103) · medium · `bugfix` · S — Converting a note to a todo never opens the new todo · U0460, batch 3B
- [BUG-104](../workstreams/notes.md#bug-104) · medium · `bugfix` · M — Converting note action items drops their @, $, % and # markers from the todo metadata · U0654, batch 3B
- [BUG-105](../workstreams/notes.md#bug-105) · medium · `bugfix` · S — Note inputs offer 'Add new person, project or priority' through callbacks that do nothing · U0655, batch 6B
- [BUG-106](../workstreams/notes.md#bug-106) · medium · `bugfix` · S — Action item edits are lost when the note closes, and on a second quick Enter · U0653, batch 3B
- [BUG-107](../workstreams/notes.md#bug-107) · medium · `bugfix` · S — Delete and Convert in note detail leave the note before confirming, and act on the pre-save note · U0697, batch 6B
- [BUG-108](../workstreams/feedback-states.md#bug-108) · medium · `bugfix` · S — NotesView header and empty states count archived and soft-deleted notes · U0702, batch 6C
- [BUG-109](../workstreams/notes.md#bug-109) · medium · `bugfix` · S — Notes 'Select all' selects nothing under the Archived quick filter · U0704, batch 6B
- [BUG-110](../workstreams/notes.md#bug-110) · medium · `bugfix` · S — Leaving notes selection mode with Escape keeps the previous selection · U0700, batch 6B
- [BUG-111](../workstreams/search.md#bug-111) · medium · `bugfix` · S — Every note autosave and every details-overlay change re-records all selections into history · U0694, batch 6C
- [BUG-112](../workstreams/entity-names.md#bug-112) · medium · `bugfix` · M — Duplicate people and projects can be created, and archived ones are offered as new · U0456, batch 3A
- [BUG-113](../workstreams/entity-names.md#bug-113) · medium · `bugfix` · S — The metadata dropdown appends duplicate names or creates a case-variant entity · U0456, batch 3A
- [BUG-114](../workstreams/undo-confirm.md#bug-114) · medium · `bugfix` · S — The person and project delete warning misses source and mention references and counts phantom ones · U0585, batch 6A
- [BUG-115](../workstreams/entity-names.md#bug-115) · medium · `bugfix` · S — A refused rename throws away the other edits sent with it · U0455, batch 6A
- [BUG-116](../workstreams/todos-core.md#bug-116) · medium · `bugfix` · S — The details overlay keeps title-edit and comment state when switched to another todo · U0487, batch 6A
- [BUG-117](../workstreams/reviews.md#bug-117) · medium · `bugfix` · S — Typing in a review entry's Notes logs one activity per keystroke · U0591, batch 3B
- [BUG-118](../workstreams/reviews.md#bug-118) · medium · `needs-decision` · M — Review entry content is HTML for child reviews but plain text for tasks, and both are rendered the same way · U0591, batch 3B
- [BUG-119](../workstreams/reviews.md#bug-119) · medium · `bugfix` · S — The custom date picker creates duplicate reviews for periods that already have one · U0716, batch 6B
- [BUG-120](../workstreams/reviews.md#bug-120) · medium · `bugfix` · S — Typing into the custom date picker creates a review from the first partial value · U0719, batch 6B
- [BUG-121](../workstreams/dates-time.md#bug-121) · medium · `bugfix` · S — Week review labels use the calendar year instead of the ISO week-year · U0335, batch 6A
- [BUG-122](../workstreams/dates-time.md#bug-122) · medium · `bugfix` · S — Review period windows are an hour off on DST days · U0172, batch 6A
- [BUG-123](../workstreams/rich-text-html.md#bug-123) · medium · `bugfix` · S — Note and review search and previews strip HTML by regex: entities stay encoded and blocks run together · U0584, batch 3B
- [BUG-124](../workstreams/import-export.md#bug-124) · medium · `bugfix` · M — CSV import marks completed tasks active, merges projects, keeps the formula guard and drops custom priorities · U0099, batch 2B
- [BUG-125](../workstreams/backup.md#bug-125) · medium · `needs-decision` · M — Backups store todos and settings twice, and the 2MB cap leaves IndexedDB users with one backup · U0060, batch 2B
- [BUG-126](../workstreams/pwa-service-worker.md#bug-126) · medium · `bugfix` · S — The update toast never shows when a new service worker is already waiting at startup · U0049, batch 6C
- [BUG-127](../workstreams/stats-time-focus.md#bug-127) · medium · `bugfix` · S — Focus confirmation reminders ignore the user's sound volume · U0732, batch 6B
- [BUG-128](../workstreams/stats-time-focus.md#bug-128) · medium · `bugfix` · S — The Focus confirmation screen says 'Time for a break' when the next item is a task or nothing · U0401, batch 6B
- [BUG-129](../workstreams/stats-time-focus.md#bug-129) · medium · `bugfix` · S — Focus auto time tracking opens a second entry on a task already being tracked · U0399, batch 6B
- [BUG-130](../workstreams/stats-time-focus.md#bug-130) · medium · `bugfix` · M — Open timer long-break cadence counts pauses and early switches as completions · U0749, batch 6B
- [BUG-131](../workstreams/keyboard-help.md#bug-131) · medium · `bugfix` · S — Tutorial: Enter on a focused button advances two steps · U0435, batch 6C
- [BUG-132](../workstreams/sprints.md#bug-132) · medium · `bugfix` · S — Sprint burndown is one day off west of UTC and draws NaN with no todos · U0417, batch 6B
- [BUG-133](../workstreams/view-state.md#bug-133) · medium · `bugfix` · S — Category grouping and filtering ignore todos of archived projects · U0234, batch 6C
- [BUG-134](../workstreams/view-state.md#bug-134) · medium · `needs-decision` · M — Settings' Calendar default view and Gantt 'collapse completed' stop working after the first visit · U0729, batch 6C
- [BUG-135](../workstreams/gantt-scheduling.md#bug-135) · medium · `bugfix` · S — The Gantt scheduler ignores 'Default task duration' and reads lossy display strings · U0378, batch 3B
- [BUG-136](../workstreams/gantt-scheduling.md#bug-136) · medium · `bugfix` · S — GanttView passes display-expanded bounds to the scheduler, so work is scheduled outside work hours · U0353, batch 6B
- [BUG-137](../workstreams/gantt-scheduling.md#bug-137) · medium · `bugfix` · S — The Gantt schedule freezes at the last data change while the now-line moves · U0381, batch 6B
- [BUG-138](../workstreams/gantt-scheduling.md#bug-138) · medium · `bugfix` · S — Gantt reports false conflicts for tasks with time tracked earlier the same day · U0355, batch 6B
- [BUG-139](../workstreams/gantt-scheduling.md#bug-139) · medium · `bugfix` · M — Gantt dependency arrows never render (percent units in SVG path data) · U0361, batch 6B
- [BUG-140](../workstreams/gantt-scheduling.md#bug-140) · medium · `needs-decision` · S — On today's Gantt view every undated active task is marked overdue · U0387, batch 6B
- [BUG-141](../workstreams/calendar.md#bug-141) · medium · `bugfix` · S — Calendar week view goes blank when the selected day is clicked; month arrows do nothing in week and agenda views · U0336, batch 6B
- [BUG-142](../workstreams/stats-time-focus.md#bug-142) · medium · `bugfix` · M — Time attributed to several groups is double-counted; the donut exceeds 100% · U0367, batch 6B
- [BUG-143](../workstreams/stats-time-focus.md#bug-143) · medium · `bugfix` · S — The Time Reports daily chart shows an extra day and only the first 14 days of long periods · U0373, batch 6B
- [BUG-144](../workstreams/dates-time.md#bug-144) · medium · `bugfix` · S — SmartInput 'today' resolves to the evening setting, not work-hours EOD · U0538, batch 3A
- [BUG-145](../workstreams/dates-time.md#bug-145) · medium · `bugfix` · S — A Sunday work-week start (0) is treated as Monday in chrono shorthands · U0531, batch 3A
- [BUG-146](../workstreams/dates-time.md#bug-146) · medium · `needs-decision` · S — Time-of-day shorthands resolve to a time already past ('midnight' is always overdue) · U0529, batch 6A
- [BUG-147](../workstreams/recurrence.md#bug-147) · medium · `bugfix` · S — 'every month on the 15th' is detected as plain 'every month' · U0520, batch 6A
- [BUG-148](../workstreams/smart-input.md#bug-148) · medium · `bugfix` · S — Names that start or end with accented or symbol characters are never auto-detected · U0526, batch 6A
- [BUG-149](../workstreams/durations.md#bug-149) · medium · `bugfix` · S — '2h30m' becomes a due time, and '1h 30m' keeps only 30m · U0518, batch 6A
- [BUG-150](../workstreams/dates-time.md#bug-150) · medium · `feature-extension` · M — The Fiscal Year Start setting is ignored by Q1-Q4, H1/H2, FY and the quarter and year shorthands · U0535, batch 3A
- [BUG-151](../workstreams/dates-time.md#bug-151) · medium · `needs-decision` · M — Greedy date detection turns ordinary words into due dates or recurrences and strips them from titles · U0539, batch 6A
- [BUG-152](../workstreams/rich-text-html.md#bug-152) · medium · `bugfix` · M — List and heading Enter and Backspace handlers ignore the caret position and selected text · U0805, batch 6C
- [BUG-153](../workstreams/smart-input.md#bug-153) · medium · `bugfix` · M — 'Click to deactivate auto-detection' only works for dates and is keyed by character position · U0499, batch 6A
- [BUG-154](../workstreams/smart-input.md#bug-154) · medium · `bugfix` · S — Picking an autocomplete option replaces the last marker in the text, not the one being typed · U0505, batch 3A
- [BUG-155](../workstreams/activity-comments.md#bug-155) · medium · `bugfix` · S — Editing a comment in the activity timeline opens an editor on every revision row and can revert the comment · U0119, batch 6A
- [BUG-156](../workstreams/kanban.md#bug-156) · medium · `feature-extension` · S — The Kanban 'Set as Default' view has no effect on the board · U0292, batch 10
- BUG-157 · medium · `bugfix` · S — held back with security unit U0797 · batch 6C
- [BUG-158](../workstreams/smart-input.md#bug-158) · medium · `bugfix` · M — MarkedText resolves overlaps in a different order from SmartInput, so chips contradict stored metadata · U0498, batch 7B
- [BUG-159](../workstreams/stats-time-focus.md#bug-159) · medium · `bugfix` · S — Focus quick-extend options re-sort and de-duplicate on every keystroke · U0278, batch 6B
- [BUG-160](../workstreams/gantt-scheduling.md#bug-160) · medium · `bugfix` · S — The Flow context-switch time cannot be set to 0 · U0285, batch 6C
- [BUG-161](../workstreams/notes.md#bug-161) · medium · `bugfix` · S — Note card progress counts deleted todos, so it never reaches done · U0189, batch 6B
- [BUG-162](../workstreams/notifications.md#bug-162) · medium · `feature-extension` · M — Due-date notifications never show on Android Chrome · U0743, batch 3B
- [BUG-163](../workstreams/undo-confirm.md#bug-163) · low · `bugfix` · S — Soft-deleted records in the undo window leak into counts, reports, sprint totals and exports · U0604, batch 11
- [BUG-164](../workstreams/search.md#bug-164) · low · `bugfix` · S — Searches don't trim the query · U0580, batch 6C
- [BUG-165](../workstreams/sprints.md#bug-165) · low · `needs-decision` · S — Sprint 'Planned End Date' shows the day after the last sprint day · U0589, batch 11
- [BUG-166](../workstreams/recurrence.md#bug-166) · low · `needs-decision` · S — Completing an overdue recurring task spawns an instance that is already overdue · U0143, batch 11
- [BUG-167](../workstreams/kanban.md#bug-167) · low · `needs-decision` · S — Stopping a timer can move the card to In Progress · U0155, batch 11
- [BUG-168](../workstreams/reviews.md#bug-168) · low · `needs-decision` · S — Collapsing a review entry logs activity and bumps updatedAt, even on completed reviews · U0573, batch 6B
- [BUG-169](../workstreams/feedback-states.md#bug-169) · low · `bugfix` · S — A second toast inherits the first toast's dismiss timer · U0728, batch 8A
- [BUG-170](../workstreams/view-state.md#bug-170) · low · `bugfix` · S — Presets without saved sections never match the list's default expanded state · U0252, batch 11
- [BUG-171](../workstreams/view-state.md#bug-171) · low · `bugfix` · S — A preset named 'custom' collides with the 'no preset' sentinel · U0254, batch 11
- [BUG-172](../workstreams/entity-names.md#bug-172) · low · `bugfix` · S — The in-memory rename remap replaces only the first case variant · U0568, batch 11
- [BUG-173](../workstreams/cross-tab.md#bug-173) · low · `bugfix` · S — A settings change from another tab overwrites a pending local settings edit · U0073, batch 2C
- [BUG-174](../workstreams/migrations-versioning.md#bug-174) · low · `needs-decision` · M — The newer-data-version guard doesn't stop the older build from writing · U0067, batch 2A
- [BUG-175](../workstreams/import-export.md#bug-175) · low · `bugfix` · S — Import matching ignores alternatives · U0111, batch 11
- [BUG-176](../workstreams/import-export.md#bug-176) · low · `bugfix` · S — Todoist import assigns todos to a person named after the numeric responsible_uid · U0109, batch 10
- [BUG-177](../workstreams/import-export.md#bug-177) · low · `bugfix` · M — Import discards source timestamps, so completed imports count as completed today · U0114, batch 11
- [BUG-178](../workstreams/import-export.md#bug-178) · low · `bugfix` · S — A malformed .json file is parsed as CSV · U0106, batch 11
- [BUG-179](../workstreams/import-export.md#bug-179) · low · `needs-decision` · M — The notes Markdown and JSON exports contain raw rich-text HTML · U0102, batch 11
- [BUG-180](../workstreams/settings.md#bug-180) · low · `bugfix` · S — A negative backup retention value deletes every backup · U0020, batch 3B
- [BUG-181](../workstreams/backup.md#bug-181) · low · `bugfix` · S — Restoring a backup isn't atomic · U0059, batch 2B
- [BUG-182](../workstreams/visual-system.md#bug-182) · low · `bugfix` · S — ThemeProvider polls storage every second instead of subscribing · U0014, batch 6C
- [BUG-183](../workstreams/import-export.md#bug-183) · low · `bugfix` · S — The backup download revokes the object URL synchronously after click() · U0100, batch 2B
- [BUG-184](../workstreams/feedback-states.md#bug-184) · low · `feature-extension` · S — The recovery screen's 'Download my data' file can't be imported anywhere · U0038, batch 2B
- [BUG-185](../workstreams/dates-time.md#bug-185) · low · `bugfix` · S — Holiday shorthands typed on or just after the day jump a year · U0534, batch 11
- [BUG-186](../workstreams/smart-input.md#bug-186) · low · `bugfix` · S — An empty person or priority name hangs SmartInput and MarkedText · U0525, batch 11
- [BUG-187](../workstreams/dates-time.md#bug-187) · low · `needs-decision` · S — Dotted dates are read as US M.D despite the 'prefer European' branch · U0545, batch 11
- [BUG-188](../workstreams/smart-input.md#bug-188) · low · `bugfix` · S — Repeated mentions and tags produce duplicate metadata entries · U0556, batch 11
- [BUG-189](../workstreams/smart-input.md#bug-189) · low · `bugfix` · S — Priority detection matches 'med' as a bare word; 'urgent priority' highlights only 'urgent' · U0528, batch 11
- [BUG-190](../workstreams/recurrence.md#bug-190) · low · `bugfix` · S — 'repeat weekly' is detected as 'weekly', leaving 'repeat' in the title · U0520, batch 6A
- [BUG-191](../workstreams/dates-time.md#bug-191) · low · `bugfix` · S — Q4, H1 and H2 on the last day of their period roll a whole year · U0536, batch 11
- [BUG-192](../workstreams/gantt-scheduling.md#bug-192) · low · `needs-decision` · S — A completed task tracked on earlier days gets an estimated block on its completion day · U0385, batch 11
- [BUG-193](../workstreams/rich-text-html.md#bug-193) · low · `bugfix` · S — Outdenting a list item reorders its following siblings above it · U0806, batch 11
- [BUG-194](../workstreams/search.md#bug-194) · low · `needs-decision` · S — The global search cap drops whole kinds despite the per-kind fairness intent · U0755, batch 11
- [BUG-195](../workstreams/reviews.md#bug-195) · low · `bugfix` · S — Half-year and fiscal-year review suggestions skip or duplicate periods on month-end dates · U0717, batch 11
- [BUG-196](../workstreams/notes.md#bug-196) · low · `bugfix` · S — Note template labels are interpolated into HTML unescaped · U0596, batch 11
- [BUG-197](../workstreams/kanban.md#bug-197) · low · `bugfix` · S — The Kanban keyboard move announces success even when refused, and the refusal is silent · U0223, batch 6B
- [BUG-198](../workstreams/keyboard-help.md#bug-198) · low · `bugfix` · S — Global shortcuts fire while a select has focus · U0463, batch 3C
- [BUG-199](../workstreams/keyboard-help.md#bug-199) · low · `bugfix` · S — The 'N' shortcut shown on Add Todo does nothing in Kanban and several other views · U0467, batch 3C
- [BUG-200](../workstreams/notes.md#bug-200) · low · `bugfix` · S — Creating a note outside the Notes view doesn't open it and leaves a stale selection · U0492, batch 11
- [BUG-201](../workstreams/todos-core.md#bug-201) · low · `bugfix` · M — Bulk complete of a blocker together with its dependent leaves the dependent blocked · U0237, batch 11
- [BUG-202](../workstreams/view-state.md#bug-202) · low · `needs-decision` · M — List due-date filters and presets store relative labels that change every day · U0253, batch 6C
- [BUG-203](../workstreams/settings.md#bug-203) · low · `bugfix` · S — A new priority can reuse an existing order number, and the Settings form ignores the entered order · U0458, batch 11
- [BUG-204](../workstreams/gantt-scheduling.md#bug-204) · low · `bugfix` · S — Gantt bars that start before the visible range are drawn too wide · U0354, batch 11
- [BUG-205](../workstreams/gantt-scheduling.md#bug-205) · low · `bugfix` · S — Closing Focus mode remounts Gantt and resets the selected date · U0493, batch 11
- [BUG-206](../workstreams/dates-time.md#bug-206) · low · `bugfix` · S — Calendar week numbers are one behind when the week starts on Sunday · U0335, batch 6A
- [BUG-207](../workstreams/calendar.md#bug-207) · low · `needs-decision` · S — The Calendar 'Created' sort runs opposite to Priority and Duration · U0330, batch 11
- [BUG-208](../workstreams/stats-time-focus.md#bug-208) · low · `bugfix` · S — Statistics 'week' and '7 days' windows span 8 days and disagree with each other · U0173, batch 11
- [BUG-209](../workstreams/stats-time-focus.md#bug-209) · low · `bugfix` · S — The custom-period label parses YYYY-MM-DD as UTC · U0371, batch 6B
- [BUG-210](../workstreams/dates-time.md#bug-210) · low · `bugfix` · S — Date boundaries computed once never roll over at midnight · U0333, batch 11
- [BUG-211](../workstreams/notes.md#bug-211) · low · `bugfix` · S — Duplicating from note detail reuses the component, dropping a pending edit and carrying drafts over · U0698, batch 11
- [BUG-212](../workstreams/reviews.md#bug-212) · low · `bugfix` · S — An empty rich-text review summary can still render an empty Summary card · U0587, batch 11
- [BUG-213](../workstreams/notes.md#bug-213) · low · `feature-extension` · S — NoteDetailView accepts autoFocusContent but ignores it · U0691, batch 10
- [BUG-214](../workstreams/sprints.md#bug-214) · low · `bugfix` · S — Sprint duration and colour inputs save broken intermediate values · U0418, batch 11
- [BUG-215](../workstreams/entity-names.md#bug-215) · low · `bugfix` · S — A stale rename error is shown on the next person or project overlay · U0451, batch 11
- [BUG-216](../workstreams/entity-names.md#bug-216) · low · `bugfix` · S — Debounced save plus prop resync strips a trailing space while the user types · U0390, batch 11
- [BUG-217](../workstreams/stats-time-focus.md#bug-217) · low · `needs-decision` · S — Skip to Next on the last segment counts the task as completed without completing it · U0403, batch 11
- [BUG-218](../workstreams/stats-time-focus.md#bug-218) · low · `bugfix` · S — Deleting the running mode in setup orphans the open segment · U0411, batch 11
- [BUG-219](../workstreams/stats-time-focus.md#bug-219) · low · `bugfix` · M — Side effects run inside setState updaters (sounds, notifications, the auto-complete timer) · U0400, batch 11
- [BUG-220](../workstreams/keyboard-help.md#bug-220) · low · `bugfix` · S — Tutorial and Help hard-code wrong view digit shortcuts · U0433, batch 3C
- [BUG-221](../workstreams/todos-core.md#bug-221) · low · `bugfix` · S — The details overlay commits context on every blur, even when unchanged · U0425, batch 11
- [BUG-222](../workstreams/settings.md#bug-222) · low · `bugfix` · S — AutoAssignTab sorts the shared priorities array in place during render · U0268, batch 11
- [BUG-223](../workstreams/sprints.md#bug-223) · low · `bugfix` · S — Sprint details show the Days percentage with full float precision · U0683, batch 3B
- [BUG-224](../workstreams/gantt-scheduling.md#bug-224) · low · `bugfix` · S — The Sprint Work metric adds 30 phantom minutes per todo without a duration · U0378, batch 3B
- [BUG-225](../workstreams/stats-time-focus.md#bug-225) · low · `bugfix` · S — A running timer shows 0:00 for its first second · U0689, batch 11
- [BUG-226](../workstreams/todos-core.md#bug-226) · low · `bugfix` · S — TodoItem swipe can't block scrolling, and archived items arm an archive swipe that does nothing · U0195, batch 6A
- [BUG-227](../workstreams/view-state.md#bug-227) · low · `bugfix` · S — The filter badge shows '0' when only a quick filter is active · U0205, batch 11
- [BUG-228](../workstreams/visual-system.md#bug-228) · low · `bugfix` · S — InfoTooltip's edge clamping assumes a left-anchored box · U0666, batch 8C
- [BUG-229](../workstreams/storage-core.md#bug-229) · low · `bugfix` · S — The Storage tab under-reports usage and shows NaN% before the quota loads · U0093, batch 2A
- [BUG-230](../workstreams/settings.md#bug-230) · low · `bugfix` · S — Deleting a category before projects finish loading leaves dangling category ids · U0275, batch 11
- BUG-231 · low · `bugfix` · S — held back with security unit U0791 · batch 4

## Commit groupings suggested by the reviewer

Superseded by the work units where they differ; kept because they show what the reviewer expected to land together.

- **Storage load safety** — BUG-01, BUG-71, BUG-174. One loadedOk/read-error contract for every loader. It must land first because other storage fixes depend on it.
- **IndexedDB backend correctness** — BUG-02, BUG-03, BUG-62, BUG-75, BUG-76, BUG-77. All in storage.ts initialisation and adapters, testable together with fake-indexeddb.
- **Migration ordering** — BUG-72, BUG-73. Moves the legacy merge into init and protects priority ids against defaulted settings.
- **Cross-tab sync** — BUG-07, BUG-173. sharedStore adoption for collections plus its own pending-write fix. Large: split into one commit per collection if it nears 1000 lines.
- **Metadata round-trip** — BUG-05, BUG-06, BUG-221. Same TodoModel.metadata/todoToMetadata seam. Fix the format and the diff together, with round-trip tests.
- **Undo and soft delete** — BUG-04, BUG-89, BUG-163. useUndoableActions handlers in three hooks, plus the consumers that leak 'deleted'.
- **Focus view lifecycle** — BUG-08, BUG-09, BUG-10, BUG-11, BUG-99, BUG-127, BUG-128, BUG-129, BUG-217, BUG-219. FocusView, usePomodoroTimer and the toggleTodo updater change; one FocusView test harness.
- **Open focus timer** — BUG-56, BUG-57, BUG-58, BUG-130, BUG-218. The segment endReason model in useFocusSession and focusModes serves countdown, resume and cadence.
- **Note detail editing** — BUG-15, BUG-16, BUG-18, BUG-107, BUG-111, BUG-211, BUG-213. NoteDetailView and NoteAddModal share an additive metadata helper and resync logic.
- **Notes list** — BUG-13, BUG-22, BUG-108, BUG-109, BUG-110. NotesView selection, reorder and counts.
- **Reviews** — BUG-17, BUG-102, BUG-117, BUG-118, BUG-119, BUG-120, BUG-121, BUG-122, BUG-168, BUG-195, BUG-212. ReviewEditView, ReviewsView, reviewUtils and useReviews. Split the edit view from the date utils if it exceeds the line budget.
- **Kanban state model** — BUG-23, BUG-24, BUG-86, BUG-87, BUG-91, BUG-92, BUG-93, BUG-94, BUG-197. The columnStateId helper and setWorkflowState rules, all in KanbanView and useTodos.
- **Dependencies and recurrence lifecycle** — BUG-19, BUG-20, BUG-84, BUG-85, BUG-88, BUG-166, BUG-167, BUG-201. TodoModel dependency checks and useTodos toggle and spawn paths.
- **List view** — BUG-12, BUG-21, BUG-68, BUG-69, BUG-133, BUG-202. ListView, useDragReorder and useListViewState.
- **Entity names and deletion** — BUG-14, BUG-26, BUG-112, BUG-113, BUG-114, BUG-115, BUG-215, BUG-216. Name validation, uniqueness and the delete flow for name-as-id entities.
- **Keyboard and Escape ownership** — BUG-41, BUG-96, BUG-97, BUG-98, BUG-100, BUG-131, BUG-198, BUG-199, BUG-220. Establishes the defaultPrevented, typing-target and modal-gate conventions in TodoApp's handler.
- **Calendar view** — BUG-43, BUG-63, BUG-141, BUG-206, BUG-207, BUG-210. CalendarView keyboard, month and week logic, plus the shared useToday and month anchor.
- **Gantt scheduler engine** — BUG-50, BUG-51, BUG-52, BUG-53. One shared day simulation in ganttScheduler.ts. Large: may need two commits (break/long-task, then the capacity unification).
- **Gantt view** — BUG-42, BUG-54, BUG-135, BUG-136, BUG-137, BUG-138, BUG-139, BUG-140, BUG-192, BUG-204, BUG-205. GanttView wiring around the scheduler: the duration helper, a 'now' parameter, bounds, conflicts and arrows.
- **Duration parsing** — BUG-31, BUG-33, BUG-149. parseDuration units and duration detection precedence.
- **Chrono date parsing** — BUG-32, BUG-34, BUG-39, BUG-40, BUG-144, BUG-145, BUG-146, BUG-185, BUG-187, BUG-191. chronoCustom refiners and normalizeDateValue, with fixed-reference-date tests.
- **Recurrence parsing** — BUG-35, BUG-36, BUG-37, BUG-38, BUG-147, BUG-190. recurringParser and autoDetection recurrence detection, plus the addMonthsClamped helper.
- **Detection quality** — BUG-148, BUG-151, BUG-186, BUG-188, BUG-189. Name, priority and false-positive detection rules in autoDetection and tokenParser.
- **Auto-assign and due semantics** — BUG-28, BUG-29, BUG-30, BUG-81, BUG-82, BUG-83. Gated on the owner's auto-assign decision. Covers the TodoModel fallbacks, effectiveDueInstant and the settings model.
- **Priorities** — BUG-27, BUG-48, BUG-203, BUG-222. Priority CRUD, references and resolution.
- **Import and export** — BUG-59, BUG-60, BUG-61, BUG-124, BUG-175, BUG-176, BUG-177, BUG-178, BUG-184. Export-to-import round-trip tests in import.ts and export.ts.
- **Backups** — BUG-74, BUG-125, BUG-180, BUG-181, BUG-183. backup.ts retention, size and restore.
- **Rename cascade** — BUG-78, BUG-79, BUG-80, BUG-172. renameReferences regex fixes and in-memory listeners.
- **Sprints and statistics** — BUG-64, BUG-65, BUG-90, BUG-132, BUG-208, BUG-214, BUG-223, BUG-224. A shared isDone helper and sprint integrity.
- **Time reports** — BUG-66, BUG-142, BUG-143, BUG-209. Within TimeReportsView and StatisticsView aggregation.
- **SmartInput** — BUG-46, BUG-47, BUG-153, BUG-154, BUG-157, BUG-158. SmartInput autocomplete and token rendering, and the MarkedText parity it needs.
- **Rich text and HTML** — BUG-55, BUG-123, BUG-152, BUG-179, BUG-193, BUG-196, BUG-231. richText utils, RichTextEditor and the htmlToPlainText helper.
- **Templates** — BUG-67. Completes the template feature in handleSubmit.
- **Notifications and service worker** — BUG-70, BUG-126, BUG-162, BUG-182. Notification keying, the SW update path and the showNotification fallback.
- **TodoApp overlays and conversion** — BUG-25, BUG-44, BUG-45, BUG-95, BUG-101, BUG-103, BUG-104, BUG-105, BUG-106, BUG-116, BUG-200. TodoApp overlay ownership, view redirect and note-to-todo conversion.
- **Settings tabs** — BUG-49, BUG-134, BUG-150, BUG-156, BUG-159, BUG-160, BUG-229, BUG-230. Settings tab inputs and the settings-to-view semantics.
- **Search and small UI fixes** — BUG-155, BUG-161, BUG-164, BUG-165, BUG-169, BUG-170, BUG-171, BUG-194, BUG-225, BUG-226, BUG-227, BUG-228. Small independent component fixes batched for review efficiency.

## Dependencies

Ordering inside this dimension:
- BUG-01 (loadedOk gate and read-error contract) lands before BUG-07, BUG-71, BUG-73 and BUG-174, which reuse it.
- BUG-31 (parseDuration units) comes before BUG-149 and before any compound format choice in BUG-05. BUG-05 comes before BUG-135, BUG-204 and BUG-224, which switch to durationMinutes.
- BUG-05 and BUG-06 land together. BUG-221 is cosmetic once BUG-06 is in.
- BUG-23 (the columnStateId helper) comes before BUG-24 and BUG-93. BUG-04 comes before BUG-163.
- The owner's decision on BUG-81 gates BUG-29, BUG-82, BUG-224 and BUG-114's phantom part. BUG-28 is independent and should land first. BUG-30's effectiveDueInstant is reused by BUG-70 and BUG-140.
- BUG-60 (absolute export dates) comes before BUG-59's dueDate mapping and before BUG-177.
- BUG-35 (keep raw bare) comes before BUG-36. BUG-34's time-only components come before BUG-146.
- The addMonthsClamped helper from BUG-37 is reused by BUG-63 and BUG-195. The isDone helper from BUG-64 is reused by BUG-65.
- BUG-50, BUG-51 and BUG-52 come before BUG-137, BUG-136 and BUG-54, because the scheduler signatures change. BUG-137 comes before BUG-205.
- BUG-41 sets the defaultPrevented convention used by BUG-96, BUG-97 and BUG-11. BUG-95 (route overlays to TodoApp) can make BUG-96 trivial.
- BUG-56's segment endReason comes before BUG-130 and BUG-57.
- BUG-158's shared token-detection util is also used by BUG-104 and BUG-153.

Against other dimensions:
- Dead-code removal: remove the unreachable TodoItem edit branch (see dropped), GanttView._parseDuration (after BUG-135), detectAssignedPeople and the dead date exports only after the related bugs here land, so no fix targets deleted code.
- Duplication: shared helpers created here (htmlToPlainText, addMonthsClamped, isDone, useToday, the token-detection pipeline, a single getScheduleForDate behind BUG-49 and BUG-53, a single duration formatter and parser) should be the canonical consolidations. Coordinate so the duplication pass doesn't create competing versions.
- Error, validation and string messages: new user-facing strings are introduced by BUG-14 (empty name), BUG-112 and BUG-113 (duplicate name), BUG-84 (cycle), BUG-61 and BUG-124 (import warnings), BUG-71 (load error) and BUG-90/BUG-26 (confirmations). Route them through whatever string registry that dimension establishes, or land them first and migrate.
- Logging: BUG-02 (log discarded keys), BUG-01 (read failures) and BUG-61 (import failures) need log statements consistent with the logging dimension.
- UI design: the confirmation dialogs (BUG-26, BUG-90, BUG-48), the Kanban column semantics (BUG-23/24) and the review entry format (BUG-118) need a UX sign-off.
- Security: BUG-231 (noopener), BUG-186 (an empty name from an untrusted backup hangs the UI; backup validation belongs to Security) and BUG-196 (escaping) overlap with that dimension. Agree ownership to avoid double edits.
- Partly implemented features: BUG-67 (templates), BUG-82 (default recurring), BUG-156 (Kanban default), BUG-213 (autoFocusContent) and BUG-150 (fiscal year) may also be listed there. Keep one owner per item.
- Support: BUG-162 (Android notifications) and BUG-184 (recovery dump) overlap.
- Restructuring: TodoApp keyboard and overlay ownership (BUG-41/95/96/97) should precede any TodoApp split, or be done as part of it.
- Inconsistencies: the trimming (BUG-164), deleted filtering (BUG-163) and date parsing UTC versus local (BUG-132, BUG-209) work overlaps with that dimension's sweep.

## Open questions

- [ ] Auto-assign model: should defaults be applied once at creation (remove the TodoModel read-time fallbacks), or stay read-time with explicit effective and raw getters? (BUG-81, BUG-29, BUG-82, BUG-224)
- [ ] When is a date-only due date overdue: at 23:59:59.999, or at the configured work-day EOD? (BUG-30)
- [ ] Does a duration day ('1d') mean 24h or one work day, and does a week mean 7 days or 5 work days? Should the '1m/2m/3m' duration suggestions be removed, relabelled, or turned into months? (BUG-31)
- [ ] Kanban: when toggle, archive or unarchive changes a todo's state, should workflowState be reset, and to which column? Should the sprint filter scope WIP limits? (BUG-24, BUG-94)
- [ ] Should completed todos past archiveDays stay visible in Completed until the next load, or should the archive sweep run while the app is open? (BUG-68)
- [ ] Priorities: archive instead of hard delete, or delete with confirmation and reassign? Should the auto-assign priority be stored by id? (BUG-48)
- [ ] Does an archived task that was never completed satisfy a dependency or count as sprint-done? (BUG-20, BUG-65)
- [ ] Open focus timer: should Start with an open session end and log it, continue it, or be disabled? Should 'Skip to Next' on the last segment complete the task? (BUG-58, BUG-217)
- [ ] Should Calendar 'Default View' and Gantt 'Collapse completed' always apply on open, or remember the last in-view choice? (BUG-134)
- [ ] Which binding wins for 'T' in Gantt and Calendar: the focus timer or go-to-today? (BUG-100)
- [ ] Which ambiguous words should date detection stop treating as dates or recurrences (H1/Q1, bare ordinals, 'sprint N', 'fall', 'now', 'weekly' mid-sentence)? Should time words that are already past roll to tomorrow? (BUG-151, BUG-146)
- [ ] Should fiscal-year handling apply to bo*/eo* shorthands, and which FY numbering convention applies (start year as in Reviews, or end year)? (BUG-150)
- [ ] Should reviews' child-summary and task-notes content be HTML or plain text? (BUG-118)
- [ ] Should the legacy duplicate fields be dropped from new backups, and should the 2MB cap scale with the storage backend? (BUG-125)
- [ ] When an older build sees newer data, should it go read-only? (BUG-174)
- [ ] Should recurring spawns skip missed occurrences to land in the future? (BUG-166)
- [ ] Should a reorder count as a modification (updatedAt) for notes, and should list reorder be allowed under non-manual sorts? (BUG-21, BUG-22)
- [ ] Should template-stored absolute due dates be re-based (relative offset) or dropped when applied? (BUG-67)
- [ ] Sprint planned end: inclusive last day, or relabel as next sprint start? (BUG-165)
- [ ] Should dotted dates be read as European DD.MM? (BUG-187)
- [ ] Global search: round-robin slots, or a lower per-kind cap? (BUG-194)
- [ ] For undated tasks in today's Gantt, should the target be work-day end, or should buffer and overdue indicators be hidden? (BUG-140)

## Dropped during synthesis

- Editing a todo inline in the list wipes its context notes and its sprint (data-hooks slice) — Not reachable. TodoItem's edit mode is never entered: grep shows setIsEditing is only ever called with false (TodoItem.tsx:294, 298). Every other editTodo caller passes metadata that already includes sprint and context, so the defensive metadataToTodoFields change has no concrete trigger. Moved to the Dead-code dimension together with the unreachable-branch finding below.
- [OTHER] TodoItem's inline edit mode can never be reached (items slice) — Dead code, not a logic bug. It belongs to the Dead-code removal dimension: remove the branch, or restore an entry point (a feature decision). Recorded here because it invalidates the inline-edit finding above.
- Report grouping and colour lookups match entity names case-sensitively and ignore aliases (views-time slice) — Refuted by the verifier. SmartInput, import and rename all canonicalise names, so the exact-match lookups hit. The inconsistent match helpers belong to the Inconsistencies/Duplication dimensions.
- NoteDetailView handleBack plus useDebouncedSave unmount flush saves twice from a stale closure (view-hooks aside) — The notes slice verifier found the second onEdit is a harmless duplicate with no data effect. No defect.
- view-hooks finder's own discarded candidates (NaN index in useKeyboardNavigation on an empty list, usePersistedState A→B→A, prune effect before todos load, double-click restore race) — The finder already dropped these as untriggerable or harmless. Listed for completeness.
- Duplicate reports merged into single items — No content lost. Unions: undo-delete (data-hooks, views-core); metadata drift and fake activity (models, data-hooks, utils-other, views-core, overlays, items); failed load (data-hooks, view-hooks, storage); cross-tab (data-hooks, storage); archived dependency (models, data-hooks); drag reorder (data-hooks, view-hooks, views-core); Gantt break, long-task and capacity (utils-other, views-time); duration units (models, utils-dates, utils-other, overlays); notification keying (utils-other, view-hooks); templates (utils-other, views-core, items); convert-opens and action-item markers (data-hooks, views-core, notes, items); selection-history rename (view-hooks, storage, views-core); SW toast (view-hooks, storage); Android notifications (storage, utils-other); default recurring and due 'now' (models, utils-dates); monthly overflow (data-hooks, utils-dates); week label and DST, half-year suggestions (utils-other, notes); trim (models, utils-other, notes); toast timer (view-hooks, items); entity empty name (views-core, overlays); OpenFocus start and pause (view-hooks, utils-other, overlays); sprint archived progress (views-time, overlays, items); delete warning (models, notes); Kanban Later and archive deps (models or data-hooks, views-core); sprint delete (data-hooks, views-core); group by sprint (view-hooks, views-core); view defaults freeze (view-hooks, views-time); token names (notes, overlays); dropdown duplicates (notes, items); link overlap (utils-other, items); collapse activity (data-hooks, notes); recurring overdue spawn (data-hooks, utils-dates).

## Coverage gaps

No slice failed, and every slice reported verified findings. Areas no reviewer read for this dimension:
- src/app/page.tsx, src/app/settings/page.tsx and src/app/error.tsx. Only the theme script in src/app/layout.tsx was read.
- scripts/ (build-gh-pages.js, fix-github-pages.js were only glanced at for the minifier claim), .github/workflows/ and docs/.
- The prose of the 10 static help/*.tsx sections; only their shortcut wiring was checked.
- InfoTooltip's static tooltipContent text.
- Presentational shared components that were only skimmed: IconButton, NoticeBox, SectionHeader, Badge, ActionButtons, EmptyState, MarkerReference and Icons.tsx. Settings SettingsHeader and SettingsLoading were skimmed too.
- Most Jest test files were consulted only to check whether a finding is already pinned. EntityDetailsOverlay.test, OpenFocusSetup.test, the storage, utils and providers tests, and the remaining model tests were not read.
- Nothing was executed except in-memory transpiled checks of the date and parsing utilities. Every other reproducer is derived from reading the code.
- BUG-76 (minified constructor.name) was not confirmed against a production bundle.
- The Firefox persist() prompt (BUG-62) and Android's Notification constructor (BUG-162) rely on documented platform behaviour, not on a run.
- FocusView's planned-schedule timer was traced only through the overlays slice. Full chrono-node internals beyond the two refiners named were not reviewed.
