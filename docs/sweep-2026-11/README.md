# Codebase sweep, November 2026 — backlog and roadmap

A read-only sweep of the whole codebase across twelve review items, consolidated into one backlog
and one phased roadmap. This folder is working material: it shrinks as batches land and is removed
with the last one. Batch 1 has landed; nothing else has been started.

**Constraint on every change made from this backlog:** business logic does not change unless a
feature is being fixed, completed or extended, and no existing feature is removed.

## What is in this folder

| Path | Content |
| --- | --- |
| `README.md` | This roadmap: batches, how a unit got its batch, how a batch is run, the rules |
| [`decisions.md`](decisions.md) | Every question that needs the owner's answer, by batch |
| `phases/` | One checklist per batch: one line per work unit |
| `workstreams/` | Every work unit with the full text of its items: where, problem, proposal, done-when |
| `dimensions/` | The twelve review lists: context, items from high to low, dependencies, open questions, dropped findings, coverage gaps |
| `security.local.md` | Untracked. Security findings are held back until they are fixed, because the repository is public |

## How it was produced

| Step | Agents | Result |
| --- | --- | --- |
| Find: one reviewer per slice of each review item, reading its files in full | 47 | raw findings per slice |
| Verify: adversarial check of each batch for the eight fact-heavy items | 34 | 1,413 findings survive; many corrected, 6 refuted |
| Synthesise: one backlog per review item | 12 | 1,234 items |
| Independent rerun of the whole request by one agent | 1 | a subset of the above, plus one new item |
| Consolidate: merge the same job reported under several review items | 21 | 727 work units in 38 workstreams |
| Adversarial review of the roadmap | 1 | one blocker and six fixes, all applied |

Final count: **729 work units, 1235 items** (259 high, 496 medium, 480 low).

Nothing was built or run. Every finding comes from reading the code as of commit `0596933`, so
every fix starts with a reproducer, and line numbers must be re-checked when a batch starts.

**Item** = one finding from one review list (`BUG-01`). **Work unit** = one job after merging the
items that describe it (`U0137`). The overlap is large: one unit holds 16 items from nine lists.

| Behaviour tag | Meaning | Units |
| --- | --- | --- |
| `none` | Pure cleanup, behaviour identical | 273 |
| `bugfix` | Behaviour changes only by correcting a defect | 268 |
| `feature-extension` | Completes or extends a feature | 53 |
| `needs-decision` | The owner has to choose before it is touched | 149 |

190 units carry a question for the owner (the `needs-decision` units plus those whose question came without the tag). None of them is started on a guess.

## The roadmap

Order follows three rules: protect data before anything else; fix before you refactor (about a
third of the duplication findings hide a bug in one copy, so the fix defines what the shared helper
must do); delete and consolidate before polishing.

