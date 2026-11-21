# 3. Error, validation and other string messages

87 items: 13 high, 40 medium, 34 low. These findings were spot-checked by the synthesiser, not independently verified. Every item links to its full text; the unit and batch after each title say where the work is scheduled.

## Context

STATE OF THE DIMENSION. Almost every human-readable string in Doit is an inline literal at its point of use. There is no src/constants directory. Only a few places act as shared sources: src/types/viewRegistry.ts (tab ids and labels), src/components/overlays/help/shortcuts.ts (useViewShortcuts works out the digit keys from the feature flags, but most help sections ignore it), the tooltipContent map in src/components/shared/InfoTooltip.tsx, src/components/shared/MarkerReference.tsx, and the helpers in src/utils/formatters.ts (pluralize, formatActivityTime, formatDuration, describeEntityDelete). pluralize exists at formatters.ts:54, but only the models call it. Components hand-write `!== 1 ? "s" : ""` 23 times.

Three patterns keep recurring:
(a) Copies that drift. The todo activity templates in utils/activityLogger.ts and the note copy in hooks/useNotes.ts disagree on marker sigils. There are three marker legends (MarkerReference, an inline copy in TodoDetailsOverlay, another in NoteDetailView). Note and review confirm dialogs are written out twice each in TodoApp.tsx. GanttTab, PrioritiesTab and SprintsTab copy tooltips word for word, and DateTimeTab repeats the date-shortcut list from dateUtils.
(b) Code that branches on display text. StorageTab checks migrationStatus.includes('Successfully' / 'failed' / 'reload'). SprintProgress checks metric.label === 'Work'. 'No Project', 'Unassigned', 'No Priority' and 'No Sprint' serve as both grouping keys and headings. The 'custom' preset sentinel is a plain string. getStorageType compares constructor.name. shortcutFor looks views up by label, so 'List' never matches the registry label 'Todos'. TokenMatch.type is a plain string, which let NoteAddModal switch on token names that do not exist.
(c) Help copy hard-codes facts the code owns: digit shortcuts, the 'ten seconds' undo window, control labels, Kanban system-state names and the link-pattern syntax.

