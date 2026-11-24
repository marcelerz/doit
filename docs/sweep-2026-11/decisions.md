# Decisions for the owner

190 work units cannot start until a question is answered. Each batch asks only its own, at the start of that batch. Tick a question when it is answered and write the answer under it. Questions belonging to security units are in the untracked local security file.

## By batch

### Batch 1 — Guard rails: CI, test gaps, timezone pin, frozen visual baselines, dependency bump, logger, agent-facing docs

- [x] **[U0649](workstreams/tests-ci-tooling.md#u0649)** (tests-ci-tooling, medium) Should amends and rewords bump the version again, and should the hook also lint staged files? — *Make the pre-commit version bump validate input and fail safely*
  - **Answer (22 November 2026):** keep both as they are. The hook bumps on every commit, amends included, and does not lint. It only has to fail safely.

Asked while planning the batch, and answered the same day:

- [x] **U0610** How is the new CI workflow proven? — **Answer:** push the batch branch and open one pull request, then iterate until it is green. Merging stays with the owner.
- [x] **U0610** Is the failing path checked too? — **Answer:** yes, with a throwaway draft pull request carrying one deliberate type error, closed unmerged once CI has failed on it.
- [x] **U0643** Should the dev server stop listening on the local network? — **Answer:** leave it as it is.

Raised by the batch, and answered on 23 November 2026. The follow-up change that applied the answers is described in [phases/batch-01.md](phases/batch-01.md#follow-ups):

- [x] **[U0814](workstreams/tests-ci-tooling.md#u0814)** (tests-ci-tooling, medium) Wait for the batches that rework those files (recommended), or take the lint upgrade sooner with one justified suppression per finding? — *Upgrade eslint-config-next to 16.4 and fix what its React Compiler rules report*
  - **Answer:** take it now, and fix each finding in the code. No suppressions. Done: `eslint-config-next` is 16.4.6 and `npm run lint` is clean.
- [x] **U0643** `next.config.ts` now sets `agentRules: false`, so that `next dev` does not write an `AGENTS.md` into the project root when an agent starts it. Keep it off, or let Next generate the file?
  - **Answer:** keep it off.
- [x] **[U0648](workstreams/migrations-versioning.md#u0648)** (migrations-versioning, medium) `package.json`'s `version` (0.1.0) is used for nothing. Sync it from `version.json`, or drop it? The docs now say it is unused.
  - **Answer:** drop it. Done: `package.json` has no `version` field, and `version.json` is the only version.
- [x] Batch 1 was merged into `main` directly at the owner's request. Does the rule "a batch lands through a pull request, where CI runs" ([README](README.md#rules-that-hold-in-every-batch)) stay?
  - **Answer:** it stays. Whether and how a pull request is merged is the owner's call.

### Batch 2A — Data safety: storage load/save, backend switch, migrations

- [ ] **[U0089](workstreams/storage-core.md#u0089)** (storage-core, high) Request persistent storage on every startup, or only after a meaningful action such as adding the first task? — *Stop storage initialization from awaiting navigator.storage.persist()*
- [ ] **[U0137](workstreams/storage-core.md#u0137)** (storage-core, high) Settle DUP-24 first: does its alternative replace usePersistedState as the shared persistence base? — *Gate auto-save on a successful load in every collection hook*
- [ ] **[U0067](workstreams/migrations-versioning.md#u0067)** (migrations-versioning, high) When stored data is newer than the app: block with a reload screen and read-only mode, or accept the migrations and reword the warning? — *Stop an older build from migrating and saving newer stored data*
- [ ] **[U0074](workstreams/storage-core.md#u0074)** (storage-core, low) Should initializeStorage return void, or a backend, fallback reason and migration count result that LOG-25 logs? — *Remove null-as-StorageAdapter casts from initializeStorage's result*

### Batch 2B — Data safety: backup, restore, import, export, durations

- [ ] **[U0043](workstreams/backup.md#u0043)** (backup, high) Exempt manual and imported backups from age and count pruning, or age them by uploadedAt under their own limit? — *Stop pruning from silently deleting imported and manual backups*
- [ ] **[U0377](workstreams/durations.md#u0377)** (durations, high) Does 'd' mean 24 hours or one 8-hour work day (and 'w' accordingly), and should '1m/2m/3m' suggestions be relabelled or removed? — *Make parseDuration sum compound units including days and weeks*
- [ ] **[U0042](workstreams/backup.md#u0042)** (backup, medium) Should auto-backup quota failures also raise the global storage-full banner? — *Report backup failure reasons: quota, partial restore, parse versus write*
- [ ] **[U0055](workstreams/backup.md#u0055)** (backup, medium) Keep lastBackupDate only in doit-backup-settings (recommended), or only in settings.backup? — *Consolidate backup helpers in backup.ts and store lastBackupDate once*
- [ ] **[U0060](workstreams/backup.md#u0060)** (backup, medium) Drop legacy todos/settings fields from new backups, and what size cap should localStorage and IndexedDB each get? — *Measure backup cap in real bytes, scale per backend, drop duplicated fields*

### Batch 2C — Data safety: two tabs open at once

- [ ] **[U0071](workstreams/cross-tab.md#u0071)** (cross-tab, high) Accept last-writer-wins through createSharedStore, or merge concurrent tab edits by id and updatedAt? — *Move every persisted collection onto createSharedStore for cross-tab safety*

### Batch 3A — Critical fixes: dates, recurrence, smart input, todos, undo/confirm, names, activity

- [ ] **[U0822](workstreams/dates-time.md#u0822)** (dates-time, medium, proposed for this batch by batch 1) Does a shorthand typed on the day it names mean today or the next occurrence (U0534 asks the same for holidays), and at the weekend do the week shorthands mean the week that just ended or the one about to start? — *Decide what a date shorthand means on the day it names*
- [ ] **[U0166](workstreams/dates-time.md#u0166)** (dates-time, high) Store end-of-day at write time, or keep midnight as the date-only marker and treat it as end-of-day? — *Stop date-only due dates turning overdue at midnight of their day*
- [ ] **[U0167](workstreams/dates-time.md#u0167)** (dates-time, high) Which 'this week' window should List, grouping, Calendar and Kanban share: next seven days or calendar week? — *Define Today, This week and overdue buckets once on TodoModel*
- [ ] **[U0535](workstreams/dates-time.md#u0535)** (dates-time, high) Should Q/H/FY and bo*/eo* shorthands follow fiscalYearStart, and with which FY-number convention, or be renamed calendar periods? — *Apply the fiscal-year-start setting to quarter, half and FY shorthands*
- [ ] **[U0538](workstreams/dates-time.md#u0538)** (dates-time, high) Should 'today' resolve to the work-hours end of day or the evening setting? Existing due times will change. — *Make 'today' resolve to one time across every parsing path*
- [ ] **[U0548](workstreams/dates-time.md#u0548)** (dates-time, high) Should the 'Next Week' preset mean the nextweek shorthand, and should day-level presets like 'tomorrow' snap to end of day? — *Fall back to the custom chrono parser so Delay presets work*
- [ ] **[U0164](workstreams/todos-core.md#u0164)** (todos-core, high) Apply defaults only at creation and drop read-time fallbacks, or expose explicit effective and raw values? — *Apply auto-assign defaults once and remove read-time fallbacks*
- [ ] **[U0171](workstreams/todos-core.md#u0171)** (todos-core, high) Do archived-but-never-completed or deleted dependencies count as satisfied? — *Treat completed-then-archived dependencies as satisfied*
- [ ] **[U0240](workstreams/todos-core.md#u0240)** (todos-core, high) Show past-threshold completed todos until the next load archives them, or run the archive sweep during the session and at completion? — *Keep completed todos visible until archived, and fix the auto-delete tooltip*
- [ ] **[U0459](workstreams/todos-core.md#u0459)** (todos-core, high) How should a stored absolute due date be re-based, and how do unticked fields interact with markers? — *Apply a template's stored metadata and subtasks when submitting*
- [ ] **[U0721](workstreams/todos-core.md#u0721)** (todos-core, high) When reorder mode starts, switch the sort to Manual automatically, or disable reordering under other sorts? — *Compute drag-reorder positions from the manual order in one shared hook*
- [ ] **[U0316](workstreams/undo-confirm.md#u0316)** (undo-confirm, high) Confirm every section reset, including the template Reset, with a dialog rather than an undo toast? — *Confirm before Reset to Defaults wipes a settings section*
- [ ] **[U0456](workstreams/entity-names.md#u0456)** (entity-names, high) Should a duplicate name block creation or only warn, and should SmartInput unarchive and reuse an archived match? — *Validate name uniqueness on every person and project create path*
- [ ] **[U0181](workstreams/activity-comments.md#u0181)** (activity-comments, high) Switch todo activity text to SmartInput's markers, and which non-colliding notation should recurring use? — *Create one activity module for building, appending and diffing entries*

### Batch 3B — Critical fixes: notes, reviews, sprints, Kanban, Gantt, stats/focus, notifications, settings

- [ ] **[U0003](workstreams/pwa-service-worker.md#u0003)** (pwa-service-worker, high) Cache sounds lazily on first play only, or also add an opt-in offline download and re-encode at a lower bitrate? — *Stop precaching 315 MB of ambient sounds on service-worker install*
- [ ] **[U0409](workstreams/notes.md#u0409)** (notes, high) Should editing a note title add its markers to the existing metadata, or should only new notes take title markers? — *Save note markers by mapping SmartInput's real token types to metadata*
- [ ] **[U0701](workstreams/notes.md#u0701)** (notes, high) Should reordering notes stop bumping updatedAt? — *Fix notes reorder mode sort, direction, filtered renumbering and updatedAt*
- [ ] **[U0591](workstreams/reviews.md#u0591)** (reviews, high) Review entry content format: read-only child HTML plus a separate notes field, plain-text task notes, or RichTextEditor for both? — *Edit review entry notes as rich text with debounced, single logging*
- [ ] **U0491** (sprints, high) held back; see the local security file.
- [ ] **[U0574](workstreams/sprints.md#u0574)** (sprints, high) Log an activity entry on each affected todo, and require confirmation before deleting a sprint? — *Clear todo sprint references when a sprint is deleted*
- [ ] **[U0219](workstreams/kanban.md#u0219)** (kanban, high) When state changes outside Kanban, should workflowState reset, and to which column per state? — *Resolve Kanban card columns with one helper for placement and moves*
- [ ] **[U0378](workstreams/gantt-scheduling.md#u0378)** (gantt-scheduling, high) Should a todo without a duration count as 0 minutes or a default estimate in Sprint Work? — *Read numeric minutes and default task duration in Gantt and SprintProgress*
- [ ] **[U0145](workstreams/stats-time-focus.md#u0145)** (stats-time-focus, high) Extend duration only when tracked time exceeds the estimate, or always record tracked time and relabel the setting? — *Fix auto-extend on overtime to match its label in every completion path*
- [ ] **[U0363](workstreams/stats-time-focus.md#u0363)** (stats-time-focus, high) Confirm archived todos that were never completed stay not-done while completed-then-archived ones count as done. — *Count completed-then-archived todos as done in statistics and sprint metrics*
- [ ] **[U0372](workstreams/stats-time-focus.md#u0372)** (stats-time-focus, high) Should the collapsed per-group breakdown details print expanded? — *Make Time Reports print the report, not only the header*
- [ ] **[U0726](workstreams/stats-time-focus.md#u0726)** (stats-time-focus, high) Should Start end and log the open session, continue it via switchTo, or be disabled while a session is resumable? — *Stop Start on open-timer setup discarding the running session unlogged*
- [ ] **[U0738](workstreams/notifications.md#u0738)** (notifications, high) Should due soon, due today and overdue each fire once per due date, or only one notification per due date? — *Key notified-task history by due date and kind, not todo id*
- [ ] **[U0743](workstreams/notifications.md#u0743)** (notifications, high) Should due and overdue reminders stay on screen instead of auto-closing after five seconds? — *Deliver notifications via service worker registration, with click-to-open and delivery tracking*
- [ ] **[U0306](workstreams/settings.md#u0306)** (settings, high) On priority delete: archive, refuse while in use, or clear references? Store defaults and filters by id instead of name? — *Cascade priority renames and deletes into todos, defaults, filters and presets*
- [ ] **[U0309](workstreams/settings.md#u0309)** (settings, high) Persist an explicit scheduleMode or derive it from customSchedules? Should switching away from custom mode clear the per-day schedules? — *Persist the work-hours schedule mode and stop hidden custom-day overrides*
- [ ] **[U0311](workstreams/settings.md#u0311)** (settings, high) On a disabled day, should BOD/EOD shortcuts use the stored hours, defaults, or roll forward to the next enabled day? — *Treat work-hours days marked Disabled as non-working in every resolver*
- [ ] **[U0047](workstreams/pwa-service-worker.md#u0047)** (pwa-service-worker, medium) Stop registering the service worker in development, or keep it with a per-load cache version? — *Stop the dev-server service worker serving stale caches at root scope*

### Batch 3C — Critical fixes: dialogs, Escape, key handlers, help digits

- [ ] **[U0480](workstreams/undo-confirm.md#u0480)** (undo-confirm, high) Should deleting a sprint from its details overlay also ask for confirmation? — *Confirm person, project and sprint deletes from their detail overlays*
- [ ] **[U0212](workstreams/overlays-dialogs.md#u0212)** (overlays-dialogs, high) Should Kanban keep closing the details overlay when the task is toggled? — *Route Kanban, Gantt and Calendar task details through TodoApp's single overlay*
- [ ] **[U0226](workstreams/overlays-dialogs.md#u0226)** (overlays-dialogs, high) Should Kanban's filter-preset modal reuse SavePresetModal, adding a delete list to it? — *Move hand-built dialogs onto Modal and define one z-index scale*
- [ ] **[U0466](workstreams/overlays-dialogs.md#u0466)** (overlays-dialogs, high) Should Modal own Escape via a stack hook, given its blur-then-defer close changes RichTextEditor commit timing, or TodoApp's chain? — *Give Escape a single owner that closes only the topmost layer*
- [ ] **[U0337](workstreams/keyboard-help.md#u0337)** (keyboard-help, high) Which key should Gantt's 'jump to today' use, since 't' also opens the focus timer from TodoApp? — *Stop Gantt and Calendar key handlers swallowing typing, buttons and overlays*
- [ ] **[U0446](workstreams/keyboard-help.md#u0446)** (keyboard-help, high) Hide the tutorial button on Stats and Time, or write tutorials for those two views? — *Stop the tutorial button crashing the app on Stats and Time*
- [ ] **[U0443](workstreams/keyboard-help.md#u0443)** (keyboard-help, medium) Stats help claims a per-person breakdown that does not exist: correct the text or add the breakdown? — *Render the Views help from the view registry, adding Notes, Reviews, Time*
- [ ] **[U0467](workstreams/keyboard-help.md#u0467)** (keyboard-help, medium) Should N open Add Todo where views lack an add action, or be documented as context-sensitive with '(N)' dropped? — *Make N, /, f, d and Escape shortcuts work consistently across views*

### Batch 4 — Security hardening

- [ ] **U0606** (security-platform, medium) held back; see the local security file.
- [ ] **U0008** (pwa-service-worker, low) held back; see the local security file.
- [ ] **U0296** (rich-text-html, low) held back; see the local security file.
- [ ] **U0809** (rich-text-html, low) held back; see the local security file.
- [ ] **U0641** (security-platform, low) held back; see the local security file.
- [ ] **U0780** (security-platform, low) held back; see the local security file.

### Batch 5 — Dead-code removal

- [ ] **[U0105](workstreams/import-export.md#u0105)** (import-export, low) Keep originalId for duplicate detection (SUP-74) or a planned column-mapping UI, or delete the mapping and raw fields? — *Remove the unused CSV field mapping and ImportedTodo raw fields*
- [ ] **[U0006](workstreams/pwa-service-worker.md#u0006)** (pwa-service-worker, low) Delete the _next/static branch, or move it above isStaticAsset so those files land in the dynamic cache? — *Remove shadowed _next/static branch and redundant root-path checks in sw.js*
- [ ] **[U0046](workstreams/pwa-service-worker.md#u0046)** (pwa-service-worker, low) Delete clearCache, getVersion and their sw.js handlers, or surface them in a Settings diagnostics panel? — *Delete or surface useServiceWorker clearCache and getVersion*
- [ ] **[U0524](workstreams/smart-input.md#u0524)** (smart-input, low) Delete detectAssignedPeople with its tests, or log ask/tell/cc auto-assign as an unfinished feature to wire in? — *Delete test-only autoDetection helpers and decide on detectAssignedPeople*
- [ ] **[U0191](workstreams/code-hygiene.md#u0191)** (code-hygiene, low) Delete these props and inline defaults, or thread real marker colours, link patterns, people and projects (a visible change)? — *Settle unused optional props on NoteListItem, TodoListItem and TodoItem*
- [ ] **[U0576](workstreams/code-hygiene.md#u0576)** (code-hygiene, low) Remove return members used only by tests, or keep some as deliberate public hook API? — *Drop hook return members that no consumer reads*
- [ ] **[U0663](workstreams/code-hygiene.md#u0663)** (code-hygiene, low) Keep EmptyState action props, ActivitySection props and Notification.duration if empty-state actions, composer reuse and persistent error toasts are approved? — *Delete optional props and variants no shared-component caller passes*

### Batch 6A — Medium fixes: domain core

- [ ] **[U0819](workstreams/smart-input.md#u0819)** (smart-input, low, proposed for this batch by batch 1) Should words such as 'Morning' and 'Weekly', which the parser reads as part of a date or recurrence, stay in the plain title? — *Decide whether a title keeps the words the date parser takes*
- [ ] **[U0168](workstreams/dates-time.md#u0168)** (dates-time, medium) Change the data model to add an all-day due-date marker with a migration? — *Store an explicit all-day marker so due dates survive time-zone changes*
- [ ] **[U0529](workstreams/dates-time.md#u0529)** (dates-time, medium) Should 'morning', 'afternoon' and 'evening' roll to tomorrow once past, like '3pm', with midnight meaning end of today? — *Stop time-of-day shorthands resolving to an already-past time*
- [ ] **[U0539](workstreams/dates-time.md#u0539)** (dates-time, medium) Per pattern: require context or case, drop it, or resolve 'sprint N' against real sprints? Which position rules for daily/weekly? — *Stop greedy date patterns turning ordinary words into due dates*
- [ ] **[U0520](workstreams/recurrence.md#u0520)** (recurrence, medium) Should the 'workday' recurrence follow the work-week settings instead of a fixed Monday to Friday? — *Align SmartInput recurrence detection with every phrase the parser accepts*
- [ ] **[U0499](workstreams/smart-input.md#u0499)** (smart-input, medium) Restrict 'click to deactivate' and its Help text to date and recurring tokens, or honour deactivation for every auto-detected token type? — *Make SmartInput token deactivation consistent, edit-stable, resettable and reversible*
- [ ] **[U0150](workstreams/todos-core.md#u0150)** (todos-core, medium) Adopt 'updatedAt changes only on content edits', and add timestamps to sprints, templates, people and projects? — *Apply one updatedAt rule across all entities and actions*
- [ ] **[U0134](workstreams/undo-confirm.md#u0134)** (undo-confirm, medium) Should undoing an action leave a trace in the activity log at all? — *Undo only the changed fields and keep the action's activity entry*
- [ ] **[U0585](workstreams/undo-confirm.md#u0585)** (undo-confirm, medium) Which references trigger the warning: all or active todos, notes, reviews, templates, and auto-assign defaults? — *Base person and project delete warnings on real reference counts*
- [ ] **[U0452](workstreams/entity-names.md#u0452)** (entity-names, medium) When a rename cascade fails part-way, should the rename be finished or the already rewritten references rolled back? — *Catch rename cascade failures and report them in the entity overlay*
- [ ] **[U0582](workstreams/entity-names.md#u0582)** (entity-names, medium) Introduce PersonRef/ProjectRef brands, and accept that resolving alternative names changes note group headers and labels? — *Separate name-reference brands from entity ids; fix id-keyed lookups*
- [ ] **[U0746](workstreams/entity-names.md#u0746)** (entity-names, medium) Should all entity colour and category lookups match case-insensitively and include alternative names? — *Resolve entity colours and lookups through one findByNameOrAlternatives resolver*
- [ ] **[U0564](workstreams/activity-comments.md#u0564)** (activity-comments, medium) Should any entity store comment_added/edited activity entries, or should comment events come only from comment history? — *Stop note comments appearing twice in the timeline*

### Batch 6B — Medium fixes: views

- [ ] **[U0655](workstreams/notes.md#u0655)** (notes, medium) In note inputs, should 'Add new person/project/priority' really create the entity, or be hidden? — *Stop note inputs offering 'Add new' through no-op callbacks*
- [ ] **[U0697](workstreams/notes.md#u0697)** (notes, medium) After archiving a review, return to the list or render the review undo stack at TodoApp level? — *Navigate away from note detail only after delete or convert is confirmed*
- [ ] **[U0573](workstreams/reviews.md#u0573)** (reviews, medium) Persist collapsed state on the review without activity, or move it into view state; keep entry_collapsed/expanded types? — *Stop review entry collapse from logging activity and bumping updatedAt*
- [ ] **[U0149](workstreams/kanban.md#u0149)** (kanban, medium) Should the sprint filter scope WIP limits, or should they always count every card in the column? — *Give Kanban drags undo, the archive dependency check and unfiltered WIP counts*
- [ ] **[U0387](workstreams/gantt-scheduling.md#u0387)** (gantt-scheduling, medium) For undated tasks, target the end of the work day, or hide buffer and overdue indicators entirely? — *Stop marking every undated task overdue on today's Gantt view*
- [ ] **[U0336](workstreams/calendar.md#u0336)** (calendar, medium) Should the header arrows step by seven days in week and agenda views? — *Keep Calendar week view populated and make header arrows view-aware*
- [ ] **[U0367](workstreams/stats-time-focus.md#u0367)** (stats-time-focus, medium) Attribute shared tracked time to the first group, to every group, or split it proportionally across groups? — *Attribute multi-project and multi-person tracked time by one shared rule*
- [ ] **[U0737](workstreams/notifications.md#u0737)** (notifications, medium) Confirm polling every checkInterval minutes (default 15 instead of 1), or keep one-minute polling and relabel the setting? — *Drive due-task notification polling from the checkInterval setting*

### Batch 6C — Medium fixes: settings, view state, search, platform

- [ ] **[U0253](workstreams/view-state.md#u0253)** (view-state, medium) Use Kanban's fixed buckets or date keys for the List due-date filter, and drop or migrate stored values? — *Replace List's relative due-date filter values with stable buckets*
- [ ] **[U0729](workstreams/view-state.md#u0729)** (view-state, medium) Persist only user-touched keys so settings keep applying, reset the stored option when the setting changes, or relabel the settings? — *Make Calendar default view and Gantt collapse-completed settings apply after first visit*
- [ ] **[U0747](workstreams/view-state.md#u0747)** (view-state, medium) Should filter options merge case variants and alternative names into one canonical entity option? — *Collapse case variants and alternative names into one filter option*
- [ ] **[U0580](workstreams/search.md#u0580)** (search, medium) Which fields should each entity's search cover, or should Help be corrected to match current todo search? — *Align search fields across models through one matchesText helper*
- [ ] **[U0702](workstreams/feedback-states.md#u0702)** (feedback-states, medium) Rewire the unreachable Reviews 'No Reviews' and Calendar empty states so they can show, or delete them? — *Fix list header counts and empty states across Notes, entities, sprints, reviews*

### Batch 7A — Consolidation: general hygiene (helpers, naming, layout)

- [ ] **[U0015](workstreams/code-hygiene.md#u0015)** (code-hygiene, low) Which byte format wins: '0 B / 1.5 KB' (BackupTab) or '0 Bytes / 1.46 KB' up to TB (StorageTab)? — *Share one byte, duration and relative-time formatter across components*

### Batch 7B — Consolidation: domain duplication and restructuring

- [ ] **[U0547](workstreams/dates-time.md#u0547)** (dates-time, high) For each divergence between the two engines (vocabulary, aliases, fallback times), which result becomes authoritative? — *Make one shorthand-date engine authoritative for chronoCustom and dateUtils*
- [ ] **[U0601](workstreams/dates-time.md#u0601)** (dates-time, medium) Which week-start setting should Calendar and Gantt follow: dateTime.workWeekStart, calendar weekStartDay, or fixed Monday? — *Share week and month range helpers with one week-start source*
- [ ] **[U0441](workstreams/smart-input.md#u0441)** (smart-input, medium) Unify legend content and colours across surfaces, or keep each surface's current entries exactly? — *Single-source marker, date shorthand and recurring example lists for help*
- [ ] **[U0498](workstreams/smart-input.md#u0498)** (smart-input, medium) Which detection order and colour rule should the shared tokenizer use: SmartInput's (durations and dates first) or MarkedText's (links and people first)? — *Extract one token detector shared by SmartInput and MarkedText*
- [ ] **[U0513](workstreams/smart-input.md#u0513)** (smart-input, medium) Should the Settings duration list gain '8h', and which recurring-suggestion order wins? — *Keep one home for due-date, duration and recurring suggestion lists*
- [ ] **[U0515](workstreams/smart-input.md#u0515)** (smart-input, medium) Unify the drifted people stop-word lists (changes what gets detected), or keep each detector's current list? — *Fold autoDetection's copy-pasted name detectors into one configurable matcher*
- [ ] **[U0426](workstreams/todos-core.md#u0426)** (todos-core, medium) Is the visible change acceptable, including unified chip styling and dropping the fake % and * suggestion prefixes? — *Unify task-detail Priority, Duration and Recurring into one single-value field*
- [ ] **[U0362](workstreams/sprints.md#u0362)** (sprints, medium) Keep Sprints search matching name and goal only, or adopt SprintModel.matchesSearch which also matches status labels? — *Render SprintsView through EntityListView and drop SprintItem's dead count props*
- [ ] **[U0154](workstreams/kanban.md#u0154)** (kanban, medium) Should an empty Kanban transition rule list mean all moves allowed, or none? — *Use one Kanban transition check with defined empty-rules semantics*
- [ ] **[U0213](workstreams/kanban.md#u0213)** (kanban, medium) Adopt FilterSection, useViewPresets and SavePresetModal in Kanban, migrating id-keyed presets to names? Should preset deletes ask for confirmation? — *Converge Kanban filters and presets onto the shared view-state and preset pattern*
- [ ] **[U0310](workstreams/settings.md#u0310)** (settings, medium) Should per-day custom schedules show the Time Blocks tooltip like the shared editors? — *Extract one ScheduleEditor in WorkHoursTab for shared and per-day schedules*
- [ ] **[U0313](workstreams/settings.md#u0313)** (settings, medium) Accept the arrow-key, Enter and empty-state behaviour changes that come from adopting SearchableDropdown? — *Build AutoAssignField on SearchableDropdown*
- [ ] **[U0235](workstreams/view-state.md#u0235)** (view-state, medium) Which Restore icon should both toolbars use, and should Select all include hidden or archived items? — *Extract shared BulkActionToolbar and QuickFilterBar for List and Notes*
- [ ] **[U0095](workstreams/import-export.md#u0095)** (import-export, low) Should todo and note exports share one field set and JSON shape, changing files users already download? — *Align todo and note exporter naming, field sets and JSON shape*
- [ ] **[U0642](workstreams/migrations-versioning.md#u0642)** (migrations-versioning, low) Should the revision bump per commit (pre-commit hook) or per plan (changelog), and should package.json mirror version.json? — *Make version.json the single version source and fix GET_VERSION*
  - **Half answered (23 November 2026):** `package.json` no longer has a `version` field, so there is nothing to mirror. Per commit or per plan is still open here.
- [ ] **[U0457](workstreams/entity-names.md#u0457)** (entity-names, low) Store an entity colour only when it differs from the marker colour, or always store it at creation? — *Route all person and project creation through one colour-aware helper*
- [ ] **[U0699](workstreams/notes.md#u0699)** (notes, low) Accept the shared pin glyph in the Pinned quick filter, a visible icon change? — *Replace NotesView's local PinIcon with the shared PinIcon*
- [ ] **[U0707](workstreams/reviews.md#u0707)** (reviews, low) Should the review state badge read 'Complete' or 'Completed'? — *Share the review entry header and state badge across review views*
- [ ] **[U0317](workstreams/settings.md#u0317)** (settings, low) Keep SettingsModel internal with components reading raw settings, or expose a settingsModel from useSettings and migrate readers? — *Choose one way to read settings: SettingsModel or raw Settings*
- [ ] **[U0216](workstreams/view-state.md#u0216)** (view-state, low) Where Kanban and List sort semantics differ (unknown priority, date parsing, updatedAt), which behaviour should both follow? — *Extract shared todo filter predicates and comparator for Kanban and List*

### Batch 8A — UI: overlays, keyboard and help, feedback states, app shell

- [ ] **[U0422](workstreams/overlays-dialogs.md#u0422)** (overlays-dialogs, medium) Should the click that closes a menu also reach the element underneath, or be swallowed as the backdrops do now? — *Replace five outside-click mechanisms with one Popover primitive*
- [ ] **[U0432](workstreams/keyboard-help.md#u0432)** (keyboard-help, medium) Rewrite tutorial hints as observations, or make the highlighted cut-out click-through? — *Make tutorial hints match whether highlighted elements can be clicked*
- [ ] **[U0439](workstreams/keyboard-help.md#u0439)** (keyboard-help, medium) In Gantt, should 't' start the global focus timer or Gantt's own action? — *Render the keyboard reference and focus hints from one shortcut registry*
- [ ] **[U0342](workstreams/app-shell.md#u0342)** (app-shell, medium) Should innermost components call useSettings() directly instead of receiving settings as a prop? — *Stop passing settings fields as separate props alongside settings*
- [ ] **[U0674](workstreams/overlays-dialogs.md#u0674)** (overlays-dialogs, low) For form dialogs with unsaved input, ignore backdrop clicks or ask 'Discard changes?'. — *Protect form dialog drafts from accidental backdrop clicks*
- [ ] **[U0209](workstreams/keyboard-help.md#u0209)** (keyboard-help, low) Build Kanban in-column reordering and Gantt Day/Week zoom and drag-to-reschedule, or correct the tutorial text? — *Make tutorials and tooltips match real behaviour; add Shift+click range selection*
- [ ] **[U0341](workstreams/keyboard-help.md#u0341)** (keyboard-help, low) Add Notes tutorial steps for search, sort and presets using the existing anchors, or delete the unreferenced data-tutorial attributes? — *Use or remove unreferenced data-tutorial anchors, adding Notes tutorial steps*
- [ ] **[U0660](workstreams/feedback-states.md#u0660)** (feedback-states, low) Should Kanban's 'Show empty columns' setting actually hide empty columns? — *Adopt EmptyState everywhere and give each empty state an action*
- [ ] **[U0474](workstreams/app-shell.md#u0474)** (app-shell, low) Drop the header tagline entirely, or show it only on first run? — *Trim the header tagline, announce loading, and label review back buttons*

### Batch 8B — UI: accessibility and keyboard access

- [ ] **[U0273](workstreams/settings.md#u0273)** (settings, medium) Approve one unified visual style for every settings toggle switch? — *Replace three hand-written settings toggle styles with one named ToggleSwitch*
- [ ] **[U0665](workstreams/accessibility.md#u0665)** (accessibility, medium) Modal fallback: require label or labelledBy and delete the fallback span, or wire it through aria-labelledby? — *Apply icons' aria-hidden default and give unlabelled Modals a name*
- [ ] **[U0774](workstreams/accessibility.md#u0774)** (accessibility, medium) Remove maximumScale and accept iOS focus-zoom on any input still below 16px until all are enlarged? — *Remove viewport maximumScale so pinch-zoom works*
- [ ] **[U0676](workstreams/feedback-states.md#u0676)** (feedback-states, medium) Should error toasts stay until dismissed, and should toast and undo timers pause on hover or focus? — *Announce toasts through persistent live regions and keep errors visible*
- [ ] **[U0438](workstreams/keyboard-help.md#u0438)** (keyboard-help, low) Add a General setting, on by default, that disables single-key shortcuts for WCAG 2.1.4? — *Add a setting to turn off single-key shortcuts*

### Batch 8C — UI: visual system and view usability

- [ ] **[U0002](workstreams/pwa-service-worker.md#u0002)** (pwa-service-worker, medium) Remove the manifest orientation member entirely, or set it to 'any'? — *Unlock installed-app orientation in the web manifest*
- [ ] **[U0477](workstreams/undo-confirm.md#u0477)** (undo-confirm, medium) Which deletes require confirmation, which get undo, and should people and projects gain undo? — *Set one confirmation and undo policy for deleting every entity*
- [ ] **[U0710](workstreams/reviews.md#u0710)** (reviews, medium) Guard review completion with a confirm, a 'Reopen as draft' action, or undo through the review undo stack? — *Guard review completion against misclicks*
- [ ] **[U0475](workstreams/visual-system.md#u0475)** (visual-system, medium) Should Note and Timer become secondary buttons, leaving Todo as the only solid primary header action? — *Rebalance header create buttons and keep labels visible on mobile*
- [ ] **[U0657](workstreams/visual-system.md#u0657)** (visual-system, medium) Should non-destructive row actions (Delay, Create note, Focus) use a neutral tone instead of distinct colours? — *Define semantic tone maps once in tones.ts and adopt everywhere*
- [ ] **[U0658](workstreams/visual-system.md#u0658)** (visual-system, medium) Should clicking a chip open its editor, with removal only through a separate labelled remove button? — *Give removable chips one pattern: click edits, labelled button removes*
- [ ] **[U0768](workstreams/visual-system.md#u0768)** (visual-system, medium) Should the app render in Geist Sans (visible change, new baselines) or keep Arial and remove the Geist Sans download? — *Resolve the Arial body font overriding the loaded Geist Sans*
- [ ] **[U0786](workstreams/visual-system.md#u0786)** (visual-system, medium) Adopt a color-mix dark treatment for marker, person, project and priority chips, keeping users' chosen hues? — *Give marker-colour chips a dark-mode treatment via a CSS variable*
- [ ] **[U0360](workstreams/gantt-scheduling.md#u0360)** (gantt-scheduling, low) Should the activity badge appear only when a task has entries beyond its initial 'created' entry? — *Show Gantt activity badge only for real activity and pluralise it*
- [ ] **[U0368](workstreams/stats-time-focus.md#u0368)** (stats-time-focus, low) Hide Statistics time-tracking cards when Time Tracking is off, or keep showing them as historical data? — *Decide whether Statistics hides time-tracking cards when tracking is off*
- [ ] **[U0406](workstreams/stats-time-focus.md#u0406)** (stats-time-focus, low) Should leaving a running focus session ask for confirmation, or pause and resume like the open timer does? — *Guard against accidentally ending or discarding a running focus session*
- [ ] **[U0251](workstreams/view-state.md#u0251)** (view-state, low) Confirm defaults: entities alphabetical or by usage, reviews by period start, name groups alphabetical with 'No …' last? — *Define consistent default orders for entity lists, reviews and groups*
- [ ] **[U0255](workstreams/view-state.md#u0255)** (view-state, low) Should quick-filter counts reflect search and panel filters, or be labelled as totals? — *Decide whether quick-filter counts reflect search and panel filters*
- [ ] **[U0261](workstreams/view-state.md#u0261)** (view-state, low) Which convention for archived items: a collapsed Archived section or a remembered 'Show archived' toggle? — *Agree one convention for showing archived items across views*
- [ ] **[U0198](workstreams/visual-system.md#u0198)** (visual-system, low) Switch Statistics and Calendar to the configured priority colours, which changes the colours users currently see? — *Resolve priority colours through one getPriorityColor helper in every view*
- [ ] **[U0419](workstreams/visual-system.md#u0419)** (visual-system, low) Accept the small visual differences from moving six colour rows onto one ColorPicker, and convert TodoApp's uncontrolled colour forms? — *Migrate hand-built colour rows onto an extended shared ColorPicker*
- [ ] **[U0424](workstreams/visual-system.md#u0424)** (visual-system, low) Replace hard-coded emoji UI icons with SVG icons everywhere, accepting the visual change? — *Replace hard-coded emoji and inline SVG copies with the shared icon set*
- [ ] **[U0705](workstreams/visual-system.md#u0705)** (visual-system, low) Move the hand-rolled empty states onto EmptyState too, accepting the visual change? — *Extract a shared ViewHeader component for the six hand-rolled view headers*
- [ ] **[U0744](workstreams/visual-system.md#u0744)** (visual-system, low) Accept small visible colour changes where fallbacks (#ffcccc, SmartInput's palette, EntityItem's swatches) move to defaultMarkerColors? — *Make every marker colour fallback read defaultMarkerColors*
- [ ] **[U0787](workstreams/visual-system.md#u0787)** (visual-system, low) Which replacement default hues should the dueDate, recurring and dependency markers use? — *Respace the default marker palette to separate near-identical pairs*

### Batch 9 — Strings and logging

- [ ] **[U0563](workstreams/activity-comments.md#u0563)** (activity-comments, medium) Should changes to todo subtasks be recorded in the activity log, as note action-item changes are? — *Make entity and sprint edit activity entries specific and complete*
- [ ] **[U0696](workstreams/activity-comments.md#u0696)** (activity-comments, medium) Which activity types get coalesced, and what time window counts as one editing session? — *Coalesce activity entries written by debounced autosaves*
- [ ] **[U0586](workstreams/strings.md#u0586)** (strings, medium) Use 'task' or 'todo' as the user-facing noun throughout the app? — *Use one noun, task or todo, in all user-facing text*
- [ ] **[U0066](workstreams/logging-diagnostics.md#u0066)** (logging-diagnostics, medium) Should pruning that overrides retention also be shown in the UI, not only logged? — *Add debug summary logs for migrations, auto-deletion and backup pruning*
- [ ] **[U0031](workstreams/storage-core.md#u0031)** (storage-core, low) Will adapter.getItem throw on read failure (per LOG-02), making these catches live, or keep returning null? — *Resolve dead per-key catches in storage usage and quota measurement*
- [ ] **[U0094](workstreams/import-export.md#u0094)** (import-export, low) Should CSV Status keep machine values such as 'active' for re-import, or show human-readable labels? — *Make export labels consistent across Markdown and CSV*
- [ ] **[U0773](workstreams/strings.md#u0773)** (strings, low) Which spelling is the canonical app name: 'DoIt' or 'Doit'? — *Unify the app name spelling and description behind string constants*
- [ ] **[U0782](workstreams/logging-diagnostics.md#u0782)** (logging-diagnostics, low) Should uncaught errors also show a non-blocking 'something went wrong' toast, or only be logged? — *Add a global error and unhandledrejection handler*

### Batch 10 — Feature completion

- [ ] **[U0299](workstreams/notes.md#u0299)** (notes, high) Wire up the Notes defaults or hide them? Should sort and archived defaults apply only when no view options are persisted? — *Apply the Notes settings for pin, archived visibility and sort order*
- [ ] **[U0292](workstreams/kanban.md#u0292)** (kanban, high) Make 'Set as Default' seed the board's initial view and retire kanban.activeViewId, or remove the control? — *Make Kanban 'Set as Default' choose the board's initial view*
- [ ] **[U0286](workstreams/gantt-scheduling.md#u0286)** (gantt-scheduling, high) Implement Show Weekends (hide Sat/Sun or follow the configured work week), or remove the control? — *Implement or remove the Gantt Show Weekends setting*
- [ ] **[U0270](workstreams/settings.md#u0270)** (settings, high) Apply the recurring default on creation (recommended) or remove the control? Should a first due date be derived when none is set? — *Apply the auto-assign Default Recurring setting when creating todos*
- [ ] **[U0272](workstreams/dates-time.md#u0272)** (dates-time, medium) Should the week start default to the browser locale, and should the Gantt week follow calendar.weekStartDay? — *Reconcile week-start settings across Calendar, Gantt and week numbers*
- [ ] **[U0332](workstreams/dates-time.md#u0332)** (dates-time, medium) Follow the browser locale or add a locale setting, and should a 12h/24h/auto time-format preference be added? — *Route all date and time labels through locale-aware shared formatters*
- [ ] **[U0129](workstreams/todos-core.md#u0129)** (todos-core, medium) Add template editing or delete updateTemplate? Add a 'New template' entry or correct the help text? — *Add template editing and make template deletion visible and confirmed*
- [ ] **[U0691](workstreams/notes.md#u0691)** (notes, medium) Implement new-note content autofocus and Calendar quick-add, or remove the unused props, state setters and contentEditorRef? — *Focus new notes' content editor on open and wire Calendar quick-add*
- [ ] **[U0592](workstreams/reviews.md#u0592)** (reviews, medium) Add project and tag pickers to ReviewEditView, or a smaller 'Prefill from included tasks' action? — *Let users set review projects and tags*
- [ ] **[U0308](workstreams/sprints.md#u0308)** (sprints, medium) Include no-sprint todos when a sprint is selected, flip the default with a migration, or remove the control? — *Define and implement the sprint Show backlog items setting*
- [ ] **[U0147](workstreams/activity-comments.md#u0147)** (activity-comments, medium) Keep the newest N entries per entity, or fold older entries into one 'N older entries trimmed' entry? — *Add a retention policy for activity logs*
- [ ] **[U0151](workstreams/activity-comments.md#u0151)** (activity-comments, medium) Confirm restoring todo comment edit and delete, which commit ae4e6e4 removed. — *Restore edit and delete for todo comments*
- [ ] **[U0210](workstreams/code-hygiene.md#u0210)** (code-hygiene, medium) For Kanban settings, ReviewsView todos, FocusView delete/archive and template initialText: wire each into a feature, or delete it? — *Remove or wire up props that components accept but never read*
- [ ] **[U0783](workstreams/gantt-scheduling.md#u0783)** (gantt-scheduling, low) Build category-specific time blocks (WorkHoursTab multi-select plus scheduler check), or correct the Help text and drop the field? — *Decide on category-specific time blocks promised by Help*
- [ ] **[U0785](workstreams/stats-time-focus.md#u0785)** (stats-time-focus, low) List sessions only, or also let focus setup pick a task and add a time entry on end? — *Show focus sessions in Time Reports and optionally link them to tasks*
- [ ] **[U0324](workstreams/settings.md#u0324)** (settings, low) Add an 'Enable auto-assign' toggle honoured on creation, or retire the field and treat it as always true? — *Add an auto-assign master toggle or retire autoAssign.enabled*

### Batch 11 — Low-priority fixes

- [ ] **[U0101](workstreams/import-export.md#u0101)** (import-export, low) Should the line show updatedAt as 'Updated', or keep creation age relabelled 'Created'? — *Fix the notes Markdown export's mislabelled 'Updated' line*
- [ ] **[U0102](workstreams/import-export.md#u0102)** (import-export, low) Convert note HTML to plain text or to simple Markdown in exports? — *Convert note rich-text HTML in Markdown and JSON exports*
- [ ] **[U0813](workstreams/pwa-service-worker.md#u0813)** (pwa-service-worker, low) Keep 315 MB of audio in git, move it to Git LFS, or reduce it? — *Decide whether 315 MB of audio stays in the git repository*
- [ ] **[U0545](workstreams/dates-time.md#u0545)** (dates-time, low) Read dotted dates as European DD.MM, or delete the unreachable dot branch and keep US order? — *Settle the dotted-date reading and its unreachable European branch*
- [ ] **[U0143](workstreams/recurrence.md#u0143)** (recurrence, low) Advance the next occurrence until it is after now, and normalise the time for undated spawns? — *Decide how overdue recurring completions schedule the next instance*
- [ ] **[U0571](workstreams/notes.md#u0571)** (notes, low) Should duplicated notes and todos both get ' (Copy)' appended, or neither? — *Reset sortOrder when duplicating a note*
- [ ] **[U0589](workstreams/sprints.md#u0589)** (sprints, low) Show start + durationDays - 1 as Planned End Date, or relabel it 'Next sprint starts'? — *Fix sprint Planned End Date showing the day after the sprint*
- [ ] **[U0155](workstreams/kanban.md#u0155)** (kanban, low) Should timers move cards to In Progress only on start and only for active todos? — *Move cards to In Progress only when a timer starts on active todos*
- [ ] **[U0385](workstreams/gantt-scheduling.md#u0385)** (gantt-scheduling, low) Use the completion fallback only when a task has no time entries at all, or show a zero-length marker instead? — *Stop drawing estimated blocks for completed tasks tracked on earlier days*
- [ ] **[U0330](workstreams/calendar.md#u0330)** (calendar, low) Migrate a stored 'asc' Created direction once so users keep their order, or accept the one-time flip? — *Align Calendar 'Created' sort direction with List and Kanban*
- [ ] **[U0173](workstreams/stats-time-focus.md#u0173)** (stats-time-focus, low) Relabel rolling windows as 'Next/Last 7 days', or switch them to the calendar week from workWeekStart? — *Align 'This week' windows across List, Statistics and Time Reports*
- [ ] **[U0403](workstreams/stats-time-focus.md#u0403)** (stats-time-focus, low) Should Skip to Next on a task's last segment actually complete the task, or stop counting it as completed? — *Decide whether Skip to Next on a last segment completes the task*
- [ ] **[U0267](workstreams/settings.md#u0267)** (settings, low) Should archived people and projects stay selectable as auto-assign defaults, or be excluded, with existing picks labelled? — *Exclude archived people and projects from auto-assign default pickers*
- [ ] **[U0256](workstreams/view-state.md#u0256)** (view-state, low) Should a quick filter narrow every section or only active items? — *Apply one quick-filter scope rule across List, Notes and Calendar*
- [ ] **[U0755](workstreams/search.md#u0755)** (search, low) Allocate the 20 result slots round-robin across kinds, or lower MAX_PER_KIND to 3? — *Keep every result kind in capped global search results*
- [ ] **[U0651](workstreams/tests-ci-tooling.md#u0651)** (tests-ci-tooling, low) Enforce unused locals via tsconfig compiler flags or by raising ESLint no-unused-vars to error? — *Enforce unused locals and parameters once the tree is clean*

### Batch 12 — Documentation

- [ ] **[U0668](workstreams/todos-core.md#u0668)** (todos-core, high) Implement dependency cycle rejection and a blocked badge on list and Kanban cards, or remove those claims from help? — *Reconcile dependency help with cycle prevention and blocked indicator reality*
- [ ] **[U0788](workstreams/settings.md#u0788)** (settings, medium) Build priority archiving, or correct the comment and add a delete confirmation naming how many todos lose the priority? — *Resolve Priority.archived: build archiving or document hard delete*
- [ ] **[U0527](workstreams/smart-input.md#u0527)** (smart-input, low) Drop the p1/p2/p3 line from the JSDoc, or support pN shorthand via default alternatives or priority order? — *Resolve detectPriorities' undocumented p1/p2/p3 shorthand claim*
- [ ] **[U0620](workstreams/docs.md#u0620)** (docs, low) Should view-kanban.png and view-list.png be embedded in the manual test report as evidence, or deleted? — *Move dated test reports to docs/reports and record their outcomes*
- [ ] **[U0170](workstreams/code-hygiene.md#u0170)** (code-hygiene, low) Document only, or rename to TodoModel.isOpen and replace Sprint.state 'active' via a migration? — *Clarify the meaning of isActive across todo and entity models*

## Open questions raised by each review

These are the questions the twelve reviews asked in their own words. Most overlap with the unit questions above; they are kept so none is lost.

### 1. Dead-code removal

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

### 2. Documentation cleanup

- [ ] Should the seven smart-input docs be merged into one docs/smart-input.md, deleting the originals once their content has moved, or corrected where they are?
- [ ] Is .github/copilot-instructions.md still used? Keep it as a feature-behaviour reference, cut it down to a pointer to CLAUDE.md, or delete it?
- [ ] Should the two .claude/agents files be rewritten for doit, or deleted?
- [ ] Dependencies: implement cycle rejection and a blocked badge on list and Kanban cards, or remove those promises from the help (DOC-11)?
- [ ] For each inert setting (Notes pin, show archived and sort order; show backlog in sprint; Gantt show weekends; Kanban show empty columns), should it be wired up or labelled 'not yet implemented' (DOC-13)?
- [ ] Default Recurring: should it be applied at creation in TodoApp.createTodo like the other defaults, or as a TodoModel fallback? And should a first due date be derived when none is given (DOC-12)?
- [ ] Auto-assign: keep writing the defaults into stored metadata at creation, as now, or rely only on model fallbacks, as the docs describe (DOC-37)?
- [ ] When stored data comes from a newer build, should the app block migration and saving (read-only with a reload banner), or keep today's behaviour and fix only the comment (DOC-07)?
- [ ] Durations: does 'd' mean a 24-hour day or a work day, and does 'Nm' in the suggestions mean minutes or months (DOC-04)?
- [ ] Should the Q/H/FY date shorthands honour fiscalYearStart, or be renamed to calendar periods with the setting's hint corrected (DOC-35)?
- [ ] Should 'today' resolve to the evening time (19:00 in SmartInput) or to the end of work hours (17:00 in date fields) (DOC-36)?
- [ ] Deleting a priority: implement archiving as the Priority.archived comment describes, or keep the hard delete and warn that todos lose the priority (DOC-34)?
- [ ] Should the p1/p2/p3 priority shorthand be supported, or dropped from the JSDoc (DOC-73)? Should typed 'sprint N' resolve against real Sprint records (DOC-79)?
- [ ] Should N open the add-todo overlay in every view, Kanban included, or keep its per-view meaning with a corrected tooltip? Which key should Gantt's 'jump to today' use (DOC-45, DOC-16)?
- [ ] Should General settings gain Notes and Reviews feature toggles (DOC-54)?
- [ ] Should search also cover comments and context notes, as the help promises, or should the help be corrected (DOC-49)?
- [ ] Should the Stats and Time views get tutorial content, or simply not show the tutorial button (DOC-08)?
- [ ] Archive threshold: should ListView show past-threshold completed tasks under Archived until reload, or should tasks archive at completion when archiveDays is 0 (DOC-14)?
- [ ] Should the Markdown todo export add assignees and projects (DOC-65)? Should the notes export show updatedAt, or relabel the line 'Created' (DOC-66)?
- [x] Should package.json's version (0.1.0) be synced to version.json, dropped, or left alone (DOC-28)? — **Answer (23 November 2026):** dropped.
- [ ] Should the unused screenshots view-kanban.png and view-list.png be deleted or referenced, and should the dated reports move to docs/reports/ (DOC-60)?
- [ ] Should the duplicate settings.backup.lastBackupDate mirror be kept as display state, or removed (DOC-26)?
- [ ] Should colors.ts's fallback priority colour be aligned with defaultMarkerColors (a small visible change), and should user marker colours apply there (DOC-74)?
- [ ] Should tod, tmr, tom and nextsaturday also be recognised in typed task text, or stay accepted only in date fields (DOC-58)?
- [ ] Is it intended that the smoke-tests project also runs edge-cases-mobile.spec.ts on desktop as well as in smoke-mobile (DOC-29)?

### 3. Error, validation and other string messages

- [ ] Which noun should user-facing text use for the core entity: 'task' (dominant in help, activity, notifications, search and export) or 'todo' (tab 'Todos', 'Add New Todo')? And should the List tab's label change to match?
- [ ] Which spelling of the app name is canonical: 'DoIt' (manifest, page title, header, notifications) or 'Doit' (help, tutorial, README, CLAUDE.md)?
- [ ] Activity descriptions are stored as finished strings. Once the templates are fixed (MSG-01, MSG-05, MSG-37), should existing entries with false or wrongly-sigilled text be left as they are, rewritten by a storage migration, or replaced by rendering descriptions at display time from type and metadata?
- [ ] MSG-48: which tasks should trigger the person/project delete warning? All tasks, or active ones only? Should auto-assign defaults be ignored? Should $source and mentions count?
- [ ] MSG-12: should the work-hours schedule mode be saved as a setting, or should custom per-day schedules be cleared when the user switches to the weekday/weekend mode?
- [ ] MSG-49: should N stay context-sensitive and be documented as such, or should it open the add-todo overlay in the views where it currently does nothing?
- [ ] MSG-50: should 'click to deactivate' be limited to dates (bugfix), or extended to every auto-detected token type (feature extension)?
- [ ] MSG-52: should gantt.showWeekends and sprints.showBacklogInSprint be implemented, or should their controls be hidden until they are?
- [ ] MSG-53: should 'Reset to Defaults' and the template 'Reset' ask for confirmation?
- [ ] MSG-85: should Calendar quick add (double-click a day to add a task with that due date) be wired up, or left unwired with the hint corrected?
- [ ] MSG-79: should dates follow the browser locale (Intl) or one fixed English style, and should times be 12-hour, 24-hour or locale-driven?
- [ ] MSG-78: should the CSV export keep machine state values so it can be re-imported, or show human labels? Should the Markdown task export gain Assigned and Projects?
- [ ] MSG-17: may the JSON export gain an additive ISO dueDate field so exports round-trip through import?
- [ ] MSG-87: should the installed PWA be allowed to rotate to landscape?
- [ ] MSG-34: is a lightweight src/constants/strings module (no i18n framework, help prose kept inline) the right level of consolidation, or is localisation a future goal that would justify going further?
- [ ] Shortcut notation: should hints be platform-aware (⌘ on macOS, Ctrl elsewhere) or use one neutral notation everywhere?

### 4. Duplication to consolidate

- [ ] DUP-01/DUP-24: should collections move onto createSharedStore (cross-tab safety, 300ms coalesced writes), or should usePersistedState be hardened as the single base?
- [ ] DUP-02: should 'Switch to localStorage' persist across reloads? That needs a stored preference read by initializeStorage. Or should the button be removed while IndexedDB is available?
- [ ] DUP-05: should a note title edit add its @/$/%/# markers to the existing metadata or replace it? And should auto-detected (unmarked) names in a note title still be added, as they are today?
- [ ] DUP-09: is a 'd' duration an 8-hour workday or 24 hours, and does 'm' after a number in the suggestion lists mean months or minutes?
- [ ] DUP-12: should a bare 'today' typed in SmartInput resolve to work-hours end of day (17:00 default), like Delay, or stay at the evening time (19:00)?
- [ ] DUP-19: should Kanban keep closing the details overlay after toggle, delete or archive once there is a single overlay?
- [ ] DUP-22: which persisted shape for the work-hours schedule mode (an explicit scheduleMode field, or derived from customSchedules)?
- [ ] DUP-37: when all Kanban transition rules are cleared, are transitions unrestricted (current drag behaviour) or forbidden (current timer behaviour)?
- [ ] DUP-47/DUP-48: should entity lookups everywhere be case-insensitive and alias-aware, and should notes display and group by the canonical entity name?
- [ ] DUP-49: which notation should activity entries use for recurring patterns once '%' means projects?
- [ ] DUP-50: should Calendar and Gantt week starts follow dateTime.workWeekStart, keep their own setting, or (Gantt) stay on Monday?
- [ ] DUP-57: which Restore icon, and should 'Select all' in the todo list include hidden and archived items as it does now?
- [ ] DUP-64: which detection order and colour fallback becomes the single tokenizer rule?
- [ ] DUP-66: may the misleading '%every day' and '*2h' suggestion labels drop their prefixes?
- [ ] DUP-68/DUP-108/DUP-129/DUP-28: may toggle switches, colour pickers, empty states and comment composers be visually unified, or must each keep its current pixels?
- [ ] DUP-93/DUP-125: which byte format ('1.46 KB' vs '1.5 KB') and which review label ('Complete' vs 'Completed')?
- [ ] DUP-127/DUP-111: may Statistics and Calendar use the configured priority colours, and NotesView the shared pin glyph?
- [ ] DUP-28: should todo comments become editable and deletable in the UI, since useTodos already provides editTodoComment and deleteTodoComment?
- [ ] DUP-69: should Notes and Reviews get feature toggles in General settings?

### 5. Restructuring for consistency

- [ ] STRUCT-10: Who should handle Escape? Option one is Modal, closing only the topmost dialog, which changes when RichTextEditor saves on close. Option two is TodoApp's priority chain, extended to list every overlay.
- [ ] STRUCT-11: Should deleting a sprint from its overlay ask for confirmation? And should deleting a person or project from its overlay show the same dialog as deleting from the list?
- [ ] STRUCT-31: Should Kanban adopt the List/Notes filter and preset model? That lifts the five-chip cap and makes presets name-based and overwritten by name, but needs a one-time migration of existing Kanban presets.
- [ ] STRUCT-07: Once Kanban uses TodoApp's shared details overlay, should the overlay still close after toggle, delete, archive and unarchive?
- [ ] STRUCT-13: In every input path, should 'today' mean the end of the work day (17:00 by default) or the evening time (19:00 by default)? And which fallback times apply when no settings exist?
- [ ] STRUCT-05: Does 'Next Week' in the Delay menu and the auto-assign defaults mean the start of the next work week (the existing 'nextweek' shorthand) or chrono's casual 'next week'?
- [ ] STRUCT-15: On a day whose work-hours toggle is off, what should the start and end of day resolve to: that day's default hours, or those of the next enabled day?
- [ ] STRUCT-02: In the note detail view, should @, % and # tokens in the title be merged into the note's metadata on autosave? That would re-add a person removed in the side panel. The alternative is to simply delete the dead merge.
- [ ] STRUCT-45: Should alternative person and project names resolve to the main name in notes grouping, labels and exports?
- [ ] STRUCT-50: Should colour lookup ignore case, like every other name lookup?
- [ ] STRUCT-51: Should the five auto-detectors share one stop-word list (this changes what gets detected)?
- [ ] STRUCT-39: Is it acceptable that a click outside an open menu also reaches the element underneath, instead of being swallowed by an invisible backdrop?
- [ ] STRUCT-95: Should the Notes 'Pinned' quick-filter use the same pin icon as the note cards?
- [ ] STRUCT-97: Should the add-person, add-project and sprint colour fields use the full ColorPicker? Should settings swatches get a compact ColorPicker variant, or stay plain colour inputs?
- [ ] STRUCT-66: Should sprint search also match status labels (SprintModel.matchesSearch), or keep matching only name and goal?
- [ ] STRUCT-65: Should people and projects created from a note get the default marker colour, as they do everywhere else?
- [ ] STRUCT-49: Should Settings > Auto-assign gain the '8h' duration option, and which order of recurring options is canonical?
- [ ] STRUCT-47: Where should lastBackupDate live: the doit-backup-settings key (recommended) or settings.backup?
- [ ] STRUCT-42 / STRUCT-67: Should leaf components read settings through useSettings() instead of receiving settings props? Should SettingsModel stay an internal helper of the other models, or be exposed through useSettings?
- [ ] STRUCT-28: Is it acceptable that the default notification check moves from every minute to the configured 15 minutes?
- [ ] STRUCT-04: Should the app get tutorial steps for Stats and Time, or should the tutorial button be hidden on tabs that have no steps?
- [ ] STRUCT-56: In the Gantt view, which action should 't' trigger: go-to-today or the focus timer?
- [ ] STRUCT-112: Should the version revision go up per commit (pre-commit hook) or per plan (changelog)? Should package.json carry the real version? — *The `package.json` half is answered (23 November 2026): the field was dropped.*
- [ ] STRUCT-113: Should todo and note JSON exports share one shape? This changes the files users download.
- [ ] STRUCT-90 / STRUCT-30: Should 'use client' appear on every hook file or only on component entry points? Is the proposed memoisation rule acceptable as a documented convention?
- [ ] STRUCT-94: Should the 'Ideal' legend swatch in the Sprint burndown show a dashed line, as the code apparently intends?

### 6. Logic and business-logic bugs

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

### 7. Missing, wrong or out-of-date logging

- [ ] Should debug and info logs be on only in development builds, or also switchable in production through an internal flag key such as doit-debug, so you can ask a user to turn it on for support?
- [ ] May console logs contain names the user typed, such as person and project names or imported file names? Or only keys, ids, counts, byte sizes and error names? This decides LOG-20 and LOG-50.
- [ ] When backup pruning by count or total size deletes backups younger than retentionDays, should the UI say so? Should a failed automatic backup trigger the storage error banner?
- [ ] When the stored data comes from a newer build (a downgrade), should the app go read-only or show the recovery screen? Or should it carry on as now with an accurate warning?
- [ ] If an entity rename cascade fails part-way, should the app finish renaming the entity (most references are already rewritten) or roll the rewritten references back?
- [ ] For core stores other than todos (people, projects, notes, reviews, sprints), should a load failure show the blocking recovery screen, or a non-blocking notice? And should templates and search/selection history use the lighter option?
- [ ] Which activity retention rule do you want: keep the newest N entries per entity (and which N), or fold older entries into a single summary entry?
- [ ] Which coalescing window should debounced edits use (for example 10 minutes), and which entry types should coalesce?
- [ ] Should collapsing or expanding a review entry keep producing an activity entry (reworded and coalesced), or stop being logged? Stopping would remove an existing behaviour.
- [ ] Should useNotes keep storing comment_added and comment_edited entries, which the timeline would de-duplicate, or stop writing them going forward?
- [ ] Should undo leave both the action entry and the undo entry in the log, and is 'Deletion/Completion/Archive undone' the wording you want?
- [ ] For 'Auto-Extend on Overtime': is the label right (extend only when tracked time exceeds the estimate) or the code (always set the duration to the tracked time)?
- [ ] Should stopping a timer ever move a card to In Progress, and should starting one affect a todo that is already completed?
- [ ] Gantt activity badge: should it show only when there is activity beyond the creation entry, or from some other threshold?
- [ ] Do you want a global 'Something went wrong' toast for errors and promise rejections that no error boundary catches?
- [ ] When a note is converted to a todo, should the todo's sourceNoteId field be set, or should only the activity entry link back to the note?
- [ ] Review comment activity types (comment_*) remain in the type union although review comments were removed: reinstate review comments, or mark those types as reserved?
- [ ] Should 'persistent storage not granted' be logged as a warning once per session, or stay silent (debug only)?

### 8. UI design review for usability

- [ ] UX-28: On Gantt and Calendar, should T mean 'go to today' (and the global timer shortcut skip those views), or should 'today' move to another key such as Home?
- [ ] UX-89: Should the app use Geist, which is already loaded, or keep Arial deliberately and drop the Geist download?
- [ ] UX-74: May maximumScale be removed, accepting that every text input must then be 16px on phones to avoid iOS focus-zoom?
- [ ] UX-66: Should every removable chip follow 'click the label to edit, a separate labelled × to remove'? That changes today's click-to-delete on duration, recurring, tag, sprint and dependency chips.
- [ ] UX-33: When completing a review, should the app ask for confirmation first, offer 'Reopen as draft' afterwards, or offer undo?
- [ ] UX-09/UX-10: For person, project and sprint deletes, is a confirm enough, or should they also get the 10-second undo that notes and reviews have?
- [ ] UX-12: Should deleting a priority archive it instead, as the type comment in priority.ts:18 says priorities always are?
- [ ] UX-46: Tutorial: make the highlighted element clickable during the tour, or rewrite the steps so they no longer ask for clicks?
- [ ] UX-48: Should click-to-deactivate work for every auto-detected token type, or should the affordance be limited to dates and recurring patterns?
- [ ] UX-82/UX-118: Should marker chips get a dark-mode treatment (tinted background, lighter text), and may the default palette be respaced by hue (stored user colours untouched)?
- [ ] UX-85: Should Todo be the only solid primary in the header, with Note and Timer demoted to secondary buttons?
- [ ] UX-84: Should colour be reserved for state and destructiveness, making non-destructive row actions (Delay, Create note) neutral?
- [ ] UX-95: For duplicate person or project names on add, block the add, warn and allow, or keep allowing silently?
- [ ] UX-96: When leaving a running Focus session, confirm, or make exit pause the session so it can be resumed?
- [ ] UX-126: Should form dialogs ignore backdrop clicks while they hold unsaved input, or ask 'Discard changes?'?
- [ ] UX-112: Should quick-filter chip counts reflect the active search and panel filters?
- [ ] UX-113: Keep the header tagline on every view, show it only on first run, or remove it?
- [ ] UX-103: Add a setting to turn off single-key shortcuts (WCAG 2.1.4), on by default?
- [ ] UX-25: Should Kanban keep closing the details overlay when a todo is toggled, or behave like the global overlay and stay open?
- [ ] UX-14: When a user switches Work Hours back to weekday/weekend mode, should existing per-day custom schedules be cleared, or only flagged as overrides?
- [ ] UX-34: With archiveDays = 0, should completed todos be archived at completion time, or only shown in the Archived section until the next load archives them?
- [ ] UX-13: Should imported and manual backups be exempt from age-based pruning, or aged by their upload time?
- [ ] UX-105: May hard-coded UI emoji (field labels, toast glyphs, Gantt technique buttons) be replaced with SVG icons? User-chosen emoji stay.

### 9. Inconsistencies across the codebase

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
- [ ] INC-81: Should versions be numbered per commit (pre-commit hook) or per plan (CHANGELOG), and should package.json track version.json? — *The `package.json` half is answered (23 November 2026): the field was dropped.*
- [ ] INC-82: Should the body font be Geist Sans, which is loaded, or Arial, which is what renders today?
- [ ] INC-68: Should duplicates of todos and notes both get ' (Copy)', or neither?
- [ ] INC-63: When Calendar's Created sort is fixed, should a stored 'asc' be flipped once so existing users keep their current order?
- [ ] INC-66: Should changes to todo subtasks be logged in the activity history?
- [ ] INC-25: After toggling, deleting or archiving from the Task Details overlay, should it close (Kanban's current behaviour) or stay open (TodoApp's)?
- [ ] INC-35: Under a non-manual sort, should entering reorder mode switch to Manual sort, or should reordering be disabled?
- [ ] INC-83: Should TodoModel.isActive be renamed (for example to isOpen), or only documented?

### 10. Opportunities to improve support

- [ ] When stored data cannot be read or a domain fails to load (SUP-01, 02, 03), should the app block on the recovery screen, or continue read-only with a warning banner and auto-save turned off?
- [ ] Backup retention (SUP-08): should manual and imported backups be exempt from age and count pruning, and if not, what limits should they have? Should the 2 MB cap grow on IndexedDB?
- [ ] Ambient sounds (SUP-11): is it acceptable that sounds never played are not available offline? Do you want a 'Download sounds for offline use' button and/or files re-encoded at a lower bitrate?
- [ ] Data saved by a newer version (SUP-25): should the older version go fully blocked or read-only until the user reloads?
- [ ] Kanban (SUP-60): should an empty list of allowed transitions mean 'every move allowed' or 'no move allowed'?
- [ ] Notification check interval (SUP-57): wire the existing 5/15/30/60-minute setting into the checker, or remove the control?
- [ ] Should due and overdue reminders stay on screen instead of closing after 5 seconds (SUP-75)?
- [ ] Persistent storage (SUP-13): request it automatically at startup only where the browser decides silently, after a first meaningful action such as adding the first task, or only from the Storage tab button?
- [ ] Viewport and manifest (SUP-49, SUP-50): may we remove maximumScale (allowing pinch zoom) and the portrait-only orientation lock?
- [ ] Week start (SUP-55): should defaults come from the browser locale, should Calendar offer Saturday, and should Gantt follow the Calendar's week-start setting?
- [ ] All-day due dates (SUP-56): do you accept a data migration that adds an explicit all-day marker to due dates?
- [ ] Stats and Time tutorials (SUP-09): write new tutorial steps for these views, or hide the 'Learn about this view' icon on them?
- [ ] Should Cmd/Ctrl+K global search get a visible header button (SUP-42)?
- [ ] Diagnostics (SUP-39, SUP-44): which issue-tracker URL may the app show, and is linking to a public GitHub issues page from inside the app acceptable?
- [ ] Off-device reminder (SUP-59): do you want a reminder to export a backup? After how many days by default, and should it be on by default?
- [ ] Cross-tab sync (SUP-05): invest in moving every collection onto the shared store (large), or settle for the 'open in another tab' notice and data-replaced broadcast (SUP-24) for now?
- [ ] Pre-commit hook (SUP-70): should an amend or reword bump the version again, and should the hook lint staged files?
- [ ] CI (SUP-16): should Playwright smoke tests run on every pull request, and will you mark ci as a required check in branch protection (manual)?
- [ ] Time format (SUP-54): add a 'Time format: Auto/12h/24h' setting? Translating UI text is assumed to stay out of scope; please confirm.
- [ ] Mobile drag (SUP-83): should someone check drag-and-drop on real iOS and Android devices before deciding on a touch fallback?
- [ ] Notes and Reviews toggles (SUP-45): OK to expose these feature flags in Settings → General?

### 11. Partly implemented features

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