| Batch | What | Units | Items | High / Med / Low | Questions | Status |
| --- | --- | --- | --- | --- | --- | --- |
| [1](phases/batch-01.md) | Guard rails: CI, test gaps, timezone pin, frozen visual baselines, dependency bump, logger, agent-facing docs | 28 | 38 | 9 / 16 / 3 | 1 | done |
| [2A](phases/batch-02a.md) | Data safety: storage load/save, backend switch, migrations | 17 | 70 | 8 / 7 / 2 | 4 | not started |
| [2B](phases/batch-02b.md) | Data safety: backup, restore, import, export, durations | 20 | 57 | 9 / 9 / 2 | 5 | not started |
| [2C](phases/batch-02c.md) | Data safety: two tabs open at once | 4 | 11 | 1 / 2 / 1 | 1 | not started |
| [3A](phases/batch-03a.md) | Critical fixes: dates, recurrence, smart input, todos, undo/confirm, names, activity | 44 | 99 | 42 / 1 / 1 | 13 | not started |
| [3B](phases/batch-03b.md) | Critical fixes: notes, reviews, sprints, Kanban, Gantt, stats/focus, notifications, settings | 42 | 104 | 39 / 3 / 0 | 18 | not started |
| [3C](phases/batch-03c.md) | Critical fixes: dialogs, Escape, key handlers, help digits | 18 | 75 | 14 / 4 / 0 | 8 | not started |
| [4](phases/batch-04.md) | Security hardening | 23 | 28 | 0 / 9 / 14 | 6 | not started |
| [5](phases/batch-05.md) | Dead-code removal | 44 | 50 | 0 / 5 / 39 | 7 | not started |
| [6A](phases/batch-06a.md) | Medium fixes: domain core | 34 | 62 | 0 / 32 / 2 | 12 | not started |
| [6B](phases/batch-06b.md) | Medium fixes: views | 33 | 54 | 0 / 33 / 0 | 8 | not started |
| [6C](phases/batch-06c.md) | Medium fixes: settings, view state, search, platform | 35 | 70 | 0 / 35 / 0 | 5 | not started |
| [7A](phases/batch-07a.md) | Consolidation: general hygiene (helpers, naming, layout) | 31 | 43 | 0 / 6 / 25 | 1 | not started |
| [7B](phases/batch-07b.md) | Consolidation: domain duplication and restructuring | 66 | 92 | 1 / 26 / 39 | 20 | not started |
| [8A](phases/batch-08a.md) | UI: overlays, keyboard and help, feedback states, app shell | 25 | 34 | 0 / 13 / 12 | 9 | not started |
| [8B](phases/batch-08b.md) | UI: accessibility and keyboard access | 30 | 40 | 4 / 19 / 7 | 5 | not started |
| [8C](phases/batch-08c.md) | UI: visual system and view usability | 49 | 61 | 0 / 21 / 28 | 20 | not started |
| [9](phases/batch-09.md) | Strings and logging | 45 | 55 | 0 / 17 / 28 | 8 | not started |
| [10](phases/batch-10.md) | Feature completion | 37 | 68 | 4 / 17 / 16 | 16 | not started |
| [11](phases/batch-11.md) | Low-priority fixes | 64 | 76 | 0 / 0 / 64 | 16 | not started |
| [12](phases/batch-12.md) | Documentation | 40 | 48 | 3 / 17 / 20 | 5 | not started |

