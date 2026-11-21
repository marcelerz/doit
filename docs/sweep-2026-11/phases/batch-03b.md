# Batch 3B — Critical fixes: notes, reviews, sprints, Kanban, Gantt, stats/focus, notifications, settings

42 units, 104 items: 39 high, 3 medium, 0 low. 18 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [ ] **U0003** Stop precaching 315 MB of ambient sounds on service-worker install · bugfix · high · `needs-decision` · M · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0003) · SUP-11, SEC-08 · **question**
- [ ] **U0409** Save note markers by mapping SmartInput's real token types to metadata · bugfix · high · `bugfix` · M · [notes](../workstreams/notes.md#u0409) · DEAD-03, DUP-05, STRUCT-02, MSG-03, BUG-18 · **question**
- [ ] **U0460** Hold the details overlay target as an id so convert opens it · bugfix · high · `bugfix` · S · [notes](../workstreams/notes.md#u0460) · DUP-18, BUG-103, UX-29, PART-39, STRUCT-24
- [ ] **U0653** Save action item edits through useDebouncedSave instead of a hand-rolled timer · bugfix · high · `bugfix` · S · [notes](../workstreams/notes.md#u0653) · DUP-08, BUG-106
- [ ] **U0654** Derive people, project, priority and date when converting action items · bugfix · high · `bugfix` · M · [notes](../workstreams/notes.md#u0654) · INC-13, PART-15, BUG-104
- [ ] **U0692** Merge title tokens into note metadata instead of replacing it · bugfix · high · `bugfix` · S · [notes](../workstreams/notes.md#u0692) · BUG-15, LOG-05
- [ ] **U0693** Stop NoteDetailView resync from discarding unsaved local edits · bugfix · high · `bugfix` · M · [notes](../workstreams/notes.md#u0693) · BUG-16
- [ ] **U0701** Fix notes reorder mode sort, direction, filtered renumbering and updatedAt · bugfix · high · `bugfix` · M · [notes](../workstreams/notes.md#u0701) · BUG-22 · **question**
- [ ] **U0703** Confirm notes bulk delete once and delete every selected note · bugfix · high · `bugfix` · S · [notes](../workstreams/notes.md#u0703) · MSG-04, DUP-17, BUG-13, UX-06, INC-07, PART-11
- [ ] **U0591** Edit review entry notes as rich text with debounced, single logging · bugfix · high · `needs-decision` · M · [reviews](../workstreams/reviews.md#u0591) · PART-40, BUG-118, UX-32, MSG-83, BUG-117, LOG-14 · **question**
- [ ] **U0709** Autosave ReviewEditView title and summary and flush on unmount · bugfix · high · `bugfix` · M · [reviews](../workstreams/reviews.md#u0709) · BUG-17
- [ ] **U0491** Security unit, held back until fixed · security · high · `bugfix` · M · sprints · SEC-07 · **question**
- [ ] **U0574** Clear todo sprint references when a sprint is deleted · bugfix · high · `bugfix` · M · [sprints](../workstreams/sprints.md#u0574) · BUG-90, INC-09 · **question**
- [ ] **U0683** Round the sprint Days percentage like the other metrics · bugfix · high · `bugfix` · S · [sprints](../workstreams/sprints.md#u0683) · MSG-13, DUP-36, BUG-223
- [ ] **U0219** Resolve Kanban card columns with one helper for placement and moves · bugfix · high · `needs-decision` · M · [kanban](../workstreams/kanban.md#u0219) · BUG-23, INC-16, DUP-16, PART-17, BUG-24, BUG-93 · **question**
- [ ] **U0378** Read numeric minutes and default task duration in Gantt and SprintProgress · bugfix · high · `bugfix` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0378) · DUP-10, BUG-135, BUG-224 · **question**
- [ ] **U0380** Honour disabled day schedules in the Gantt scheduler · bugfix · high · `bugfix` · M · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0380) · BUG-53
- [ ] **U0382** Unify Gantt day-map and day-scheduler capacity into one simulation · bugfix · high · `bugfix` · L · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0382) · BUG-52
- [ ] **U0384** Keep scheduling lower-ranked Gantt tasks past one oversized task · bugfix · high · `bugfix` · M · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0384) · BUG-51
- [ ] **U0386** Keep tracked and completed work when the Gantt day is exhausted · bugfix · high · `bugfix` · M · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0386) · BUG-50
- [ ] **U0145** Fix auto-extend on overtime to match its label in every completion path · bugfix · high · `needs-decision` · M · [stats-time-focus](../workstreams/stats-time-focus.md#u0145) · DOC-06, BUG-88, LOG-39, PART-43 · **question**
- [ ] **U0356** Exclude already-tracked segments when starting focus mode from Gantt · bugfix · high · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0356) · BUG-54
- [ ] **U0363** Count completed-then-archived todos as done in statistics and sprint metrics · bugfix · high · `needs-decision` · M · [stats-time-focus](../workstreams/stats-time-focus.md#u0363) · BUG-65, INC-52, BUG-64, PART-16 · **question**
- [ ] **U0372** Make Time Reports print the report, not only the header · bugfix · high · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0372) · DEAD-08, DUP-23, UX-16, BUG-66 · **question**
- [ ] **U0396** Complete Focus tasks against the live todo instead of toggling a snapshot · bugfix · high · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0396) · BUG-10
- [ ] **U0397** Make Focus Complete and Skip jump past all of a task's segments · bugfix · high · `bugfix` · M · [stats-time-focus](../workstreams/stats-time-focus.md#u0397) · BUG-09
- [ ] **U0412** Resume the paused mode, not the first mode, in the open timer · bugfix · high · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0412) · BUG-57
- [ ] **U0726** Stop Start on open-timer setup discarding the running session unlogged · bugfix · high · `needs-decision` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0726) · BUG-58 · **question**
- [ ] **U0748** Carry paused time so open-timer resume continues the countdown · bugfix · high · `bugfix` · M · [stats-time-focus](../workstreams/stats-time-focus.md#u0748) · BUG-56
- [ ] **U0738** Key notified-task history by due date and kind, not todo id · bugfix · high · `needs-decision` · M · [notifications](../workstreams/notifications.md#u0738) · BUG-70, PART-44 · **question**
- [ ] **U0743** Deliver notifications via service worker registration, with click-to-open and delivery tracking · bugfix · high · `feature-extension` · L · [notifications](../workstreams/notifications.md#u0743) · LOG-10, SUP-10, BUG-162, PART-45, SUP-75 · **question**
- [ ] **U0020** Clamp retention, archive and auto-delete days on every load path · bugfix · high · `bugfix` · S · [settings](../workstreams/settings.md#u0020) · SEC-05, BUG-180
- [ ] **U0269** Keep cleared auto-assign defaults cleared across reloads and tabs · bugfix · high · `bugfix` · S · [settings](../workstreams/settings.md#u0269) · BUG-28
- [ ] **U0306** Cascade priority renames and deletes into todos, defaults, filters and presets · bugfix · high · `needs-decision` · L · [settings](../workstreams/settings.md#u0306) · BUG-48, PART-48, INC-33 · **question**
- [ ] **U0309** Persist the work-hours schedule mode and stop hidden custom-day overrides · bugfix · high · `needs-decision` · M · [settings](../workstreams/settings.md#u0309) · MSG-12, PART-18, DEAD-05, DUP-22, BUG-49, UX-14 · **question**
- [ ] **U0311** Treat work-hours days marked Disabled as non-working in every resolver · bugfix · high · `needs-decision` · M · [settings](../workstreams/settings.md#u0311) · PART-19, STRUCT-15 · **question**
- [ ] **U0320** Consolidate work-hours schedule resolution into utils/workHours.ts · dedup · high · `none` · M · [settings](../workstreams/settings.md#u0320) · STRUCT-14 · moved from 7B
- [ ] **U0259** Show sprint names, not raw ids, in List's Group by Sprint · bugfix · high · `bugfix` · S · [view-state](../workstreams/view-state.md#u0259) · MSG-09, BUG-69, INC-18
- [ ] **U0804** Keep formatted text when markdown shortcuts convert a block · bugfix · high · `bugfix` · M · [rich-text-html](../workstreams/rich-text-html.md#u0804) · BUG-55

## Medium priority

- [ ] **U0047** Stop the dev-server service worker serving stale caches at root scope · bugfix · medium · `bugfix` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0047) · SUP-34, SEC-22, INC-71 · **question** · moved from 6C
- [ ] **U0546** Centralise work-hours schedule lookup and weekday-name arrays in dateUtils · dedup · medium · `none` · M · [dates-time](../workstreams/dates-time.md#u0546) · DUP-42 · moved from 7B
- [ ] **U0584** Replace regex HTML stripping with a shared htmlToPlainText · bugfix · medium · `bugfix` · M · [rich-text-html](../workstreams/rich-text-html.md#u0584) · DUP-35, BUG-123, SEC-24 · moved from 6C
