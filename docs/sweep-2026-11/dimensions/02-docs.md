# 2. Documentation cleanup

83 items: 13 high, 41 medium, 29 low. These findings were spot-checked by the synthesiser, not independently verified. Every item links to its full text; the unit and batch after each title say where the work is scheduled.

## Context

Doit has three documentation layers, and all three have drifted. (1) Repo docs: README.md (344 lines), CLAUDE.md (161), CHANGELOG.md (57), .github/copilot-instructions.md (699), two .claude/agents files (523) and 15 files in docs/ (about 3,100 lines). Seven of the docs/ files are smart-input references, two are model guides, two are infrastructure guides (storage-architecture, e2e-testing) and two are dated reports. (2) Code comments and JSDoc in src/. (3) User-facing documentation inside the app: 13 Help sections under src/components/overlays/help/, the tutorial step arrays in TutorialOverlay.tsx and in each view, tooltipContent in shared/InfoTooltip.tsx, MarkerReference, and the tooltips, descriptions and NoticeBoxes in every settings tab. In all three layers, a doc stays right when it is derived from code and goes wrong when it is hand-copied.

The recurring failure is hand-copied inventories: counts ('69 tests', '28 keys', '36 files'), marker tables (5-6 copies), digit shortcuts, view lists, settings-tab lists, default priorities and Kanban states, and 'Used by' caller lists. Wherever the code feeds the doc, it holds: viewRegistry.ts drives useViewShortcuts in help/shortcuts.ts, which drives the Views range and the Keyboard section. Wherever someone typed a list, it has drifted: the Getting Started, Quick Start, Workflows and tutorial digits are all wrong for default settings. Three other patterns repeat. Docs and comments are written as change notes ('now automatically…', 'used to…', 'Commit 72', 'Migration Notes'), which date immediately. Comments describe designs that were never built or have since been removed: Priority.archived, circular-dependency prevention, sharedStore's cross-tab safety for all data, the newer-data 'refusal', fiscal-aware shorthands, the EntityRegistry removed in b823476, and the removed ^ * ~ markers. And several settings are documented and offered in the UI but have no consumer.

Problems concentrate in five places. The smart-input docs: seven files plus copilot lines 478-607, plus InputSection, MarkerReference and the tooltips, which disagree with each other and with SmartInput.renderTokensFromText on precedence, durations, priorities and recurring grammar. The Help overlay and tutorials. copilot-instructions.md. The storage docs and comments (storage-architecture.md, backup.ts, migrations.ts, sharedStore.ts). The TodoModel/useTodos comments. Several doc errors are symptoms of real bugs that I verified in code: parseDuration stores '2d' as 2 minutes; 'in 2 weeks' is swallowed by duration detection; the tutorial button crashes Stats and Time; auto-extend-on-overtime overwrites estimates; the newer-data guard does not stop migrations or saves; and the Default Recurring, notes-default, sprint-backlog, gantt-weekends and kanban-empty-columns settings do nothing. These appear here as cross-dimension items so they are not lost, but each must be deduplicated against the Logic-bugs and Partly-implemented backlogs. The doc text for those areas must describe the fixed behaviour, never the bug as if it were intended.

In good shape and best left alone: viewRegistry.ts and help/shortcuts.ts (the model to copy); the CHANGELOG entry (keep its text and update only the link if the RTE report moves); the 'why' comments in storage.ts migrateToIndexedDB and the failed-migration branch of initializeStorage; the canDelete comments in PersonModel and ProjectModel; sharedStore's persist and flush comments; the closeAddOverlay docblock (its handlers are the bug); the small hooks' JSDoc (useDebouncedSave, useClickOutside); the closed RTE defects report as a record; and README's storage-init warning, apart from the literal key.

What an implementer must know first. Business logic may change only where a feature is fixed, completed or extended. No setting or feature may be removed, so for an inert setting the doc options are 'wire it up' or 'label it not yet implemented', never deletion. Fix or decide the underlying behaviour before rewriting the doc that describes it. Every commit runs scripts/pre-commit, which bumps version.json, and CHANGELOG headings use version.json, not package.json (0.1.0). Never run prettier on these files: there is no prettier config, and it would reformat them against the repo's real style. The visual tolerance is now 0.1-0.2%, not the 1-2% that CLAUDE.md claims. Text changes on screens covered by e2e/visual.spec.ts (list, kanban, gantt, calendar, people, projects, details, smart input) need deliberate baseline updates. No unit or e2e test asserts Help text, so the help packages should add derivation tests (digits from getEnabledViews, tutorial selectors against data-tutorial attributes, a description for every registry view) rather than rely on existing suites. The .claude/agents files describe another project and are marked 'use PROACTIVELY', so rewrite them before any agent-assisted work in any dimension.

## Items, high to low

