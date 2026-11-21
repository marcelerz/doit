# 4. Duplication to consolidate

130 items: 23 high, 47 medium, 60 low. Each reviewer batch was checked against the code by an adversarial verifier (0 findings refuted outright, others corrected). Every item links to its full text; the unit and batch after each title say where the work is scheduled.

## Context

Duplication in Doit has a clear shape. Where a shared layer exists, it is usually good, but several call sites never moved onto it. Each time this happened, one copy picked up a fix and the others did not. About a third of the verified duplication findings therefore contain a real bug in one copy.

1. **Unused shared helpers.** The codebase already has most of the helpers it needs, and the components do not use them:
   - Formatting: formatters.formatDuration, formatElapsed and pluralize have no component importers. Copies sit in TimeTracking, SprintProgress, StatisticsView, TimeReportsView and GanttView.
   - Dates: dateUtils.formatDateKey, toLocalISOString and parseLocalDate are re-derived about 20 times with padStart, and new Date('YYYY-MM-DD') remains at three sites.
   - Lookups and entries: filterHelpers.findByNameOrAlternatives, BaseEntityModel.matchesAnyName, commentMutations, activityUtils.createActivityEntry and linkPatternUtils.escapeRegex are each re-implemented in hooks or components.
   - Persistence: storage/sharedStore exists to stop tabs overwriting each other, but only settings uses it.
   - UI primitives: IconButton, Modal, SectionHeader, NoticeBox, ColorPicker, EntityListView, ActivitySection and SearchableDropdown exist, yet hand-rolled twins remain in TodoApp, the item components, the settings tabs and SprintsView.

2. **Parallel implementations of one domain rule have drifted into user-visible bugs.**
   - **Two date parsers.** chronoCustom serves SmartInput; dateUtils.parseDate and normalizeDateValue serve Delay and auto-assign. As a result, 12 of 21 Delay options do nothing, and a Sunday week start is read as Monday.
   - **Two todo-to-metadata serializers.** One is in useTodos, the other is TodoModel.metadata. Nearly every edit therefore logs spurious activity.
   - **Two duration grammars.** SmartInput writes '2h30m', '2d' and '1w', which parseDuration cannot read. On top of that, Gantt and SprintProgress re-parse a rounded display string.
   - **Two Kanban column rules.** Grouping uses state, while transitions use workflowState.
   - **Five token-to-metadata merges.** NoteAddModal and NoteDetailView switch on token types SmartInput never emits.
   - **Two drag-reorder implementations.** Both compute positions against the wrong list.
   - **Two storage-usage measures.** StorageTab discards the UTF-16 estimate that storage.ts introduced to make the 80% warning reachable.
   - **Three soft-delete/undo lifecycles.** All three prepend a restored copy without removing the soft-deleted one, so ids are duplicated.
   - **Eight hand-rolled load/save sequences.** Two of them write defaults over stored data after a failed load.

   These items are high priority in this backlog because the duplication is the bug. Each must land with a reproducer test first. The same defects will also appear in the logic-bugs dimension, and the orchestrator should deduplicate them there rather than fix them twice.

3. **Where the problems concentrate:**
   - src/components/views/TodoApp.tsx (2359 lines): four TodoDetailsOverlay mounts across Kanban, Gantt and Calendar, repeated confirm and convert handlers, four hand-built modal shells, and a hand-written feature map next to viewRegistry.
   - ListView / NotesView and their hooks useListViewState / useNotesViewState: filter codec, presets, selection, bulk toolbar, quick filters, filter panel and drag reorder. ListViewToolbar and NotesViewToolbar are about 95% the same file.
   - KanbanView: its own filter serialisation, chips and preset modal.
   - The settings tabs: toggle switches, checkbox rows, number fields, add/edit forms written twice, and colour pickers.
   - src/utils date and duration code.
   - The data hooks (useTodos, useNotes, useReviews, useSprints, useEntityManager): lifecycle, activity entries, prev.map update-by-id, and persistence.

4. **What is in good shape and should be left alone:**
   - EntityListView behind PeopleView/ProjectsView.
   - commentMutations, as adopted by four hooks.
   - FILTER_SECTIONS-driven filters in ListView.
   - useDebouncedSave in the overlays.
   - sharedStore/settingsStore as a design.
   - LinksTab's single add/edit form, which is the template for the other settings tabs.
   - The viewRegistry concept.
   - SearchableDropdown, Modal and IconButton as bases.
   - BaseEntityModel.
   - Do not touch the richText editor beyond trivial helpers until it settles; it was rewritten in the last commits.

5. **What an implementer must understand before touching anything:**
   - Copies are rarely identical. Every item lists the differences, and each difference is either kept as a parameter or flagged needs-decision. Never silently 'fix' a variant.
   - There are no unit tests for src/components/views, useNotes, useReviews, usePersistedState, useViewPresets, useBackups, useDragReorder, NoteModel or ReviewModel. Write characterisation tests before consolidating any of them; view refactors rely on the e2e suite plus visual baselines.
   - The visual suite tolerates a 1-2% pixel difference. When markup moves into shared components, regenerate the affected baselines and compare them.
   - Existing data-testid and data-tutorial values used by e2e (overlay-close, comment-add-section, add-comment-button, todo-delete, action-*, filter-button, notes-search-input, etc.) must survive every extraction.
   - Person and project references hold names, not ids. Any id-keyed map over them is suspect.
   - Several fixes in this backlog change stored values or visible output. Those are marked needs-decision or bugfix, never none.

Priority normalisation used here:
- **High:** data loss or corruption, a feature doing the wrong thing, or a blocker for other cleanup.
- **Medium:** wrong text or cosmetic display, latent bugs, and real maintainability or usability cost.
- **Low:** polish.

Some medium reviewer items were raised to high on this rule (Time Reports print, StorageTab under-reporting usage). Some were lowered once their bug part was split out (the Statistics/TimeReports presentational blocks).

