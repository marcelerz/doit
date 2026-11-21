# Batch 11 — Low-priority fixes

64 units, 76 items: 0 high, 0 medium, 64 low. 16 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## Low priority

- [ ] **U0032** Explain persistent-storage denial and distinguish errors from unsupported · bugfix · low · `bugfix` · S · [storage-core](../workstreams/storage-core.md#u0032) · LOG-43
- [ ] **U0092** Compute available storage from the browser's own usage estimate · bugfix · low · `bugfix` · S · [storage-core](../workstreams/storage-core.md#u0092) · SUP-78
- [ ] **U0098** Add a UTF-8 byte-order mark to CSV exports · bugfix · low · `bugfix` · S · [import-export](../workstreams/import-export.md#u0098) · SUP-77
- [ ] **U0101** Fix the notes Markdown export's mislabelled 'Updated' line · bugfix · low · `bugfix` · S · [import-export](../workstreams/import-export.md#u0101) · DOC-66 · **question**
- [ ] **U0102** Convert note rich-text HTML in Markdown and JSON exports · bugfix · low · `needs-decision` · M · [import-export](../workstreams/import-export.md#u0102) · BUG-179, SEC-40 · **question**
- [ ] **U0106** Force the JSON parser for files with a .json extension · bugfix · low · `bugfix` · S · [import-export](../workstreams/import-export.md#u0106) · BUG-178
- [ ] **U0111** Resolve priority and entity alternatives when matching imported names · bugfix · low · `bugfix` · S · [import-export](../workstreams/import-export.md#u0111) · BUG-175
- [ ] **U0114** Carry source created and completed timestamps through import · bugfix · low · `bugfix` · M · [import-export](../workstreams/import-export.md#u0114) · BUG-177
- [ ] **U0813** Decide whether 315 MB of audio stays in the git repository · tests-tooling · low · `needs-decision` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0813) · IND-01 · **question**
- [ ] **U0333** Add a shared useToday hook so date boundaries roll over at midnight · bugfix · low · `bugfix` · S · [dates-time](../workstreams/dates-time.md#u0333) · BUG-210
- [ ] **U0534** Stop holiday shorthands jumping a year when typed on the day · bugfix · low · `bugfix` · S · [dates-time](../workstreams/dates-time.md#u0534) · BUG-185
- [ ] **U0536** Stop Q4, H1 and H2 rolling a year on their last day · bugfix · low · `bugfix` · S · [dates-time](../workstreams/dates-time.md#u0536) · BUG-191
- [ ] **U0545** Settle the dotted-date reading and its unreachable European branch · bugfix · low · `needs-decision` · S · [dates-time](../workstreams/dates-time.md#u0545) · BUG-187 · **question**
- [ ] **U0135** Judge an untouched recurring spawn by its data, not activity count · bugfix · low · `bugfix` · S · [recurrence](../workstreams/recurrence.md#u0135) · LOG-61
- [ ] **U0143** Decide how overdue recurring completions schedule the next instance · bugfix · low · `needs-decision` · S · [recurrence](../workstreams/recurrence.md#u0143) · BUG-166 · **question**
- [ ] **U0525** Skip empty person and priority names so detection cannot hang · bugfix · low · `bugfix` · S · [smart-input](../workstreams/smart-input.md#u0525) · BUG-186
- [ ] **U0528** Require context for short priority alternatives like 'med' · bugfix · low · `bugfix` · S · [smart-input](../workstreams/smart-input.md#u0528) · BUG-189
- [ ] **U0556** De-duplicate repeated mentions and tags in parsed metadata · bugfix · low · `bugfix` · S · [smart-input](../workstreams/smart-input.md#u0556) · BUG-188
- [ ] **U0237** Let bulk completion satisfy dependencies among the selected todos · bugfix · low · `bugfix` · M · [todos-core](../workstreams/todos-core.md#u0237) · BUG-201
- [ ] **U0425** Skip committing unchanged task context on blur · bugfix · low · `bugfix` · S · [todos-core](../workstreams/todos-core.md#u0425) · BUG-221
- [ ] **U0161** Move undo finalisation side effects out of the state updater · bugfix · low · `bugfix` · S · [undo-confirm](../workstreams/undo-confirm.md#u0161) · STRUCT-61
- [ ] **U0604** Exclude soft-deleted records from counts, reports and exports · bugfix · low · `bugfix` · M · [undo-confirm](../workstreams/undo-confirm.md#u0604) · BUG-163, INC-60
- [ ] **U0723** Close ConfirmDialog and report failure when an async onConfirm rejects · bugfix · low · `bugfix` · S · [undo-confirm](../workstreams/undo-confirm.md#u0723) · LOG-45
- [ ] **U0390** Stop name-field resync from stripping trailing spaces while typing · bugfix · low · `bugfix` · S · [entity-names](../workstreams/entity-names.md#u0390) · BUG-216
- [ ] **U0451** Clear the shared rename error when the entity overlay changes or closes · bugfix · low · `bugfix` · S · [entity-names](../workstreams/entity-names.md#u0451) · BUG-215
- [ ] **U0568** Remap every case variant of a renamed name in filters · bugfix · low · `bugfix` · S · [entity-names](../workstreams/entity-names.md#u0568) · BUG-172
- [ ] **U0492** Switch to Notes and open a note created from another view · bugfix · low · `bugfix` · S · [notes](../workstreams/notes.md#u0492) · BUG-200
- [ ] **U0571** Reset sortOrder when duplicating a note · bugfix · low · `bugfix` · S · [notes](../workstreams/notes.md#u0571) · INC-68 · **question**
- [ ] **U0596** HTML-escape note template labels when generating notes · bugfix · low · `bugfix` · S · [notes](../workstreams/notes.md#u0596) · BUG-196
- [ ] **U0698** Key NoteDetailView by note id and flush before duplicating · bugfix · low · `bugfix` · S · [notes](../workstreams/notes.md#u0698) · BUG-211
- [ ] **U0587** Treat empty rich-text review summaries as empty · bugfix · low · `bugfix` · S · [reviews](../workstreams/reviews.md#u0587) · BUG-212
- [ ] **U0717** Anchor half-year and fiscal-year review suggestions to day one · bugfix · low · `bugfix` · S · [reviews](../workstreams/reviews.md#u0717) · BUG-195
- [ ] **U0418** Validate sprint duration and colour inputs before saving · bugfix · low · `bugfix` · S · [sprints](../workstreams/sprints.md#u0418) · BUG-214
- [ ] **U0589** Fix sprint Planned End Date showing the day after the sprint · bugfix · low · `needs-decision` · S · [sprints](../workstreams/sprints.md#u0589) · BUG-165 · **question**
- [ ] **U0155** Move cards to In Progress only when a timer starts on active todos · bugfix · low · `needs-decision` · S · [kanban](../workstreams/kanban.md#u0155) · LOG-68, BUG-167 · **question**
- [ ] **U0298** Share a moveItem helper and fix KanbanTab's reorder on the sorted list · bugfix · low · `bugfix` · S · [kanban](../workstreams/kanban.md#u0298) · DUP-88
- [ ] **U0354** Clamp Gantt bar width for bars starting before the visible range · bugfix · low · `bugfix` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0354) · BUG-204
- [ ] **U0385** Stop drawing estimated blocks for completed tasks tracked on earlier days · bugfix · low · `needs-decision` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0385) · BUG-192 · **question**
- [ ] **U0493** Stop remounting Gantt when Focus mode closes · bugfix · low · `bugfix` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0493) · BUG-205
- [ ] **U0330** Align Calendar 'Created' sort direction with List and Kanban · bugfix · low · `needs-decision` · S · [calendar](../workstreams/calendar.md#u0330) · INC-63, BUG-207 · **question**
- [ ] **U0173** Align 'This week' windows across List, Statistics and Time Reports · bugfix · low · `needs-decision` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0173) · INC-73, BUG-208 · **question**
- [ ] **U0400** Move sounds, notifications and timers out of setState updaters · bugfix · low · `bugfix` · M · [stats-time-focus](../workstreams/stats-time-focus.md#u0400) · BUG-219
- [ ] **U0403** Decide whether Skip to Next on a last segment completes the task · bugfix · low · `needs-decision` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0403) · BUG-217 · **question**
- [ ] **U0408** Honour Show Keyboard Hints on Focus break and confirmation screens · bugfix · low · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0408) · UX-98
- [ ] **U0411** Keep the open timer working when its running mode is deleted · bugfix · low · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0411) · BUG-218
- [ ] **U0689** Show a running timer's elapsed time immediately on start · bugfix · low · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0689) · BUG-225
- [ ] **U0267** Exclude archived people and projects from auto-assign default pickers · bugfix · low · `needs-decision` · S · [settings](../workstreams/settings.md#u0267) · INC-80 · **question**
- [ ] **U0268** Sort a copy of priorities in AutoAssignTab instead of in place · bugfix · low · `bugfix` · S · [settings](../workstreams/settings.md#u0268) · DUP-90, BUG-222, UX-130
- [ ] **U0275** Wait for projects to load before deleting a category · bugfix · low · `bugfix` · S · [settings](../workstreams/settings.md#u0275) · BUG-230
- [ ] **U0458** Give new priorities a unique order and honour the entered order · bugfix · low · `bugfix` · S · [settings](../workstreams/settings.md#u0458) · BUG-203
- [ ] **U0205** Expose activeFilterCount from each view-state hook for filter badges · bugfix · low · `bugfix` · S · [view-state](../workstreams/view-state.md#u0205) · INC-64, BUG-227
- [ ] **U0252** Match list presets against the real completedExpanded default · bugfix · low · `bugfix` · S · [view-state](../workstreams/view-state.md#u0252) · STRUCT-60, BUG-170
- [ ] **U0254** Separate group sentinel keys from display labels and the custom preset · bugfix · low · `bugfix` · M · [view-state](../workstreams/view-state.md#u0254) · MSG-62, BUG-171
- [ ] **U0256** Apply one quick-filter scope rule across List, Notes and Calendar · bugfix · low · `needs-decision` · S · [view-state](../workstreams/view-state.md#u0256) · INC-72 · **question**
- [ ] **U0755** Keep every result kind in capped global search results · bugfix · low · `needs-decision` · S · [search](../workstreams/search.md#u0755) · BUG-194 · **question**
- [ ] **U0120** Make saving an unchanged comment a no-op · bugfix · low · `bugfix` · S · [activity-comments](../workstreams/activity-comments.md#u0120) · LOG-59
- [ ] **U0806** Keep following siblings in order when outdenting a list item · bugfix · low · `bugfix` · S · [rich-text-html](../workstreams/rich-text-html.md#u0806) · BUG-193
- [ ] **U0495** Give every view root and tab a derived test id · tests-tooling · low · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0495) · STRUCT-101
- [ ] **U0631** Replace e2e fixed sleeps with waiting assertions and drop local retries · tests-tooling · low · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0631) · SUP-88
- [ ] **U0636** Fail lint on warnings and lint the deploy scripts · tests-tooling · low · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0636) · SUP-86
- [ ] **U0639** Remove duplicated alias, ts-jest overrides and stale tooling config entries · tests-tooling · low · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0639) · STRUCT-111
- [ ] **U0647** Set GITHUB_PAGES inside build:gh-pages and clear stale out/ · bugfix · low · `bugfix` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0647) · STRUCT-62, SUP-90
- [ ] **U0651** Enforce unused locals and parameters once the tree is clean · tests-tooling · low · `needs-decision` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0651) · DEAD-87 · **question**
- [ ] **U0652** Stop tsconfig type-checking the stale build/ directory · tests-tooling · low · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0652) · SUP-89, DEAD-84