- [DOC-01](../workstreams/docs.md#doc-01) · high · `none` · S — Rewrite both .claude/agents definitions, which were copied from another project (RetroStack) · U0605, batch 1
- [DOC-02](../workstreams/tests-ci-tooling.md#doc-02) · high · `none` · S — Visual-diff tolerance documented as 1-2%; the config enforces 0.1-0.2% · U0615, batch 1
- [DOC-03](../workstreams/entity-names.md#doc-03) · high · `none` · S — The rule that person/project ids are uuids while references hold names is documented wrongly or not at all · U0614, batch 12
- [DOC-04](../workstreams/durations.md#doc-04) · high · `bugfix` · M — [Bug, cross-dimension] parseDuration stores '2d', '1w', '1h30m' and '1d2h' as a few minutes · U0377, batch 2B
- [DOC-05](../workstreams/smart-input.md#doc-05) · high · `bugfix` · S — [Bug, cross-dimension] 'in 2 weeks', '5 days from now' and '2 weeks ago' become durations instead of due dates · U0517, batch 3A
- [DOC-06](../workstreams/stats-time-focus.md#doc-06) · high · `bugfix` · S — [Bug, cross-dimension] 'Auto-extend on overtime' overwrites the estimate even when there is no overtime · U0145, batch 3B
- [DOC-07](../workstreams/migrations-versioning.md#doc-07) · high · `needs-decision` · M — The newer-data guard is documented as protecting data but only skips the version write; the migration model is undocumented · U0067, batch 2A
- [DOC-08](../workstreams/keyboard-help.md#doc-08) · high · `bugfix` · S — [Bug, cross-dimension] 'Learn about this view' crashes the app on the Stats and Time tabs · U0446, batch 3C
- [DOC-09](../workstreams/keyboard-help.md#doc-09) · high · `bugfix` · M — Help and tutorial hard-code digit shortcuts that no longer match the tab order · U0433, batch 3C
- [DOC-10](../workstreams/backup.md#doc-10) · high · `none` · S — Backup and restore help names the wrong buttons and leaves out the restore step · U0444, batch 12
- [DOC-11](../workstreams/todos-core.md#doc-11) · high · `needs-decision` · M — Dependency help promises cycle prevention and a blocked indicator, neither of which exists · U0668, batch 12
- [DOC-12](../workstreams/settings.md#doc-12) · high · `feature-extension` · S — [Partly implemented] The 'Default Recurring' auto-assign setting is saved but never applied · U0270, batch 10
- [DOC-13](../workstreams/notes.md#doc-13) · high · `needs-decision` · L — [Partly implemented] Six more settings do nothing: three Notes defaults, sprint backlog, Gantt weekends, Kanban empty columns · U0299, batch 10
- [DOC-14](../workstreams/todos-core.md#doc-14) · medium · `bugfix` · S — [Bug, cross-dimension] Completed tasks past the archive threshold vanish until reload, and the auto-delete tooltip contradicts the code · U0240, batch 3A
- [DOC-15](../workstreams/overlays-dialogs.md#doc-15) · medium · `bugfix` · S — [Bug, cross-dimension] The add-todo backdrop and X button skip closeAddOverlay, so cancelled text comes back · U0461, batch 3C
- [DOC-16](../workstreams/keyboard-help.md#doc-16) · medium · `bugfix` · S — [Bug, cross-dimension] Gantt's keyboard handler stays active under the focus views, and T triggers two actions · U0337, batch 3C
- [DOC-17](../workstreams/cross-tab.md#doc-17) · medium · `bugfix` · S — [Bug, cross-dimension] Cross-tab settings sync never reaches a tab that has not saved settings itself · U0072, batch 2C
- [DOC-18](../workstreams/storage-core.md#doc-18) · medium · `bugfix` · S — [Bug, cross-dimension] The settings mirror for the theme script is wiped on most loads, causing a theme flash · U0776, batch 2A
- [DOC-19](../workstreams/storage-core.md#doc-19) · medium · `bugfix` · S — [Bug, cross-dimension] getStorageType compares constructor.name, which production minification can rename · U0084, batch 2A
- [DOC-20](../workstreams/notifications.md#doc-20) · medium · `bugfix` · S — [Bug, cross-dimension] The 'Check for due tasks every' setting is ignored; the hook polls every minute · U0737, batch 6B
- [DOC-21](../workstreams/keyboard-help.md#doc-21) · medium · `bugfix` · S — Tutorial spotlight selectors point at elements that do not exist · U0340, batch 6C
- [DOC-22](../workstreams/storage-core.md#doc-22) · medium · `none` · S — storage-architecture.md contradicts storage.ts on migration, timeouts and APIs · U0625, batch 12
- [DOC-23](../workstreams/storage-core.md#doc-23) · medium · `none` · M — The data-safety subsystems have no documentation: version migrations, backups, cross-tab store, rename cascade, recovery UI · U0626, batch 12
- [DOC-24](../workstreams/cross-tab.md#doc-24) · medium · `none` · S — The sharedStore header overstates cross-tab protection, but only settings use the store · U0071, batch 2C
- [DOC-25](../workstreams/storage-core.md#doc-25) · medium · `none` · S — saveToStorage's return contract is documented under onStorageWriteError · U0083, batch 12
- [DOC-26](../workstreams/backup.md#doc-26) · medium · `none` · S — backup.ts docs are stale: the module header, bytes vs characters, and two lastBackupDate copies · U0054, batch 12
- [DOC-27](../workstreams/docs.md#doc-27) · medium · `none` · S — CLAUDE.md's layer map is incomplete and has small factual errors · U0613, batch 1
- [DOC-28](../workstreams/migrations-versioning.md#doc-28) · medium · `none` · S — The pre-commit version bump and the two version numbers are undocumented · U0648, batch 1
- [DOC-29](../workstreams/tests-ci-tooling.md#doc-29) · medium · `none` · S — e2e-testing.md has a stale file list and counts, wrong CI settings and a broken recipe for new tests · U0619, batch 1
- [DOC-30](../workstreams/entity-names.md#doc-30) · medium · `none` · S — Comments still describe the EntityRegistry that commit b823476 removed · U0165, batch 12
- [DOC-31](../workstreams/view-state.md#doc-31) · medium · `none` · S — usePersistedViewOptions does not document that its defaults are read only once · U0729, batch 6C
- [DOC-32](../workstreams/settings.md#doc-32) · medium · `none` · S — The SettingsModel singleton is updated in place, which is undocumented, so memoised model lists can go stale · U0319, batch 3A
- [DOC-33](../workstreams/smart-input.md#doc-33) · medium · `none` · S — Comments cite markers SmartInput never parses (^, *, ~, '%monthly') · U0325, batch 12
- [DOC-34](../workstreams/settings.md#doc-34) · medium · `needs-decision` · M — Priority.archived claims priorities are archived, but they are hard-deleted and silently cleared from todos · U0788, batch 12
- [DOC-35](../workstreams/dates-time.md#doc-35) · medium · `needs-decision` · M — The fiscal Q/H/FY shorthands ignore fiscalYearStart, though the setting and comments say they use it · U0535, batch 3A
- [DOC-36](../workstreams/dates-time.md#doc-36) · medium · `needs-decision` · S — 'today' resolves to two different times, and both are documented as end of day · U0538, batch 3A
- [DOC-37](../workstreams/todos-core.md#doc-37) · medium · `none` · S — The auto-assign docs describe a design the code does not follow · U0627, batch 12
- [DOC-38](../workstreams/smart-input.md#doc-38) · medium · `none` · M — Seven smart-input docs and a copilot section duplicate each other and have drifted: consolidate into docs/smart-input.md · U0618, batch 12
- [DOC-39](../workstreams/smart-input.md#doc-39) · medium · `none` · S — auto-date-detection.md misfiles the 'startofthe…' aliases and omits many keywords that set a date · U0618, batch 12
- [DOC-40](../workstreams/smart-input.md#doc-40) · medium · `none` · S — Duration detection is undocumented, and copilot says it does not exist · U0608, batch 12
- [DOC-41](../workstreams/recurrence.md#doc-41) · medium · `none` · S — The recurring docs cover only 'every …' patterns and get the processing order wrong · U0623, batch 12
- [DOC-42](../workstreams/smart-input.md#doc-42) · medium · `none` · S — The priority docs list the wrong default alternatives and a wrong 'no context required' rule · U0624, batch 12
- [DOC-43](../workstreams/docs.md#doc-43) · medium · `none` · M — copilot-instructions.md: many claims are out of date or never matched the code · U0607, batch 12
- [DOC-44](../workstreams/docs.md#doc-44) · medium · `none` · S — The README feature list misstates the views, Kanban defaults, Calendar modes and where sounds live · U0617, batch 12
- [DOC-45](../workstreams/keyboard-help.md#doc-45) · medium · `none` · M — The keyboard reference is incomplete and overstates where shortcuts work; render it from one shortcut registry · U0439, batch 8A
- [DOC-46](../workstreams/keyboard-help.md#doc-46) · medium · `none` · S — Onboarding text describes an always-visible input and a '+ Add' button that no longer exist · U0431, batch 6C
- [DOC-47](../workstreams/smart-input.md#doc-47) · medium · `none` · S — Smart-input help misstates how priorities and durations are detected · U0437, batch 12
- [DOC-48](../workstreams/smart-input.md#doc-48) · medium · `none` · M — In-app reference lists (markers, date shorthands, recurring examples) are written out in several places and have drifted · U0441, batch 7B
- [DOC-49](../workstreams/view-state.md#doc-49) · medium · `none` · M — Search, sort, filter and preset help does not match the list view · U0436, batch 12
- [DOC-50](../workstreams/keyboard-help.md#doc-50) · medium · `none` · S — Gantt help and tutorial describe controls that do not exist · U0431, batch 6C
- [DOC-51](../workstreams/settings.md#doc-51) · medium · `none` · M — The Help Settings section is out of date and misses five tabs · U0442, batch 12
- [DOC-52](../workstreams/rich-text-html.md#doc-52) · medium · `none` · S — Link-pattern docs contradict the matcher (JIRA-123, $1/$2, T-123) · U0295, batch 9
- [DOC-53](../workstreams/keyboard-help.md#doc-53) · medium · `none` · M — Notes, Reviews, Time Reports and the command palette have no in-app documentation · U0443, batch 3C
- [DOC-54](../workstreams/settings.md#doc-54) · medium · `feature-extension` · S — Feature toggles cannot turn off Notes or Reviews, and the toggle descriptions understate their effect · U0262, batch 3C
- [DOC-55](../workstreams/todos-core.md#doc-55) · low · `none` · S — TodoModel and entity-model docs give wrong signatures and describe a stubbed getter as working · U0628, batch 12
- [DOC-56](../workstreams/smart-input.md#doc-56) · low · `none` · S — Person-mention doc copies the blacklist and reads as a change note · U0621, batch 12
- [DOC-57](../workstreams/smart-input.md#doc-57) · low · `none` · S — Project-reference doc omits context patterns and wrongly says only one project is detected · U0622, batch 12
- [DOC-58](../workstreams/smart-input.md#doc-58) · low · `none` · S — due-date-feature.md lists shorthands that only date fields accept · U0618, batch 12
- [DOC-59](../workstreams/docs.md#doc-59) · low · `none` · M — Most user-facing features have no repo docs; README has no shortcut list and an incomplete docs index · U0616, batch 12
- [DOC-60](../workstreams/docs.md#doc-60) · low · `none` · S — Dated test reports sit among the living docs; the manual report has no outcome record · U0620, batch 12
- [DOC-61](../workstreams/keyboard-help.md#doc-61) · low · `none` · S — Batch, template, time-tracking, Kanban and sprint help have smaller inaccuracies · U0431, batch 6C
- [DOC-62](../workstreams/settings.md#doc-62) · low · `none` · S — Settings hints mislead about import formats and what categories are for · U0274, batch 9
- [DOC-63](../workstreams/smart-input.md#doc-63) · low · `bugfix` · S — Detail-overlay suggestion chips use wrong or non-existent marker prefixes · U0429, batch 6A
- [DOC-64](../workstreams/storage-core.md#doc-64) · low · `none` · S — The theme bootstrap script hard-codes the settings storage key, contrary to CLAUDE.md · U0776, batch 2A
- [DOC-65](../workstreams/import-export.md#doc-65) · low · `feature-extension` · S — [Feature extension] The Markdown todo export leaves out people and projects because of a stale comment · U0097, batch 2B
- [DOC-66](../workstreams/import-export.md#doc-66) · low · `bugfix` · S — [Bug, cross-dimension] The notes Markdown export labels the note's creation age as 'Updated' · U0101, batch 11
- [DOC-67](../workstreams/code-hygiene.md#doc-67) · low · `none` · S — The models' raw getters give contradictory guidance on copying and mutation · U0577, batch 7A
- [DOC-68](../workstreams/kanban.md#doc-68) · low · `none` · S — The lists of Kanban system states leave out Rejected · U0260, batch 12
- [DOC-69](../workstreams/code-hygiene.md#doc-69) · low · `none` · S — idGenerator's guidance on model createId does not match how ids are created · U0757, batch 7A
- [DOC-70](../workstreams/import-export.md#doc-70) · low · `none` · S — convertToTodo's JSDoc contradicts the comment inside the function · U0112, batch 12
- [DOC-71](../workstreams/docs.md#doc-71) · low · `none` · S — 'Used by' lists in util JSDoc are stale · U0753, batch 12
- [DOC-72](../workstreams/dates-time.md#doc-72) · low · `none` · S — dateUtils' header and aliases are out of date, and the two getWeekNumber exports differ · U0542, batch 12
- [DOC-73](../workstreams/smart-input.md#doc-73) · low · `needs-decision` · S — detectPriorities' JSDoc promises a p1/p2/p3 shorthand that does not exist · U0527, batch 12
- [DOC-74](../workstreams/visual-system.md#doc-74) · low · `needs-decision` · S — colors.ts fallbacks are documented as marker colours but are fixed constants · U0744, batch 8C
- [DOC-75](../workstreams/stats-time-focus.md#doc-75) · low · `none` · S — The ambient sound settings are called 'sound file' but store an id · U0326, batch 12
- [DOC-76](../workstreams/stats-time-focus.md#doc-76) · low · `none` · S — focusMode.ts claims src/types no longer imports src/utils, but settings.ts does · U0784, batch 12
- [DOC-77](../workstreams/docs.md#doc-77) · low · `none` · S — Hook JSDoc examples use components and keys the app does not use that way · U0160, batch 12
- [DOC-78](../workstreams/storage-core.md#doc-78) · low · `none` · S — initializeStorage's return type and JSDoc hide its null adapter · U0074, batch 2A
- [DOC-79](../workstreams/dates-time.md#doc-79) · low · `none` · S — The JSDoc of the chrono 'sprint N' parser is inaccurate · U0541, batch 12
- [DOC-80](../workstreams/docs.md#doc-80) · low · `none` · M — The large domain hooks have no JSDoc for their contract or persistence · U0131, batch 12
- [DOC-81](../workstreams/docs.md#doc-81) · low · `none` · S — Orphaned, stacked and misplaced comments in hooks, models, storage, types and utils · U0057, batch 12
- [DOC-82](../workstreams/docs.md#doc-82) · low · `none` · S — Orphaned and stale comments in components, the app shell and sw.js · U0057, batch 12
- [DOC-83](../workstreams/docs.md#doc-83) · low · `none` · S — Comments narrate refactor history and cite commit numbers that cannot be looked up · U0496, batch 12

## Commit groupings suggested by the reviewer

Superseded by the work units where they differ; kept because they show what the reviewer expected to land together.

- **Agent definitions for doit** — DOC-01. This blocks other work: the PROACTIVE agents would push foreign conventions onto every later package. About 400 lines in two files.
- **Agent-facing truth: CLAUDE.md, e2e docs, versioning, theme key** — DOC-02, DOC-27, DOC-28, DOC-29, DOC-64. Implementers read CLAUDE.md, e2e-testing.md and the playwright comments first, so fix them together before any UI or test work. About 250 lines.
- **Name-reference invariant** — DOC-03, DOC-30, DOC-70. Write the id-vs-name rule once, in the types, CLAUDE.md and the docs, and point every stale registry comment at it. About 120 lines.
- **Duration parsing fix (cross-dimension)** — DOC-04. A behaviour fix with its own tests, kept separate so it can be bisected. Every doc or help text about durations depends on it.
- **Relative dates vs duration precedence (cross-dimension)** — DOC-05. A reproducer-first fix in autoDetection and SmartInput. The date documentation must describe the result.
- **Completion lifecycle bugs (cross-dimension)** — DOC-06, DOC-14. Both change what completing a task does to stored or visible state, and both are tested through useTodos and ListView.
- **Newer-data guard and migration model** — DOC-07. A data-safety change gated on an owner decision, confined to migrations.ts, useTodos and settingsStore.
- **Tutorial and onboarding correctness** — DOC-08, DOC-09, DOC-21, DOC-46. These share TutorialOverlay and the GettingStarted, QuickStart, Workflows and Views sections: a crash fix, derived shortcuts, working selectors and current wording. About 300 lines plus tests.
- **Help: backup, settings, links and hints** — DOC-10, DOC-51, DOC-52, DOC-62. All user text about settings: SettingsSection, the backup workflow steps, LinksTab, ImportTab and CategoriesTab.
- **Dependency claims vs behaviour** — DOC-11. Gated on an owner decision. The result is either a feature (cycle check and blocked badge) or a small text removal.
- **Settings wiring without decisions** — DOC-12, DOC-20, DOC-37. Completes two clearly broken settings and updates the auto-assign docs that describe them, in one commit.
- **Inert settings** — DOC-13. Gated on an owner decision for each setting. Split it into one commit per setting if the wiring grows past about 500 lines.
- **Add-todo overlay and Gantt keyboard (cross-dimension)** — DOC-15, DOC-16. Both fixes are in TodoApp's overlay and keyboard plumbing, and both are tested in TodoApp and GanttView.
- **Storage correctness fixes (cross-dimension)** — DOC-17, DOC-18, DOC-19. Behaviour fixes in sharedStore and storage.ts, with unit tests. They must land before the storage docs describe them.
- **Storage documentation** — DOC-22, DOC-23, DOC-24, DOC-25, DOC-26, DOC-78. Brings storage-architecture.md and the storage-layer JSDoc in line with the fixed behaviour. About 500 lines.
- **Models and types JSDoc truth pass** — DOC-32, DOC-55, DOC-67, DOC-68, DOC-69, DOC-74, DOC-75, DOC-76. Comment-only edits in src/models and src/types, plus the TodoModel guide lines. Low risk to review together.
- **Hooks and utils JSDoc truth pass** — DOC-31, DOC-71, DOC-72, DOC-77, DOC-80. Comment-only edits in src/hooks and src/utils. The domain-hook headers go last, once Logic fixes to those hooks have settled.
- **Marker syntax truth** — DOC-33, DOC-63. Removes the syntax of the removed markers from comments and from the detail-overlay chips in one sweep.
- **Decision-gated date and priority semantics** — DOC-34, DOC-35, DOC-36, DOC-73, DOC-79. Each needs an owner answer. If only the docs change, the commit is small; any choice that extends a feature moves to Partly implemented or Logic bugs.
- **smart-input.md: pipeline and dates** — DOC-38, DOC-39. Creates the living doc with the pipeline and dates, and deletes auto-date-detection.md. About 550 changed lines.
- **smart-input.md: durations and field-only dates** — DOC-40, DOC-58. Lands after the duration fixes, and deletes due-date-feature.md. About 300 lines.
- **smart-input.md: recurring** — DOC-41. Moves the recurring grammar into the doc, with tested examples, and deletes both recurring docs. About 450 lines.
- **smart-input.md: people, source, priorities** — DOC-42, DOC-56. Deletes the person-mention and source-priority docs. About 600 lines, mostly deletions.
- **smart-input.md: projects and pointers** — DOC-57. Deletes the project-reference doc and repoints CLAUDE.md. About 400 lines.
- **copilot-instructions fix and shrink** — DOC-43. Lands after smart-input.md, so that lines 478-607 become a link, and removes the hand-copied inventories.
- **README accuracy, shortcuts and docs index** — DOC-44, DOC-59. Lands after the consolidation and the shortcut registry, so the index and the shortcut list reflect the final state.
- **Keyboard shortcut registry** — DOC-45. One registry, rendered by KeyboardSection, the FocusView hint bar and the focus tooltip. About 400 lines.
- **Help views, filtering and smaller inaccuracies** — DOC-49, DOC-50, DOC-53, DOC-61. Rewrites the Views, Filtering, Advanced and TimeTracking help content against the real controls. About 400 lines.
- **Smart-input help and shared reference data** — DOC-47, DOC-48. In-app help mirrors the final grammar once the parser fixes and smart-input.md are in. About 400 lines.
- **Notes and Reviews feature toggles** — DOC-54. A small feature extension in GeneralTab and the settings Feature type, plus clearer toggle descriptions.
- **Archive dated reports** — DOC-60. File moves, an outcome table and the CHANGELOG link, isolated from content changes.
- **Export fixes (cross-dimension)** — DOC-65, DOC-66. Both are in export.ts and covered by export tests.
- **Comment hygiene: orphans and history** — DOC-81, DOC-82, DOC-83. Mechanical comment moves and deletions, done last so they do not conflict with packages that move code. About 200 lines.

## Dependencies

Inside this dimension:
(1) 'Agent definitions' (DOC-01) and 'Agent-facing truth' (DOC-02, DOC-27, DOC-28, DOC-29, DOC-64) go first. They govern how every other package in every dimension is implemented, and DOC-02 governs how it is verified.
(2) DOC-03 comes before DOC-30, DOC-70, DOC-55, DOC-56 and DOC-57, which restate the name-reference rule.
(3) The parser fixes come before the docs that describe them. DOC-04 lands before DOC-40, DOC-47 (the '1h30m' tooltip), DOC-48 (whose examples must parse) and DOC-44. DOC-05 lands before DOC-39, DOC-40 and README's 'in 2 weeks' example.
(4) The smart-input chain runs in order: DOC-38/39, then DOC-40/58, then DOC-41, then DOC-42/56, then DOC-57, then DOC-43 (the copilot shrink), then DOC-44/59 (the README index). Each step deletes its source docs and fixes the links in README, copilot and CLAUDE.md as it goes.
(5) The decisions on DOC-35 (fiscal) and DOC-36 ('today') come before the matching text in DOC-39 and DOC-51.
(6) DOC-12 comes before DOC-37. The DOC-13 decision comes before DOC-51's labels for inert settings and DOC-43's settings lines. DOC-54 comes before DOC-44, because the README line 20 wording depends on it.
(7) The DOC-07 decision comes before DOC-23's version section. DOC-17, DOC-18 and DOC-19 come before DOC-23 and DOC-24.
(8) Several help packages edit the same files. DOC-09 (Views and Workflows digits) comes before DOC-10, DOC-49, DOC-50, DOC-53 and DOC-61. DOC-46 (the tutorial keyboard step) comes before DOC-45. DOC-45 comes before DOC-53's palette mention and DOC-59's README shortcut table.
(9) DOC-81, DOC-82 and DOC-83 land last.

Against other dimensions:
- Dead-code removal: must not remove SettingsModel.defaultRecurring, showBacklogInSprint or notificationCheckInterval, or the NotesSettings fields, before the decisions on DOC-12, DOC-13 and DOC-20, because they belong to existing features. Dead-code should decide blockedTodosCount, raw_DONOTUSE, the tutorialSteps alias, the no-op backdrop, notifyPomodoroBreak and SprintModel.createId before DOC-55, DOC-67, DOC-69 and DOC-82 document them. Its comment deletions overlap DOC-81 and DOC-82, so agree on one owner.
- Error, validation and other string messages: Help, tooltip and settings copy is string content. Land these content fixes before any string extraction, so the corrected text is what gets moved; or, if InfoTooltip is restructured first, apply DOC-47, DOC-52, DOC-61 and DOC-62 to the new location.
- Duplication to consolidate: DOC-48 (reference.ts) and DOC-45 (the shortcut registry) overlap with consolidation of the help reference data. Pick one owner. Also hand over the getAllBackups duplicate (DOC-26), the two getWeekNumber exports (DOC-72) and createSprintId vs SprintModel.createId (DOC-69).
- Restructuring for consistency: hand over a separate PersonRef brand (DOC-03), the types-to-utils inversion (DOC-76), moving the entity collections onto createSharedStore (DOC-24) and driving keydown handlers from the registry (DOC-45). Any file moves change the paths these docs cite, so run the doc packages after restructuring of the same files, or update the paths in the same commit.
- Logic and business-logic bugs: deduplicate DOC-04, 05, 06, 07, 08, 14, 15, 16, 17, 18, 19, 20 and 66 against the Logic backlog and land each once. Hand-offs that have no item here: usePersistedState ignores a false save result (DOC-25); GanttView derives a usePersistedViewOptions default from settings (DOC-31); memoisation on SettingsModel may go stale (DOC-32); common words ('now', 'later', 'fall', 'spring') are stripped as dates (DOC-39); the smoke-tests project also runs the mobile spec (DOC-29); 'every 2 weeks' may emit a stray duration (DOC-05). The docs for each of these areas are written after the fix.
- Missing, wrong or out-of-date logging: DOC-22 stops quoting log lines. If the logging work adds storage-init logs, do not quote them back into the doc. usePersistedState's .catch belongs there too.
- UI design review: KeyboardSection (DOC-45), SettingsSection (DOC-51) and ViewsSection (DOC-53) may be redesigned. Land the content fixes first, or do both in the same package. DOC-02 must land before any UI package runs test:visual.
- Inconsistencies across the codebase: these decisions are shared: 'List' vs 'Todos', 'Done' vs 'Completed', the two times for 'today' (DOC-36), fiscal semantics (DOC-35), and what N does in each view (DOC-45).
- Opportunities to improve support: in-app Help completeness (DOC-53, DOC-59) overlaps with support content, so agree on one owner.
- Partly implemented features: the feature paths of DOC-11, 12, 13, 34, 54, 65, 73 and 79, and the tutorials for Stats and Time (DOC-08).
- Security review: DOC-71 must keep the preconditions in sanitize.ts and linkPatternUtils.ts. The DOC-52 text must not encourage unsafe URL templates. The DOC-01 agent rules should include the repo's sanitisation rules.

## Open questions

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
- [ ] Should package.json's version (0.1.0) be synced to version.json, dropped, or left alone (DOC-28)?
- [ ] Should the unused screenshots view-kanban.png and view-list.png be deleted or referenced, and should the dated reports move to docs/reports/ (DOC-60)?
- [ ] Should the duplicate settings.backup.lastBackupDate mirror be kept as display state, or removed (DOC-26)?
- [ ] Should colors.ts's fallback priority colour be aligned with defaultMarkerColors (a small visible change), and should user marker colours apply there (DOC-74)?
- [ ] Should tod, tmr, tom and nextsaturday also be recognised in typed task text, or stay accepted only in date fields (DOC-58)?
- [ ] Is it intended that the smoke-tests project also runs edge-cases-mobile.spec.ts on desktop as well as in smoke-mobile (DOC-29)?

## Dropped during synthesis

- In-app Help 'Views' section shows wrong or missing digit shortcuts and omits views (repo-docs) — Merged into DOC-09 (digits). The views it omits are covered by DOC-53.
- parseDuration turns detected '2d', '1w' and '1h30m' into a few minutes (code-docs-logic) — Merged with the UI slice's 'Day/week and compound durations are stored as minutes' into DOC-04.
- Day/week and compound durations are stored as minutes ('2d' becomes 2m) (code-docs-ui) — Merged into DOC-04.
- The 'Default Recurring' auto-assign setting is never applied (repo-docs) — Merged with the Auto-Assign part of the UI slice's inert-settings finding into DOC-12.
- The 'Show Backlog in Sprint' setting has no effect (repo-docs) — Merged into DOC-13.
- Several settings describe behaviour that nothing implements (code-docs-ui) — Split: Default Recurring went to DOC-12 because its fix needs no decision; the other six settings went to DOC-13.
- Docs claim person/project entity ids are their names (repo-docs) — Merged into DOC-03. Corrected its proposal, which gave the project id prefix as 'project-'; ProjectModel.createId mints 'proj-'.
- PersonId and ProjectId are used for both generated ids and names (code-docs-logic) — Merged into DOC-03.
- ProjectModel comment gives the wrong project id prefix (code-docs-logic) — Merged into DOC-03.
- TodoModel JSDoc that does not match what the getters return (code-docs-logic) — Merged with the repo-docs finding 'TodoModel and entity-model docs list wrong signatures' into DOC-55.
- Comments with commit numbers, dated counts and references to removed code (code-docs-logic) — Merged with the UI slice's 'Comments narrate refactor history' into DOC-83. The focusMode.ts:17 'commit 24' reference is handled in DOC-76 to avoid a double edit.
- Comments narrate refactor history and cite commit numbers that cannot be looked up (code-docs-ui) — Merged into DOC-83.
- Keyboard reference is incomplete and overstates where shortcuts work (code-docs-ui) — Merged with the shortcut part of 'In-app reference content is duplicated' into DOC-45.
- In-app reference content is duplicated across 4-6 places (code-docs-ui) — Split: the shortcut lists went to DOC-45, and the markers, date shorthands and recurring examples went to DOC-48.
- Settings hints mislead on fiscal year, import formats and categories (code-docs-ui) — Split: the fiscal hint went to DOC-35 with the chronoCustom fiscal finding; the import and categories tooltips went to DOC-62.
- 'Fiscal' Q/H/FY date shorthands ignore the fiscalYearStart setting (code-docs-logic) — Merged into DOC-35, which also absorbs the fiscal sub-point of the repo-docs auto-date-detection finding.
- Project and person detection docs contradict themselves and the code (repo-docs) — Split into DOC-56 (person doc) and DOC-57 (project doc), because the two docs are deleted in different commits.
- Sub-claim: 'nextsaturday exists nowhere in src' (repo-docs, due-date-feature finding) — Incorrect. It exists in dateUtils.parseShorthand at src/utils/dateUtils.ts:272, accepted only in date fields like tod, tmr and tom. Corrected in DOC-58.
- Sub-claim: 'Help Settings section misses six tabs' (code-docs-ui) — Corrected to five (Notifications, Sprints, Notes, Focus, Storage), with Import mentioned only in passing. See DOC-51.
- Sub-claim: detail-overlay chip line numbers (code-docs-ui) — Corrected. TodoDetailsOverlay.tsx:828 is the duration dropdown with the '*' prefix and :881 is the recurring dropdown with the '%' prefix; the reviewer had them swapped. See DOC-63.
- Location 'docs/copilot-instructions.md' on the 'in 2 weeks' finding (repo-docs) — No such file and no line was given. The file is .github/copilot-instructions.md; the location was removed from DOC-05.
- Duplicate locations ProductivityTechniquesSection.tsx:83, TodoApp.tsx:612 and public/sw.js:312 — Each was cited by two findings; each is now kept in one item only (DOC-51, DOC-15, DOC-82). DOC-43 still cites sw.js:312 as evidence but does not edit it.

## Coverage gaps

No reviewer read these:
- .github/workflows/claude.yml and .github/workflows/claude-code-review.yml (only deploy.yml was checked).
- LICENSE, which README describes as a Personal Use License.
- resources/ (icon sources).
- .claude/settings.json.
- eslint.config.mjs and jest.config.js comments (jest.config.js was used only for the coverage floor).
- The scripts/*.js comment headers (only the version flow was checked).
- site.webmanifest copy.
- public/sw.js beyond the sync and push handlers.
- The docblocks in e2e/fixtures and the spec files.
- Comments in __tests__ folders.
- The contents of the four PNGs in docs/manual-test-evidence/ (only their references were checked).

Read only for comments, without reading the function bodies:
- 27 of 35 hooks, including useNotes, useReviews, useSprints, useSettings, the view-state hooks, useServiceWorker, useFocusSession, useSelectionHistory and useTaskNotifications. useTaskNotifications was spot-checked.
- Most type files.
- The large utils: ganttScheduler, autoDetection, chronoCustom, recurringParser, import, notifications, dateUtils and richText/*.

Components the UI slice did not reach (it reviewed their comments only, not their rendered text):
- The bodies of RichTextEditor.tsx and SmartInput.tsx.
- NoteDetailView, ReviewDetailView, ReviewEditView, StatisticsView and TimeReportsView.
- The bodies of the Person, Project and Sprint DetailsOverlays.
- NoteAddModal and OpenFocusSetup.
- Most of items/* and of the shared/* components not listed in that slice's coverage note.
- The full forms of GanttTab, KanbanTab, WorkHoursTab, FocusTab, StorageTab and ImportTab.
- settings/components/FocusModesSection.

Sub-claims nobody verified:
- In copilot-instructions: 'WIP columns turn red' and the per-field cap on selection history.
- The example output dates in the detection docs.
- The CHANGELOG known gap 'four visual baselines fail'.
- The claim that F1-F7 in the manual test report are fixed, which the reviewer inferred.
- 'MarkedText runs the same pipeline'.
- The 1-3 letter limit on link-pattern prefixes in LinksTab validation.
- The 'every year on jan 1' recurring example not parsing.

Conclusions drawn from reading code, not running it:
- 'in 2 weeks' being dropped and the possible stray duration on 'every 2 weeks' (DOC-05).
- The Gantt keyboard handler acting under the focus views (DOC-16).
- Minification renaming constructor.name (DOC-19).
- The settings mirror wipe causing a visible flash (DOC-18).

Every slice's finder completed; none failed. The verifier refuted nothing in any slice. I re-checked every high-priority item and most medium items against the code myself. The remaining medium and low items carry the reviewers' locations, which I did not all re-open.
