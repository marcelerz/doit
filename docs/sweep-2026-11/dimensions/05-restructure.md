# 5. Restructuring for consistency

114 items: 15 high, 40 medium, 59 low. Each reviewer batch was checked against the code by an adversarial verifier (0 findings refuted outright, others corrected). Every item links to its full text; the unit and batch after each title say where the work is scheduled.

## Context

Doit's structural problems come less from missing conventions than from consolidations that were started and not finished. Again and again the codebase introduced a single source of truth and then moved only part of the code onto it:
- types/viewRegistry.ts drives the tabs, digit shortcuts and Help, but the tutorial switch (TodoApp.tsx:483) and the feature gating (TodoApp.tsx:256) are still hand-written lists.
- shared/Modal.tsx with useDialogFocus provides dialog semantics, yet five dialogs still build their own shell.
- createSharedStore exists to stop tabs overwriting each other, but only settingsStore uses it.
- usePersistedViewOptions replaced "nine copies" of persistence code, but List, Notes and Kanban still write their own.
- commentMutations is shared by four hooks but not by useSprints.
- formatters.formatDuration claims four users and has none.
- idGenerator tells callers to use Model.createId, which useSprints does not.
- richText/selection.ts centralised caret placement, which richText/keyHandlers.ts still bypasses.

Most items in this backlog therefore mean finishing a migration that is already half done. That keeps the risk low: the target pattern exists, is tested, and has at least one adopter to copy from.

Problems concentrate in five areas.
1. TodoApp.tsx (2359 lines, 34 useState) orchestrates everything: the add modals are written inline, the keyboard handler runs to 240 lines, there is an Escape priority chain, overlays render through IIFEs, and it holds the feature and tutorial lists. The overlay layer around it has four Escape mechanisms, four confirmation styles and five ways of closing dropdowns on an outside click. z-index values are chosen per file, and three views (Gantt, Kanban, Calendar) each mount their own reduced copy of TodoDetailsOverlay.
2. Persistence. Every domain hook owns its own load and save effects, each with a different style for errors, cancellation and async code. A read cannot tell a failure from an empty store. Startup migration work runs inside useTodos. SettingsModel is a mutable singleton while every other model is immutable.
3. Date and time utilities. dateUtils and chronoCustom are two shorthand-date engines with different vocabularies and defaults. Work-hours resolution is written four times, and the picker option lists exist twice.
4. Text grammar. The marker regexes, the link-pattern matching (including its sanitizeUrl gate), the marker legend and regex escaping are each rebuilt across SmartInput, MarkedText, renameReferences, TodoDetailsOverlay and NoteDetailView.
5. The model and hook API surface. Models expose raw data, factories, getters and branded types in different ways, and hooks return keys named in different styles. Branded ids are bypassed with plain strings, and PersonId holds both uuids and names.

Structure is where many real defects hide in this codebase, so a large share of this backlog is marked bugfix or needs-decision. Examples:
- The add modals in TodoApp close by different paths, and some of them leave the cancelled text to be submitted on the next open (STRUCT-06).
- The reduced overlay copies lose fields (STRUCT-07).
- Stacking by DOM order hides Task Details behind the sprint overlay (STRUCT-08).
- A missing tutorial case crashes the app (STRUCT-04).
- Storage reads that swallow errors let hooks overwrite real data (STRUCT-01).

Items whose main home is another dimension say "Cross-listed (primary: X)" in their problem text: STRUCT-02, 04, 05, 12, 15, 18, 22, 24, 26, 27, 28, 57-61, 64 and 89. They stay here so nothing is lost; the central plan should dedupe them by location instead of implementing them twice.

Priorities were normalised as follows:
- High: data loss, a crash, a broken core flow, or a direct prerequisite of a high item. STRUCT-14 was raised to high for that last reason.
- Medium: maintainability cost; data-loss paths that need rare conditions, such as legacy settings (STRUCT-17) or a future CURRENT_VERSION bump (STRUCT-18); contained wrong behaviour the user can see.
- Low: polish and alignment with conventions.

Every refactor item must preserve behaviour and must not carry a bugfix inside it. STRUCT-24 was split out of the TodoApp extraction for exactly that reason.

These parts are in good shape and should be extended, not replaced:
- types/viewRegistry.ts, the authoritative list of views.
- STORAGE_KEYS and STORAGE_KEY_PREFIX, nearly complete; only internal literals remain.
- shared/Modal.tsx plus useDialogFocus.
- The sharedStore/settingsStore design, which is the model for STRUCT-03.
- storage/migrations.ts for todos and settings.
- utils/commentMutations.ts.
- EntityListView, which already serves People and Projects.
- richText/selection.ts and utils/sanitize.ts.
- The scheduling algorithms in utils/ganttScheduler.ts. Helpers may move out of that file, but a structural commit must never touch the scheduling itself.

Two behaviours must not change as a side effect of restructuring: chronoCustom's parsing results, and RichTextEditor's timing for committing an edit when it loses focus (documented in useEscapeKey.ts). Both need an explicit decision from the owner (STRUCT-13, STRUCT-10).

Before touching anything, an implementer needs to know these things.
- Person and project references hold names but are typed PersonId/ProjectId, while the entities' own ids are uuids (STRUCT-45).
- The storage adapter is only correct after waitForStorageInit resolves.
- Module-level stores keep state between renderHook calls, so test suites need a reset in beforeEach.
- TokenMatch.type is a plain string, so a wrong token name still compiles.
- playwright.config.ts sets maxDiffPixelRatio 0.001, not the 1-2% that CLAUDE.md states. Baselines can still be stale, so delete and regenerate them right before any UI extraction (Gantt, Kanban, toolbars, FocusView, modals) and compare afterwards.
- Do not run prettier: there is no config, and it reformats against the repo's style.
- Run Playwright with PLAYWRIGHT_PORT set.
- Large extractions exceed 1000 changed lines if done at once: TodoApp, GanttView, KanbanView, the toolbars, the cross-tab stores, the callback renames and PersonRef. Land them one extracted unit per commit, and use git mv for file moves.
- Write characterisation tests first where they are missing: useBackups, load errors in useNotes/useReviews/useSprints, Kanban's view state, and the global shortcuts. KanbanView's own comment postpones convergence until such tests exist.
- The owner's constraint applies throughout: no item removes a feature. Alternatives that would remove one, such as dropping an ignored setting or a half-wired prop, appear only as options for the owner.

## Items, high to low

