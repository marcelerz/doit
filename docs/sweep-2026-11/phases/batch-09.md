# Batch 9 — Strings and logging

45 units, 55 items: 0 high, 17 medium, 28 low. 8 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## Medium priority

- [ ] **U0686** Correct storage-full banner advice and backend-aware StorageTab warning wording · wording · medium · `none` · S · [storage-core](../workstreams/storage-core.md#u0686) · MSG-24
- [ ] **U0239** Derive undo-window wording from a constant and unify confirm dialogs · wording · medium · `none` · S · [undo-confirm](../workstreams/undo-confirm.md#u0239) · MSG-36
- [ ] **U0290** Derive Kanban system-state names in settings text from the data · wording · medium · `none` · S · [kanban](../workstreams/kanban.md#u0290) · MSG-27
- [ ] **U0315** Show friendly labels and a preview for focus mode end chimes · wording · medium · `none` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0315) · MSG-33, UX-129
- [ ] **U0302** Separate browser permission status from the task notifications setting · wording · medium · `none` · S · [notifications](../workstreams/notifications.md#u0302) · MSG-25
- [ ] **U0274** Correct settings help strings that contradict behaviour · wording · medium · `none` · S · [settings](../workstreams/settings.md#u0274) · MSG-28, UX-121, DOC-62
- [ ] **U0152** Log comment deletions on todos, people, projects and sprints · logging · medium · `feature-extension` · S · [activity-comments](../workstreams/activity-comments.md#u0152) · LOG-38
- [ ] **U0153** Log subtask and time-tracking changes in todo activity · logging · medium · `feature-extension` · M · [activity-comments](../workstreams/activity-comments.md#u0153) · LOG-36
- [ ] **U0156** Log the state change when a Kanban column completes, reopens or archives · logging · medium · `feature-extension` · S · [activity-comments](../workstreams/activity-comments.md#u0156) · LOG-32
- [ ] **U0563** Make entity and sprint edit activity entries specific and complete · logging · medium · `feature-extension` · M · [activity-comments](../workstreams/activity-comments.md#u0563) · MSG-59, LOG-57, INC-66, LOG-37 · **question**
- [ ] **U0696** Coalesce activity entries written by debounced autosaves · logging · medium · `needs-decision` · M · [activity-comments](../workstreams/activity-comments.md#u0696) · LOG-34 · **question**
- [ ] **U0295** Make link-pattern help text match the actual matcher · wording · medium · `none` · S · [rich-text-html](../workstreams/rich-text-html.md#u0295) · DOC-52, MSG-26
- [ ] **U0122** Replace internal identifiers and raw values in UI text with labels · wording · medium · `none` · M · [strings](../workstreams/strings.md#u0122) · MSG-32
- [ ] **U0586** Use one noun, task or todo, in all user-facing text · wording · medium · `none` · M · [strings](../workstreams/strings.md#u0586) · MSG-35 · **question**
- [ ] **U0066** Add debug summary logs for migrations, auto-deletion and backup pruning · logging · medium · `needs-decision` · S · [logging-diagnostics](../workstreams/logging-diagnostics.md#u0066) · LOG-26 · **question**
- [ ] **U0075** Strip duplicate log-and-rethrow wrappers from the storage adapters · logging · medium · `none` · S · [logging-diagnostics](../workstreams/logging-diagnostics.md#u0075) · DUP-83, LOG-24, MSG-77
- [ ] **U0090** Log the chosen storage backend, fallback reason and migration count · logging · medium · `none` · S · [logging-diagnostics](../workstreams/logging-diagnostics.md#u0090) · LOG-25

## Low priority

- [ ] **U0028** Name storage backends consistently and give one capacity figure · wording · low · `none` · S · [storage-core](../workstreams/storage-core.md#u0028) · MSG-66
- [ ] **U0031** Resolve dead per-key catches in storage usage and quota measurement · logging · low · `none` · S · [storage-core](../workstreams/storage-core.md#u0031) · LOG-51 · **question**
- [ ] **U0037** Update Safari private-mode text and list minimum browser versions · wording · low · `none` · S · [storage-core](../workstreams/storage-core.md#u0037) · SUP-79
- [ ] **U0039** Unify wipe-all wording and share the delete confirmation phrase · wording · low · `none` · S · [storage-core](../workstreams/storage-core.md#u0039) · MSG-67
- [ ] **U0025** Log FileReader errors in todo import and backup import · logging · low · `none` · S · [import-export](../workstreams/import-export.md#u0025) · LOG-50
- [ ] **U0094** Make export labels consistent across Markdown and CSV · wording · low · `needs-decision` · S · [import-export](../workstreams/import-export.md#u0094) · MSG-78 · **question**
- [ ] **U0115** Use display names for the import source in activity entries · wording · low · `bugfix` · S · [import-export](../workstreams/import-export.md#u0115) · MSG-58
- [ ] **U0050** Handle hourly update() rejections, applyUpdate no-ops and CLEAR_CACHE errors · logging · low · `bugfix` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0050) · LOG-40
- [ ] **U0595** Say when a rejected rename collides with an alternative name · wording · low · `bugfix` · S · [entity-names](../workstreams/entity-names.md#u0595) · MSG-61
- [ ] **U0402** Rename the two Focus skip actions to say what each does · wording · low · `none` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0402) · UX-97
- [ ] **U0760** Warn once on ambient-sound playback failures other than AbortError · logging · low · `none` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0760) · LOG-49
- [ ] **U0763** Handle and log AudioContext.resume() rejection in playSound · logging · low · `none` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0763) · LOG-48
- [ ] **U0764** Normalise OS notification copy and centralise Focus notification texts · wording · low · `none` · S · [notifications](../workstreams/notifications.md#u0764) · MSG-60
- [ ] **U0263** Unify settings tab labels, header titles and add-button wording via a registry · wording · low · `none` · M · [settings](../workstreams/settings.md#u0263) · MSG-71
- [ ] **U0118** Hide activity links whose target task or note was deleted · bugfix · low · `bugfix` · S · [activity-comments](../workstreams/activity-comments.md#u0118) · LOG-55 · moved from 11
- [ ] **U0484** Record provenance links for converted, duplicated and recurring todo creations · logging · low · `feature-extension` · M · [activity-comments](../workstreams/activity-comments.md#u0484) · LOG-64
- [ ] **U0174** Apply sentence case and consistent punctuation to generated labels · wording · low · `none` · S · [strings](../workstreams/strings.md#u0174) · MSG-75
- [ ] **U0175** Centralise model validation messages with UI status labels · wording · low · `none` · S · [strings](../workstreams/strings.md#u0175) · MSG-56
- [ ] **U0241** Use 'Unarchive' and 'Completed' consistently for the same states · wording · low · `none` · S · [strings](../workstreams/strings.md#u0241) · MSG-65
- [ ] **U0243** Rename the three different 'This Week' ranges to distinct labels · wording · low · `none` · S · [strings](../workstreams/strings.md#u0243) · MSG-64
- [ ] **U0303** Make vague settings and toolbar messages specific · wording · low · `none` · S · [strings](../workstreams/strings.md#u0303) · MSG-70
- [ ] **U0413** Apply one copy style for punctuation, case and shortcut notation · wording · low · `none` · M · [strings](../workstreams/strings.md#u0413) · MSG-76
- [ ] **U0751** Replace inline plural ternaries with pluralize and a countLabel helper · wording · low · `none` · M · [strings](../workstreams/strings.md#u0751) · DUP-77, MSG-55
- [ ] **U0773** Unify the app name spelling and description behind string constants · wording · low · `none` · S · [strings](../workstreams/strings.md#u0773) · MSG-54 · **question**
- [ ] **U0004** Correct log levels and misnamed catch messages in sw.js and storage · logging · low · `none` · S · [logging-diagnostics](../workstreams/logging-diagnostics.md#u0004) · LOG-46
- [ ] **U0091** Demote routine storage and service-worker lifecycle logs to debug · logging · low · `none` · S · [logging-diagnostics](../workstreams/logging-diagnostics.md#u0091) · LOG-47
- [ ] **U0637** Enforce no-console as an ESLint error outside the logger · tests-tooling · low · `none` · S · [logging-diagnostics](../workstreams/logging-diagnostics.md#u0637) · LOG-54 · moved from 11
- [ ] **U0782** Add a global error and unhandledrejection handler · logging · low · `needs-decision` · S · [logging-diagnostics](../workstreams/logging-diagnostics.md#u0782) · LOG-52 · **question**