WHERE THE PROBLEMS CONCENTRATE.
1. The activity log: useTodos.editTodo, activityLogger.ts, useNotes, useEntityManager, useReviews, useSprints and the renderer shared/Activity.tsx. ActivityEntry.description is stored as a finished string. Every todo edit currently appends false 'Changed priority from !!2 to !!high' entries, with wrong sigils, and these are permanent. The renderer also prints raw JSON metadata.
2. Help and tutorial copy (overlays/help/*.tsx, TutorialOverlay.tsx, the tutorial steps in GanttView): wrong digit keys, controls that do not exist, missing shortcuts.
3. Settings tabs (StorageTab, BackupTab, ImportTab, LinksTab, KanbanTab, NotificationsTab, GeneralTab): text that contradicts the behaviour or the condition that triggers it.
4. Import and backup error paths (utils/import.ts, hooks/useBackups.ts, storage/backup.ts): stringified exceptions, a write failure reported as a parse failure, stacked 'Failed to…' prefixes.
5. Feedback surfaces: the dependency-block reason renders only in ListView. Notification has no live region, ConfirmDialog has no dialog semantics, and the Kanban keyboard path announces refused moves as successes.

Terminology conflicts run through the whole UI: task vs todo (often on the same screen), DoIt vs Doit, Restore vs Unarchive, Complete vs Completed, four spellings of localStorage, and three meanings of 'This Week'.

WHAT IS IN GOOD SHAPE AND SHOULD BE LEFT ALONE.
- viewRegistry as the single list of views.
- useConfirmDialog as the one confirm channel.
- validateBackupData returning reasons. Improve the wording only; what it accepts must not change.
- The isDestructive split in UndoNotificationStack.
- The moveAnnouncement live region in KanbanView. Keep the infrastructure; only the success-path text is wrong.
- Templates to copy: the interpolated aria-labels in FocusModesSection (`Move ${mode.name} up`) and the id/htmlFor pairs in NotesTab:214-222 and SprintsTab:68-76.
- The many code comments explaining past drift. Keep them.

Long help prose should stay as inline JSX. Only facts the code owns (digits, labels, durations, names, system states) should be read from code. A lightweight constants module is the proportionate tool; an i18n framework is not.

WHAT AN IMPLEMENTER MUST KNOW.
1. About 18 items are behaviour bugs found through the message lens and tagged [x-dim]. They must be deduplicated against the Logic, Partly-implemented and UI dimensions so each has one owner.
2. Fixing an activity template does not touch entries already stored. Only render-time formatting or a migration would; see the open questions.
3. Tests assert on strings. src/utils/__tests__/activityLogger.test.ts:171 and :267 encode the current wrong sigils ('Added tag &important'). e2e/smoke/focus-timer.spec.ts looks up the dialog by the name 'Open focus timer' six times. ServiceWorkerProvider.test.tsx asserts on toast markup. Other e2e selectors use names such as 'Skip tutorial', 'Search everything', 'End session' and 'Cancel'. Grep both e2e/ and the __tests__ folders for every string you change.
4. The visual suite tolerates a 1-2% pixel difference, so copy changes can pass while baselines go stale. Regenerate baselines for touched overlays and compare.
5. The repo has no prettier config. Do not run prettier.
6. scripts/fix-github-pages.js rewrites public/site.webmanifest with exact-string replacements and fails loudly if the formatting changes. Edit the manifest without reformatting it.
7. Wording changes must not change what any validator accepts or rejects: the canX methods, validateBackupData, isNameTaken, the import parsers.
8. Several new messages ('This isn't a Doit backup') depend on the app-name decision, and the terminology items depend on the noun decision. Both questions should be settled before the consolidation phase.

SUGGESTED PHASING:
- Phase 1, the high items: packages Activity log correctness, Note flows, the confirm fix MSG-02, SmartInput, Global feedback, Activity timeline, Grouping labels, Help/shortcuts, Storage MSG-11, View bugs MSG-13.
- Phase 2: owner decisions, then the Strings foundation and terminology package.
- Phase 3: consolidation (Marker registry, Activity and undo messages, Confirm builders, Plurals).
- Phase 4: settings copy and accessibility.
- Phase 5: low-priority polish.

## Items, high to low

- [MSG-01](../workstreams/activity-comments.md#msg-01) · high · `bugfix` · S — Every todo edit logs false priority, due-date and duration activity · U0116, batch 3A
- [MSG-02](../workstreams/undo-confirm.md#msg-02) · high · `bugfix` · S — [x-dim UI/Logic] Detail overlays delete people, projects and sprints with no confirm · U0480, batch 3C
- [MSG-03](../workstreams/notes.md#msg-03) · high · `bugfix` · S — [x-dim Logic] Note title markers are silently dropped, though the helper text promises them · U0409, batch 3B
- [MSG-04](../workstreams/notes.md#msg-04) · high · `bugfix` · S — [x-dim Logic] Notes bulk delete asks about one note and deletes only the last selected · U0703, batch 3B
- [MSG-05](../workstreams/activity-comments.md#msg-05) · high · `bugfix` · S — Todo activity templates use the wrong marker sigils and show raw todo ids · U0184, batch 3A
- [MSG-06](../workstreams/smart-input.md#msg-06) · high · `bugfix` · S — [x-dim Logic] SmartInput 'Add new' creates people, projects and priorities with lowercased names · U0506, batch 3A
- [MSG-07](../workstreams/undo-confirm.md#msg-07) · high · `bugfix` · S — The dependency-block reason is only rendered in the List view · U0247, batch 3A
- [MSG-08](../workstreams/activity-comments.md#msg-08) · high · `bugfix` · S — Activity timeline prints raw JSON metadata · U0117, batch 3A
- [MSG-09](../workstreams/view-state.md#msg-09) · high · `bugfix` · S — Group-by-Sprint headings in the List view show raw sprint ids · U0259, batch 3B
- [MSG-10](../workstreams/keyboard-help.md#msg-10) · high · `bugfix` · M — Help and tutorial hard-code digit shortcuts that are wrong by default, and the List key never shows · U0433, batch 3C
- [MSG-11](../workstreams/storage-core.md#msg-11) · high · `bugfix` · S — [x-dim Logic] getStorageType compares constructor.name, which production minification renames · U0084, batch 2A
- [MSG-12](../workstreams/settings.md#msg-12) · high · `needs-decision` · M — [x-dim Logic] Work-hours 'Custom schedule for each day' is not saved and silently overrides weekday/weekend · U0309, batch 3B
- [MSG-13](../workstreams/sprints.md#msg-13) · high · `bugfix` · S — Sprint details show an unrounded days percentage · U0683, batch 3B
- [MSG-14](../workstreams/backup.md#msg-14) · medium · `bugfix` · S — Backup import misattributes failures and stacks 'Failed to…' prefixes · U0042, batch 2B
- [MSG-15](../workstreams/import-export.md#msg-15) · medium · `bugfix` · S — [x-dim Logic] A backup file dropped into the Import tab produces one warning per character · U0107, batch 2B
- [MSG-16](../workstreams/import-export.md#msg-16) · medium · `bugfix` · M — Import errors leak stringified exceptions, and skipped or empty results are explained inconsistently · U0104, batch 2B
- [MSG-17](../workstreams/import-export.md#msg-17) · medium · `bugfix` · M — [x-dim Logic/Partial] Doit's own JSON export does not round-trip through JSON import · U0099, batch 2B
- [MSG-18](../workstreams/kanban.md#msg-18) · medium · `bugfix` · S — Kanban move feedback: the keyboard announces refused moves as success, and refused pointer drops say nothing · U0223, batch 6B
- [MSG-19](../workstreams/overlays-dialogs.md#msg-19) · medium · `bugfix` · S — [x-dim Logic] The add-todo overlay's backdrop and close button leave hidden text that Add Todo will submit · U0461, batch 3C
- [MSG-20](../workstreams/feedback-states.md#msg-20) · medium · `bugfix` · S — Notes header count compares numbers from different sets ('5 of 3 notes') · U0702, batch 6C
- [MSG-21](../workstreams/stats-time-focus.md#msg-21) · medium · `bugfix` · S — Time report custom-period heading shows the previous day west of UTC · U0371, batch 6B
- [MSG-22](../workstreams/feedback-states.md#msg-22) · medium · `bugfix` · M — Empty states that are unreachable, missing, or do not match their condition · U0702, batch 6C
- [MSG-23](../workstreams/smart-input.md#msg-23) · medium · `bugfix` · S — Wrong marker prefixes on the duration, recurring and priority labels · U0429, batch 6A
- [MSG-24](../workstreams/storage-core.md#msg-24) · medium · `none` · S — The storage-full banner gives wrong advice, and StorageTab says 'local storage' on IndexedDB · U0686, batch 9
- [MSG-25](../workstreams/notifications.md#msg-25) · medium · `none` · S — 'Notifications are enabled' reflects browser permission, not the app setting · U0302, batch 9
- [MSG-26](../workstreams/rich-text-html.md#msg-26) · medium · `none` · S — Link Patterns help describes a syntax the feature does not support · U0295, batch 9
- [MSG-27](../workstreams/kanban.md#msg-27) · medium · `none` · S — Kanban settings name the wrong system states and contradict each other · U0290, batch 9
- [MSG-28](../workstreams/settings.md#msg-28) · medium · `none` · S — Settings help text contradicts behaviour in several tabs · U0274, batch 9
- [MSG-29](../workstreams/keyboard-help.md#msg-29) · medium · `none` · M — In-app help and tutorial copy describes UI that does not exist · U0431, batch 6C
- [MSG-30](../workstreams/keyboard-help.md#msg-30) · medium · `none` · S — Keyboard help omits the command palette and view-level keys, and its tip is wrong · U0439, batch 8A
- [MSG-31](../workstreams/feedback-states.md#msg-31) · medium · `none` · S — Raw exception text is shown as the primary error message · U0010, batch 8A
- [MSG-32](../workstreams/strings.md#msg-32) · medium · `none` · M — Internal identifiers and raw values appear in UI text · U0122, batch 9
- [MSG-33](../workstreams/stats-time-focus.md#msg-33) · medium · `none` · S — The focus mode End chime dropdown shows raw sound ids · U0315, batch 9
- [MSG-34](../workstreams/strings.md#msg-34) · medium · `none` · M — Create one home for UI strings and write down the copy conventions (foundation) · U0481, batch 7A
- [MSG-35](../workstreams/strings.md#msg-35) · medium · `none` · M — 'Task' and 'todo' are used interchangeably in user-facing text · U0586, batch 9
- [MSG-36](../workstreams/undo-confirm.md#msg-36) · medium · `none` · S — The undo window is hard-coded as 'ten seconds', confirm configs are copied, and confirm bodies use three styles · U0239, batch 9
- [MSG-37](../workstreams/activity-comments.md#msg-37) · medium · `none` · M — Activity messages are hand-written per hook and drift apart · U0182, batch 6A
- [MSG-38](../workstreams/smart-input.md#msg-38) · medium · `none` · M — Marker symbols are hard-coded in many places · U0502, batch 7B
- [MSG-39](../workstreams/smart-input.md#msg-39) · medium · `none` · M — Three diverging smart-input marker legends · U0441, batch 7B
- [MSG-40](../workstreams/settings.md#msg-40) · medium · `none` · S — Help and tooltip text is duplicated between settings tabs and shared modules · U0281, batch 7B
- [MSG-41](../workstreams/storage-core.md#msg-41) · medium · `none` · S — StorageTab picks status styling and the Reload button by matching message text · U0030, batch 7B
- [MSG-42](../workstreams/accessibility.md#msg-42) · medium · `none` · M — Icon-only and glyph-only controls and both editors lack accessible names · U0199, batch 8B
- [MSG-43](../workstreams/settings.md#msg-43) · medium · `none` · S — Settings toggle switches have no accessible name · U0273, batch 8B
- [MSG-44](../workstreams/accessibility.md#msg-44) · medium · `none` · L — Most settings and form labels are not associated with their controls · U0271, batch 8B
- [MSG-45](../workstreams/feedback-states.md#msg-45) · medium · `none` · S — Toasts are not announced, and the live-region roles conflict · U0676, batch 8B
- [MSG-46](../workstreams/overlays-dialogs.md#msg-46) · medium · `none` · M — ConfirmDialog and the ad-hoc modals expose no dialog name or description · U0226, batch 3C
- [MSG-47](../workstreams/accessibility.md#msg-47) · medium · `none` · S — InfoTooltip content is unreachable for assistive technology, and Modal's fallback label is never wired · U0667, batch 8B
- [MSG-48](../workstreams/undo-confirm.md#msg-48) · medium · `needs-decision` · S — The person/project delete warning misstates what was checked · U0585, batch 6A
- [MSG-49](../workstreams/keyboard-help.md#msg-49) · medium · `needs-decision` · S — The '(N)' shortcut hint is wrong in most views · U0467, batch 3C
- [MSG-50](../workstreams/smart-input.md#msg-50) · medium · `needs-decision` · S — 'Click to deactivate auto-detection' promises an action only dates support · U0499, batch 6A
- [MSG-51](../workstreams/settings.md#msg-51) · medium · `feature-extension` · S — [x-dim Partial] The Notes and Reviews views have feature flags but no toggle · U0262, batch 3C
- [MSG-52](../workstreams/gantt-scheduling.md#msg-52) · medium · `needs-decision` · M — [x-dim Partial] Two settings are labelled and saved but never read · U0286, batch 10
- [MSG-53](../workstreams/undo-confirm.md#msg-53) · medium · `needs-decision` · S — [x-dim UI] 'Reset to Defaults' and the template 'Reset' act immediately with no confirm · U0316, batch 3A
- [MSG-54](../workstreams/strings.md#msg-54) · low · `none` · S — The app name is spelled 'DoIt' and 'Doit', and the metadata and manifest descriptions differ · U0773, batch 9
- [MSG-55](../workstreams/strings.md#msg-55) · low · `none` · S — Plural errors, and about 20 hand-written plurals despite the existing pluralize helper · U0751, batch 9
- [MSG-56](../workstreams/strings.md#msg-56) · low · `none` · S — Model validation reasons are duplicated, expose internal states, and have dead fallbacks · U0175, batch 9
- [MSG-57](../workstreams/undo-confirm.md#msg-57) · low · `none` · S — The undo toast message maps are written three times, untyped, with a vague fallback · U0248, batch 7B
- [MSG-58](../workstreams/import-export.md#msg-58) · low · `bugfix` · S — Imported tasks' activity uses raw format ids · U0115, batch 9
- [MSG-59](../workstreams/activity-comments.md#msg-59) · low · `bugfix` · S — Entity edit activity can read 'Updated color from undefined to #3b82f6', and colour removal is not logged · U0563, batch 9
- [MSG-60](../workstreams/notifications.md#msg-60) · low · `none` · S — OS notification copy has mid-sentence capitals and mixed casing, and the Focus notification texts are duplicated · U0764, batch 9
- [MSG-61](../workstreams/entity-names.md#msg-61) · low · `bugfix` · S — A rename rejection says a person 'already exists' when the name is only another person's alternative · U0595, batch 9
- [MSG-62](../workstreams/view-state.md#msg-62) · low · `bugfix` · M — Group placeholder labels and the 'custom' preset sentinel double as data keys · U0254, batch 11
- [MSG-63](../workstreams/keyboard-help.md#msg-63) · low · `bugfix` · S — Gantt tutorial steps target data-tutorial ids that do not exist · U0340, batch 6C
- [MSG-64](../workstreams/strings.md#msg-64) · low · `none` · S — 'This Week' means three different ranges · U0243, batch 9
- [MSG-65](../workstreams/strings.md#msg-65) · low · `none` · S — 'Restore' vs 'Unarchive' and 'Complete' vs 'Completed' are used for the same states · U0241, batch 9
- [MSG-66](../workstreams/storage-core.md#msg-66) · low · `none` · S — The storage backend is named four ways, and the capacity figures disagree · U0028, batch 9
- [MSG-67](../workstreams/storage-core.md#msg-67) · low · `none` · S — Wiping all data uses two vocabularies, and the confirm phrase is a literal at four sites · U0039, batch 9
- [MSG-68](../workstreams/storage-core.md#msg-68) · low · `bugfix` · S — StorageTab can show 'NaN% used' and 'NaN undefined available' · U0093, batch 2A
- [MSG-69](../workstreams/feedback-states.md#msg-69) · low · `none` · S — Dropdown empty messages are wrong when no people or projects exist · U0662, batch 8A
- [MSG-70](../workstreams/strings.md#msg-70) · low · `none` · S — Vague messages that do not say what or where · U0303, batch 9
- [MSG-71](../workstreams/settings.md#msg-71) · low · `none` · M — Settings tab names, titles and suffixes are inconsistent · U0263, batch 9
- [MSG-72](../workstreams/strings.md#msg-72) · low · `none` · M — UI labels duplicated within and across components · U0207, batch 7A
- [MSG-73](../workstreams/code-hygiene.md#msg-73) · low · `none` · S — Duration, byte-size and relative-time formatting is duplicated with different output · U0015, batch 7A
- [MSG-74](../workstreams/sprints.md#msg-74) · low · `none` · S — SprintProgress chooses the value format by comparing display labels · U0684, batch 7B
- [MSG-75](../workstreams/strings.md#msg-75) · low · `none` · S — Generated labels mix capitalisation and punctuation · U0174, batch 9
- [MSG-76](../workstreams/strings.md#msg-76) · low · `none` · M — Copy style pass over components: punctuation, ellipses, case and shortcut notation · U0413, batch 9
- [MSG-77](../workstreams/logging-diagnostics.md#msg-77) · low · `none` · S — Console messages: wrong plural, three logs per failure, duplicated across two files · U0075, batch 9
- [MSG-78](../workstreams/import-export.md#msg-78) · low · `needs-decision` · S — Export labels are inconsistent · U0094, batch 9
- [MSG-79](../workstreams/dates-time.md#msg-79) · low · `needs-decision` · M — Date and time display uses at least five conventions and mixed locales · U0332, batch 10
- [MSG-80](../workstreams/undo-confirm.md#msg-80) · low · `bugfix` · S — The undo toast subtitle is red even for non-destructive actions · U0690, batch 6A
- [MSG-81](../workstreams/activity-comments.md#msg-81) · low · `bugfix` · S — Editing a comment in the Activity timeline accepts empty rich text · U0119, batch 6A
- [MSG-82](../workstreams/notes.md#msg-82) · low · `bugfix` · S — [x-dim Logic] Note detail navigates away before its delete or convert confirm is answered · U0697, batch 6B
- [MSG-83](../workstreams/reviews.md#msg-83) · low · `bugfix` · S — [x-dim Logic] The review entry 'Notes' textarea shows a child review's HTML · U0591, batch 3B
- [MSG-84](../workstreams/rich-text-html.md#msg-84) · low · `feature-extension` · S — Applying a link in the rich-text editor fails silently · U0789, batch 8C
- [MSG-85](../workstreams/notes.md#msg-85) · low · `needs-decision` · S — The Calendar quick-add hint names a button labelled differently, and quick add is never wired · U0691, batch 10
- [MSG-86](../workstreams/storage-core.md#msg-86) · low · `bugfix` · S — [x-dim] The theme pre-hydration script uses a literal key and does nothing on IndexedDB or with no stored settings · U0776, batch 2A
- [MSG-87](../workstreams/pwa-service-worker.md#msg-87) · low · `needs-decision` · S — [x-dim] The manifest locks the installed PWA to portrait · U0002, batch 8C

## Commit groupings suggested by the reviewer

Superseded by the work units where they differ; kept because they show what the reviewer expected to land together.

- **Activity log correctness** — MSG-01, MSG-05, MSG-58, MSG-59. Every fix that stops new wrong activity text being persisted, landing together with the activityLogger test updates.
- **Note flows: markers, bulk delete, detail navigation** — MSG-03, MSG-04, MSG-82. All three touch NoteAddModal, NoteDetailView, NotesView and TodoApp's note callbacks.
- **Confirm dialogs: shared builders and missing confirms** — MSG-36, MSG-02, MSG-48. The confirm builders and undo-duration constant land first, then the missing entity and sprint confirms and the reworded delete warning use them.
- **SmartInput fixes** — MSG-06, MSG-50. Both live in SmartInput's autocomplete and token rendering; MSG-50 waits for the owner's choice.
- **Global action feedback** — MSG-07, MSG-18, MSG-45. Moves the dependency toast into TodoApp, reuses it for refused Kanban moves, and makes all toasts announced.
- **Activity timeline display** — MSG-08, MSG-32, MSG-81. Activity.tsx rendering fixes, plus the other places that show internal ids.
- **Grouping labels vs keys** — MSG-09, MSG-62. Sprint-name headings and the sentinel group keys both change the grouping code in the view-state hooks.
- **Help, tutorial and shortcut copy** — MSG-10, MSG-29, MSG-30, MSG-49, MSG-63. One pass over overlays/help, TutorialOverlay and the Gantt tutorial steps, built on the id-based shortcutFor.
- **Storage backend and storage messages** — MSG-11, MSG-24, MSG-31, MSG-41, MSG-66, MSG-67, MSG-68. Concentrated in storage.ts, StorageTab, StorageErrorBanner and StorageRecoveryScreen. The type field comes first, then the labels and messages.
- **Backup and import messages** — MSG-14, MSG-15, MSG-16, MSG-77. useBackups, backup.ts and import.ts error paths, including removing the duplicated backup helpers.
- **Export round trip and labels** — MSG-17, MSG-78. Both change export.ts and its tests; MSG-78 waits for the CSV decision.
- **Settings copy corrections** — MSG-25, MSG-26, MSG-27, MSG-28, MSG-33, MSG-40, MSG-69, MSG-70. Text-only corrections across the settings tabs and their shared tooltip and dropdown helpers.
- **Settings behaviour gaps (owner decisions)** — MSG-12, MSG-51, MSG-52, MSG-53. Settings items whose fix changes or completes behaviour. They land after the owner has answered.
- **View-level display bugs** — MSG-13, MSG-19, MSG-20, MSG-21, MSG-22, MSG-64, MSG-74. Small, independent message-condition bugs in views and SprintProgress, each with its own component test.
- **Strings foundation and terminology** — MSG-34, MSG-35, MSG-54, MSG-65. Creates src/constants/strings and the CLAUDE.md conventions, then applies the owner's noun and app-name decisions. Split out MSG-35 if the diff nears 1000 lines.
- **Marker registry** — MSG-38, MSG-39, MSG-23. MARKER_SYMBOLS first, then the single legend and the corrected label prefixes that consume it.
- **Activity and undo message consolidation** — MSG-37, MSG-57, MSG-80. Shared activity-message builders and typed undo message records. Lands after the correctness fixes.
- **Validation, notification and generated-label copy** — MSG-56, MSG-60, MSG-61, MSG-75. Model reasons, OS notification texts and generated labels in models and utils, normalised to the new conventions.
- **Plurals and formatter reuse** — MSG-55, MSG-73. Adds countLabel and formatBytes and replaces hand-written copies across components.
- **Date display convention** — MSG-79. A cross-cutting formatter change that needs the owner's locale decision and touches many views.
- **Accessible names for controls** — MSG-42, MSG-43. aria-labels and the shared Toggle component, covered by role/name test sweeps.
- **Label association in settings forms** — MSG-44. Large mechanical htmlFor/id pass with a Field wrapper, kept on its own to stay under the commit limit.
- **Dialog and tooltip semantics** — MSG-46, MSG-47. Moves ConfirmDialog and the ad-hoc modals onto Modal and makes InfoTooltip describable.
- **Copy style pass and settings registry** — MSG-71, MSG-72, MSG-76. Applies the conventions to the remaining component copy and deduplicates labels. Split views from settings if it nears 1000 lines.
- **Remaining small fixes** — MSG-83, MSG-84, MSG-85, MSG-86, MSG-87. Independent low-priority fixes and owner-decision items that do not fit another package.

## Dependencies

WITHIN THIS DIMENSION

Gating decisions:
- The owner's answers on the UI noun and the app name gate MSG-34, MSG-35 and MSG-54.

Strings foundation:
- MSG-34 (the src/constants/strings module and the CLAUDE.md conventions) lands before the consolidation and style items: MSG-35, MSG-36's builders where they live in the module, MSG-54, MSG-57, MSG-65, MSG-66, MSG-67, MSG-71, MSG-72, MSG-75 and MSG-76.
- Phase-1 bugfixes do not wait for MSG-34. They may use literals and move them into the module later.

Activity log:
- MSG-01 lands before or with MSG-05. Rewriting the templates while todoToMetadata still emits priority ids would produce well-worded false entries.
- Both MSG-01 and MSG-05 land before MSG-37, which consolidates both diff helpers and may absorb MSG-59.

Tokens and markers:
- MSG-03 introduces the TokenMatch type union.
- MSG-38 adds MARKER_SYMBOLS beside that union, then MSG-39 and MSG-23 consume it.
- If MSG-23 lands first, it uses literals and is switched over by MSG-38.

Feedback surfaces:
- MSG-07 (global toast) before MSG-18, which reuses it for refused drops.

Help copy:
- MSG-10 (id-based shortcutFor and useViewShortcuts everywhere) before MSG-29, MSG-30, MSG-49 and MSG-63, which edit the same help files.

Confirm dialogs:
- MSG-36 (confirm builders and UNDO_TIMEOUT_MS) before MSG-02, MSG-04, MSG-48 and MSG-53. Alternatively MSG-04 lands first with inline text.
- MSG-46 (ConfirmDialog on Modal, confirmText required) lands after MSG-36 to avoid conflicting edits.

Storage:
- MSG-11 (adapter type) before MSG-24 and MSG-66.
- MSG-66 (backend label map) before MSG-24's backend-dependent wording.
- MSG-31 and MSG-41 both rewrite StorageTab's migration status and land together.

Other pairings:
- MSG-14 and MSG-15 use the app name in their messages, so they follow MSG-54 or switch to APP_NAME later.
- MSG-09 before MSG-62 (same grouping code).
- MSG-13 with MSG-74 (same file).
- MSG-43's Toggle and MSG-44's Field wrapper should share a pattern, so MSG-43 goes first.
- MSG-55's countLabel is optional for MSG-20, MSG-22 and MSG-41, which can use pluralize directly.
- MSG-79 waits for the locale decision. MSG-21 does not depend on it.

AGAINST OTHER DIMENSIONS

Logic and business-logic bugs:
- MSG-01–04, 06, 07, 11, 12, 15, 17, 19, 62, 82, 83 and 86 are behaviour bugs. Each needs exactly one owner across the two backlogs.
- MSG-01 must land before any Logic-dimension change to useTodos.editTodo or setWorkflowState.

Dead-code removal should decide first, so no one polishes wording that is about to be deleted:
- notifyPomodoroBreak / notifyPomodoroWorkStart (MSG-60)
- formatRecurringPattern (MSG-75)
- formatDateForDisplay (MSG-79)
- BaseEntityModel.getMetadataSummary (MSG-35)
- NoteDetailView's unused tooltip keys (MSG-40)
- Modal's sr-only fallback (MSG-47)
- the unreachable ReviewsView and Calendar empty states (MSG-22)
- the SprintDetailsOverlay and useTodos fallback reasons (MSG-56)
- 'Action completed' (MSG-57)
- formatDurationFromSeconds after MSG-01
- StorageTab's unused _availablePercentage (StorageTab.tsx:171)

Duplication to consolidate:
- MSG-37, 38, 39, 40, 57, 72 and 73 overlap it, as does MSG-77's backup helpers. Agree one owner per item.
- The shared formatters (formatBytes, formatDuration, countLabel) should be the ones that dimension creates.

Restructuring for consistency:
- The location of src/constants/strings (MSG-34) and the settings tab registry (MSG-71) must follow its conventions. Registries currently live in src/types (viewRegistry.ts), so MARKER_SYMBOLS goes in src/types/token.ts.

Missing, wrong or out-of-date logging:
- MSG-77 and the console.error part of MSG-31 should follow the logging dimension's prefix and once-per-failure conventions. Agree those first.

UI design review:
- The accessibility items MSG-42–47 and MSG-18, 22, 53 and 76 overlap it.
- Regenerate the visual baselines after each copy-heavy package, because of the 1-2% tolerance.

Inconsistencies across the codebase:
- MSG-35, 54, 64, 65, 66, 75, 76 and 79 overlap; one owner each.

Documentation cleanup:
- MSG-34 adds copy conventions to CLAUDE.md.
- README and docs naming must follow the MSG-54 decision.
- In-app help (MSG-10, 29, 30) and docs/ should be corrected in a coordinated pass.

Partly implemented features:
- MSG-17, 51, 52, 84, 85, and the optional link wiring in MSG-08, are completion work; dedupe with that backlog.

Security review:
- MSG-84 must reuse sanitizeUrl unchanged.
- MSG-16 must stop showing raw file content in error text.
- MSG-26 changes the example placeholder to https.

Opportunities to improve support:
- MSG-31's 'Technical details' block with a copy button supports bug reports, and should match any support or diagnostics design.

## Open questions

- [ ] Which noun should user-facing text use for the core entity: 'task' (dominant in help, activity, notifications, search and export) or 'todo' (tab 'Todos', 'Add New Todo')? And should the List tab's label change to match?
- [ ] Which spelling of the app name is canonical: 'DoIt' (manifest, page title, header, notifications) or 'Doit' (help, tutorial, README, CLAUDE.md)?
- [ ] Activity descriptions are stored as finished strings. Once the templates are fixed (MSG-01, MSG-05, MSG-37), should existing entries with false or wrongly-sigilled text be left as they are, rewritten by a storage migration, or replaced by rendering descriptions at display time from type and metadata?
- [ ] MSG-48: which tasks should trigger the person/project delete warning? All tasks, or active ones only? Should auto-assign defaults be ignored? Should $source and mentions count?
- [ ] MSG-12: should the work-hours schedule mode be saved as a setting, or should custom per-day schedules be cleared when the user switches to the weekday/weekend mode?
- [ ] MSG-49: should N stay context-sensitive and be documented as such, or should it open the add-todo overlay in the views where it currently does nothing?
- [ ] MSG-50: should 'click to deactivate' be limited to dates (bugfix), or extended to every auto-detected token type (feature extension)?
- [ ] MSG-52: should gantt.showWeekends and sprints.showBacklogInSprint be implemented, or should their controls be hidden until they are?
- [ ] MSG-53: should 'Reset to Defaults' and the template 'Reset' ask for confirmation?
- [ ] MSG-85: should Calendar quick add (double-click a day to add a task with that due date) be wired up, or left unwired with the hint corrected?
- [ ] MSG-79: should dates follow the browser locale (Intl) or one fixed English style, and should times be 12-hour, 24-hour or locale-driven?
- [ ] MSG-78: should the CSV export keep machine state values so it can be re-imported, or show human labels? Should the Markdown task export gain Assigned and Projects?
- [ ] MSG-17: may the JSON export gain an additive ISO dueDate field so exports round-trip through import?
- [ ] MSG-87: should the installed PWA be allowed to rotate to landscape?
- [ ] MSG-34: is a lightweight src/constants/strings module (no i18n framework, help prose kept inline) the right level of consolidation, or is localisation a future goal that would justify going further?
- [ ] Shortcut notation: should hints be platform-aware (⌘ on macOS, Ctrl elsewhere) or use one neutral notation everywhere?

## Dropped during synthesis

- Dependency-block reason is only displayed in the List view (views slice) — Duplicate of the logic-slice finding; merged into MSG-07 with locations combined.
- User-facing text mixes 'todo' and 'task' (logic slice); 'Task' and 'todo' used interchangeably (views slice); Task vs todo terminology is mixed (shared slice) — The same problem seen from three slices; merged into MSG-35.
- App name spelled 'DoIt' and 'Doit' (logic, views and shared slices) — Merged into MSG-54, which also takes the shared slice's description mismatch.
- Pluralisation errors and ad-hoc plural logic (shared slice) — Merged into MSG-55. Corrected: its proposal to add pluralize to utils/formatters.ts was based on a wrong premise, because pluralize already exists at src/utils/formatters.ts:54 (used only by the models).
- Placeholder group labels double as data keys (views slice: TimeReports, Statistics) — Same problem as the logic slice's group-label finding; merged into MSG-62.
- Storage migration errors show raw exception text; quota detection matches on message text (logic slice) — Merged into MSG-31 together with the shared slice's error.tsx and recovery-screen findings.
- Other messages that expose internals or stack prefixes (shared slice) — Split by job: activity icon titles and the Kanban badge went to MSG-32; error.tsx, StorageRecoveryScreen and the migration error to MSG-31; the doubled 'Failed to import backup: Failed to parse' prefix to MSG-14.
- Internal values shown raw in UI strings (views slice) — Merged into MSG-32. The proposed aria-label rename is now marked as needing the six e2e selectors in e2e/smoke/focus-timer.spec.ts updated.
- No central home for UI strings (views slice) and No shared home for UI strings: consolidation proposal (shared slice) — Merged into MSG-34. The two proposed directory names (src/constants/messages/ and src/constants/strings/) were unified to src/constants/strings/.
- Missing accessible names on icon-only controls and the two editors (views slice); Glyph-only buttons with no accessible name or a generic one (shared slice) — Same problem in different file sets; merged into MSG-42 with locations combined.
- Punctuation, ellipsis, capitalisation and shortcut-notation inconsistencies (views slice); Capitalisation, punctuation and minor wording conflicts (shared slice) — Same job, applying the copy conventions; merged into MSG-76.
- Hard-coded en-US and English weekday names (views slice) — Merged with the logic slice's date-format finding into MSG-79.
- UI labels duplicated within and across components (shared slice): the 'Action completed' part — Moved to MSG-57 (undo message maps); the rest of the finding is MSG-72.
- Tutorial steps target data-tutorial ids that do not exist: the claim that 'gantt-focus' is tagged but unused — Not dropped, reframed: the gantt-focus step exists (GanttView.tsx:78) but has no targetSelector, so MSG-63 now proposes pointing it at the existing tag.
- getStorageType minification claim, flagged medium confidence by the logic slice — Kept as high (MSG-11) after checking node_modules/next/dist/build/webpack/plugins/minify-webpack-plugin/src/index.js:101, where keep_classnames is false unless mangling is off. The Turbopack build path (the default for Next 16 builds) was not checked; the acceptance criterion includes a production-build check.

## Coverage gaps

NOTHING WAS RUN. All findings come from reading the code. Behaviour that depends on a production build (MSG-11), the timezone (MSG-21) or screen-reader output (MSG-42–47) is inferred and should be confirmed by the acceptance checks. No slice's finder failed. The verifier refuted nothing in any slice.

During synthesis I re-read and confirmed the code behind every high item (MSG-01–MSG-13) and most medium bugfix items: MSG-14–22, 23, 24, 25, 26, 27, 28, 36, 41, 51, 52, 55 (partial), 62, 63, 68 and 86. MSG-83 (ReviewEditView child HTML) and MSG-70's claim about what older backups restore were not re-verified and are carried at the reviewers' confidence.

Read only by grep, for thrown errors, console calls and capitalised literals, not line by line: src/models/NoteModel.ts, src/models/SettingsModel.ts, src/storage/sharedStore.ts, settingsStore, renameInStoredFilters, src/utils/autoDetection.ts, chronoCustom, ganttScheduler (its break labels reach Focus headings, see MSG-76), reviewUtils, globalSearch, focusReport, delayOptions, suggestions, linkPatternUtils, sanitize, colors, filterHelpers, idGenerator, browserApis, commentMutations, todoTemplates, src/utils/richText/*, and the small hooks (usePomodoroTimer, useFocusSession, useTaskNotifications, useTemplates, useSettings, useSearchHistory, useSelectionHistory, useViewPresets, usePersistedViewOptions, usePersistedState, useEntityCounts, useUsageSortedOptions, useDebouncedSave, useDragReorder, useDialogFocus, useEntityRename*, useKeyboardNavigation, useClickOutside, useEscapeKey, useDropdownManager, useProjects).

Not reviewed by any slice:
- public/sw.js, only grepped. It logs cache failures with console.log rather than console.warn, uses a '[SW]' prefix, and falls back to 'You have a notification'. Forward to the logging dimension.
- scripts/ (build-gh-pages.js, bump-version.js, fix-github-pages.js, pre-commit, setup-hooks.js): console and error text.
- .github/workflows: step names and messages.
- Most of src/types: only viewRegistry, kanbanState, settings, token and priority were opened. Label maps defined elsewhere in src/types were not checked.
- The __tests__ folders and e2e/: searched only for assertions on strings likely to change.
- src/app/globals.css: has no strings.
- README.md, CHANGELOG.md and docs/: outside this dimension; the Documentation dimension owns them.
- src/components/shared/Icons.tsx: grepped only; it has no title or aria strings.
- MarkedText.tsx lines 1-279: searched, not read in full.

Observed while verifying, outside this dimension:
- scripts/fix-github-pages.js rewrites site.webmanifest by exact-string replacement and fails if the formatting changes. This constrains MSG-54 and MSG-87.
- StorageTab.tsx:171 holds an unused `_availablePercentage`. Forward to dead-code removal.
- useEntityManager.ts:141 logs 'context removed' when an update omits context while the entity has one. Every current caller passes context, so this is latent. Forward to the logic dimension.