- [STRUCT-01](../workstreams/storage-core.md#struct-01) · high · `bugfix` · M — Failed or corrupt storage reads look like an empty store, and hooks then save defaults over real data · U0137, batch 2A
- [STRUCT-02](../workstreams/notes.md#struct-02) · high · `bugfix` · S — Add Note modal drops all people, project and tag metadata because its token-type names never match, and TokenMatch.type is an untyped string · U0409, batch 3B
- [STRUCT-03](../workstreams/cross-tab.md#struct-03) · high · `bugfix` · L — Only settings are coordinated across tabs; every other collection is overwritten between tabs and routes · U0071, batch 2C
- [STRUCT-04](../workstreams/keyboard-help.md#struct-04) · high · `bugfix` · S — Tutorial steps bypass the view registry, and the tutorial buttons on Stats and Time crash the app · U0446, batch 3C
- [STRUCT-05](../workstreams/dates-time.md#struct-05) · high · `bugfix` · S — 12 of the 21 Delay quick-picks, and the matching auto-assign due-date defaults, silently do nothing · U0548, batch 3A
- [STRUCT-06](../workstreams/overlays-dialogs.md#struct-06) · high · `bugfix` · M — The Add Todo, Person, Project and Sprint modals are hand-built inline in TodoApp, and their close paths disagree so cancelled text can still be submitted · U0462, batch 3C
- [STRUCT-07](../workstreams/overlays-dialogs.md#struct-07) · high · `bugfix` · L — Gantt, Kanban and Calendar each mount their own reduced TodoDetailsOverlay · U0212, batch 3C
- [STRUCT-08](../workstreams/overlays-dialogs.md#struct-08) · high · `bugfix` · M — Five dialogs re-implement the modal shell, and ad hoc z-indexes open Task Details underneath the Sprint overlay · U0226, batch 3C
- [STRUCT-09](../workstreams/backup.md#struct-09) · high · `bugfix` · S — useBackups re-reads every backup in an endless render loop while the Backup tab is open · U0044, batch 2B
- [STRUCT-10](../workstreams/overlays-dialogs.md#struct-10) · high · `needs-decision` · M — Escape is handled four different ways, so it can close the dialog underneath, or two dialogs at once · U0466, batch 3C
- [STRUCT-11](../workstreams/undo-confirm.md#struct-11) · high · `needs-decision` · M — Whether a delete asks for confirmation depends on where it is started, and ConfirmDialog sits outside the Modal system and renders underneath it · U0480, batch 3C
- [STRUCT-12](../workstreams/dates-time.md#struct-12) · high · `bugfix` · S — chronoCustom turns a Sunday work-week start into Monday ('|| 1') · U0531, batch 3A
- [STRUCT-13](../workstreams/dates-time.md#struct-13) · high · `needs-decision` · L — Two parallel shorthand-date engines (dateUtils and chronoCustom) with diverging results · U0547, batch 7B
- [STRUCT-14](../workstreams/settings.md#struct-14) · high · `none` · M — Work-hours schedule resolution is written four times, along with copied HH:MM parsing and day-name arrays · U0320, batch 3B
- [STRUCT-15](../workstreams/settings.md#struct-15) · high · `needs-decision` · M — The work-hours 'Enabled' toggle (DaySchedule.enabled) has no effect anywhere · U0311, batch 3B
- [STRUCT-16](../workstreams/app-shell.md#struct-16) · medium · `none` · L — TodoApp.tsx (2359 lines, 34 useState) mixes about a dozen concerns, with clear places to split it · U0453, batch 8A
- [STRUCT-17](../workstreams/migrations-versioning.md#struct-17) · medium · `bugfix` · M — Startup work (version check, auto-backup, legacy entity merge) runs inside useTodos and races useEntityManager · U0138, batch 2A
- [STRUCT-18](../workstreams/migrations-versioning.md#struct-18) · medium · `bugfix` · M — The guard against newer stored data does not stop hooks from writing the old shape · U0067, batch 2A
- [STRUCT-19](../workstreams/storage-core.md#struct-19) · medium · `bugfix` · M — Domain hooks handle load errors, cancellation and async code in five different ways · U0137, batch 2A
- [STRUCT-20](../workstreams/settings.md#struct-20) · medium · `bugfix` · M — SettingsModel is a mutable singleton, so memos keyed on it never update when settings change · U0319, batch 3A
- [STRUCT-21](../workstreams/storage-core.md#struct-21) · medium · `bugfix` · S — Storage operations list keys in two different ways, and the startup cleanup deletes the theme mirror · U0087, batch 2A
- [STRUCT-22](../workstreams/storage-core.md#struct-22) · medium · `bugfix` · S — getStorageType identifies the adapter by constructor.name, which minification can rename · U0084, batch 2A
- [STRUCT-23](../workstreams/rich-text-html.md#struct-23) · medium · `none` · M — Link-pattern matching, including the sanitizeUrl check, is rebuilt in four places · U0801, batch 4
- [STRUCT-24](../workstreams/notes.md#struct-24) · medium · `bugfix` · S — Converting a note to a todo never opens the new todo, because the lookup uses a stale closure · U0460, batch 3B
- [STRUCT-25](../workstreams/app-shell.md#struct-25) · medium · `bugfix` · S — View feature gating is re-listed outside VIEW_DEFINITIONS so the Time view never redirects, and the settings page re-declares features and tabs · U0447, batch 6C
- [STRUCT-26](../workstreams/notes.md#struct-26) · medium · `feature-extension` · M — Two props are only half wired: focusing the content of a new note, and Calendar quick-add · U0691, batch 10
- [STRUCT-27](../workstreams/notes.md#struct-27) · medium · `feature-extension` · S — Three Notes settings are saved but never applied · U0299, batch 10
- [STRUCT-28](../workstreams/notifications.md#struct-28) · medium · `feature-extension` · S — The notification check-interval setting can be edited but is ignored · U0737, batch 6B
- [STRUCT-29](../workstreams/import-export.md#struct-29) · medium · `bugfix` · S — downloadFile lives in export.ts, and useBackups re-implements it but revokes the URL immediately · U0100, batch 2B
- [STRUCT-30](../workstreams/code-hygiene.md#struct-30) · medium · `none` · M — Hook functions are memoised inconsistently, usePeople and useProjects memoise on an unstable object, and there is no rule for memoisation · U0140, batch 7A
- [STRUCT-31](../workstreams/kanban.md#struct-31) · medium · `needs-decision` · L — KanbanView runs its own filter, preset and persistence code instead of the view-state pattern List and Notes use · U0213, batch 7B
- [STRUCT-32](../workstreams/gantt-scheduling.md#struct-32) · medium · `none` · L — GanttView.tsx (2151 lines) renders the toolbar, overview, timeline, rows and tooltip in one component · U0345, batch 7B
- [STRUCT-33](../workstreams/smart-input.md#struct-33) · medium · `none` · M — The marker grammar (@ $ % !! #) is built separately in SmartInput, MarkedText and renameReferences · U0502, batch 7B
- [STRUCT-34](../workstreams/smart-input.md#struct-34) · medium · `none` · M — SmartInput mixes a 400-line tokenizer with DOM rendering, and keeps fallback colours that are never used · U0498, batch 7B
- [STRUCT-35](../workstreams/stats-time-focus.md#struct-35) · medium · `none` · M — FocusView repeats the dialog shell on five screens and keeps the timer state machine inside the component · U0395, batch 7B
- [STRUCT-36](../workstreams/smart-input.md#struct-36) · medium · `none` · S — The Smart Input marker legend exists three times · U0441, batch 7B
- [STRUCT-37](../workstreams/todos-core.md#struct-37) · medium · `none` · M — TodoDetailsOverlay (1200 lines) writes the selection-record mapping and the explicit-token merge rule inline · U0421, batch 7B
- [STRUCT-38](../workstreams/view-state.md#struct-38) · medium · `none` · M — ListViewToolbar and NotesViewToolbar are near-copies · U0203, batch 7B
- [STRUCT-39](../workstreams/overlays-dialogs.md#struct-39) · medium · `needs-decision` · M — Five different mechanisms close dropdowns and menus on an outside click · U0422, batch 8A
- [STRUCT-40](../workstreams/app-shell.md#struct-40) · medium · `none` · M — The same callback has different prop names across components, and one name has two meanings · U0343, batch 8A
- [STRUCT-41](../workstreams/app-shell.md#struct-41) · medium · `none` · M — Components mix Models and raw records in their props · U0211, batch 8A
- [STRUCT-42](../workstreams/app-shell.md#struct-42) · medium · `none` · M — settings is passed down together with separate markerColors, linkPatterns, workHours and kanban props taken from it · U0342, batch 8A
- [STRUCT-43](../workstreams/view-state.md#struct-43) · medium · `none` · M — The two biggest view-state hooks hand-write their own option persistence and Set-to-array filter conversion · U0250, batch 6C
- [STRUCT-44](../workstreams/code-hygiene.md#struct-44) · medium · `none` · M — Branded ids are bypassed with plain strings in hook APIs and stored cross-references · U0141, batch 6A
- [STRUCT-45](../workstreams/entity-names.md#struct-45) · medium · `needs-decision` · L — PersonId and ProjectId label both generated ids and name references, so lookups by id never find people or projects created in the app · U0582, batch 6A
- [STRUCT-46](../workstreams/migrations-versioning.md#struct-46) · medium · `none` · M — Normalising data on load is split between migrations.ts and code inside the hooks · U0063, batch 2A
- [STRUCT-47](../workstreams/backup.md#struct-47) · medium · `needs-decision` · M — Backup operations are duplicated between storage/backup.ts and useBackups, and lastBackupDate is stored in two places · U0055, batch 2B
- [STRUCT-48](../workstreams/durations.md#struct-48) · medium · `none` · M — Duration helpers have no single home: parseDuration lives in ganttScheduler and formatDuration is copied four times · U0376, batch 7B
- [STRUCT-49](../workstreams/smart-input.md#struct-49) · medium · `needs-decision` · S — Picker option lists exist both in types/time.ts and in utils, and have already drifted apart · U0513, batch 7B
- [STRUCT-50](../workstreams/entity-names.md#struct-50) · medium · `needs-decision` · S — Looking up an entity by name or alternative name is written about 15 times, with mixed case sensitivity · U0746, batch 6A
- [STRUCT-51](../workstreams/smart-input.md#struct-51) · medium · `needs-decision` · M — autoDetection has five copy-pasted detector skeletons, and their stop-word lists already differ · U0515, batch 7B
- [STRUCT-52](../workstreams/code-hygiene.md#struct-52) · medium · `none` · M — Ids are generated in three styles, and some still use timestamps · U0757, batch 7A
- [STRUCT-53](../workstreams/tests-ci-tooling.md#struct-53) · medium · `none` · S — browserApis.ts ships Jest test doubles inside a production module · U0742, batch 1
- [STRUCT-54](../workstreams/tests-ci-tooling.md#struct-54) · medium · `none` · S — The storage module is mocked by hand in 12 test files, with literal keys and inconsistent return types · U0127, batch 1
- [STRUCT-55](../workstreams/tests-ci-tooling.md#struct-55) · medium · `none` · M — e2e duplicates the storage reset, hard-codes storage keys, and has a persistence assertion that can never fail · U0629, batch 1
- [STRUCT-56](../workstreams/keyboard-help.md#struct-56) · low · `bugfix` · M — Help sections and keyboard-shortcut lists are maintained by hand in parallel, and 't' triggers two actions in Gantt · U0439, batch 8A
- [STRUCT-57](../workstreams/view-state.md#struct-57) · low · `bugfix` · S — List and Notes keep selection mode in different layers, and toggling it from the keyboard in Notes leaves the old selection behind · U0231, batch 6C
- [STRUCT-58](../workstreams/keyboard-help.md#struct-58) · low · `bugfix` · S — Two Gantt tutorial steps point at data-tutorial anchors that do not exist · U0340, batch 6C
- [STRUCT-59](../workstreams/entity-names.md#struct-59) · low · `bugfix` · S — Renaming an entity updates filters and presets but not the in-memory selection history · U0569, batch 6A
- [STRUCT-60](../workstreams/view-state.md#struct-60) · low · `bugfix` · S — List preset matching assumes a different default than the hook's initial state · U0252, batch 11
- [STRUCT-61](../workstreams/undo-confirm.md#struct-61) · low · `bugfix` · S — useUndoableActions runs side effects inside a state updater · U0161, batch 11
- [STRUCT-62](../workstreams/tests-ci-tooling.md#struct-62) · low · `bugfix` · S — build:gh-pages does not set GITHUB_PAGES itself, so a local run fails or patches a stale out/ folder · U0647, batch 11
- [STRUCT-63](../workstreams/storage-core.md#struct-63) · low · `none` · S — Literal storage keys remain outside STORAGE_KEYS, including in the layout's theme script · U0777, batch 1
- [STRUCT-64](../workstreams/code-hygiene.md#struct-64) · low · `none` · S — Unused props are passed down through component interfaces · U0210, batch 10
- [STRUCT-65](../workstreams/entity-names.md#struct-65) · low · `needs-decision` · S — Notes are matched to people and projects in TodoApp but todos inside the overlay, and entities created from a note get no colour · U0457, batch 7B
- [STRUCT-66](../workstreams/sprints.md#struct-66) · low · `needs-decision` · S — SprintsView re-implements EntityListView · U0362, batch 7B
- [STRUCT-67](../workstreams/settings.md#struct-67) · low · `needs-decision` · M — Settings are read both through SettingsModel and as raw Settings, and most SettingsModel getters are unused or missing · U0317, batch 7B
- [STRUCT-68](../workstreams/code-hygiene.md#struct-68) · low · `none` · S — Shared data types live in hook and storage files, and two are declared twice · U0249, batch 7A
- [STRUCT-69](../workstreams/code-hygiene.md#struct-69) · low · `none` · S — Each model exposes its raw data in a different way · U0577, batch 7A
- [STRUCT-70](../workstreams/code-hygiene.md#struct-70) · low · `none` · S — Each model has a different set of factory functions · U0578, batch 7A
- [STRUCT-71](../workstreams/code-hygiene.md#struct-71) · low · `none` · S — Model members with the same name have different shapes, and most of them are dead · U0162, batch 5
- [STRUCT-72](../workstreams/code-hygiene.md#struct-72) · low · `none` · S — Model getters drop branded types and use loosely typed activity · U0322, batch 7A
- [STRUCT-73](../workstreams/sprints.md#struct-73) · low · `none` · S — The Sprint type and model differ from the other entities · U0593, batch 3A
- [STRUCT-74](../workstreams/search.md#struct-74) · low · `none` · S — matchesSearch treats a blank query differently in BaseEntityModel than in the other models (not visible to users) · U0580, batch 6C
- [STRUCT-75](../workstreams/code-hygiene.md#struct-75) · low · `none` · S — Defensive '|| []' reads are inconsistent within and across models · U0588, batch 7A
- [STRUCT-76](../workstreams/code-hygiene.md#struct-76) · low · `none` · S — NoteModel and ReviewModel require a SettingsModel they never use · U0583, batch 5
- [STRUCT-77](../workstreams/code-hygiene.md#struct-77) · low · `none` · S — Hooks return a mix of domain-prefixed and generic keys, plus values nobody uses · U0158, batch 8A
- [STRUCT-78](../workstreams/code-hygiene.md#struct-78) · low · `none` · S — Hook lookups return undefined where the coding standard says null · U0559, batch 7A
- [STRUCT-79](../workstreams/code-hygiene.md#struct-79) · low · `none` · S — useEntityManager has three redundant ways to build models · U0557, batch 7A
- [STRUCT-80](../workstreams/code-hygiene.md#struct-80) · low · `none` · S — Plain helper functions are exported from hook files, and one file is named after a hook it does not contain · U0736, batch 7A
- [STRUCT-81](../workstreams/sprints.md#struct-81) · low · `none` · S — useSprints re-implements the comment functions the other hooks share · U0185, batch 7B
- [STRUCT-82](../workstreams/activity-comments.md#struct-82) · low · `none` · S — Activity entries are built four different ways across two nearly identical modules · U0181, batch 3A
- [STRUCT-83](../workstreams/todos-core.md#struct-83) · low · `none` · S — useTodos handles the same cases inconsistently internally · U0136, batch 5
- [STRUCT-84](../workstreams/code-hygiene.md#struct-84) · low · `none` · S — Numbers that can be zero are tested with truthiness checks, against the coding standard · U0590, batch 7A
- [STRUCT-85](../workstreams/storage-core.md#struct-85) · low · `none` · S — initializeStorage hides a null behind a double cast four times, and nothing reads its result · U0074, batch 2A
- [STRUCT-86](../workstreams/settings.md#struct-86) · low · `none` · S — src/types/settings.ts imports from src/utils, the last remaining case of the types layer depending on utils · U0323, batch 7B
- [STRUCT-87](../workstreams/code-hygiene.md#struct-87) · low · `none` · S — Utils import model classes as values though they use them only as types, and the storage layer exports a React hook · U0754, batch 7A
- [STRUCT-88](../workstreams/code-hygiene.md#struct-88) · low · `none` · S — Naming and declaration conventions in src/types have drifted · U0375, batch 7A
- [STRUCT-89](../workstreams/docs.md#struct-89) · low · `none` · S — Leftover scaffolding comments and duplicate imports in hooks and storage · U0057, batch 12
- [STRUCT-90](../workstreams/code-hygiene.md#struct-90) · low · `none` · S — Eight files that use hooks lack the 'use client' directive · U0497, batch 7A
- [STRUCT-91](../workstreams/code-hygiene.md#struct-91) · low · `none` · M — shared/ is a grab-bag: modals, single-use sections and help text sit next to reusable building blocks · U0687, batch 7B
- [STRUCT-92](../workstreams/code-hygiene.md#struct-92) · low · `none` · S — A few components use default exports, and SmartInput.tsx exports a component with a different name · U0511, batch 7A
- [STRUCT-93](../workstreams/settings.md#struct-93) · low · `none` · S — The settings page keeps its logic in app/, and the full-screen loading block is duplicated · U0265, batch 7B
- [STRUCT-94](../workstreams/visual-system.md#struct-94) · low · `none` · S — Fixed values are written as inline styles where utility classes exist · U0510, batch 8C
- [STRUCT-95](../workstreams/visual-system.md#struct-95) · low · `needs-decision` · S — Inline SVGs duplicate Icons.tsx, and NotesView defines a second, different PinIcon · U0424, batch 8C
- [STRUCT-96](../workstreams/visual-system.md#struct-96) · low · `none` · M — StorageTab builds its own notice boxes, and NoticeBox's type omits the danger variant it already styles · U0035, batch 8C
- [STRUCT-97](../workstreams/visual-system.md#struct-97) · low · `needs-decision` · S — Plain &lt;input type=color> fields are used in 12 places next to the shared ColorPicker · U0419, batch 8C
- [STRUCT-98](../workstreams/code-hygiene.md#struct-98) · low · `none` · S — Pure helper functions are copied or parked inside component files · U0347, batch 7A
- [STRUCT-99](../workstreams/dates-time.md#struct-99) · low · `none` · S — YYYY-MM-DD keys are built by hand in 14 places instead of with formatDateKey · U0334, batch 7B
- [STRUCT-100](../workstreams/settings.md#struct-100) · low · `none` · S — Defensive ?. and ?? fallbacks on required Settings fields, mixed with direct access · U0287, batch 5
- [STRUCT-101](../workstreams/tests-ci-tooling.md#struct-101) · low · `none` · S — Test ids on view roots and tabs are inconsistent · U0495, batch 11
- [STRUCT-102](../workstreams/code-hygiene.md#struct-102) · low · `none` · S — The /doit base path is hard-coded in seven places, using two different approaches · U0759, batch 7A
- [STRUCT-103](../workstreams/tests-ci-tooling.md#struct-103) · low · `none` · M — Shared test fixtures live in utils/__tests__ and are used inconsistently · U0741, batch 1
- [STRUCT-104](../workstreams/dates-time.md#struct-104) · low · `none` · S — The same date helpers are exported under several names, and two getWeekNumber functions have different signatures · U0552, batch 7B
- [STRUCT-105](../workstreams/dates-time.md#struct-105) · low · `none` · S — Date display formatting is split across three modules · U0750, batch 7B
- [STRUCT-106](../workstreams/notifications.md#struct-106) · low · `none` · M — notifications.ts bundles sound playback, the ambient player and system notifications in one module · U0758, batch 7B
- [STRUCT-107](../workstreams/code-hygiene.md#struct-107) · low · `none` · S — Regex and HTML escape helpers are in the wrong modules and copied many times · U0802, batch 7A
- [STRUCT-108](../workstreams/rich-text-html.md#struct-108) · low · `none` · M — richText keyHandlers bypass the caret helpers that selection.ts centralised · U0803, batch 7B
- [STRUCT-109](../workstreams/code-hygiene.md#struct-109) · low · `none` · S — Imports mix the @/ alias with relative paths, in source and in tests · U0514, batch 7A
- [STRUCT-110](../workstreams/tests-ci-tooling.md#struct-110) · low · `none` · S — The e2e mobile tests' test.use is ignored by the shared worker page, Playwright config has stale comments, and CLAUDE.md states the wrong visual tolerance · U0633, batch 1
- [STRUCT-111](../workstreams/tests-ci-tooling.md#struct-111) · low · `none` · S — Tooling config has duplicated and stale entries: the alias declared three times, ts-jest overrides, old build paths, an incomplete clean script · U0639, batch 11
- [STRUCT-112](../workstreams/migrations-versioning.md#struct-112) · low · `needs-decision` · S — Version numbers disagree: package.json is frozen while the pre-commit hook bumps version.json on every commit · U0642, batch 7B
- [STRUCT-113](../workstreams/import-export.md#struct-113) · low · `needs-decision` · S — The todo and note exporters in export.ts differ in naming and JSON shape, and one comment is stale · U0095, batch 7B
- [STRUCT-114](../workstreams/code-hygiene.md#struct-114) · low · `none` · S — Util modules follow different conventions: arrow-function constants versus function declarations, and mixed name suffixes · U0812, batch 7A

## Commit groupings suggested by the reviewer

Superseded by the work units where they differ; kept because they show what the reviewer expected to land together.

- **P1-01 Storage reads distinguish failure from empty** — STRUCT-01. Highest-impact fix for data loss, and the error convention every later persistence change relies on.
- **P1-02 Add Note metadata and typed tokens** — STRUCT-02. Small, separate fix for data loss that happens on every note created from the modal.
- **P1-03 Unit-test infrastructure** — STRUCT-54, STRUCT-103, STRUCT-53. Test-only changes: a shared storage mock, shared fixtures and test doubles moved out of production code. Landing them before the hook refactors means those refactors touch fewer test lines.
- **P1-04 Storage key handling in storage.ts** — STRUCT-63, STRUCT-21, STRUCT-22. All three change how storage.ts names and lists keys and adapters, and they are tested by the same storage.test.
- **P1-05 Storage startup owns the migration work** — STRUCT-17, STRUCT-85. Moves checkAndUpdateVersion into storage startup and gives initializeStorage an honest return type in the same change.
- **P1-06 Guard against newer stored data** — STRUCT-18. Builds on P1-05's init result, and must land before the next CURRENT_VERSION bump.
- **P1-07 useBackups render loop** — STRUCT-09. A small, urgent fix that stabilises the useSettings functions and adds the first useBackups test.
- **P1-08 Backup module owns backup storage and file I/O** — STRUCT-47, STRUCT-29. Both rewrite useBackups' file and storage code; doing them together avoids editing the hook twice.
- **P1-09 Normalise data when it is loaded** — STRUCT-46, STRUCT-75. Migration functions for every entity, then removing the model guards those migrations make unnecessary.
- **P1-10 useStorageLoad** — STRUCT-19. One loader for the hooks the shared stores do not replace, following P1-01's convention.
- **P1-11 Shared stores for every collection** — STRUCT-03. Fixes data loss between tabs. Allowed to span several commits: one commit per collection, todos first, each under 1000 lines.
- **P2-01 Tutorial registry** — STRUCT-04, STRUCT-58. Centralises the tutorial steps, fixes the crash, then fixes the broken Gantt anchors with a test that checks every anchor.
- **P2-02 Add modals extracted from TodoApp** — STRUCT-06. Extracts the Add Todo, Person/Project and Sprint modals onto Modal and fixes the close paths that kept the old text.
- **P2-03 Modal shells and z-index scale** — STRUCT-08. Every dialog becomes a Modal on one layering scale, which P2-04 and P2-05 depend on.
- **P2-04 ConfirmDialog on Modal and one delete path** — STRUCT-11. One confirmation component and one delete flow for the list and the overlay.
- **P2-05 A single owner for Escape** — STRUCT-10. Needs the owner's decision on the RichTextEditor commit timing; lands after P2-03.
- **P2-06 Views open TodoApp's details overlay** — STRUCT-07. Removes the three reduced overlay copies. Allowed to span several commits, one view per commit, if the diff exceeds 1000 lines.
- **P2-07 Popover primitive** — STRUCT-39. One way to close menus on an outside click, adopted after the add modals have moved.
- **P3-01 Date shorthand bugfixes** — STRUCT-05, STRUCT-12. Two small fixes in dateUtils and chronoCustom, each with a table test, that ship before the larger consolidation of the two engines.
- **P3-02 One shorthand-date engine** — STRUCT-13. Needs owner rulings. Allowed to span two commits: move the code, then delegate to it.
- **P3-03 Work-hours module** — STRUCT-14. Behaviour-preserving merge of the four work-hours resolvers; prerequisite for P3-04.
- **P3-04 DaySchedule.enabled honoured** — STRUCT-15. A one-place change once P3-03 has landed, plus tests for Gantt and dateUtils.
- **P3-05 Date helper cleanup** — STRUCT-99, STRUCT-104, STRUCT-105. Date keys built by hand, duplicate aliases, and display formatters in the wrong module: all mechanical changes in dateUtils and its callers.
- **P3-06 Duration and component helpers** — STRUCT-48, STRUCT-98. Moves pure helpers out of ganttScheduler and component files into utils and types.
- **P3-07 Picker option lists** — STRUCT-49. One home for the suggestion lists, once the owner has decided between the variants that drifted apart.
- **P4-01 Convert-note navigation fix** — STRUCT-24. Separate bugfix that lands before the TodoApp extraction, so the extraction stays behaviour-preserving.
- **P4-02 TodoApp extraction** — STRUCT-16. Allowed to span several commits: one hook or component extracted per commit, behind a keyboard e2e test written first.
- **P4-03 Global shortcuts and help registry** — STRUCT-56. Builds on useGlobalShortcuts from P4-02, so Help can no longer drift from the actual key handling.
- **P4-04 Feature gating and settings app shell** — STRUCT-25, STRUCT-93. Both rework app/settings/page.tsx: SETTINGS_TABS lands first, then the page body moves into SettingsApp.
- **P4-05 Half-wired props completed** — STRUCT-26. Feature extension that needs AddTodoModal from P2-02 and a focus handle on RichTextEditor.
- **P4-06 Ignored settings wired up** — STRUCT-27, STRUCT-28. Two small feature extensions that make existing settings take effect.
- **P4-07 GanttView split** — STRUCT-32. Allowed to span several commits, one or two components per commit, with baselines regenerated beforehand.
- **P4-08 Kanban view state** — STRUCT-31. Tests first, then the hook, then the components. Allowed to span several commits, and the preset alignment depends on the owner's decision.
- **P4-09 Marker grammar and escape helpers** — STRUCT-33, STRUCT-107. markers.ts needs escapeRegExp, and the two together replace the regex copies in SmartInput, MarkedText and renameReferences.
- **P4-10 SmartInput tokenizer extraction** — STRUCT-34. Moves detection into utils on top of P4-09, checked against a snapshot of detectTokens output.
- **P4-11 FocusView shell and schedule hook** — STRUCT-35. Self-contained refactor of the two focus views.
- **P4-12 Link-pattern matching in one place** — STRUCT-23. Puts the sanitizeUrl check in one function; security review then has a single target.
- **P4-13 Marker legend in one place** — STRUCT-36. Small change driven by a list of definitions; visual snapshots prove each legend stays the same.
- **P4-14 TodoDetailsOverlay helpers and split** — STRUCT-37. Uses LinksSection from P4-12 and the legend from P4-13, then splits the 1200-line overlay.
- **P4-15 Generic view toolbar** — STRUCT-38. Needs P5-04's types. Allowed to span two commits (generic toolbar plus List, then Notes) to stay under 1000 lines.
- **P4-16 Callback prop naming** — STRUCT-40. Mechanical renames, one component group per commit, after P2-06 has removed several of the props.
- **P4-17 Models in component props** — STRUCT-41. Changes types and field access component by component, and drops rawReviews.
- **P4-18 Prop pruning** — STRUCT-42, STRUCT-64. Both delete props: the separately passed settings slices and the unused props.
- **P4-19 Notes selection mode** — STRUCT-57. Small bugfix plus one shared handle type for the List and Notes views.
- **P4-20 Entity views aligned** — STRUCT-65, STRUCT-66, STRUCT-101. Brings People, Projects and Sprints onto one list shell, one way of matching notes, and one test-id scheme.
- **P4-21 Component placement and export style** — STRUCT-91, STRUCT-92. Diffs that only move files and update imports, using git mv; lands after the modal and toolbar packages.
- **P4-22 UI primitives adopted** — STRUCT-94, STRUCT-95, STRUCT-96, STRUCT-97. Inline styles, icons, NoticeBox and ColorPicker, all verified by one visual snapshot pass.
- **P5-01 Hook functions keep stable identities** — STRUCT-30. Applies the documented memoisation rule across the domain hooks after P1-07.
- **P5-02 SettingsModel becomes a plain instance** — STRUCT-20, STRUCT-76. Removes the singleton and the unused settings dependency of the Note and Review models together.
- **P5-03 SettingsModel API and typed getters** — STRUCT-67, STRUCT-72. Both reshape SettingsModel's public getters, after P5-02 and P5-04.
- **P5-04 src/types consistency** — STRUCT-68, STRUCT-73, STRUCT-86, STRUCT-88. Type-only moves and renames inside src/types; a prerequisite for P4-15 and P5-03.
- **P5-05 Model API conventions** — STRUCT-69, STRUCT-70, STRUCT-71, STRUCT-74. Raw-data access, factories, member shapes and blank-query handling, all within src/models.
- **P5-06 Branded id parameters** — STRUCT-44. Type-only change across hooks and types, checked by typecheck.
- **P5-07 Id generation** — STRUCT-52. Branded id generators in one module; prerequisite for P5-09's activity entries.
- **P5-08 Person and project references** — STRUCT-45. Needs the owner's decision on resolving alternative names. Allowed to span two commits (brands, then lookups).
- **P5-09 Hook internals reuse shared helpers** — STRUCT-81, STRUCT-82, STRUCT-83. useSprints, useEntityManager and useTodos adopt the shared comment and activity helpers and their own dependency-block helper.
- **P5-10 Hook API tidy-up** — STRUCT-77, STRUCT-78, STRUCT-79, STRUCT-80. Return keys, null for misses, model factories and helper placement: small API cleanups across the hooks.
- **P5-11 Small hook bugfixes** — STRUCT-59, STRUCT-60, STRUCT-61. Three independent fixes of a few lines each, each with its own test.
- **P5-12 Coding-standard comparisons** — STRUCT-84, STRUCT-100. Zero checks and unneeded fallbacks rewritten to give the same results, after P1-09.
- **P5-13 View-option persistence helpers** — STRUCT-43. Shared filter-conversion helpers for the two view-state hooks; step 2 is optional.
- **P6-01 Name-matching utilities** — STRUCT-50, STRUCT-51. One shared name-lookup helper and one detector skeleton for autoDetection.
- **P6-02 Notifications module split** — STRUCT-106. Splits sounds from notifications and adds a check that sw.js lists the same sound files.
- **P6-03 richText caret and block helpers** — STRUCT-108. Self-contained in utils/richText and covered by its suites and the e2e spec.
- **P6-04 File hygiene** — STRUCT-89, STRUCT-90. Comment, import and directive changes only.
- **P6-05 Module naming and import style** — STRUCT-87, STRUCT-109, STRUCT-113, STRUCT-114. Import style, type-only imports and module naming conventions, plus a lint rule that enforces them.
- **P6-06 e2e infrastructure** — STRUCT-55, STRUCT-110. Test-only changes to fixtures and Playwright config, after P1-04 exports the IndexedDB names.
- **P6-07 Build and release tooling** — STRUCT-62, STRUCT-102, STRUCT-111, STRUCT-112. Scripts, config and the base-path constant used by next.config and the GitHub Pages script.

## Dependencies

Within this dimension:
- Test infrastructure first. STRUCT-54 (shared storage mock), STRUCT-103 (fixtures) and STRUCT-53 (test doubles) should land before the hook refactors that rewrite those suites: STRUCT-03, 19, 20, 30 and 46.
- Persistence chain:
  - STRUCT-01 comes first, then STRUCT-46, then STRUCT-19 and STRUCT-03. The shared stores load through the new migrate functions and follow the failure convention.
  - STRUCT-17 and STRUCT-85 come before STRUCT-18, because the three-state version result travels through the init result. STRUCT-18 must land before any future CURRENT_VERSION bump.
  - STRUCT-46 comes before STRUCT-75, STRUCT-81 and STRUCT-84, because the guards can only go once the arrays are guaranteed.
  - STRUCT-47 lands before STRUCT-29 or in the same commit, since both rewrite useBackups.
- Hooks and models:
  - STRUCT-09 before STRUCT-30: useSettings becomes stable first, then the general rule follows.
  - STRUCT-20 before STRUCT-69, STRUCT-76, STRUCT-67 and STRUCT-72: SettingsModel must stop mutating before raw-access and getter cleanup.
  - STRUCT-73 before STRUCT-72 and STRUCT-82, which need the Timestamp fields and SprintActivityType.
  - STRUCT-52 before or together with STRUCT-82 (branded activity ids).
  - STRUCT-44 before STRUCT-45.
  - STRUCT-50 before STRUCT-45 and STRUCT-65, which use the shared name resolver.
  - STRUCT-68 before STRUCT-38, because the generic toolbar needs the moved types.
- Overlays:
  - STRUCT-08 before STRUCT-10 and STRUCT-11: every dialog must be a Modal on the z-index scale first.
  - STRUCT-06 before STRUCT-26 (quick-add opens AddTodoModal), STRUCT-97 (ColorPicker in the new modals) and STRUCT-39 (the template dropdown moves into AddTodoModal).
  - STRUCT-07 before STRUCT-32, STRUCT-31 and STRUCT-40, because it removes the local overlays and several props.
  - STRUCT-04 before STRUCT-58.
  - STRUCT-11 and STRUCT-38 before STRUCT-91, which moves the resulting files.
- TodoApp: STRUCT-24 before STRUCT-16, so the extraction moves already-fixed code. STRUCT-16 before STRUCT-56, which shares GLOBAL_SHORTCUTS. STRUCT-25 before STRUCT-93.
- Dates: STRUCT-05 and STRUCT-12 land first as small fixes with tests, and STRUCT-13 must keep them green. STRUCT-14 before STRUCT-15. STRUCT-99, 104 and 105 go after STRUCT-14, so fewer files are changing at once.
- Text grammar: STRUCT-107 before STRUCT-33, which comes before STRUCT-34 and STRUCT-36. STRUCT-23 and STRUCT-36 come before STRUCT-37.
- Other:
  - STRUCT-63 before STRUCT-55, because e2e imports DB_NAME and STORE_NAME.
  - STRUCT-41 before or together with STRUCT-77 (rawReviews).
  - STRUCT-64 must keep NotesView.notesSettings, which STRUCT-27 wires up, and NoteDetailView.autoFocusContent, which STRUCT-26 wires up.

Against the other dimensions:
- Logic and business-logic bugs:
  - Cross-listed items STRUCT-02, 04, 05, 12, 18, 22, 24 and 57-61 must be implemented once. If the bugs dimension owns them, drop them here.
  - The fixes inside STRUCT-01, 06, 07, 08, 09, 17, 21 and 29 are only possible through the restructuring, so they stay here.
- Dead-code removal:
  - It should land first for the dead code inside STRUCT-71, 67 (unused getters), 49 (test-only lists), 48 (GanttView _parseDuration), 91 (Comments.tsx), 88 (unused Duration types) and 105 (formatDetectedDate), so nothing is restructured right before it is deleted.
  - STRUCT-64 overlaps it directly.
- Duplication to consolidate:
  - STRUCT-14, 23, 31, 33, 36, 37, 38, 43, 48, 50, 51, 82, 98, 99, 104, 105 and 107 are also duplication findings.
  - Dedupe them in the central plan and keep one owner per location.
- Documentation cleanup:
  - STRUCT-89 and the comment fixes inside STRUCT-32, 35, 48 and 69 touch the same lines as that dimension.
  - STRUCT-110 corrects CLAUDE.md's visual tolerance.
  - The conventions adopted in STRUCT-30, 35, 40, 90, 109 and 114 need CLAUDE.md updates once they land.
- Error, validation and string messages: STRUCT-04, 06, 08, 11, 25 and 56 move user-facing text (tutorial copy, modal labels, confirmation text, settings tab labels, help rows). Centralise messages after those moves, aiming at the new locations rather than the old ones.
- Missing or wrong logging: STRUCT-01, 19 and 22 create explicit failure paths that load, save and adapter logging should hook into. Land them first.
- UI design review: build visual changes on the primitives from STRUCT-08 (z-index scale), STRUCT-39 (Popover), STRUCT-11 (ConfirmDialog) and STRUCT-95/96/97 (icons, NoticeBox, ColorPicker), not on the hand-built versions.
- Inconsistencies across the codebase: this is the closest sibling dimension. Dedupe STRUCT-35, 40, 78, 84, 100, 109 and 114 against it.
- Partly implemented features:
  - STRUCT-15, 26, 27 and 28 are cross-listed.
  - STRUCT-104 keeps reviewUtils.getWeekNumber only if that dimension builds the work-week calculation.
- Security review: STRUCT-23 puts the sanitizeUrl check into one function. Any security change to link handling should target that function, after STRUCT-23 or in the same commit.
- Opportunities to improve support: STRUCT-01 (the recovery screen really holds the user's data) and STRUCT-22 (the Storage tab reports the right backend) are prerequisites for trustworthy support diagnostics.

## Open questions

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
- [ ] STRUCT-112: Should the version revision go up per commit (pre-commit hook) or per plan (changelog)? Should package.json carry the real version?
- [ ] STRUCT-113: Should todo and note JSON exports share one shape? This changes the files users download.
- [ ] STRUCT-90 / STRUCT-30: Should 'use client' appear on every hook file or only on component entry points? Is the proposed memoisation rule acceptable as a documented convention?
- [ ] STRUCT-94: Should the 'Ideal' legend swatch in the Sprint burndown show a dashed line, as the code apparently intends?

## Dropped during synthesis

- Dead members found while reviewing structure (Comments.tsx, GanttView _parseDuration, test-only getRecurringSuggestions and getDueDateSuggestions, autoDetection.formatDetectedDate, the unused model members listed in STRUCT-71, the unused SettingsModel getters in STRUCT-67, the DurationWeek/Month/Year types) — Handed to the Dead-code removal dimension. The items above name them so they are not restructured, but deleting them is not scheduled here.
- Alternatives that would remove features (removing the notification check-interval control, the autoFocusContent and onQuickAdd props, or Kanban's close-after-action behaviour) — The owner's constraint forbids removing existing features, so these are kept only as owner options in openQuestions and the item text, not as proposals.
- Layering note that useConfirmDialog and useNotification import components — The reviewer judged this a normal React pattern and proposed no change; noted inside STRUCT-87 for completeness.
- Deciding which action 't' triggers in Gantt, and whether the burndown legend should be dashed — These are behaviour and visual decisions, not structural work, so they are recorded as open questions. STRUCT-56 and STRUCT-94 only cover the structural part.
- Switching runningSprint and nextPlannedSprint from undefined to null (part of the original finding on hook lookups returning null) — The verifier removed it: these are derived 'not set' values passed into optional ?: Sprint props, so under the coding standard they correctly stay undefined.
- Merged duplicates across slices — Nothing was lost; these were folded together: - the two literal storage-key findings into STRUCT-63 - the two activity-entry findings into STRUCT-82 - the two id-generation findings into STRUCT-52 - the two base-path findings into STRUCT-102 - the two types-importing-utils findings into STRUCT-86 - the two missing 'use client' findings into STRUCT-90 - the Links half of the detail-panels finding into STRUCT-23 The locations of all merged findings were combined.
- Split findings — Bundled findings were split so each job is its own item: - the TodoApp finding: the stale lookup after converting a note became STRUCT-24 - the SmartInput finding: the export name went to STRUCT-92 and the inline escapes to STRUCT-107 - the detail-panels finding: became STRUCT-23, STRUCT-36 and STRUCT-37 - the TodoModel helpers finding: date keys to STRUCT-99, durations to STRUCT-48 - the utils layering finding: STRUCT-86 and STRUCT-87, with ganttScheduler's import type in STRUCT-48 - the 'use client' plus memoisation finding: STRUCT-90 and STRUCT-30.

## Coverage gaps

No slice's finder failed, and the adversarial verifier rejected no finding outright. Several findings were corrected, and the items use the corrected versions. Nothing was run: no build, no Jest, no Playwright. Some claims therefore rest on reading the code and on framework knowledge rather than on observation: class-name mangling under Turbopack (STRUCT-22) and the StrictMode double run of state updaters (STRUCT-61).

Components slice: read only by grep or outline, not in full:
- Settings tabs: GeneralTab, GanttTab, CalendarTab, SprintsTab, CategoriesTab, LinksTab, MarkersTab, PrioritiesTab, DateTimeTab, AutoAssignTab, NotesTab, NotificationsTab, FocusTab, WorkHoursTab, BackupTab and ImportTab were only read at the lines cited. StorageTab and KanbanTab were read in part.
- Settings components: AutoAssignField, FocusModesSection, SettingsHeader and SettingsLoading were only read at the lines cited.
- Views: ReviewDetailView, ReviewEditView (only the lines cited) and StatisticsView.
- Overlays: OpenFocusView (beyond the shell helper), OpenFocusSetup, ProjectDetailsOverlay, and the bodies of the help/ sections.
- Items: NoteItem, ReviewItem and SprintItem.
- Shared components: Activity, ActivitySection, ActionItemsSection, MarkedText (beyond the regex and link sections), Templates, FilterSection, SearchableDropdown, MetadataSection, EntityMetadataFields, UndoNotificationStack, EmptyState, ExportMenuItems, SearchHistory, SearchInput, SectionHeader, StorageErrorBanner, Badge and IconButton.
- The providers, beyond their headers, and src/app/globals.css.

Components slice: large files read only in part:
- GanttView after line 1460 (outline only)
- SmartInput lines 910-1100
- ListView after line 700
- CalendarView after line 420
- TodoDetailsOverlay lines 480-980 and 1060-1185
- FocusView lines 150-760 and after 880
- the middle sections of NoteDetailView and NotesView
- most of TutorialOverlay
- ListViewToolbar and NotesViewToolbar, compared only by diff

Hooks, models, storage and types slice: every source file was read in full. The slice's Jest tests were only searched, not read, and component internals were only opened at the cited lines.

Utils, tests and tooling slice:
- Not reached: docs/ (15 files, including storage-architecture.md and todomodel-usage-guide.md), src/app beyond layout.tsx, most of public/sw.js, .claude/ and .vscode/.
- Skimmed with grep only: the bodies of about 70 Jest suites and e2e/visual.spec.ts. Most e2e specs were read only in part.

Not covered by any slice: README.md and CHANGELOG.md were read only at the lines cited, and nothing in public/ besides sw.js (manifest, icons, sound assets) was looked at.

Disclosure: the components reviewer accidentally created a scratch file outside the repository, at /private/tmp/claude-501/-Users-marcel-projects-projects-doit/0ec92a24-d1a9-40cf-822b-9139ace60257/scratchpad/targets.txt. Nothing inside the repository was created or changed.
