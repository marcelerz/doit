# Batch 3A — Critical fixes: dates, recurrence, smart input, todos, undo/confirm, names, activity

44 units, 99 items: 42 high, 1 medium, 1 low. 13 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [ ] **U0166** Stop date-only due dates turning overdue at midnight of their day · bugfix · high · `needs-decision` · M · [dates-time](../workstreams/dates-time.md#u0166) · INC-21, BUG-30 · **question**
- [ ] **U0167** Define Today, This week and overdue buckets once on TodoModel · bugfix · high · `needs-decision` · M · [dates-time](../workstreams/dates-time.md#u0167) · INC-24 · **question**
- [ ] **U0328** Anchor month arithmetic on day one to stop period skipping · bugfix · high · `bugfix` · M · [dates-time](../workstreams/dates-time.md#u0328) · DUP-14, BUG-63
- [ ] **U0416** Parse date-only strings with parseLocalDate in burndown, reports and backup · bugfix · high · `bugfix` · S · [dates-time](../workstreams/dates-time.md#u0416) · DUP-13, INC-41, SUP-53
- [ ] **U0521** Keep weekday time ranges within one day instead of seven · bugfix · high · `bugfix` · S · [dates-time](../workstreams/dates-time.md#u0521) · BUG-40
- [ ] **U0531** Honour a Sunday work-week start in chrono week shorthands · bugfix · high · `bugfix` · S · [dates-time](../workstreams/dates-time.md#u0531) · STRUCT-12, BUG-145, INC-39
- [ ] **U0532** Fix 'nextweek' landing a week late except on the week start · bugfix · high · `bugfix` · S · [dates-time](../workstreams/dates-time.md#u0532) · BUG-39
- [ ] **U0535** Apply the fiscal-year-start setting to quarter, half and FY shorthands · bugfix · high · `needs-decision` · M · [dates-time](../workstreams/dates-time.md#u0535) · DOC-35, BUG-150, DEAD-06 · **question**
- [ ] **U0537** Resolve 'friday morning' and 'next friday eod' to the named weekday · bugfix · high · `bugfix` · M · [dates-time](../workstreams/dates-time.md#u0537) · BUG-34
- [ ] **U0538** Make 'today' resolve to one time across every parsing path · bugfix · high · `needs-decision` · S · [dates-time](../workstreams/dates-time.md#u0538) · DOC-36, INC-22, BUG-144 · **question**
- [ ] **U0540** Security unit, held back until fixed · security · high · `bugfix` · S · dates-time · SEC-02
- [ ] **U0548** Fall back to the custom chrono parser so Delay presets work · bugfix · high · `bugfix` · M · [dates-time](../workstreams/dates-time.md#u0548) · DUP-11, STRUCT-05, BUG-32 · **question**
- [ ] **U0142** Prevent duplicate next occurrences when re-completing a recurring task · bugfix · high · `bugfix` · S · [recurrence](../workstreams/recurrence.md#u0142) · BUG-19
- [ ] **U0522** Merge a time into 'every &lt;weekday> at 9am' recurrences · bugfix · high · `bugfix` · M · [recurrence](../workstreams/recurrence.md#u0522) · BUG-36
- [ ] **U0523** Keep recurring patterns parseable when the text includes a time range · bugfix · high · `bugfix` · M · [recurrence](../workstreams/recurrence.md#u0523) · BUG-35
- [ ] **U0553** Clamp month and year arithmetic for recurrences and relative dates · bugfix · high · `bugfix` · S · [recurrence](../workstreams/recurrence.md#u0553) · BUG-37
- [ ] **U0555** Use this month's nth-weekday occurrence when it is still ahead · bugfix · high · `bugfix` · S · [recurrence](../workstreams/recurrence.md#u0555) · BUG-38
- [ ] **U0504** Respect IME composition in SmartInput and RichTextEditor · bugfix · high · `bugfix` · M · [smart-input](../workstreams/smart-input.md#u0504) · SUP-12
- [ ] **U0505** Open SmartInput autocomplete only at word starts and insert at caret · bugfix · high · `bugfix` · M · [smart-input](../workstreams/smart-input.md#u0505) · UX-03, BUG-46, BUG-154
- [ ] **U0506** Keep typed case when SmartInput 'Add new' creates people, projects, priorities · bugfix · high · `bugfix` · S · [smart-input](../workstreams/smart-input.md#u0506) · MSG-06, DUP-21, BUG-47
- [ ] **U0517** Let dates and recurrences win over overlapping duration matches · bugfix · high · `bugfix` · M · [smart-input](../workstreams/smart-input.md#u0517) · DOC-05, BUG-33
- [ ] **U0164** Apply auto-assign defaults once and remove read-time fallbacks · bugfix · high · `needs-decision` · M · [todos-core](../workstreams/todos-core.md#u0164) · BUG-81, BUG-29, INC-20 · **question**
- [ ] **U0171** Treat completed-then-archived dependencies as satisfied · bugfix · high · `bugfix` · S · [todos-core](../workstreams/todos-core.md#u0171) · INC-14, BUG-20 · **question**
- [ ] **U0236** Make List 'Select all' select only the visible rows · bugfix · high · `bugfix` · S · [todos-core](../workstreams/todos-core.md#u0236) · BUG-12, UX-07, INC-17, PART-05
- [ ] **U0240** Keep completed todos visible until archived, and fix the auto-delete tooltip · bugfix · high · `needs-decision` · M · [todos-core](../workstreams/todos-core.md#u0240) · DOC-14, BUG-68, UX-34 · **question**
- [ ] **U0389** Require an explicit choice before Batch Edit clears a field on all tasks · bugfix · high · `bugfix` · S · [todos-core](../workstreams/todos-core.md#u0389) · UX-08
- [ ] **U0398** Apply toggle, archive and delete against current todos to keep time entries · bugfix · high · `bugfix` · M · [todos-core](../workstreams/todos-core.md#u0398) · BUG-08
- [ ] **U0427** Apply a newly added priority to the task it was added from · bugfix · high · `bugfix` · S · [todos-core](../workstreams/todos-core.md#u0427) · BUG-27
- [ ] **U0459** Apply a template's stored metadata and subtasks when submitting · bugfix · high · `feature-extension` · M · [todos-core](../workstreams/todos-core.md#u0459) · PART-14, BUG-67 · **question**
- [ ] **U0721** Compute drag-reorder positions from the manual order in one shared hook · bugfix · high · `bugfix` · M · [todos-core](../workstreams/todos-core.md#u0721) · INC-35, DUP-15, BUG-21 · **question**
- [ ] **U0132** Fix undo-delete duplicate ids via a shared soft-delete lifecycle · bugfix · high · `bugfix` · M · [undo-confirm](../workstreams/undo-confirm.md#u0132) · DUP-04, BUG-04, LOG-04
- [ ] **U0247** Render todo undo toasts and dependency notice once in TodoApp · bugfix · high · `bugfix` · M · [undo-confirm](../workstreams/undo-confirm.md#u0247) · UX-15, INC-06, PART-06, MSG-07, LOG-11
- [ ] **U0307** Confirm deletes in settings lists, showing what each affects · ux · high · `bugfix` · M · [undo-confirm](../workstreams/undo-confirm.md#u0307) · UX-12
- [ ] **U0316** Confirm before Reset to Defaults wipes a settings section · ux · high · `needs-decision` · S · [undo-confirm](../workstreams/undo-confirm.md#u0316) · UX-11, MSG-53 · **question**
- [ ] **U0415** Confirm sprint lifecycle actions and unassign todos when a sprint is deleted · bugfix · high · `bugfix` · M · [undo-confirm](../workstreams/undo-confirm.md#u0415) · UX-10, PART-04
- [ ] **U0454** Reject empty person and project names and guard renames from empty · bugfix · high · `bugfix` · M · [entity-names](../workstreams/entity-names.md#u0454) · BUG-14, INC-02
- [ ] **U0456** Validate name uniqueness on every person and project create path · bugfix · high · `needs-decision` · M · [entity-names](../workstreams/entity-names.md#u0456) · UX-95, BUG-112, INC-12, BUG-113 · **question**
- [ ] **U0319** Replace the mutable SettingsModel singleton with a new model per settings · bugfix · high · `bugfix` · M · [settings](../workstreams/settings.md#u0319) · STRUCT-20, DEAD-09, BUG-83, DOC-32 · moved from 3B
- [ ] **U0116** Diff typed todo values in editTodo to stop false activity entries · bugfix · high · `bugfix` · M · [activity-comments](../workstreams/activity-comments.md#u0116) · MSG-01, DUP-07, BUG-06, LOG-12, INC-19
- [ ] **U0117** Replace raw JSON metadata fallback in Activity with per-shape renderers · bugfix · high · `feature-extension` · M · [activity-comments](../workstreams/activity-comments.md#u0117) · MSG-08, LOG-13, PART-49
- [ ] **U0181** Create one activity module for building, appending and diffing entries · dedup · high · `needs-decision` · M · [activity-comments](../workstreams/activity-comments.md#u0181) · DUP-39, STRUCT-82, LOG-16, DUP-49 · **question** · moved from 7B
- [ ] **U0184** Use correct marker symbols and task titles in todo activity text · bugfix · high · `bugfix` · M · [activity-comments](../workstreams/activity-comments.md#u0184) · MSG-05, LOG-31, INC-67, LOG-56

## Medium priority

- [ ] **U0530** Use shared default constants instead of restated literals; pass date settings · bugfix · medium · `bugfix` · M · [settings](../workstreams/settings.md#u0530) · INC-42 · moved from 6C

## Low priority

- [ ] **U0593** Align the Sprint type with other entities' timestamp and activity types · restructure · low · `none` · S · [sprints](../workstreams/sprints.md#u0593) · STRUCT-73 · moved from 7B
