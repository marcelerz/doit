# Batch 2B — Data safety: backup, restore, import, export, durations

20 units, 57 items: 9 high, 9 medium, 2 low. 5 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [ ] **U0043** Stop pruning from silently deleting imported and manual backups · bugfix · high · `needs-decision` · M · [backup](../workstreams/backup.md#u0043) · UX-13, INC-43, BUG-74, SUP-08 · **question**
- [ ] **U0044** Break useBackups render loop by stabilising useSettings mutators · bugfix · high · `bugfix` · S · [backup](../workstreams/backup.md#u0044) · STRUCT-09
- [ ] **U0059** Validate backup contents and write before deleting during restore · bugfix · high · `bugfix` · M · [backup](../workstreams/backup.md#u0059) · SEC-04, BUG-181
- [ ] **U0097** Export absolute due dates, raw values and missing todo fields · bugfix · high · `feature-extension` · M · [import-export](../workstreams/import-export.md#u0097) · SUP-58, BUG-60, PART-13, DOC-65
- [ ] **U0099** Make the app's own JSON and CSV exports round-trip through import · bugfix · high · `bugfix` · L · [import-export](../workstreams/import-export.md#u0099) · DUP-06, SEC-33, MSG-17, SUP-14, BUG-124, PART-12, BUG-59, INC-10
- [ ] **U0108** Security unit, held back until fixed · security · high · `bugfix` · M · import-export · SEC-03, BUG-61
- [ ] **U0485** Export only filtered, non-deleted notes from NotesView with a dated filename · bugfix · high · `bugfix` · S · [import-export](../workstreams/import-export.md#u0485) · INC-34, PART-10
- [ ] **U0377** Make parseDuration sum compound units including days and weeks · bugfix · high · `needs-decision` · M · [durations](../workstreams/durations.md#u0377) · DOC-04, DEAD-01, DUP-09, BUG-31, BUG-05, LOG-06, INC-03, INC-23 · **question** · moved from 3A
- [ ] **U0038** Make the recovery screen's download restorable and report unreadable keys · bugfix · high · `bugfix` · M · [feedback-states](../workstreams/feedback-states.md#u0038) · DUP-51, BUG-184, LOG-44, SUP-07 · moved from 3C

## Medium priority

- [ ] **U0016** Take an automatic safety backup before restore, import, migration and clear · feature · medium · `feature-extension` · M · [backup](../workstreams/backup.md#u0016) · UX-64, SEC-13, SUP-23 · moved from 10
- [ ] **U0042** Report backup failure reasons: quota, partial restore, parse versus write · bugfix · medium · `needs-decision` · M · [backup](../workstreams/backup.md#u0042) · MSG-14, LOG-19 · **question**
- [ ] **U0055** Consolidate backup helpers in backup.ts and store lastBackupDate once · dedup · medium · `needs-decision` · M · [backup](../workstreams/backup.md#u0055) · STRUCT-47, DUP-41, INC-89 · **question** · moved from 7B
- [ ] **U0058** Security unit, held back until fixed · security · medium · `bugfix` · M · backup · SEC-12
- [ ] **U0060** Measure backup cap in real bytes, scale per backend, drop duplicated fields · bugfix · medium · `needs-decision` · M · [backup](../workstreams/backup.md#u0060) · BUG-125, SUP-27 · **question**
- [ ] **U0061** Record auto-backup failures and warn in Backup tab when backups stall · bugfix · medium · `bugfix` · S · [backup](../workstreams/backup.md#u0061) · SUP-22
- [ ] **U0100** Share downloadFile and fix the backup download's immediate URL revoke · dedup · medium · `bugfix` · S · [import-export](../workstreams/import-export.md#u0100) · DUP-92, STRUCT-29, BUG-183, SUP-28, SEC-38
- [ ] **U0104** Make import error and skip messages readable and consistent · wording · medium · `bugfix` · M · [import-export](../workstreams/import-export.md#u0104) · MSG-16
- [ ] **U0107** Detect backup files in Import and point to Settings Backup · bugfix · medium · `bugfix` · S · [import-export](../workstreams/import-export.md#u0107) · MSG-15, SUP-26

## Low priority

- [ ] **U0082** Security unit, held back until fixed · dedup · low · `none` · S · backup · SEC-39 · moved from 7B
- [ ] **U0064** Stop migrateTodo writing nulls, raw strings and undeclared fields · bugfix · low · `bugfix` · S · [migrations-versioning](../workstreams/migrations-versioning.md#u0064) · INC-70 · moved from 11
