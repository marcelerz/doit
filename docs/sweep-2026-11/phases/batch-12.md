# Batch 12 — Documentation

40 units, 48 items: 3 high, 17 medium, 20 low. 5 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [ ] **U0444** Fix backup and restore help to name the real buttons and steps · docs · high · `none` · S · [backup](../workstreams/backup.md#u0444) · DOC-10
- [ ] **U0668** Reconcile dependency help with cycle prevention and blocked indicator reality · docs · high · `needs-decision` · M · [todos-core](../workstreams/todos-core.md#u0668) · DOC-11 · **question**
- [ ] **U0614** Document generated entity ids versus name-holding reference fields consistently · docs · high · `none` · S · [entity-names](../workstreams/entity-names.md#u0614) · DOC-03

## Medium priority

- [ ] **U0083** Document saveToStorage and loadFromStorage return contracts on the functions · docs · medium · `none` · S · [storage-core](../workstreams/storage-core.md#u0083) · DOC-25
- [ ] **U0625** Correct storage-architecture.md's stale migration, interface, timeout and log claims · docs · medium · `none` · S · [storage-core](../workstreams/storage-core.md#u0625) · INC-57, DOC-22, LOG-53
- [ ] **U0626** Document migrations, backups, shared store, rename cascade and recovery UI · docs · medium · `none` · M · [storage-core](../workstreams/storage-core.md#u0626) · DOC-23
- [ ] **U0054** Rewrite stale backup.ts header and document backup size units · docs · medium · `none` · S · [backup](../workstreams/backup.md#u0054) · DOC-26
- [ ] **U0623** Move recurring docs into smart-input.md with the full grammar · docs · medium · `none` · S · [recurrence](../workstreams/recurrence.md#u0623) · DOC-41
- [ ] **U0325** Fix code comments that cite smart-input markers never parsed · docs · medium · `none` · S · [smart-input](../workstreams/smart-input.md#u0325) · DOC-33
- [ ] **U0437** Correct smart-input help on priority keywords and duration detection · docs · medium · `none` · S · [smart-input](../workstreams/smart-input.md#u0437) · DOC-47
- [ ] **U0608** Document duration detection in smart-input.md and README · docs · medium · `none` · S · [smart-input](../workstreams/smart-input.md#u0608) · DOC-40
- [ ] **U0618** Create docs/smart-input.md with pipeline order and dates section · docs · medium · `none` · M · [smart-input](../workstreams/smart-input.md#u0618) · DOC-38, DOC-39, DOC-58
- [ ] **U0624** Move source and priority docs into smart-input.md with real defaults · docs · medium · `none` · S · [smart-input](../workstreams/smart-input.md#u0624) · DOC-42
- [ ] **U0627** Rewrite TodoModel auto-assign docs to describe both default layers · docs · medium · `none` · S · [todos-core](../workstreams/todos-core.md#u0627) · DOC-37
- [ ] **U0165** Rewrite comments that still describe the removed EntityRegistry · docs · medium · `none` · S · [entity-names](../workstreams/entity-names.md#u0165) · DOC-30
- [ ] **U0442** Bring the Help Settings section in line with the current settings tabs · docs · medium · `none` · M · [settings](../workstreams/settings.md#u0442) · DOC-51
- [ ] **U0788** Resolve Priority.archived: build archiving or document hard delete · docs · medium · `needs-decision` · M · [settings](../workstreams/settings.md#u0788) · DOC-34 · **question**
- [ ] **U0436** Rewrite the filtering help from the real sort, filter and quick-filter lists · docs · medium · `none` · M · [view-state](../workstreams/view-state.md#u0436) · DOC-49
- [ ] **U0607** Correct copilot-instructions.md and shrink it to what CLAUDE.md lacks · docs · medium · `none` · M · [docs](../workstreams/docs.md#u0607) · DOC-43
- [ ] **U0617** Correct README feature list for views, Kanban defaults, Calendar, sounds · docs · medium · `none` · S · [docs](../workstreams/docs.md#u0617) · DOC-44

## Low priority

- [ ] **U0112** Rewrite convertToTodo's JSDoc to match how names are resolved · docs · low · `none` · S · [import-export](../workstreams/import-export.md#u0112) · DOC-70
- [ ] **U0541** Correct the JSDoc of the chrono 'sprint N' parser · docs · low · `none` · S · [dates-time](../workstreams/dates-time.md#u0541) · DOC-79
- [ ] **U0542** Update dateUtils header and comments; note the two getWeekNumber variants · docs · low · `none` · S · [dates-time](../workstreams/dates-time.md#u0542) · DOC-72
- [ ] **U0527** Resolve detectPriorities' undocumented p1/p2/p3 shorthand claim · docs · low · `needs-decision` · S · [smart-input](../workstreams/smart-input.md#u0527) · DOC-73 · **question**
- [ ] **U0621** Move person-mention docs into smart-input.md, citing the blacklist constant · docs · low · `none` · S · [smart-input](../workstreams/smart-input.md#u0621) · DOC-56
- [ ] **U0622** Move project-reference docs into smart-input.md with every context pattern · docs · low · `none` · S · [smart-input](../workstreams/smart-input.md#u0622) · DOC-57
- [ ] **U0628** Fix TodoModel and entity-model doc signatures and stubbed getter claims · docs · low · `none` · S · [todos-core](../workstreams/todos-core.md#u0628) · DOC-55
- [ ] **U0597** Correct renameReferences header about keeping old names as alternatives · docs · low · `none` · S · [entity-names](../workstreams/entity-names.md#u0597) · INC-91
- [ ] **U0260** Correct Kanban system-state comments that omit Rejected · docs · low · `none` · S · [kanban](../workstreams/kanban.md#u0260) · DOC-68
- [ ] **U0326** Reword ambient sound comments to say they store an id · docs · low · `none` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0326) · DOC-75
- [ ] **U0784** Correct the focusMode.ts comment about types importing utils · docs · low · `none` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0784) · DOC-76
- [ ] **U0123** Security unit, held back until fixed · docs · low · `none` · S · rich-text-html · SEC-41
- [ ] **U0057** Reattach or delete orphaned comments in hooks, models, storage, types, utils · docs · low · `none` · S · [docs](../workstreams/docs.md#u0057) · DOC-81, DOC-82, DEAD-81, STRUCT-89
- [ ] **U0131** Write header JSDoc for the large domain hooks · docs · low · `none` · M · [docs](../workstreams/docs.md#u0131) · DOC-80
- [ ] **U0160** Fix hook JSDoc examples to match real components and keys · docs · low · `none` · S · [docs](../workstreams/docs.md#u0160) · DOC-77
- [ ] **U0496** Replace refactor-history comments and commit numbers with current reasons · docs · low · `none` · S · [docs](../workstreams/docs.md#u0496) · DOC-83
- [ ] **U0616** Add README shortcut list, full docs index, focus-modes and import docs · docs · low · `none` · M · [docs](../workstreams/docs.md#u0616) · DOC-59
- [ ] **U0620** Move dated test reports to docs/reports and record their outcomes · docs · low · `none` · M · [docs](../workstreams/docs.md#u0620) · DOC-60, DEAD-86 · **question**
- [ ] **U0753** Remove stale 'Used by' lists from utility JSDoc · docs · low · `none` · S · [docs](../workstreams/docs.md#u0753) · DOC-71
- [ ] **U0170** Clarify the meaning of isActive across todo and entity models · docs · low · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0170) · INC-83 · **question**