## Items, high to low

- [DUP-01](../workstreams/storage-core.md#dup-01) · high · `bugfix` · L — Unify load/save persistence; a failed load must never overwrite stored data · U0137, batch 2A
- [DUP-02](../workstreams/storage-core.md#dup-02) · high · `bugfix` · S — Storage key-copy loops duplicated; switching back to localStorage reverts and wipes itself · U0087, batch 2A
- [DUP-03](../workstreams/storage-core.md#dup-03) · high · `bugfix` · S — getStorageType compares constructor.name, which is minified in production · U0084, batch 2A
- [DUP-04](../workstreams/undo-confirm.md#dup-04) · high · `bugfix` · M — Soft-delete, archive and undo lifecycle copied three times; undoing a delete duplicates the id · U0132, batch 3A
- [DUP-05](../workstreams/notes.md#dup-05) · high · `bugfix` · M — Token-to-metadata merge written five times; new notes and note title saves lose people, projects and tags · U0409, batch 3B
- [DUP-06](../workstreams/import-export.md#dup-06) · high · `bugfix` · M — Export and import share no schema; the app's own export does not round-trip · U0099, batch 2B
- [DUP-07](../workstreams/activity-comments.md#dup-07) · high · `bugfix` · S — Two todo-to-metadata serializers disagree, so nearly every edit logs spurious activity · U0116, batch 3A
- [DUP-08](../workstreams/notes.md#dup-08) · high · `bugfix` · S — ActionItemsSection hand-rolls a debounce that loses the last edit and logs an edit on every note open · U0653, batch 3B
- [DUP-09](../workstreams/durations.md#dup-09) · high · `bugfix` · M — Duration token formatters and parseDuration disagree: '2h30m', '2d' and '1w' are stored wrong · U0377, batch 2B
- [DUP-10](../workstreams/gantt-scheduling.md#dup-10) · high · `bugfix` · S — Gantt and SprintProgress re-parse the rounded duration display string; two display formatters in TodoModel · U0378, batch 3B
- [DUP-11](../workstreams/dates-time.md#dup-11) · high · `bugfix` · M — Two parallel date parsers: 12 of the 21 Delay options and most auto-assign due dates do nothing · U0548, batch 3A
- [DUP-12](../workstreams/dates-time.md#dup-12) · high · `needs-decision` · M — Date shorthand table implemented twice: chrono reads a Sunday week start as Monday, and 'today' differs · U0547, batch 7B
- [DUP-13](../workstreams/dates-time.md#dup-13) · high · `bugfix` · S — Date-only strings parsed as UTC at three sites despite parseLocalDate; Time Reports custom label shows the previous day · U0416, batch 3A
- [DUP-14](../workstreams/dates-time.md#dup-14) · high · `bugfix` · S — Inline setMonth arithmetic overflows: Calendar, Time Reports 'Last Month' and the Reviews half-year list skip periods · U0328, batch 3A
- [DUP-15](../workstreams/todos-core.md#dup-15) · high · `bugfix` · M — Drag reorder computes positions from the wrong list in both implementations · U0721, batch 3A
- [DUP-16](../workstreams/kanban.md#dup-16) · high · `bugfix` · S — Kanban computes a card's column two ways, so checkbox-completed cards keep their old column's rules · U0219, batch 3B
- [DUP-17](../workstreams/notes.md#dup-17) · high · `bugfix` · S — Bulk-deleting notes deletes only the last selected note · U0703, batch 3B
- [DUP-18](../workstreams/notes.md#dup-18) · high · `bugfix` · S — TodoApp stores the open todo as a model: lookups are repeated and convert-to-todo never opens the new todo · U0460, batch 3B
- [DUP-19](../workstreams/overlays-dialogs.md#dup-19) · high · `needs-decision` · M — TodoDetailsOverlay is mounted four times and the copies have drifted (no sprint picker from Kanban, Gantt or Calendar) · U0212, batch 3C
- [DUP-20](../workstreams/storage-core.md#dup-20) · high · `bugfix` · M — Storage usage measured four ways; the Storage tab under-reports localStorage usage by about half · U0093, batch 2A
- [DUP-21](../workstreams/smart-input.md#dup-21) · high · `bugfix` · S — SmartInput 'Add new' saves people, projects and priorities with a lowercased name · U0506, batch 3A
- [DUP-22](../workstreams/settings.md#dup-22) · high · `needs-decision` · M — Work-hours 'custom schedule' mode is not saved, and hidden custom days still apply · U0309, batch 3B
- [DUP-23](../workstreams/stats-time-focus.md#dup-23) · high · `bugfix` · S — Time Reports print CSS targets an id no element has, so printing shows no report · U0372, batch 3B
- [DUP-24](../workstreams/cross-tab.md#dup-24) · medium · `feature-extension` · L — Collections bypass createSharedStore, so separate browser tabs overwrite each other · U0071, batch 2C
- [DUP-25](../workstreams/entity-names.md#dup-25) · medium · `bugfix` · S — Rename-event subscription duplicated; the in-memory selection history clobbers the storage rewrite · U0569, batch 6A
- [DUP-26](../workstreams/view-state.md#dup-26) · medium · `bugfix` · M — Selection state and the imperative view handle duplicated; the Notes handle leaves a stale selection · U0231, batch 6C
- [DUP-27](../workstreams/settings.md#dup-27) · medium · `bugfix` · M — Settings add and edit forms each written twice; their validation has drifted · U0305, batch 6C
- [DUP-28](../workstreams/activity-comments.md#dup-28) · medium · `bugfix` · M — Comment composer written four times and edit form twice; Activity's edit form accepts empty HTML · U0656, batch 6A
- [DUP-29](../workstreams/overlays-dialogs.md#dup-29) · medium · `bugfix` · M — Add Todo/Person/Project/Sprint dialogs bypass Modal, and their close paths diverge · U0462, batch 3C
- [DUP-30](../workstreams/todos-core.md#dup-30) · medium · `bugfix` · S — Delay dropdown duplicated; TodoItem's backdrop click bubbles up and opens the details overlay · U0200, batch 6A
- [DUP-31](../workstreams/app-shell.md#dup-31) · medium · `bugfix` · S — TodoApp keeps its own feature and tutorial maps beside viewRegistry; the Time tab is missed · U0447, batch 6C
- [DUP-32](../workstreams/keyboard-help.md#dup-32) · medium · `bugfix` · M — View digit shortcuts hard-coded in Help and the tutorial, and wrong under default settings · U0433, batch 3C
- [DUP-33](../workstreams/keyboard-help.md#dup-33) · medium · `bugfix` · S — Focus-mode shortcuts documented in four places, and no two lists agree · U0439, batch 8A
- [DUP-34](../workstreams/dates-time.md#dup-34) · medium · `bugfix` · M — No day primitives in dateUtils: about 40 inline start/end-of-day copies, plus a DST bug in reviewUtils · U0172, batch 6A
- [DUP-35](../workstreams/rich-text-html.md#dup-35) · medium · `bugfix` · S — Regex HTML stripping copied seven times leaks entities into previews, CSV and search · U0584, batch 3B
- [DUP-36](../workstreams/sprints.md#dup-36) · medium · `bugfix` · S — Sprint progress shows the Days percentage unrounded · U0683, batch 3B
- [DUP-37](../workstreams/kanban.md#dup-37) · medium · `needs-decision` · S — Kanban transition check written six times with two different empty-rules semantics · U0154, batch 7B
- [DUP-38](../workstreams/view-state.md#dup-38) · medium · `bugfix` · L — List and Notes view state share the same Set-filter and preset machinery; Kanban shares the codec; a legacy preset is never highlighted · U0250, batch 6C
- [DUP-39](../workstreams/activity-comments.md#dup-39) · medium · `none` · S — Activity entries hand-built 12 times beside two identical helpers · U0181, batch 3A
- [DUP-40](../workstreams/code-hygiene.md#dup-40) · medium · `none` · M — About 59 prev.map update-by-id blocks; reorderTodos and reorderNotes are identical · U0148, batch 7A
- [DUP-41](../workstreams/backup.md#dup-41) · medium · `none` · S — Backup helpers duplicated between storage/backup.ts and useBackups; backup-key test written six ways · U0055, batch 2B
- [DUP-42](../workstreams/dates-time.md#dup-42) · medium · `none` · M — Work-hours schedule precedence written five times; weekday-name arrays seven times · U0546, batch 3B
- [DUP-43](../workstreams/dates-time.md#dup-43) · medium · `none` · S — Local YYYY-MM-DD / YYYY-MM-DDTHH:mm formatting written inline about 20 times · U0334, batch 7B
- [DUP-44](../workstreams/durations.md#dup-44) · medium · `none` · S — Display formatDuration copied five times and formatElapsed once; the shared versions have no importers · U0376, batch 7B
- [DUP-45](../workstreams/rich-text-html.md#dup-45) · medium · `none` · M — Link-pattern matching and URL sanitising copied four times; Links chips copied twice · U0801, batch 4
- [DUP-46](../workstreams/smart-input.md#dup-46) · medium · `none` · M — autoDetection's four detectors copy the stopword list, alias map and context-match loop · U0515, batch 7B
- [DUP-47](../workstreams/entity-names.md#dup-47) · medium · `needs-decision` · M — Entity colour and category lookup uses three matching rules (exact, case-insensitive, no aliases) · U0746, batch 6A
- [DUP-48](../workstreams/entity-names.md#dup-48) · medium · `needs-decision` · M — Note peopleMap/projectsMap are keyed by entity id, but note references hold names · U0582, batch 6A
- [DUP-49](../workstreams/activity-comments.md#dup-49) · medium · `needs-decision` · M — Reference-change activity diff copied for notes; the todo copy uses stale marker symbols · U0181, batch 3A
- [DUP-50](../workstreams/dates-time.md#dup-50) · medium · `needs-decision` · M — Week and month ranges computed in six places from three week-start sources · U0601, batch 7B
- [DUP-51](../workstreams/feedback-states.md#dup-51) · medium · `feature-extension` · S — The storage-recovery rescue file cannot be restored through any import path · U0038, batch 2B
- [DUP-52](../workstreams/app-shell.md#dup-52) · medium · `none` · S — Convert-to-todo and delete-confirm handlers copied in TodoApp; person/project delete twins · U0483, batch 8A
- [DUP-53](../workstreams/app-shell.md#dup-53) · medium · `none` · S — TodoActionProps values and time-tracking gating repeated at five mounts; the overlay re-declares the props · U0478, batch 8A
- [DUP-54](../workstreams/todos-core.md#dup-54) · medium · `none` · M — Swipe gesture state machine copied into three item components · U0194, batch 7B
- [DUP-55](../workstreams/visual-system.md#dup-55) · medium · `none` · M — About 25 hand-rolled action buttons duplicate IconButton variants · U0201, batch 8C
- [DUP-56](../workstreams/view-state.md#dup-56) · medium · `none` · M — Filter panel and marker-colour mapping duplicated between ListView and NotesView · U0233, batch 7B
- [DUP-57](../workstreams/view-state.md#dup-57) · medium · `needs-decision` · M — Bulk-action toolbar and quick-filter bar are twins in ListView and NotesView · U0235, batch 7B
- [DUP-58](../workstreams/view-state.md#dup-58) · medium · `none` · M — ListViewToolbar and NotesViewToolbar are about 95% the same file; the Help sort list has drifted · U0203, batch 7B
- [DUP-59](../workstreams/kanban.md#dup-59) · medium · `none` · M — Kanban hand-rolls its filter chip sections and preset chip rows · U0225, batch 7B
- [DUP-60](../workstreams/overlays-dialogs.md#dup-60) · medium · `needs-decision` · M — Five more modal shells bypass Modal: SavePresetModal, two KanbanTab modals, ConfirmDialog, Kanban preset modal · U0226, batch 3C
- [DUP-61](../workstreams/gantt-scheduling.md#dup-61) · medium · `none` · M — GanttView repeats control groups, lookup tables and timeline fragments · U0346, batch 7B
- [DUP-62](../workstreams/code-hygiene.md#dup-62) · medium · `none` · S — TodoItem prop bundle repeated five times; ListView re-implements SectionHeader · U0245, batch 7A
- [DUP-63](../workstreams/sprints.md#dup-63) · medium · `none` · S — SprintsView re-implements EntityListView; SprintItem's count props and fallback branch are dead · U0362, batch 7B
- [DUP-64](../workstreams/smart-input.md#dup-64) · medium · `needs-decision` · L — MarkedText and SmartInput each have their own tokenizer, and they disagree · U0498, batch 7B
- [DUP-65](../workstreams/settings.md#dup-65) · medium · `none` · M — WorkHoursTab writes its schedule editor twice; the per-day copy inlines all break logic · U0310, batch 7B
- [DUP-66](../workstreams/todos-core.md#dup-66) · medium · `needs-decision` · M — Priority, Duration and Recurring in task details are three hand-copied single-value fields · U0426, batch 7B
- [DUP-67](../workstreams/stats-time-focus.md#dup-67) · medium · `none` · M — FocusView and OpenFocusView repeat the same screen chrome · U0395, batch 7B
- [DUP-68](../workstreams/settings.md#dup-68) · medium · `needs-decision` · M — Three hand-written toggle-switch styles in settings, none with an accessible name · U0273, batch 8B
- [DUP-69](../workstreams/settings.md#dup-69) · medium · `feature-extension` · S — GeneralTab writes 11 feature toggles by hand; Notes and Reviews flags have no toggle · U0262, batch 3C
- [DUP-70](../workstreams/settings.md#dup-70) · medium · `needs-decision` · S — AutoAssignField re-implements SearchableDropdown without keyboard navigation · U0313, batch 7B
- [DUP-71](../workstreams/view-state.md#dup-71) · low · `needs-decision` · L — Kanban filter and sort logic re-implements useListViewState with edge-case differences · U0216, batch 7B
- [DUP-72](../workstreams/view-state.md#dup-72) · low · `none` · S — Sort comparators and multi-value grouping copied within and across the view-state hooks · U0257, batch 7B
- [DUP-73](../workstreams/code-hygiene.md#dup-73) · low · `none` · S — Priority name-or-alias lookup implemented four times · U0130, batch 6A
- [DUP-74](../workstreams/entity-names.md#dup-74) · low · `none` · S — matchesAnyName rebuilt in four places; person and project note-creation handlers are twins · U0414, batch 6A
- [DUP-75](../workstreams/entity-names.md#dup-75) · low · `none` · S — MarkedText and SmartInput copy the colour lookups (behaviour-preserving subset) · U0746, batch 6A
- [DUP-76](../workstreams/code-hygiene.md#dup-76) · low · `none` · S — Regex escaping copied 15 times; HTML escaping twice · U0802, batch 7A
- [DUP-77](../workstreams/strings.md#dup-77) · low · `none` · S — pluralize exists, yet plural ternaries are inlined about 45 times · U0751, batch 9
- [DUP-78](../workstreams/activity-comments.md#dup-78) · low · `none` · S — useSprints re-implements the shared comment-mutation helpers · U0565, batch 7B
- [DUP-79](../workstreams/sprints.md#dup-79) · low · `none` · S — useSprints repeats one transition shape five times; daysRemaining re-derives daysElapsed · U0575, batch 7B
- [DUP-80](../workstreams/code-hygiene.md#dup-80) · low · `none` · S — Id generation bypasses idGenerator and the model createId methods · U0757, batch 7A
- [DUP-81](../workstreams/code-hygiene.md#dup-81) · low · `none` · S — useEntityManager takes createModels twice and never uses it; entity shapes declared twice · U0557, batch 7A
- [DUP-82](../workstreams/settings.md#dup-82) · low · `none` · S — useSettings: 11 section-merge updaters and three add/update/delete triples with identical bodies · U0318, batch 7B
- [DUP-83](../workstreams/logging-diagnostics.md#dup-83) · low · `none` · S — The two storage adapters repeat identical try/log/rethrow wrappers per method · U0075, batch 9
- [DUP-84](../workstreams/code-hygiene.md#dup-84) · low · `none` · M — Comment, activity and date-display helpers copied across four models · U0163, batch 7A
- [DUP-85](../workstreams/search.md#dup-85) · low · `bugfix` · S — useKeyboardNavigation duplicated in CommandPalette; the hook divides by zero · U0727, batch 7B
- [DUP-86](../workstreams/pwa-service-worker.md#dup-86) · low · `none` · S — useServiceWorker clearCache and getVersion duplicate the MessageChannel request; neither has a production caller · U0046, batch 5
- [DUP-87](../workstreams/code-hygiene.md#dup-87) · low · `none` · S — sortByUsage and sortStringsByUsage are the same comparator twice · U0735, batch 7A
- [DUP-88](../workstreams/kanban.md#dup-88) · low · `bugfix` · S — Move up/down written three times; KanbanTab swaps by raw array index · U0298, batch 11
- [DUP-89](../workstreams/stats-time-focus.md#dup-89) · low · `bugfix` · S — Focus-mode list operations duplicated; one copy produces duplicate order values · U0410, batch 7B
- [DUP-90](../workstreams/settings.md#dup-90) · low · `bugfix` · S — AutoAssignTab sorts the shared settings priorities array in place · U0268, batch 11
- [DUP-91](../workstreams/visual-system.md#dup-91) · low · `bugfix` · S — Colour fallbacks hard-coded and drifted; People/Projects list swatches ignore marker colours · U0744, batch 8C
- [DUP-92](../workstreams/import-export.md#dup-92) · low · `bugfix` · S — File download and FileReader logic written twice; the backup download revokes its URL immediately · U0100, batch 2B
- [DUP-93](../workstreams/code-hygiene.md#dup-93) · low · `needs-decision` · S — Two byte-size formatters that disagree · U0015, batch 7A
- [DUP-94](../workstreams/code-hygiene.md#dup-94) · low · `none` · S — Relative-time and date-time formatters re-implemented in components · U0015, batch 7A
- [DUP-95](../workstreams/smart-input.md#dup-95) · low · `needs-decision` · S — Suggestion vocabularies duplicated four ways · U0513, batch 7B
- [DUP-96](../workstreams/code-hygiene.md#dup-96) · low · `none` · S — Runtime base-path detection copied three times · U0759, batch 7A
- [DUP-97](../workstreams/dates-time.md#dup-97) · low · `none` · S — Ordinal suffix and month/day name arrays duplicated · U0544, batch 7B
- [DUP-98](../workstreams/import-export.md#dup-98) · low · `none` · S — exportTodos and exportNotes repeat the format, mime and download plumbing · U0096, batch 7B
- [DUP-99](../workstreams/rich-text-html.md#dup-99) · low · `none` · M — Rich-text block conversions and RichTextEditor toolbar code repeat one skeleton · U0803, batch 7B
- [DUP-100](../workstreams/gantt-scheduling.md#dup-100) · low · `none` · S — ganttScheduler and chronoCustom repeat blocks within the same file · U0383, batch 7B
- [DUP-101](../workstreams/smart-input.md#dup-101) · low · `none` · S — SmartInput repeats its content-replace, caret and duration-string code · U0501, batch 7B
- [DUP-102](../workstreams/stats-time-focus.md#dup-102) · low · `none` · S — FocusView repeats its state-transition and time-tracking code · U0395, batch 7B
- [DUP-103](../workstreams/notifications.md#dup-103) · low · `none` · S — Notification-permission handling written three times · U0300, batch 7B
- [DUP-104](../workstreams/stats-time-focus.md#dup-104) · low · `none` · S — The ambient-sound select written four times; FocusTab duplicates the phase blocks · U0280, batch 7B
- [DUP-105](../workstreams/settings.md#dup-105) · low · `none` · S — Three settings tabs paste tooltips that already exist in tooltipContent · U0281, batch 7B
- [DUP-106](../workstreams/settings.md#dup-106) · low · `none` · M — About 19 settings number fields and 18 checkbox rows hand-built with drifting classes · U0283, batch 6C
- [DUP-107](../workstreams/gantt-scheduling.md#dup-107) · low · `none` · S — GanttTab repeats the technique header and preset-chip group per technique · U0282, batch 7B
- [DUP-108](../workstreams/visual-system.md#dup-108) · low · `needs-decision` · M — Colour picker rows re-implemented instead of ColorPicker · U0419, batch 8C
- [DUP-109](../workstreams/visual-system.md#dup-109) · low · `none` · S — StorageTab and NotificationsTab rebuild NoticeBox; its variant type excludes its own danger styles · U0035, batch 8C
- [DUP-110](../workstreams/visual-system.md#dup-110) · low · `none` · M — Inline SVGs duplicate Icons.tsx; Icons.tsx defines three pairs of identical icons · U0424, batch 8C
- [DUP-111](../workstreams/notes.md#dup-111) · low · `needs-decision` · S — NotesView defines a local PinIcon with a different glyph from the shared one · U0699, batch 7B
- [DUP-112](../workstreams/smart-input.md#dup-112) · low · `needs-decision` · M — The marker reference (@ $ % !! #) written seven times with drifting colours and content · U0441, batch 7B
- [DUP-113](../workstreams/keyboard-help.md#dup-113) · low · `none` · M — Help sections repeat the same presentational markup dozens of times · U0440, batch 8A
- [DUP-114](../workstreams/overlays-dialogs.md#dup-114) · low · `bugfix` · S — Modal headers and close buttons hand-built eight times; two have no accessible name · U0392, batch 8A
- [DUP-115](../workstreams/code-hygiene.md#dup-115) · low · `none` · S — Field headings with icon and tooltip hand-built throughout the detail overlays · U0672, batch 7A
- [DUP-116](../workstreams/code-hygiene.md#dup-116) · low · `none` · S — EntityMetadataFields renders four near-identical MetadataSection blocks · U0661, batch 7A
- [DUP-117](../workstreams/todos-core.md#dup-117) · low · `none` · S — CreateTemplateModal and BatchEditModal repeat one field row seven or eight times · U0688, batch 7B
- [DUP-118](../workstreams/settings.md#dup-118) · low · `none` · S — StorageTab's migrate handlers and sub-tab bar duplicate code · U0034, batch 7B
- [DUP-119](../workstreams/search.md#dup-119) · low · `none` · S — NoteDetailView repeats its change check; the usage-history selections mapping is written four times · U0695, batch 7B
- [DUP-120](../workstreams/settings.md#dup-120) · low · `none` · S — DateTimeTab repeats its time fields and weekday and month option lists · U0276, batch 7B
- [DUP-121](../workstreams/app-shell.md#dup-121) · low · `none` · S — ViewTabs wraps each icon in a one-line component · U0449, batch 8A
- [DUP-122](../workstreams/code-hygiene.md#dup-122) · low · `none` · S — EntityCounts type declared four times · U0187, batch 7A
- [DUP-123](../workstreams/stats-time-focus.md#dup-123) · low · `none` · M — Statistics and Time Reports repeat presentational blocks and lookup tables · U0366, batch 7B
- [DUP-124](../workstreams/visual-system.md#dup-124) · low · `none` · M — Small presentational pieces repeated across item components · U0190, batch 8C
- [DUP-125](../workstreams/reviews.md#dup-125) · low · `needs-decision` · S — Review views duplicate the entry header and render the state badge three ways · U0707, batch 7B
- [DUP-126](../workstreams/reviews.md#dup-126) · low · `none` · S — ReviewsView writes four period sections and five setters by hand · U0715, batch 7B
- [DUP-127](../workstreams/visual-system.md#dup-127) · low · `needs-decision` · S — Priority-to-colour mapping hard-coded three ways, ignoring configured colours · U0198, batch 8C
- [DUP-128](../workstreams/undo-confirm.md#dup-128) · low · `none` · S — Undo stack wiring and messages repeated per view · U0248, batch 7B
- [DUP-129](../workstreams/visual-system.md#dup-129) · low · `needs-decision` · S — View headers hand-rolled six times; empty states only loosely resemble EmptyState · U0705, batch 8C
- [DUP-130](../workstreams/view-state.md#dup-130) · low · `none` · S — Per-key persisted-option setters are boilerplate in six views · U0731, batch 7B

## Commit groupings suggested by the reviewer

Superseded by the work units where they differ; kept because they show what the reviewer expected to land together.

- **Storage backend correctness** — DUP-02, DUP-03, DUP-83. The migration flag fix must precede the type fix that exposes the switch button, and the adapter wrapper lands with the new type property.
- **Persistence base hook** — DUP-01. An L item: split it into a usePersistedState commit and a hook-migration commit if it passes about 800 lines.
- **Shared-store collections** — DUP-24. Cross-tab safety; it lands only if the owner chooses it as the persistence base.
- **Entity lifecycle and collection helpers** — DUP-04, DUP-40. The undo fix and updateById/applyOrder touch the same hook bodies.
- **Activity and sprint helpers** — DUP-39, DUP-78, DUP-79, DUP-80. withActivity and createActivityEntry feed the sprint transition, comment and id cleanups in the same files.
- **Todo metadata serializer** — DUP-07. A small, high-value fix with a reproducer test that other metadata work builds on.
- **Duration grammar** — DUP-09, DUP-10. One utils/duration.ts module and its consumers.
- **Note metadata save paths** — DUP-05, DUP-119. Both rewrite the NoteDetailView and TodoDetailsOverlay save handlers.
- **Export/import interchange** — DUP-06, DUP-98. Both reshape export.ts and import.ts.
- **Action item autosave** — DUP-08. An isolated high bugfix.
- **Date parsing unification** — DUP-11, DUP-12. One resolver table and one parser fallback.
- **Date primitives** — DUP-13, DUP-14, DUP-34, DUP-43. Shared dateUtils additions; split into a utils/models commit and a components commit if it is too large.
- **Schedule and week helpers** — DUP-42, DUP-50, DUP-97. getScheduleForDate, week ranges and weekday constants live together in dateUtils.
- **Drag reorder and selection** — DUP-15, DUP-26. Both generalise ListView/NotesView interaction state into hooks.
- **Kanban rules** — DUP-16, DUP-37. Column id and transition check are the same Kanban domain helper module.
- **Notes bulk actions** — DUP-17, DUP-57. Land the single-confirm fix with, or just before, the shared BulkActionToolbar.
- **TodoApp details overlay** — DUP-18, DUP-19, DUP-52, DUP-53. The id-based overlay state, single mount, handler helpers and the todoActionProps memo all rewrite the same TodoApp region.
- **Dialogs on Modal** — DUP-29, DUP-60, DUP-114. These share Modal's new closeOnBackdrop prop and ModalHeader.
- **Storage tab** — DUP-20, DUP-93, DUP-118, DUP-109. All four rework StorageTab.tsx.
- **SmartInput cleanup** — DUP-21, DUP-75, DUP-76, DUP-101. These touch the same SmartInput regions; escapeRegex moves at the same time.
- **Work hours** — DUP-22, DUP-65. The persisted mode and the extracted ScheduleEditor change the same tab.
- **Time reports and statistics** — DUP-23, DUP-123, DUP-44. The print fix, the shared metric components and formatDuration adoption all touch both report views.
- **Rename sync and usage sorting** — DUP-25, DUP-87. useSelectionHistory changes in both.
- **Settings forms** — DUP-27, DUP-88, DUP-106. Shared settings form primitives and the add/edit merge; split per tab if it gets large.
- **Comments and field headings** — DUP-28, DUP-115. ActivitySection adoption brings FieldHeading with it.
- **Todo row and delay menu** — DUP-30, DUP-62. DelayMenu and the renderTodoItem helpers change the same ListView/Calendar row markup.
- **Item gestures and badges** — DUP-54, DUP-124. Both touch the three item components.
- **Registry-driven views** — DUP-31, DUP-32, DUP-69. All three derive from viewRegistry.
- **Help content** — DUP-33, DUP-112, DUP-113. The help primitives, marker definitions and focus shortcut constants land together.
- **Plain text and model helpers** — DUP-35, DUP-84. htmlToPlainText is consumed by the model record helpers.
- **Sprints** — DUP-36, DUP-63. Sprint view and progress cleanups.
- **List/notes filter state** — DUP-38, DUP-72. Filter codec and ordering helpers for both view-state hooks.
- **Kanban filter semantics** — DUP-71. Needs a decision and characterisation tests first.
- **Backups** — DUP-41, DUP-51, DUP-92. These share backup.ts helpers and downloadFile.
- **Link patterns** — DUP-45. Security-relevant; reviewed on its own.
- **Auto-detection** — DUP-46. Self-contained within autoDetection.ts.
- **Entity lookup cleanup (no behaviour change)** — DUP-73, DUP-74, DUP-122. Pure delegation to the existing resolvers.
- **Entity matching rule (owner decision)** — DUP-47, DUP-48, DUP-91, DUP-127. Colour and name-resolution semantics decided together.
- **Reference activity diff** — DUP-49. Changes the activity log text; needs a decision.
- **Icons and buttons** — DUP-55, DUP-110, DUP-111, DUP-121. The IconButton extension and the Icons.tsx additions.
- **List/notes toolbars** — DUP-56, DUP-58. Generic ViewToolbar and FilterPanel for both views.
- **Kanban chips** — DUP-59. KanbanView-local UI extraction.
- **Gantt view** — DUP-61. GanttView-local tables and components.
- **Option setters and settings updaters** — DUP-130, DUP-82. Section and option setter boilerplate.
- **Unified tokenizer** — DUP-64. An L needs-decision item, alone.
- **Details fields** — DUP-66, DUP-116, DUP-117. Metadata field-row components.
- **Focus mode** — DUP-67, DUP-102, DUP-103, DUP-104, DUP-89. All in the focus overlays and settings.
- **Settings toggles** — DUP-68. Accessible ToggleSwitch across three tabs.
- **Auto-assign** — DUP-70, DUP-90, DUP-95. AutoAssignTab and AutoAssignField.
- **Small hooks** — DUP-81, DUP-85, DUP-86. Independent low-risk hook cleanups.
- **Formatters** — DUP-77, DUP-94, DUP-96. pluralize, date-time and base-path helpers.
- **Rich text** — DUP-99. Deferred until the editor rewrite settles.
- **Scheduler internals** — DUP-100. File-local helpers.
- **Gantt settings tab** — DUP-105, DUP-107, DUP-108. Settings tooltips, technique sections and colour pickers.
- **Date/time settings** — DUP-120. DateTimeTab option tables.
- **Reviews** — DUP-125, DUP-126, DUP-128. Review views and undo wiring.
- **View headers** — DUP-129. ViewHeader across six views.

## Dependencies

Inside this dimension:
- DUP-02 lands before or with DUP-03.
- Decide DUP-24 before DUP-01; DUP-130 follows DUP-01.
- DUP-04 lands before DUP-40, so updateById never meets duplicate ids. DUP-40 provides applyOrder for DUP-15.
- DUP-39 lands before DUP-79.
- DUP-07 lands before DUP-49 and before DUP-43's TodoModel part.
- DUP-09 lands before DUP-10 and DUP-95's duration list.
- DUP-42 lands before DUP-22 (the resolver must honour the mode) and before DUP-50 and DUP-97.
- DUP-11 and DUP-12 land before DUP-34, because both edit dateUtils.
- DUP-18 lands before DUP-19 and DUP-52.
- DUP-17 lands before or with DUP-57; DUP-26 goes with DUP-57.
- DUP-38 lands before DUP-59 (Kanban adopts the codec) and before DUP-71.
- DUP-35 lands before DUP-84.
- DUP-47 lands after DUP-73, DUP-74 and DUP-75, which are behaviour-preserving.
- DUP-28 lands before DUP-115; DUP-29 before DUP-60 and DUP-114.
- DUP-55 lands before DUP-124.
- DUP-112's popover lands after DUP-28.
- DUP-41 lands before DUP-51.

Against other dimensions:
- Dead-code removal should run first, or in the same commits, for DUP-05 (TodoItem's unreachable edit branch), DUP-28 (Comments.tsx), DUP-63 (SprintItem fallback), DUP-84 (unused model members), DUP-86 (useServiceWorker), DUP-94, DUP-95, DUP-127 (_getPriorityColor) and DUP-09 (_parseDuration). It also covers ListView's _selectAllInSection, IndexedDB isOpening, ganttScheduler _todayStr, StatisticsView monthAgo, colors.ts defaulters, parseDateWithCustomChrono and formatDetectedDate.
- Logic and business-logic bugs overlaps 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 36, 85, 88, 89 and 90. Fix each defect once: in the consolidated helper where one exists, otherwise in the bug dimension, with the reproducer test owned by whichever lands first.
- Error, validation and other string messages: DUP-27 (validation), DUP-52 (undo sentence), DUP-67 and DUP-33 (wording), DUP-77 (pluralize), DUP-125 (state labels) and DUP-49 (activity text). Touch each file once, and let the messages work set the wording.
- Missing, wrong or out-of-date logging: DUP-83 owns the adapter log policy, DUP-01 must log load failures without saving, and DUP-86 keeps its warn strings.
- UI design review: DUP-28, 55, 57, 60, 66, 68, 108, 111, 125 and 129 need the visual decisions that review should make first.
- Restructuring for consistency and inconsistencies across the codebase overlap DUP-42, 50, 58 and 80. Agree on module homes (src/utils/dateUtils, src/utils/duration.ts, src/utils/kanban.ts, src/types/markers.ts) before extraction.
- Partly implemented features: DUP-28 (todo comment edit/delete), DUP-02 (persistent backend switch), DUP-51, DUP-69 and DUP-24 are completions that need the owner's go-ahead.
- Security review: DUP-45 (single sanitised link path) should land early and be reviewed by that dimension.
- Opportunities to improve support: DUP-51 (recovery file) and DUP-20 (storage warning).
- Documentation cleanup: DUP-44 (the stale 'Used by' comments), DUP-58 (the Help sort list) and DUP-32. Update docs/ for any new utility modules.

## Open questions

- [ ] DUP-01/DUP-24: should collections move onto createSharedStore (cross-tab safety, 300ms coalesced writes), or should usePersistedState be hardened as the single base?
- [ ] DUP-02: should 'Switch to localStorage' persist across reloads? That needs a stored preference read by initializeStorage. Or should the button be removed while IndexedDB is available?
- [ ] DUP-05: should a note title edit add its @/$/%/# markers to the existing metadata or replace it? And should auto-detected (unmarked) names in a note title still be added, as they are today?
- [ ] DUP-09: is a 'd' duration an 8-hour workday or 24 hours, and does 'm' after a number in the suggestion lists mean months or minutes?
- [ ] DUP-12: should a bare 'today' typed in SmartInput resolve to work-hours end of day (17:00 default), like Delay, or stay at the evening time (19:00)?
- [ ] DUP-19: should Kanban keep closing the details overlay after toggle, delete or archive once there is a single overlay?
- [ ] DUP-22: which persisted shape for the work-hours schedule mode (an explicit scheduleMode field, or derived from customSchedules)?
- [ ] DUP-37: when all Kanban transition rules are cleared, are transitions unrestricted (current drag behaviour) or forbidden (current timer behaviour)?
- [ ] DUP-47/DUP-48: should entity lookups everywhere be case-insensitive and alias-aware, and should notes display and group by the canonical entity name?
- [ ] DUP-49: which notation should activity entries use for recurring patterns once '%' means projects?
- [ ] DUP-50: should Calendar and Gantt week starts follow dateTime.workWeekStart, keep their own setting, or (Gantt) stay on Monday?
- [ ] DUP-57: which Restore icon, and should 'Select all' in the todo list include hidden and archived items as it does now?
- [ ] DUP-64: which detection order and colour fallback becomes the single tokenizer rule?
- [ ] DUP-66: may the misleading '%every day' and '*2h' suggestion labels drop their prefixes?
- [ ] DUP-68/DUP-108/DUP-129/DUP-28: may toggle switches, colour pickers, empty states and comment composers be visually unified, or must each keep its current pixels?
- [ ] DUP-93/DUP-125: which byte format ('1.46 KB' vs '1.5 KB') and which review label ('Complete' vs 'Completed')?
- [ ] DUP-127/DUP-111: may Statistics and Calendar use the configured priority colours, and NotesView the shared pin glyph?
- [ ] DUP-28: should todo comments become editable and deletable in the UI, since useTodos already provides editTodoComment and deleteTodoComment?
- [ ] DUP-69: should Notes and Reviews get feature toggles in General settings?

## Dropped during synthesis

- Statistics/Time Reports finding: 'custom period label is a day early' — Not dropped, but split: the label bug is merged into DUP-13 and the presentational duplication is DUP-123 (lowered to low once the bug was separated).
- Views finding: 'Kanban hand-rolls filter chips, preset chips, (de)serialisation and the preset modal' — Split across DUP-38 (serialisation), DUP-59 (chips) and DUP-60 (preset modal).
- Views finding: 'NoteDetailView duplicates its change check, the marker popover and the comment composer' — Split across DUP-119 (change check), DUP-112 (popover) and DUP-28 (composer).
- Views finding: 'Day and week boundary maths written inline; week start computed five ways' — Split across DUP-34 (day primitives), DUP-50 (week start) and DUP-61 (Gantt's duplicated day bounds).
- Views finding: 'Formatting helpers re-declared locally' — Split across DUP-44 (formatDuration), DUP-43 (formatDateKey) and DUP-77 (pluralize).
- Hooks finding: 'TodoModel re-implements formatDateKey, its own duration display and formatDuration' — Split across DUP-43, DUP-10 and DUP-44.
- Hooks finding: 'Activity entries hand-built 11 times; sprints re-implement comment mutations' — Split into DUP-39 and DUP-78.
- Overlays finding: 'MarkedText and SmartInput copy findByNameOrAlternatives, escapeRegex and colour lookups' — Split into DUP-75 (lookups) and DUP-76 (escaping).
- Utils finding: 'Storage usage measured four ways' formatBytes part — Moved to DUP-93; the rest is merged into DUP-20.
- Sub-claim: StatisticsView monthAgo as a setMonth overflow site — The verifier showed it is never read, so it is dead code rather than a bug; it is routed to the dead-code dimension.
- Sub-claim: nextquarter/nexthalf '&lt;' vs '&lt;=' divergence between the shorthand tables — The verifier showed the difference is unobservable.
- Sub-claim: Kanban priority sort affected by alias matching — The verifier showed the compared value is always the canonical name.
- Sub-claim: FocusView close, sound and bell buttons lack accessible names — The verifier showed their title attributes provide the name; DUP-67 keeps only the duplication and wording.
- Sub-claim: the 'Gantt and StatisticsView' near-copies of TodoItem's unreachable inline edit as a migration target — Both slices agree the TodoItem branch is dead; DUP-05 routes its deletion to the dead-code dimension instead of migrating it.

## Coverage gaps

No slice failed, and every slice reported surviving findings with no refutations.

Areas no reviewer actually read:
- src/app: layout.tsx and settings/page.tsx were read only at the cited lines; page.tsx, error.tsx and globals.css were not read.
- src/components/providers: StorageInitializer.tsx and ThemeProvider.tsx were not read; ServiceWorkerProvider.tsx was glimpsed only.
- src/types: most files were spot-read only at cited lines.
- Icons.tsx was searched for duplicate paths, not read line by line.
- Help sections, partly read: QuickStartSection after line 200, WorkflowsSection after 60, AdvancedSection after 40 and SettingsSection after 50. FilteringSection, PeopleProjectsSection and ProductivityTechniquesSection were only skimmed.
- Utils, unread ranges: ganttScheduler.ts lines 810-1256, recurringParser.ts parse branches 130-290, richText/selection.ts (except collapseTo), keyHandlers.ts 270-463, richText/blocks.ts outside 60-230 and the first 60 lines of notifications.ts.
- storage/migrations.ts beyond fixPriorityId and the migrate functions.
- utils/renameReferences and cascadeEntityRename were read only by the utils slice and not cross-checked against the hooks.
- Not reviewed at all: public/sw.js, scripts/, .github/workflows and docs/.
- All roughly 25k lines of Jest tests and the e2e specs (only grepped for test ids). Duplication inside the test suites, such as fixtures and helpers, was not reviewed.

Missing tests that the consolidations depend on: there are no unit tests for src/components/views, useNotes, useReviews, usePersistedState, useViewPresets, useBackups, useDragReorder, NoteModel or ReviewModel.
