# Batch 7B — Consolidation: domain duplication and restructuring

66 units, 92 items: 1 high, 26 medium, 39 low. 20 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [ ] **U0547** Make one shorthand-date engine authoritative for chronoCustom and dateUtils · restructure · high · `needs-decision` · L · [dates-time](../workstreams/dates-time.md#u0547) · STRUCT-13, DUP-12 · **question**

## Medium priority

- [ ] **U0030** Drive StorageTab migration status styling from a typed status kind · restructure · medium · `none` · S · [storage-core](../workstreams/storage-core.md#u0030) · MSG-41
- [ ] **U0376** Give duration helpers one module and replace copied formatDuration functions · dedup · medium · `none` · M · [durations](../workstreams/durations.md#u0376) · STRUCT-48, DEAD-22, DUP-44
- [ ] **U0334** Replace inline YYYY-MM-DD padStart formatting with dateUtils helpers · dedup · medium · `none` · S · [dates-time](../workstreams/dates-time.md#u0334) · DUP-43, STRUCT-99
- [ ] **U0601** Share week and month range helpers with one week-start source · dedup · medium · `needs-decision` · M · [dates-time](../workstreams/dates-time.md#u0601) · DUP-50 · **question**
- [ ] **U0441** Single-source marker, date shorthand and recurring example lists for help · dedup · medium · `needs-decision` · M · [smart-input](../workstreams/smart-input.md#u0441) · DOC-48, MSG-39, DUP-112, STRUCT-36 · **question**
- [ ] **U0498** Extract one token detector shared by SmartInput and MarkedText · restructure · medium · `needs-decision` · L · [smart-input](../workstreams/smart-input.md#u0498) · STRUCT-34, DUP-64, BUG-158 · **question**
- [ ] **U0502** Share one marker-grammar module across SmartInput, MarkedText and renameReferences · dedup · medium · `none` · M · [smart-input](../workstreams/smart-input.md#u0502) · STRUCT-33, MSG-38
- [ ] **U0513** Keep one home for due-date, duration and recurring suggestion lists · dedup · medium · `needs-decision` · S · [smart-input](../workstreams/smart-input.md#u0513) · STRUCT-49, INC-87, DUP-95 · **question**
- [ ] **U0515** Fold autoDetection's copy-pasted name detectors into one configurable matcher · dedup · medium · `needs-decision` · M · [smart-input](../workstreams/smart-input.md#u0515) · STRUCT-51, DUP-46 · **question**
- [ ] **U0194** Extract a useSwipeActions hook shared by Todo, Note and Review items · dedup · medium · `none` · M · [todos-core](../workstreams/todos-core.md#u0194) · DUP-54
- [ ] **U0421** Extract selection-record and token-merge helpers, then split TodoDetailsOverlay · restructure · medium · `none` · M · [todos-core](../workstreams/todos-core.md#u0421) · STRUCT-37
- [ ] **U0426** Unify task-detail Priority, Duration and Recurring into one single-value field · dedup · medium · `needs-decision` · M · [todos-core](../workstreams/todos-core.md#u0426) · DUP-66 · **question**
- [ ] **U0362** Render SprintsView through EntityListView and drop SprintItem's dead count props · dedup · medium · `needs-decision` · M · [sprints](../workstreams/sprints.md#u0362) · DUP-63, STRUCT-66, DEAD-27 · **question**
- [ ] **U0154** Use one Kanban transition check with defined empty-rules semantics · dedup · medium · `needs-decision` · S · [kanban](../workstreams/kanban.md#u0154) · DUP-37, SUP-60 · **question**
- [ ] **U0213** Converge Kanban filters and presets onto the shared view-state and preset pattern · restructure · medium · `needs-decision` · L · [kanban](../workstreams/kanban.md#u0213) · STRUCT-31, INC-51 · **question**
- [ ] **U0225** Extract config-driven chip sections and preset chips inside KanbanView · dedup · medium · `none` · M · [kanban](../workstreams/kanban.md#u0225) · DUP-59
- [ ] **U0345** Split GanttView.tsx into toolbar, timeline, row and tooltip components · restructure · medium · `none` · L · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0345) · STRUCT-32
- [ ] **U0346** Fold GanttView's repeated control groups, lookup ternaries and timeline fragments · dedup · medium · `none` · M · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0346) · DUP-61
- [ ] **U0365** Extract statistics and time-report calculations into tested pure functions · tests-tooling · medium · `none` · M · [stats-time-focus](../workstreams/stats-time-focus.md#u0365) · SUP-65 · moved from 1
- [ ] **U0395** Extract shared focus shell, chrome components and a schedule state hook · restructure · medium · `none` · L · [stats-time-focus](../workstreams/stats-time-focus.md#u0395) · STRUCT-35, DUP-67, DUP-102
- [ ] **U0281** Use shared tooltipContent in settings tabs instead of pasted copies · dedup · medium · `none` · S · [settings](../workstreams/settings.md#u0281) · MSG-40, DUP-105
- [ ] **U0310** Extract one ScheduleEditor in WorkHoursTab for shared and per-day schedules · dedup · medium · `none` · M · [settings](../workstreams/settings.md#u0310) · DUP-65 · **question**
- [ ] **U0313** Build AutoAssignField on SearchableDropdown · dedup · medium · `needs-decision` · S · [settings](../workstreams/settings.md#u0313) · DUP-70 · **question**
- [ ] **U0203** Merge ListViewToolbar and NotesViewToolbar into one generic ViewToolbar · dedup · medium · `none` · L · [view-state](../workstreams/view-state.md#u0203) · STRUCT-38, DUP-58
- [ ] **U0233** Share the filter panel and marker-colour mapping between List and Notes · dedup · medium · `none` · M · [view-state](../workstreams/view-state.md#u0233) · DUP-56
- [ ] **U0235** Extract shared BulkActionToolbar and QuickFilterBar for List and Notes · dedup · medium · `needs-decision` · M · [view-state](../workstreams/view-state.md#u0235) · DUP-57 · **question**

## Low priority

- [ ] **U0095** Align todo and note exporter naming, field sets and JSON shape · restructure · low · `needs-decision` · M · [import-export](../workstreams/import-export.md#u0095) · STRUCT-113, INC-78 · **question**
- [ ] **U0096** Fold repeated export format and download plumbing into one helper · dedup · low · `none` · S · [import-export](../workstreams/import-export.md#u0096) · DUP-98
- [ ] **U0642** Make version.json the single version source and fix GET_VERSION · restructure · low · `needs-decision` · S · [migrations-versioning](../workstreams/migrations-versioning.md#u0642) · STRUCT-112, INC-81 · **question**
- [ ] **U0048** Derive the /doit base path from one env-backed helper · restructure · low · `none` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0048) · SUP-84
- [ ] **U0544** Share the ordinal-suffix helper and month/day abbreviation arrays · dedup · low · `none` · S · [dates-time](../workstreams/dates-time.md#u0544) · DUP-97
- [ ] **U0552** Use one name per date helper and drop duplicate getWeekNumber exports · restructure · low · `none` · S · [dates-time](../workstreams/dates-time.md#u0552) · STRUCT-104
- [ ] **U0750** Consolidate date display formatters into formatters.ts · restructure · low · `none` · S · [dates-time](../workstreams/dates-time.md#u0750) · STRUCT-105
- [ ] **U0501** Fold SmartInput's repeated content-replace and caret-to-end code into helpers · dedup · low · `none` · S · [smart-input](../workstreams/smart-input.md#u0501) · DUP-101
- [ ] **U0688** Drive CreateTemplateModal and BatchEditModal field rows from configs · dedup · low · `none` · S · [todos-core](../workstreams/todos-core.md#u0688) · DUP-117
- [ ] **U0248** Give UndoNotificationStack typed default messages instead of per-view getMessage chains · dedup · low · `none` · S · [undo-confirm](../workstreams/undo-confirm.md#u0248) · DUP-128, MSG-57
- [ ] **U0457** Route all person and project creation through one colour-aware helper · restructure · low · `needs-decision` · M · [entity-names](../workstreams/entity-names.md#u0457) · INC-79, STRUCT-65 · **question**
- [ ] **U0699** Replace NotesView's local PinIcon with the shared PinIcon · dedup · low · `needs-decision` · S · [notes](../workstreams/notes.md#u0699) · DUP-111 · **question**
- [ ] **U0707** Share the review entry header and state badge across review views · dedup · low · `needs-decision` · S · [reviews](../workstreams/reviews.md#u0707) · DUP-125 · **question**
- [ ] **U0715** Render ReviewsView period sections from a REVIEW_SECTIONS config · dedup · low · `none` · S · [reviews](../workstreams/reviews.md#u0715) · DUP-126
- [ ] **U0185** Use commentMutations helpers in useSprints · dedup · low · `none` · S · [sprints](../workstreams/sprints.md#u0185) · STRUCT-81
- [ ] **U0575** Fold useSprints transitions into one helper; derive daysRemaining from daysElapsed · dedup · low · `none` · S · [sprints](../workstreams/sprints.md#u0575) · DUP-79
- [ ] **U0684** Switch SprintProgress formatting on a metric kind, not its label · restructure · low · `none` · S · [sprints](../workstreams/sprints.md#u0684) · MSG-74
- [ ] **U0282** Extract a TechniqueSection component in GanttTab · dedup · low · `none` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0282) · DUP-107
- [ ] **U0383** Fold repeated blocks inside ganttScheduler and chronoCustom into local helpers · dedup · low · `none` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0383) · DUP-100
- [ ] **U0280** Extract a shared AmbientSoundSelect and FocusTab phase field · dedup · low · `none` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0280) · DUP-104
- [ ] **U0366** Share metric cards and bar rows across Statistics and Time Reports · dedup · low · `none` · M · [stats-time-focus](../workstreams/stats-time-focus.md#u0366) · DUP-123
- [ ] **U0410** Share focus-mode list operations and renumber order on remove · dedup · low · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0410) · DUP-89
- [ ] **U0300** Extract a useNotificationPermission hook for settings and focus views · dedup · low · `none` · S · [notifications](../workstreams/notifications.md#u0300) · DUP-103
- [ ] **U0758** Split sound playback out of notifications.ts into utils/sounds.ts · restructure · low · `none` · M · [notifications](../workstreams/notifications.md#u0758) · STRUCT-106
- [ ] **U0034** Fold StorageTab migrate handlers and share a settings sub-tab bar · dedup · low · `none` · S · [settings](../workstreams/settings.md#u0034) · DUP-118
- [ ] **U0265** Move the settings page body into SettingsApp and share FullScreenLoading · restructure · low · `none` · S · [settings](../workstreams/settings.md#u0265) · STRUCT-93
- [ ] **U0276** Share time-field config and weekday and month options in settings tabs · dedup · low · `none` · S · [settings](../workstreams/settings.md#u0276) · DUP-120
- [ ] **U0317** Choose one way to read settings: SettingsModel or raw Settings · restructure · low · `needs-decision` · M · [settings](../workstreams/settings.md#u0317) · STRUCT-67 · **question**
- [ ] **U0318** Fold useSettings section updaters and list operations into helpers · dedup · low · `none` · S · [settings](../workstreams/settings.md#u0318) · DUP-82
- [ ] **U0323** Remove src/types/settings.ts's import from utils/focusModes · restructure · low · `none` · S · [settings](../workstreams/settings.md#u0323) · STRUCT-86
- [ ] **U0216** Extract shared todo filter predicates and comparator for Kanban and List · dedup · low · `needs-decision` · L · [view-state](../workstreams/view-state.md#u0216) · DUP-71 · **question**
- [ ] **U0257** Extract shared list ordering and grouping helpers for the view-state hooks · dedup · low · `none` · S · [view-state](../workstreams/view-state.md#u0257) · DUP-72
- [ ] **U0731** Return a stable setOption from usePersistedViewOptions and drop per-key wrappers · dedup · low · `none` · S · [view-state](../workstreams/view-state.md#u0731) · DUP-130
- [ ] **U0695** Extract hasUnsavedChanges and selectionsFromMetadata helpers for note and overlay saves · dedup · low · `none` · S · [search](../workstreams/search.md#u0695) · DUP-119
- [ ] **U0727** Guard empty lists in useKeyboardNavigation and adopt it in CommandPalette · dedup · low · `bugfix` · S · [search](../workstreams/search.md#u0727) · DUP-85
- [ ] **U0121** Memoise the activity timeline and avoid deep-cloning logs for display · restructure · low · `none` · S · [activity-comments](../workstreams/activity-comments.md#u0121) · LOG-67
- [ ] **U0565** Use shared comment-mutation helpers in useSprints · dedup · low · `none` · S · [activity-comments](../workstreams/activity-comments.md#u0565) · DUP-78
- [ ] **U0803** Consolidate rich-text caret, block-conversion and toolbar helpers · dedup · low · `none` · M · [rich-text-html](../workstreams/rich-text-html.md#u0803) · DUP-99, STRUCT-108
- [ ] **U0687** Move modals and single-use pieces out of components/shared · restructure · low · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0687) · STRUCT-91 · moved from 7A
