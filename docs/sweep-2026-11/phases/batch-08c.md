# Batch 8C — UI: visual system and view usability

49 units, 61 items: 0 high, 21 medium, 28 low. 20 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## Medium priority

- [ ] **U0019** Explain backup count and size caps and confirm lowering retention · ux · medium · `none` · S · [backup](../workstreams/backup.md#u0019) · UX-65
- [ ] **U0002** Unlock installed-app orientation in the web manifest · ux · medium · `needs-decision` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0002) · MSG-87, SUP-50 · **question**
- [ ] **U0289** Preview the tasks that Auto-Delete will remove before enabling it · ux · medium · `feature-extension` · S · [undo-confirm](../workstreams/undo-confirm.md#u0289) · UX-63
- [ ] **U0477** Set one confirmation and undo policy for deleting every entity · ux · medium · `needs-decision` · M · [undo-confirm](../workstreams/undo-confirm.md#u0477) · INC-55 · **question**
- [ ] **U0710** Guard review completion against misclicks · ux · medium · `needs-decision` · S · [reviews](../workstreams/reviews.md#u0710) · UX-33 · **question**
- [ ] **U0339** Let Calendar week and agenda views open task details · ux · medium · `feature-extension` · M · [calendar](../workstreams/calendar.md#u0339) · UX-38
- [ ] **U0301** Report notification test failures and permission errors to the user · ux · medium · `bugfix` · S · [notifications](../workstreams/notifications.md#u0301) · LOG-22
- [ ] **U0264** Put the active settings tab in the URL and add tab search · ux · medium · `feature-extension` · M · [settings](../workstreams/settings.md#u0264) · UX-61
- [ ] **U0206** Replace the abc/cba sort toggle with a shared SortDirectionButton · ux · medium · `none` · S · [view-state](../workstreams/view-state.md#u0206) · UX-87
- [ ] **U0208** Give Save view its own icon and a neutral button style · ux · medium · `none` · S · [view-state](../workstreams/view-state.md#u0208) · UX-86
- [ ] **U0204** Use SearchInput for every view's search field with real labels · ux · medium · `none` · M · [search](../workstreams/search.md#u0204) · UX-88
- [ ] **U0465** Add a visible header search button for the command palette · ux · medium · `feature-extension` · S · [search](../workstreams/search.md#u0465) · UX-93
- [ ] **U0789** Make the rich-text Link action work without selection and allow editing · ux · medium · `feature-extension` · M · [rich-text-html](../workstreams/rich-text-html.md#u0789) · UX-52, MSG-84
- [ ] **U0201** Extend IconButton and migrate the hand-rolled item action buttons · dedup · medium · `none` · M · [visual-system](../workstreams/visual-system.md#u0201) · DUP-55
- [ ] **U0475** Rebalance header create buttons and keep labels visible on mobile · ux · medium · `needs-decision` · S · [visual-system](../workstreams/visual-system.md#u0475) · UX-85 · **question**
- [ ] **U0476** Introduce a shared Button primitive and adopt it across the app · dedup · medium · `none` · L · [visual-system](../workstreams/visual-system.md#u0476) · UX-91
- [ ] **U0657** Define semantic tone maps once in tones.ts and adopt everywhere · ux · medium · `needs-decision` · M · [visual-system](../workstreams/visual-system.md#u0657) · UX-84 · **question**
- [ ] **U0658** Give removable chips one pattern: click edits, labelled button removes · ux · medium · `needs-decision` · M · [visual-system](../workstreams/visual-system.md#u0658) · UX-66 · **question**
- [ ] **U0766** Introduce semantic colour tokens and migrate shared primitives to them · restructure · medium · `none` · L · [visual-system](../workstreams/visual-system.md#u0766) · UX-90
- [ ] **U0768** Resolve the Arial body font overriding the loaded Geist Sans · ux · medium · `needs-decision` · S · [visual-system](../workstreams/visual-system.md#u0768) · INC-82, UX-89, DEAD-53 · **question**
- [ ] **U0786** Give marker-colour chips a dark-mode treatment via a CSS variable · ux · medium · `needs-decision` · M · [visual-system](../workstreams/visual-system.md#u0786) · UX-82 · **question**

## Low priority

- [ ] **U0033** Confirm storage backend switch and show its warning first · ux · low · `bugfix` · S · [storage-core](../workstreams/storage-core.md#u0033) · UX-120
- [ ] **U0018** Show backup contents per row and offer restore after importing · ux · low · `feature-extension` · S · [backup](../workstreams/backup.md#u0018) · SUP-71
- [ ] **U0423** Fix task details mobile timestamps and move destructive actions to a footer · ux · low · `none` · S · [todos-core](../workstreams/todos-core.md#u0423) · UX-123
- [ ] **U0359** Clarify Gantt mobile abbreviations, long-span durations and tooltip placement · ux · low · `none` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0359) · UX-111
- [ ] **U0360** Show Gantt activity badge only for real activity and pluralise it · ux · low · `bugfix` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0360) · LOG-62 · **question**
- [ ] **U0368** Decide whether Statistics hides time-tracking cards when tracking is off · ux · low · `needs-decision` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0368) · PART-64 · **question**
- [ ] **U0406** Guard against accidentally ending or discarding a running focus session · ux · low · `needs-decision` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0406) · UX-96 · **question**
- [ ] **U0288** Show a Saved status for instant-apply settings · ux · low · `none` · S · [settings](../workstreams/settings.md#u0288) · UX-127
- [ ] **U0312** Warn about impossible work-hour and time-block ranges · ux · low · `none` · S · [settings](../workstreams/settings.md#u0312) · UX-128
- [ ] **U0251** Define consistent default orders for entity lists, reviews and groups · ux · low · `needs-decision` · S · [view-state](../workstreams/view-state.md#u0251) · INC-76 · **question**
- [ ] **U0255** Decide whether quick-filter counts reflect search and panel filters · ux · low · `needs-decision` · S · [view-state](../workstreams/view-state.md#u0255) · UX-112 · **question**
- [ ] **U0261** Agree one convention for showing archived items across views · ux · low · `needs-decision` · M · [view-state](../workstreams/view-state.md#u0261) · INC-74 · **question**
- [ ] **U0179** Reconcile activity type unions, icons and tooltips with actual writers · ux · low · `none` · S · [activity-comments](../workstreams/activity-comments.md#u0179) · LOG-66
- [ ] **U0035** Add danger and neutral NoticeBox variants and adopt them in StorageTab · dedup · low · `none` · M · [visual-system](../workstreams/visual-system.md#u0035) · DUP-109, STRUCT-96
- [ ] **U0190** Extract ArchivedBadge, MiniProgress and ColorChip from the item components · dedup · low · `none` · M · [visual-system](../workstreams/visual-system.md#u0190) · DUP-124
- [ ] **U0198** Resolve priority colours through one getPriorityColor helper in every view · bugfix · low · `needs-decision` · S · [visual-system](../workstreams/visual-system.md#u0198) · INC-65, DUP-127 · **question**
- [ ] **U0229** Use configured colours on Kanban card chips and Stats priority bars · feature · low · `feature-extension` · S · [visual-system](../workstreams/visual-system.md#u0229) · PART-63
- [ ] **U0419** Migrate hand-built colour rows onto an extended shared ColorPicker · dedup · low · `needs-decision` · M · [visual-system](../workstreams/visual-system.md#u0419) · DUP-108, STRUCT-97 · **question**
- [ ] **U0424** Replace hard-coded emoji and inline SVG copies with the shared icon set · ux · low · `needs-decision` · L · [visual-system](../workstreams/visual-system.md#u0424) · UX-105, STRUCT-95, DUP-110 · **question**
- [ ] **U0510** Replace fixed inline style values with existing Tailwind utility classes · restructure · low · `none` · S · [visual-system](../workstreams/visual-system.md#u0510) · STRUCT-94
- [ ] **U0666** Clamp centred InfoTooltip placements correctly near viewport edges · bugfix · low · `bugfix` · S · [visual-system](../workstreams/visual-system.md#u0666) · BUG-228
- [ ] **U0705** Extract a shared ViewHeader component for the six hand-rolled view headers · dedup · low · `needs-decision` · S · [visual-system](../workstreams/visual-system.md#u0705) · DUP-129 · **question**
- [ ] **U0744** Make every marker colour fallback read defaultMarkerColors · dedup · low · `needs-decision` · M · [visual-system](../workstreams/visual-system.md#u0744) · DOC-74, DUP-91, INC-86 · **question**
- [ ] **U0769** Align editor placeholder colours with the zinc palette and contrast · ux · low · `none` · S · [visual-system](../workstreams/visual-system.md#u0769) · UX-117
- [ ] **U0771** Fix print output: light colours, hidden chrome, scoped landscape rules · bugfix · low · `bugfix` · M · [visual-system](../workstreams/visual-system.md#u0771) · UX-115, SUP-76
- [ ] **U0775** Respect safe-area insets for viewport-fit cover · bugfix · low · `bugfix` · S · [visual-system](../workstreams/visual-system.md#u0775) · SUP-80
- [ ] **U0781** Stop every page scrolling by the footer height · bugfix · low · `bugfix` · S · [visual-system](../workstreams/visual-system.md#u0781) · UX-116
- [ ] **U0787** Respace the default marker palette to separate near-identical pairs · ux · low · `needs-decision` · S · [visual-system](../workstreams/visual-system.md#u0787) · UX-118 · **question**
