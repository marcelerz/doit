# Batch 6A — Medium fixes: domain core

34 units, 62 items: 0 high, 32 medium, 2 low. 12 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## Medium priority

- [ ] **U0518** Detect compound durations like '2h30m' and '1h 30m' as one token · bugfix · medium · `bugfix` · S · [durations](../workstreams/durations.md#u0518) · BUG-149
- [ ] **U0168** Store an explicit all-day marker so due dates survive time-zone changes · bugfix · medium · `needs-decision` · L · [dates-time](../workstreams/dates-time.md#u0168) · SUP-56 · **question**
- [ ] **U0172** Add day primitives to dateUtils and fix the reviewUtils DST bug · dedup · medium · `bugfix` · L · [dates-time](../workstreams/dates-time.md#u0172) · DUP-34, INC-69, BUG-122
- [ ] **U0335** Compute week numbers from ISO Thursday in Calendar and review labels · bugfix · medium · `bugfix` · S · [dates-time](../workstreams/dates-time.md#u0335) · BUG-206, INC-40, BUG-121
- [ ] **U0529** Stop time-of-day shorthands resolving to an already-past time · bugfix · medium · `needs-decision` · S · [dates-time](../workstreams/dates-time.md#u0529) · BUG-146 · **question**
- [ ] **U0539** Stop greedy date patterns turning ordinary words into due dates · bugfix · medium · `needs-decision` · M · [dates-time](../workstreams/dates-time.md#u0539) · BUG-151 · **question**
- [ ] **U0520** Align SmartInput recurrence detection with every phrase the parser accepts · bugfix · medium · `needs-decision` · M · [recurrence](../workstreams/recurrence.md#u0520) · BUG-147, BUG-190, PART-68 · **question**
- [ ] **U0429** Drop misleading marker prefixes from duration, recurring and priority labels · wording · medium · `bugfix` · S · [smart-input](../workstreams/smart-input.md#u0429) · DOC-63, MSG-23, UX-131
- [ ] **U0499** Make SmartInput token deactivation consistent, edit-stable, resettable and reversible · bugfix · medium · `needs-decision` · M · [smart-input](../workstreams/smart-input.md#u0499) · UX-49, MSG-50, UX-48, BUG-153 · **question**
- [ ] **U0526** Auto-detect names starting or ending with accented or symbol characters · bugfix · medium · `bugfix` · S · [smart-input](../workstreams/smart-input.md#u0526) · BUG-148
- [ ] **U0150** Apply one updatedAt rule across all entities and actions · bugfix · medium · `needs-decision` · M · [todos-core](../workstreams/todos-core.md#u0150) · INC-36 · **question**
- [ ] **U0195** Stop swipes scrolling the page and disable archive swipe on archived todos · bugfix · medium · `bugfix` · S · [todos-core](../workstreams/todos-core.md#u0195) · SUP-48, BUG-226
- [ ] **U0200** Share one DelayMenu and stop its backdrop click opening task details · bugfix · medium · `bugfix` · S · [todos-core](../workstreams/todos-core.md#u0200) · DUP-30
- [ ] **U0428** Prevent circular task dependencies in the dependency picker · bugfix · medium · `bugfix` · M · [todos-core](../workstreams/todos-core.md#u0428) · BUG-84
- [ ] **U0487** Key the task details overlay by todo id at every mount · bugfix · medium · `bugfix` · S · [todos-core](../workstreams/todos-core.md#u0487) · BUG-116
- [ ] **U0673** Stop Dependency and Sprint pickers storing free-text dangling ids · bugfix · medium · `bugfix` · S · [todos-core](../workstreams/todos-core.md#u0673) · BUG-85
- [ ] **U0134** Undo only the changed fields and keep the action's activity entry · bugfix · medium · `needs-decision` · M · [undo-confirm](../workstreams/undo-confirm.md#u0134) · BUG-89, LOG-21, LOG-63 · **question**
- [ ] **U0585** Base person and project delete warnings on real reference counts · bugfix · medium · `needs-decision` · M · [undo-confirm](../workstreams/undo-confirm.md#u0585) · BUG-114, MSG-48, INC-32 · **question**
- [ ] **U0594** Clear deleted people and projects from auto-assign defaults · bugfix · medium · `bugfix` · S · [undo-confirm](../workstreams/undo-confirm.md#u0594) · INC-31
- [ ] **U0690** Colour the undo toast subtitle neutral for non-destructive actions · bugfix · medium · `bugfix` · S · [undo-confirm](../workstreams/undo-confirm.md#u0690) · MSG-80, UX-43
- [ ] **U0452** Catch rename cascade failures and report them in the entity overlay · bugfix · medium · `bugfix` · S · [entity-names](../workstreams/entity-names.md#u0452) · LOG-20 · **question**
- [ ] **U0455** Apply the other fields when an entity rename is refused · bugfix · medium · `bugfix` · S · [entity-names](../workstreams/entity-names.md#u0455) · BUG-115
- [ ] **U0569** Share rename-event subscription and keep selection history in sync · bugfix · medium · `bugfix` · S · [entity-names](../workstreams/entity-names.md#u0569) · DUP-25, INC-30, STRUCT-59, PART-47, BUG-80
- [ ] **U0582** Separate name-reference brands from entity ids; fix id-keyed lookups · bugfix · medium · `needs-decision` · L · [entity-names](../workstreams/entity-names.md#u0582) · STRUCT-45, DUP-48 · **question**
- [ ] **U0598** Stop rename from rewriting the start of a longer marker · bugfix · medium · `bugfix` · M · [entity-names](../workstreams/entity-names.md#u0598) · BUG-79
- [ ] **U0599** Use a replacer function so '$' in new names stays literal · bugfix · medium · `bugfix` · S · [entity-names](../workstreams/entity-names.md#u0599) · BUG-78
- [ ] **U0746** Resolve entity colours and lookups through one findByNameOrAlternatives resolver · dedup · medium · `needs-decision` · M · [entity-names](../workstreams/entity-names.md#u0746) · DUP-47, STRUCT-50, INC-59, DUP-75 · **question** · moved from 7B
- [ ] **U0119** Allow comment editing only on the latest revision row · bugfix · medium · `bugfix` · S · [activity-comments](../workstreams/activity-comments.md#u0119) · BUG-155, MSG-81
- [ ] **U0182** Normalise activity message wording across todos, notes and other entities · wording · medium · `bugfix` · M · [activity-comments](../workstreams/activity-comments.md#u0182) · MSG-37, LOG-58
- [ ] **U0564** Stop note comments appearing twice in the timeline · bugfix · medium · `needs-decision` · S · [activity-comments](../workstreams/activity-comments.md#u0564) · LOG-30, PART-71 · **question**
- [ ] **U0656** Share one comment composer and edit form; validate edits with isHtmlEmpty · dedup · medium · `bugfix` · M · [activity-comments](../workstreams/activity-comments.md#u0656) · DUP-28
- [ ] **U0141** Use branded id types in hook APIs and stored cross-references · restructure · medium · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0141) · STRUCT-44 · moved from 7A

## Low priority

- [ ] **U0414** Use matchesAnyName and one createEntityNote for people and projects · dedup · low · `none` · S · [entity-names](../workstreams/entity-names.md#u0414) · DUP-74 · moved from 7B
- [ ] **U0130** Delegate priority name-or-alias lookups to findByNameOrAlternatives · dedup · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0130) · DUP-73 · moved from 7A
