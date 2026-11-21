# Batch 2A — Data safety: storage load/save, backend switch, migrations

17 units, 70 items: 8 high, 7 medium, 2 low. 4 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [ ] **U0084** Identify the storage adapter by a type field, not constructor.name · bugfix · high · `bugfix` · S · [storage-core](../workstreams/storage-core.md#u0084) · DOC-19, DEAD-07, MSG-11, DUP-03, STRUCT-22, BUG-76, LOG-07, INC-05, SUP-06
- [ ] **U0086** Block with a recovery screen when the chosen IndexedDB cannot open · bugfix · high · `bugfix` · M · [storage-core](../workstreams/storage-core.md#u0086) · SUP-03
- [ ] **U0087** Make switching back to localStorage stick and share key-copy helpers · bugfix · high · `bugfix` · L · [storage-core](../workstreams/storage-core.md#u0087) · DUP-02, STRUCT-21, INC-04, LOG-03, SUP-04, PART-02, BUG-03
- [ ] **U0088** Set the migrated flag on fresh IndexedDB installs and never overwrite data · bugfix · high · `bugfix` · M · [storage-core](../workstreams/storage-core.md#u0088) · BUG-02
- [ ] **U0089** Stop storage initialization from awaiting navigator.storage.persist() · bugfix · high · `bugfix` · S · [storage-core](../workstreams/storage-core.md#u0089) · BUG-62, SUP-13 · **question**
- [ ] **U0093** Measure storage usage and backup sizes with one shared helper · bugfix · high · `bugfix` · M · [storage-core](../workstreams/storage-core.md#u0093) · DUP-20, INC-45, MSG-68, LOG-09, BUG-229, PART-72
- [ ] **U0137** Gate auto-save on a successful load in every collection hook · bugfix · high · `bugfix` · L · [storage-core](../workstreams/storage-core.md#u0137) · LOG-01, BUG-01, SUP-01, PART-01, STRUCT-19, STRUCT-01, LOG-02, INC-01, SUP-02, SEC-15, DUP-01, LOG-42, DEAD-59, LOG-18, LOG-17, BUG-71 · **question**
- [ ] **U0067** Stop an older build from migrating and saving newer stored data · bugfix · high · `needs-decision` · M · [migrations-versioning](../workstreams/migrations-versioning.md#u0067) · INC-48, BUG-174, LOG-27, SUP-25, DOC-07, STRUCT-18 · **question**

## Medium priority

- [ ] **U0081** Reopen the IndexedDB connection after the browser closes it · bugfix · medium · `bugfix` · S · [storage-core](../workstreams/storage-core.md#u0081) · BUG-77, SUP-30
- [ ] **U0085** Catch synchronous IndexedDB probe errors and explain blocked site storage · bugfix · medium · `feature-extension` · M · [storage-core](../workstreams/storage-core.md#u0085) · LOG-41, SUP-52
- [ ] **U0724** Flush pending debounced saves on pagehide and visibilitychange · bugfix · medium · `bugfix` · S · [storage-core](../workstreams/storage-core.md#u0724) · SUP-29
- [ ] **U0776** Mirror the theme under a registered key the pre-hydration script reads · bugfix · medium · `bugfix` · M · [storage-core](../workstreams/storage-core.md#u0776) · MSG-86, INC-44, SUP-46, DOC-64, DOC-18, BUG-75, PART-46, SEC-36
- [ ] **U0063** Normalise every collection on load through migrations.ts · bugfix · medium · `bugfix` · M · [migrations-versioning](../workstreams/migrations-versioning.md#u0063) · INC-37, STRUCT-46
- [ ] **U0068** Skip fixPriorityId when settings fell back to defaults · bugfix · medium · `bugfix` · S · [migrations-versioning](../workstreams/migrations-versioning.md#u0068) · BUG-73
- [ ] **U0138** Run version check and legacy merge inside storage initialisation · bugfix · medium · `bugfix` · M · [migrations-versioning](../workstreams/migrations-versioning.md#u0138) · STRUCT-17, BUG-72

## Low priority

- [ ] **U0074** Remove null-as-StorageAdapter casts from initializeStorage's result · restructure · low · `none` · S · [storage-core](../workstreams/storage-core.md#u0074) · DOC-78, DEAD-62, STRUCT-85 · **question** · moved from 7B
- [ ] **U0561** Default missing activity and comments arrays when loading notes and reviews · bugfix · low · `bugfix` · S · [storage-core](../workstreams/storage-core.md#u0561) · LOG-60 · moved from 11
