# Batch 10 — Feature completion

37 units, 68 items: 4 high, 17 medium, 16 low. 16 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [ ] **U0299** Apply the Notes settings for pin, archived visibility and sort order · feature · high · `needs-decision` · M · [notes](../workstreams/notes.md#u0299) · PART-20, DOC-13, DEAD-11, STRUCT-27 · **question**
- [ ] **U0292** Make Kanban 'Set as Default' choose the board's initial view · feature · high · `needs-decision` · M · [kanban](../workstreams/kanban.md#u0292) · DEAD-12, BUG-156, PART-24 · **question**
- [ ] **U0286** Implement or remove the Gantt Show Weekends setting · feature · high · `needs-decision` · M · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0286) · DEAD-10, PART-28, MSG-52 · **question**
- [ ] **U0270** Apply the auto-assign Default Recurring setting when creating todos · feature · high · `needs-decision` · S · [settings](../workstreams/settings.md#u0270) · DOC-12, UX-17, PART-27, DEAD-13, BUG-82 · **question**

## Medium priority

- [ ] **U0022** Track last off-device export and remind users to save a copy · feature · medium · `feature-extension` · M · [backup](../workstreams/backup.md#u0022) · SUP-59
- [ ] **U0005** Stop app launch stalling on the network for cached HTML · feature · medium · `feature-extension` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0005) · SUP-36
- [ ] **U0036** Add install guidance for Chromium and iOS Home Screen · feature · medium · `feature-extension` · M · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0036) · SUP-51
- [ ] **U0051** Precache build assets and settings so offline works after first visit · feature · medium · `feature-extension` · M · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0051) · SUP-35
- [ ] **U0272** Reconcile week-start settings across Calendar, Gantt and week numbers · feature · medium · `needs-decision` · M · [dates-time](../workstreams/dates-time.md#u0272) · SUP-55, INC-49 · **question**
- [ ] **U0332** Route all date and time labels through locale-aware shared formatters · feature · medium · `needs-decision` · L · [dates-time](../workstreams/dates-time.md#u0332) · SUP-54, INC-77, MSG-79 · **question**
- [ ] **U0129** Add template editing and make template deletion visible and confirmed · feature · medium · `needs-decision` · M · [todos-core](../workstreams/todos-core.md#u0129) · DEAD-58, PART-50 · **question**
- [ ] **U0238** Group bulk-action undo into one toast and cap visible toasts · feature · medium · `feature-extension` · M · [undo-confirm](../workstreams/undo-confirm.md#u0238) · UX-41
- [ ] **U0691** Focus new notes' content editor on open and wire Calendar quick-add · feature · medium · `needs-decision` · M · [notes](../workstreams/notes.md#u0691) · DEAD-23, STRUCT-26, PART-56, BUG-213, UX-110, DEAD-24, MSG-85, UX-109, PART-23 · **question**
- [ ] **U0592** Let users set review projects and tags · feature · medium · `feature-extension` · M · [reviews](../workstreams/reviews.md#u0592) · PART-41 · **question**
- [ ] **U0308** Define and implement the sprint Show backlog items setting · feature · medium · `needs-decision` · M · [sprints](../workstreams/sprints.md#u0308) · PART-29, DEAD-26 · **question**
- [ ] **U0321** Delete SettingsModel members with no production caller · dead-code · medium · `none` · M · [settings](../workstreams/settings.md#u0321) · DEAD-15 · moved from 5
- [ ] **U0147** Add a retention policy for activity logs · feature · medium · `needs-decision` · S · [activity-comments](../workstreams/activity-comments.md#u0147) · LOG-35 · **question**
- [ ] **U0151** Restore edit and delete for todo comments · feature · medium · `needs-decision` · M · [activity-comments](../workstreams/activity-comments.md#u0151) · INC-47, PART-21, DEAD-21 · **question**
- [ ] **U0445** Add a Troubleshooting and Your Data section to the in-app help · docs · medium · `feature-extension` · M · [keyboard-help](../workstreams/keyboard-help.md#u0445) · SUP-44 · moved from 8A
- [ ] **U0053** Add an About and Troubleshooting settings tab with copyable diagnostics · feature · medium · `feature-extension` · M · [logging-diagnostics](../workstreams/logging-diagnostics.md#u0053) · SUP-39
- [ ] **U0210** Remove or wire up props that components accept but never read · dead-code · medium · `needs-decision` · M · [code-hygiene](../workstreams/code-hygiene.md#u0210) · DEAD-18, PART-58, STRUCT-64 · **question** · moved from 5

## Low priority

- [ ] **U0685** Show the storage-full banner on every page with backup action · feature · low · `feature-extension` · S · [storage-core](../workstreams/storage-core.md#u0685) · SUP-72
- [ ] **U0109** Create unmatched people and projects on import, ignore responsible_uid · feature · low · `feature-extension` · S · [import-export](../workstreams/import-export.md#u0109) · PART-70, BUG-176
- [ ] **U0110** Add duplicate detection and undo for imports · feature · low · `feature-extension` · M · [import-export](../workstreams/import-export.md#u0110) · SUP-74, UX-125
- [ ] **U0001** Add maskable icon, dark theme colour, shortcuts and screenshots to manifest · feature · low · `feature-extension` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0001) · SUP-82
- [ ] **U0013** Show incoming version and what's new in the update toast · feature · low · `feature-extension` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0013) · SUP-73
- [ ] **U0472** Sort due-date, duration and recurrence pickers by recorded usage · feature · low · `feature-extension` · M · [smart-input](../workstreams/smart-input.md#u0472) · PART-69
- [ ] **U0246** Render long completed, archived and Done lists incrementally · feature · low · `feature-extension` · M · [todos-core](../workstreams/todos-core.md#u0246) · UX-107
- [ ] **U0490** Set project category on creation and show it in Projects · feature · low · `feature-extension` · S · [entity-names](../workstreams/entity-names.md#u0490) · PART-65
- [ ] **U0718** Add Show archived option and Other picker for half-years and years · feature · low · `feature-extension` · M · [reviews](../workstreams/reviews.md#u0718) · PART-59
- [ ] **U0222** Verify drag-and-drop on touch devices and add a fallback · feature · low · `feature-extension` · M · [kanban](../workstreams/kanban.md#u0222) · SUP-83
- [ ] **U0783** Decide on category-specific time blocks promised by Help · feature · low · `needs-decision` · L · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0783) · PART-66 · **question**
- [ ] **U0785** Show focus sessions in Time Reports and optionally link them to tasks · feature · low · `feature-extension` · M · [stats-time-focus](../workstreams/stats-time-focus.md#u0785) · PART-67 · **question**
- [ ] **U0324** Add an auto-assign master toggle or retire autoAssign.enabled · feature · low · `needs-decision` · S · [settings](../workstreams/settings.md#u0324) · PART-57, DEAD-77 · **question**
- [ ] **U0733** Finish search history: suggestions while typing, more views, and a clear action · feature · low · `feature-extension` · M · [search](../workstreams/search.md#u0733) · PART-62
- [ ] **U0708** Render the full review activity log with the shared Activity component · feature · low · `feature-extension` · S · [activity-comments](../workstreams/activity-comments.md#u0708) · LOG-65
- [ ] **U0188** Apply link patterns in the Notes list and review views · feature · low · `feature-extension` · S · [rich-text-html](../workstreams/rich-text-html.md#u0188) · PART-60