Batch 1 added fourteen units, U0814 to U0827, which are in the counts of the tag table above but
not in the rows of this one. They are listed in [phases/batch-01.md](phases/batch-01.md#new-units)
with a proposed batch each; a batch picks up the ones proposed for it at its reconcile step.
U0814 was done right after the batch.

### How a unit got its batch

A rule over each unit's workstream, kind, priority and tag, then a dependency pass. The batches
were computed once; from here on this folder is edited by hand.

*Rule, first match wins.* "Fix" means kind bugfix or security, or any dedup, restructure, wording,
docs, logging or dead-code unit tagged `bugfix`.

1. Tests and tooling rated high or medium, the high agent-docs unit, the high platform-security unit → 1
2. Cross-tab units → 2C; storage and migration fixes rated high or medium → 2A; backup and import/export fixes rated high or medium → 2B
3. Any other high-rated fix or destructive-action safeguard → 3A, 3B or 3C by workstream family
4. Remaining security → 4; dead code → 5; medium fixes → 6A, 6B or 6C
5. Duplication and restructuring outside the UI → 7A or 7B
6. Accessibility → 8B; overlays, keyboard, feedback and shell → 8A; visual system and other usability → 8C
7. Wording and logging → 9; feature completion → 10; documentation → 12; everything left → 11

*Dependency pass.* The rule alone orders by user impact, which puts some prerequisites after the
work that needs them. Every "X before Y" statement in the twelve dependency notes was read as a
constraint: a prerequisite is pulled forward to its dependent's batch, and a dead-code deletion
that waits for something is pushed back to that thing's batch. No prerequisite now sits in a later
batch than its dependent. 43 units moved:

- **U0077** Add a scoped logger with a debug gate: batch 9 → 1, plan review.
- **U0613** Complete CLAUDE.md layer map and fix its factual errors: batch 12 → 1, plan review.
- **U0638** Run unit and e2e tests under non-UTC time zones: batch 11 → 1, plan review.
- **U0648** Document the pre-commit version bump and authoritative version source: batch 12 → 1, plan review.
- **U0741** Move shared test fixtures to a common folder and use them consistently: batch 11 → 1, plan review.
- **U0777** Route literal storage keys through the registry and scope LocalStorageAdapter.clear: batch 11 → 1, plan review.
- **U0074** Remove null-as-StorageAdapter casts from initializeStorage's result: batch 7B → 2A, plan review.
- **U0561** Default missing activity and comments arrays when loading notes and reviews: batch 11 → 2A, plan review.
- **U0016** Take an automatic safety backup before restore, import, migration and clear: batch 10 → 2B, plan review.
- **U0038** Make the recovery screen's download restorable and report unreadable keys: batch 3C → 2B, plan review.
- **U0055** Consolidate backup helpers in backup.ts and store lastBackupDate once: batch 7B → 2B, needed by U0038 (DUP-41 before DUP-51).
- **U0064** Stop migrateTodo writing nulls, raw strings and undeclared fields: batch 11 → 2B, waits for U0377 (INC-03 before INC-70).
- **U0082** (security unit): batch 7B → 2B, needed by U0058 (SEC-39 before SEC-12).
- **U0377** Make parseDuration sum compound units including days and weeks: batch 3A → 2B, plan review.
- **U0181** Create one activity module for building, appending and diffing entries: batch 7B → 3A, plan review.
- **U0319** Replace the mutable SettingsModel singleton with a new model per settings: batch 3B → 3A, plan review.
- **U0530** Use shared default constants instead of restated literals; pass date settings: batch 6C → 3A, needed by U0538 (INC-42 before INC-22).
- **U0593** Align the Sprint type with other entities' timestamp and activity types: batch 7B → 3A, needed by U0181 (STRUCT-73 before STRUCT-82).
- **U0047** Stop the dev-server service worker serving stale caches at root scope: batch 6C → 3B, plan review.
- **U0320** Consolidate work-hours schedule resolution into utils/workHours.ts: batch 7B → 3B, plan review.
- **U0546** Centralise work-hours schedule lookup and weekday-name arrays in dateUtils: batch 7B → 3B, plan review.
- **U0584** Replace regex HTML stripping with a shared htmlToPlainText: batch 6C → 3B, plan review.
- **U0262** Add Notes and Reviews view toggles, deriving GeneralTab toggles from the registry: batch 10 → 3C, plan review.
- **U0443** Render the Views help from the view registry, adding Notes, Reviews, Time: batch 8A → 3C, plan review.
- **U0462** Move the Add Todo, Person, Project, Sprint and preset dialogs onto Modal: batch 8B → 3C, plan review.
- **U0467** Make N, /, f, d and Escape shortcuts work consistently across views: batch 8A → 3C, plan review.
- **U0480** Confirm person, project and sprint deletes from their detail overlays: batch 3A → 3C, waits for U0226 (STRUCT-08 before STRUCT-11).
- **U0745** Pick text colour by WCAG contrast ratio in getTextColor: batch 8B → 3C, plan review.
- **U0801** Extract findLinkPatternMatches and a shared LinkChips component: batch 6C → 4, plan review.
- **U0811** (security unit): batch 11 → 4, needed by U0296 (SEC-30 before SEC-31).
- **U0130** Delegate priority name-or-alias lookups to findByNameOrAlternatives: batch 7A → 6A, needed by U0746 (DUP-73 before DUP-47).
- **U0141** Use branded id types in hook APIs and stored cross-references: batch 7A → 6A, needed by U0582 (STRUCT-44 before STRUCT-45).
- **U0414** Use matchesAnyName and one createEntityNote for people and projects: batch 7B → 6A, needed by U0746 (DUP-74 before DUP-47).
- **U0746** Resolve entity colours and lookups through one findByNameOrAlternatives resolver: batch 7B → 6A, needed by U0582 (STRUCT-50 before STRUCT-45).
- **U0285** Allow 0 for the Gantt Flow context-switch time: batch 6B → 6C, waits for U0283 (UX-53 before UX-54).
- **U0365** Extract statistics and time-report calculations into tested pure functions: batch 1 → 7B, waits for U0154 (SUP-60 before SUP-65).
- **U0687** Move modals and single-use pieces out of components/shared: batch 7A → 7B, waits for U0203 (STRUCT-38 before STRUCT-91).
- **U0158** Prefix generic hook return keys and drop unused settings returns: batch 7A → 8A, waits for U0211 (STRUCT-41 before STRUCT-77).
- **U0118** Hide activity links whose target task or note was deleted: batch 11 → 9, needed by U0484 (LOG-55 before LOG-64).
- **U0637** Enforce no-console as an ESLint error outside the logger: batch 11 → 9, plan review.
- **U0210** Remove or wire up props that components accept but never read: batch 5 → 10, waits for U0292 (PART-24 before PART-58).
- **U0321** Delete SettingsModel members with no production caller: batch 5 → 10, waits for U0292 (DEAD-12 before DEAD-15).
- **U0445** Add a Troubleshooting and Your Data section to the in-app help: batch 8A → 10, waits for U0053 (SUP-39 before SUP-44).

15 further constraints are ordering preferences, not prerequisites (the two units edit the same file or the same wording). They were left where the rule put them; whichever batch comes first takes them into account:

- DOC-45 (U0439, batch 8A) is preferred before DOC-53 (U0443, batch 3C).
- MSG-38 (U0502, batch 7B) is preferred before MSG-23 (U0429, batch 6A).
- MSG-36 (U0239, batch 9) is preferred before MSG-02 (U0480, batch 3C).
- MSG-36 (U0239, batch 9) is preferred before MSG-04 (U0703, batch 3B).
- MSG-36 (U0239, batch 9) is preferred before MSG-48 (U0585, batch 6A).
- MSG-36 (U0239, batch 9) is preferred before MSG-53 (U0316, batch 3A).
- MSG-36 (U0239, batch 9) is preferred before MSG-46 (U0226, batch 3C).
- MSG-54 (U0773, batch 9) is preferred before MSG-14 (U0042, batch 2B).
- MSG-54 (U0773, batch 9) is preferred before MSG-15 (U0107, batch 2B).
- DUP-24 (U0071, batch 2C) is preferred before DUP-01 (U0137, batch 2A).
- DUP-12 (U0547, batch 7B) is preferred before DUP-34 (U0172, batch 6A).
- STRUCT-52 (U0757, batch 7A) is preferred before STRUCT-82 (U0181, batch 3A).
- SUP-54 (U0332, batch 10) is preferred before SUP-56 (U0168, batch 6A).
- PART-08 (U0446, batch 3C) is preferred before PART-51 (U0713, batch 1).
- PART-54 (U0341, batch 8A) is preferred before PART-51 (U0713, batch 1).

## How a batch is run

Each batch is one request ("run sweep batch 2A") and one planning pass:

1. **Reconcile.** Re-read the batch's units against the current code. Drop what earlier batches
   already resolved, merge any duplicate that survived consolidation, refresh line numbers.
2. **Decide.** Put the batch's questions to the owner up front. A unit whose question is
   unanswered is deferred, never guessed.
3. **Plan.** Numbered commits under 1,000 changed lines; reproducer test first for every fix.
4. **Implement and gate.** Then tick the units in `phases/`, set the batch's status in the table
   above, delete workstream files that are fully done, and add one `CHANGELOG.md` entry.

Three gap reviews are scheduled, because reviewers reported areas nobody read. Each is read-only
and appends its findings to this backlog:

- **Start of 2B:** the loaders of stored data that no data-handling reviewer read (`useTemplates`,
  `useViewPresets`, `usePersistedViewOptions`, the history hooks, `useFocusSession`), the
  Todoist/Things/Reminders/CSV parsers in `import.ts`, and whether the settings-driven loops in
  `ganttScheduler.ts`, `GanttView.tsx` and `StatisticsView.tsx` always terminate.
- **Start of 6C:** the settings tabs and help sections no reviewer read in full.
- **Start of 8A:** the UI review saw the 16 baseline screenshots and the code, but nothing was
  rendered live. Capture each view at desktop, mobile and dark, and run an axe pass.

### Rules that hold in every batch

- Per commit: `npm run typecheck && npm run lint && npm run test` green, and `npm run test:coverage`
  when `src` or a threshold changes. Per batch: `npm run validate` with `PLAYWRIGHT_PORT` set, which
  passes since batch 1; add `npm run test:browsers` and `npm run test:pwa` when the batch touches the
  editors, storage or the service worker. A batch lands through a pull request, where CI runs.
- `bugfix`: write the reproducer, watch it fail, then fix. `none`: tests green before and after,
  and no expectation edited to make it pass.
- No feature is removed. Where a question offers "implement or remove" for a visible control, the
  default is implement.
- A batch that changes colour, type, spacing, icons or layout regenerates the affected visual
  baselines on purpose and reviews the before and after. The tolerance is 0.1%, which lets small
  changes through, and the update command leaves a passing baseline alone: delete the affected
  baselines and regenerate them, as `docs/e2e-testing.md` describes.
- A test pins behaviour that is right. Where it is a known defect, batch 1 left an `it.todo` or a
  `test.fixme` naming the unit; `grep -rn "(U0132)" src e2e` finds a unit's. The fix turns each
  into its reproducer, and a new test written beside a defect follows the same rule.
- The coverage floor in `jest.config.js` only goes up. Deleting tested dead code moves the
  percentages, so batch 5 re-measures and re-pins in the same commit.
- No `prettier`, no suppressed type errors, no debug logs.

### Sequencing inside batches

- **2A:** the failed-load save gate (`U0137`) lands before anything else that touches a load path;
  storage may only start propagating errors once that gate is in. Its question (how collections
  will be shared across tabs) is asked here, not in 2C. Backend detection (`U0084`) exposes the
  storage-switch bug in production, so `U0084` and `U0087` ship together.
- **3A:** `U0319` first, so settings-dependent date fixes are not tested through a stale model.
- **3C:** dialogs onto `Modal` with one z-index scale (`U0226`, `U0462`), then one Escape owner
  (`U0466`), then the key-handler guards (`U0337`, `U0463`). One details overlay (`U0212`) removes
  most of the key-handler hijacks.
- **5:** a unit is deleted only if it is tagged `none`, has no open question, and no still-open
  unit refers to its symbols (reconcile greps this folder for each symbol before deleting). Kept
  until their feature is decided: everything the partly-implemented-features list names, including
  the `SettingsModel` getters (`defaultRecurring`, `notificationCheckInterval`,
  `showBacklogInSprint`, `activeKanbanView`, auto-assign), `editTodoComment`/`deleteTodoComment`,
  `updateTemplate`, `getSuggestions`, `clearAllHistory`, `getRecurringSuggestions`,
  `focusSessionsInPeriod`, `TodoModel.dueDateISO`, `_selectAllInSection`/`_deselectAllInSection`,
  `CalendarView.onQuickAdd`, `EmptyState.actionLabel/onAction`, `NoteDetailView.autoFocusContent`,
  `KanbanView.onUpdateKanbanSettings`, `createSharedStore`. `U0583` is retitled first: `TodoModel`
  uses `SettingsModel` heavily and only the unused members go.
- **7:** helpers created by the fix batches (`htmlToPlainText`, `addMonthsClamped`, `isDone`, the
  duration parser and formatter, the token pipeline) are the targets; batch 7 adopts them and does
  not write competing ones.
- **9:** the strings module waits for the owner's answers on the UI noun (task/todo), the app name
  (DoIt/Doit) and locale. The `no-console` rule lands last.
- **12:** documentation of a behaviour lands after the batch that fixes that behaviour.

## Questions that gate the most work

The full list is in [`decisions.md`](decisions.md). These gate high-priority units:

1. Durations: is `1d` 8 hours, the configured work hours, or 24? Is `1w` five days? Are `1m`–`3m` minutes or months?
2. Two tabs: reload the other tab, or merge record by record?
3. Due dates: when does a date-only due date become overdue, and what time is "today"?
4. Auto-assign defaults: apply once at creation and drop the read-time fallbacks?
5. Sounds: cache on first play, or precache once? Keep 315 MB in git?
6. Backups: exempt manual and imported backups from pruning? Does the 10-backup / 2 MB cap override retention days?
7. An older build meeting newer data: block, or read-only?
8. The settings that do nothing (Notes ×3, Kanban default, Gantt weekends, default recurring, notification interval, sprint backlog): implement each? Default: yes.
9. One Escape owner and one task-details overlay for every view?
10. Confirm before deletes from detail overlays, sprint lifecycle actions and "Reset to Defaults"?
11. Work hours: what does "Disabled" mean, and is the per-day mode a saved setting?
12. Kanban: which of `state` and `workflowState` decides a card's column?
13. Renaming or deleting a priority: cascade into todos, markers, defaults, presets?
14. Do completed-then-archived todos count as done in statistics, sprint metrics and dependencies?
15. Tutorial on Stats and Time: hide the button, or write the two tutorials?
16. UI noun (task/todo), app name (DoIt/Doit), locale (browser or `en-US`).

## The twelve review lists

Counts are items (high / medium / low).

1. **[Dead-code removal](dimensions/01-dead-code.md)** — 87 (13/13/61). Dead code is renamed, not deleted: ESLint ignores a leading underscore, so unused functions, state and props hide behind it. About 70 model getters have no production caller, one 228-line component is orphaned, and about 30 util exports are used only by their own tests. All storage keys, all icons and every dependency are live. Seven settings controls write fields nothing reads; those are unfinished features, not dead code. *Lands mostly in:* phase 5 (44), phase 10 (12), phase 3 (10).
2. **[Documentation cleanup](dimensions/02-docs.md)** — 83 (13/41/29). Three layers have drifted: repo docs, code comments, and the help the app shows users. Docs derived from code hold; hand-copied inventories (counts, marker tables, shortcut digits, view lists) are wrong. Both agent definitions belong to another project. *Lands mostly in:* phase 12 (40), phase 3 (12), phase 2 (9).
3. **[Error, validation and other string messages](dimensions/03-messages.md)** — 87 (13/40/34). Almost every string is an inline literal; there is no constants module. `pluralize` exists but components hand-write plurals 23 times. Copies drift (three marker legends, two sets of activity templates) and some code branches on display text. *Lands mostly in:* phase 9 (26), phase 3 (18), phase 6 (13).
4. **[Duplication to consolidate](dimensions/04-duplication.md)** — 130 (23/47/60). The shared helper usually exists and call sites never moved onto it; about a third of the findings contain a real bug in one copy. Biggest: two date parsers, two todo-to-metadata serialisers, per-hook persistence, four mounts of the task details overlay. *Lands mostly in:* phase 7 (60), phase 3 (25), phase 8 (15).
5. **[Restructuring for consistency](dimensions/05-restructure.md)** — 114 (15/40/59). Consolidations that were started and not finished: the view registry, `Modal`, `createSharedStore`, `usePersistedViewOptions`. `TodoApp.tsx` is 2,359 lines with 34 `useState` and inline dialogs. *Lands mostly in:* phase 7 (46), phase 3 (15), phase 2 (12).
6. **[Logic and business-logic bugs](dimensions/06-bugs.md)** — 231 (70/92/69). Five seams: persistence (a failed load writes an empty list), the lossy `TodoModel.metadata` round trip (durations drift, false activity), read-time auto-assign fallbacks, date and duration parsing, and keyboard and Escape handling. *Lands mostly in:* phase 3 (89), phase 6 (66), phase 11 (43).
7. **[Missing, wrong or out-of-date logging](dimensions/07-logging.md)** — 69 (16/23/30). No logger; 87 console calls, 32 of them in `storage.ts`. The real problem is errors swallowed into default values that are then saved. The activity log writes false entries on most edits and none for todo comments or sprint changes. *Lands mostly in:* phase 9 (20), phase 2 (14), phase 3 (12).
8. **[UI design review for usability](dimensions/08-ux.md)** — 132 (24/71/37). Destructive actions with no safeguard, key handlers that swallow typing, rows and the completion checkbox unreachable by keyboard, chips at 1.2–2.5:1 contrast, five dialogs outside `Modal`. *Lands mostly in:* phase 8 (65), phase 3 (28), phase 6 (25).
9. **[Inconsistencies across the codebase](dimensions/09-inconsistencies.md)** — 91 (24/33/34). One root: a concept computed where it is used instead of once in the model. Overdue and today buckets four ways, "done" two ways, week start from five sources, priority colour from four. *Lands mostly in:* phase 3 (27), phase 6 (19), phase 2 (15).
10. **[Opportunities to improve support](dimensions/10-support.md)** — 93 (21/49/23). Read three ways. A user in trouble: failures become empty data, and the recovery download cannot be restored. Platforms: Android notifications, IME input, a 315 MB sound precache, Firefox startup. Maintainers: nothing checks pull requests, Playwright never runs in CI, and `npm run validate` fails. *Lands mostly in:* phase 2 (22), phase 1 (17), phase 10 (13).
11. **[Partly implemented features](dimensions/11-partial-features.md)** — 72 (19/32/21). "Built but not wired": the storage, hook and model half exists and the last connection is missing. Export and import do not round-trip; templates store metadata that is never applied; cross-tab sync reaches settings only. *Lands mostly in:* phase 3 (25), phase 10 (20), phase 6 (11).
12. **Security review** — 46 (8/15/23). Held back. The review found no exploitable script-execution path; its findings are hardening and input validation. Details are in the untracked local security file until they are fixed. *Lands mostly in:* phase 4 (23), phase 2 (10), phase 3 (6).

## Limits

- Consolidation merged duplicates inside each workstream family. A job reported under two families
  can still appear twice (one known case: `U0226` and `U0462`); each batch's reconcile step catches those.
- Documentation, messages, UI and support findings were spot-checked by their synthesiser, not
  independently verified like the other eight lists.
- Coverage gaps the reviewers reported are listed at the end of each file in `dimensions/`; the
  three gap reviews above cover the ones that matter for data safety, settings and the UI.
- The dependency pass read prose. It can have missed a constraint that was not written as
  "X before Y"; the dependency notes in `dimensions/` remain the reference when a batch is planned.
