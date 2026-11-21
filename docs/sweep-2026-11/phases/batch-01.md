# Batch 1 — Guard rails: CI, test gaps, timezone pin, frozen visual baselines, dependency bump, logger, agent-facing docs

28 units, 38 items: 9 high, 16 medium, 3 low. 1 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [ ] **U0077** Add a scoped logger with a debug gate · logging · high · `none` · M · [logging-diagnostics](../workstreams/logging-diagnostics.md#u0077) · LOG-15 · moved from 9
- [ ] **U0078** Test storage initialization, migration and IndexedDB adapter paths · tests-tooling · high · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0078) · SUP-19
- [ ] **U0570** Add tests for useNotes, useReviews, NoteModel, ReviewModel and noteTemplates · tests-tooling · high · `none` · L · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0570) · SUP-20
- [ ] **U0610** Add pull-request CI running checks, Pages build and Playwright smoke · tests-tooling · high · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0610) · SUP-16
- [ ] **U0615** Correct documented visual-diff tolerance in CLAUDE.md and e2e-testing.md · docs · high · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0615) · DOC-02
- [ ] **U0634** Make never-failing smoke steps assert real outcomes · tests-tooling · high · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0634) · SUP-21
- [ ] **U0635** Freeze the clock in visual specs and regenerate baselines · tests-tooling · high · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0635) · SUP-17
- [ ] **U0643** Security unit, held back until fixed · security · high · `bugfix` · S · security-platform · SUP-18, SEC-01
- [ ] **U0605** Rewrite both .claude/agents definitions against doit's own conventions · docs · high · `none` · M · [docs](../workstreams/docs.md#u0605) · DOC-01

## Medium priority

- [ ] **U0648** Document the pre-commit version bump and authoritative version source · docs · medium · `none` · S · [migrations-versioning](../workstreams/migrations-versioning.md#u0648) · DOC-28 · moved from 12
- [ ] **U0500** Add jsdom component tests for SmartInput · tests-tooling · medium · `none` · M · [smart-input](../workstreams/smart-input.md#u0500) · SUP-66
- [ ] **U0180** Add integration tests for the activity feature · tests-tooling · medium · `none` · M · [activity-comments](../workstreams/activity-comments.md#u0180) · LOG-29
- [ ] **U0040** Add tests for backup import, list grouping, notes export, date shortcuts · tests-tooling · medium · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0040) · SUP-67
- [ ] **U0127** Add one shared storage-module mock for tests · tests-tooling · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0127) · STRUCT-54, SUP-87
- [ ] **U0612** Move CI and local runtime to current Node LTS and pin it · tests-tooling · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0612) · SEC-21, SUP-61
- [ ] **U0619** Refresh e2e-testing.md spec list, CI settings and new-test recipe · docs · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0619) · DOC-29, SUP-91
- [ ] **U0629** Share one e2e storage reset and import storage constants · dedup · medium · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0629) · STRUCT-55
- [ ] **U0633** Make mobile e2e tests actually run at mobile viewport · tests-tooling · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0633) · SUP-64, STRUCT-110
- [ ] **U0640** Extend the coverage ratchet to components and types · tests-tooling · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0640) · SUP-68
- [ ] **U0646** Add WebKit, Firefox and static-export PWA Playwright projects · tests-tooling · medium · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0646) · SUP-63
- [ ] **U0649** Make the pre-commit version bump validate input and fail safely · bugfix · medium · `needs-decision` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0649) · SUP-70, SEC-44 · **question**
- [ ] **U0650** Security unit, held back until fixed · bugfix · medium · `bugfix` · S · tests-ci-tooling · SEC-18
- [ ] **U0713** Add e2e specs for Reviews, Sprints, Time Reports, Settings, Kanban, offline · tests-tooling · medium · `none` · L · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0713) · SUP-62, PART-51
- [ ] **U0742** Move MockBrowserApis and MockAudioElement out of production browserApis.ts · restructure · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0742) · DEAD-67, STRUCT-53
- [ ] **U0613** Complete CLAUDE.md layer map and fix its factual errors · docs · medium · `none` · S · [docs](../workstreams/docs.md#u0613) · DOC-27 · moved from 12

## Low priority

- [ ] **U0777** Route literal storage keys through the registry and scope LocalStorageAdapter.clear · bugfix · low · `none` · S · [storage-core](../workstreams/storage-core.md#u0777) · INC-88, STRUCT-63 · moved from 11
- [ ] **U0638** Run unit and e2e tests under non-UTC time zones · tests-tooling · low · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0638) · INC-90, SUP-92 · moved from 11
- [ ] **U0741** Move shared test fixtures to a common folder and use them consistently · tests-tooling · low · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0741) · STRUCT-103 · moved from 11
