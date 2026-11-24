# Batch 1 — Guard rails: CI, test gaps, timezone pin, frozen visual baselines, dependency bump, logger, agent-facing docs

28 units, 38 items: 9 high, 16 medium, 3 low. 1 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [x] **U0077** Add a scoped logger with a debug gate · logging · high · `none` · M · [logging-diagnostics](../workstreams/logging-diagnostics.md#u0077) · LOG-15 · moved from 9
- [x] **U0078** Test storage initialization, migration and IndexedDB adapter paths · tests-tooling · high · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0078) · SUP-19
- [x] **U0570** Add tests for useNotes, useReviews, NoteModel, ReviewModel and noteTemplates · tests-tooling · high · `none` · L · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0570) · SUP-20
- [x] **U0610** Add pull-request CI running checks, Pages build and Playwright smoke · tests-tooling · high · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0610) · SUP-16
- [x] **U0615** Correct documented visual-diff tolerance in CLAUDE.md and e2e-testing.md · docs · high · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0615) · DOC-02
- [x] **U0634** Make never-failing smoke steps assert real outcomes · tests-tooling · high · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0634) · SUP-21
- [x] **U0635** Freeze the clock in visual specs and regenerate baselines · tests-tooling · high · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0635) · SUP-17
- [x] **U0643** Upgrade Next and React past the December 2025 RSC advisories · security · high · `bugfix` · S · security-platform, [text below](#u0643) · SUP-18, SEC-01
- [x] **U0605** Rewrite both .claude/agents definitions against doit's own conventions · docs · high · `none` · M · [docs](../workstreams/docs.md#u0605) · DOC-01

## Medium priority

- [x] **U0648** Document the pre-commit version bump and authoritative version source · docs · medium · `none` · S · [migrations-versioning](../workstreams/migrations-versioning.md#u0648) · DOC-28 · moved from 12
- [x] **U0500** Add jsdom component tests for SmartInput · tests-tooling · medium · `none` · M · [smart-input](../workstreams/smart-input.md#u0500) · SUP-66
- [x] **U0180** Add integration tests for the activity feature · tests-tooling · medium · `none` · M · [activity-comments](../workstreams/activity-comments.md#u0180) · LOG-29
- [x] **U0040** Add tests for backup import, list grouping, notes export, date shortcuts · tests-tooling · medium · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0040) · SUP-67
- [x] **U0127** Add one shared storage-module mock for tests · tests-tooling · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0127) · STRUCT-54, SUP-87
- [x] **U0612** Move CI and local runtime to current Node LTS and pin it · tests-tooling · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0612) · SEC-21, SUP-61
- [x] **U0619** Refresh e2e-testing.md spec list, CI settings and new-test recipe · docs · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0619) · DOC-29, SUP-91
- [x] **U0629** Share one e2e storage reset and import storage constants · dedup · medium · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0629) · STRUCT-55
- [x] **U0633** Make mobile e2e tests actually run at mobile viewport · tests-tooling · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0633) · SUP-64, STRUCT-110
- [x] **U0640** Extend the coverage ratchet to components and types · tests-tooling · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0640) · SUP-68
- [x] **U0646** Add WebKit, Firefox and static-export PWA Playwright projects · tests-tooling · medium · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0646) · SUP-63
- [x] **U0649** Make the pre-commit version bump validate input and fail safely · bugfix · medium · `needs-decision` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0649) · SUP-70, SEC-44 · **question**
- [x] **U0650** Stop postinstall overwriting existing or global pre-commit hooks · bugfix · medium · `bugfix` · S · tests-ci-tooling, [text below](#u0650) · SEC-18
- [x] **U0713** Add e2e specs for Reviews, Sprints, Time Reports, Settings, Kanban, offline · tests-tooling · medium · `none` · L · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0713) · SUP-62, PART-51
- [x] **U0742** Move MockBrowserApis and MockAudioElement out of production browserApis.ts · restructure · medium · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0742) · DEAD-67, STRUCT-53
- [x] **U0613** Complete CLAUDE.md layer map and fix its factual errors · docs · medium · `none` · S · [docs](../workstreams/docs.md#u0613) · DOC-27 · moved from 12

## Low priority

- [x] **U0777** Route literal storage keys through the registry and scope LocalStorageAdapter.clear · bugfix · low · `none` · S · [storage-core](../workstreams/storage-core.md#u0777) · INC-88, STRUCT-63 · moved from 11
- [x] **U0638** Run unit and e2e tests under non-UTC time zones · tests-tooling · low · `none` · S · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0638) · INC-90, SUP-92 · moved from 11
- [x] **U0741** Move shared test fixtures to a common folder and use them consistently · tests-tooling · low · `none` · M · [tests-ci-tooling](../workstreams/tests-ci-tooling.md#u0741) · STRUCT-103 · moved from 11

## Outcome

Done on branch `sweep-batch-1`, pull request #2. `npm run validate` passes in full for the first
time, and so do `npm run test:tz`, `npm run test:browsers` and `npm run test:pwa`. The new CI
workflow is green on the pull request and was seen to fail on a deliberate type error (pull
request #3, closed unmerged).

Unit tests went from 1,922 to 2,366. The global coverage floor went from 70.9 / 60.8 / 65 / 72.5
to 83.9 / 71 / 83.8 / 85.2 (statements / branches / functions / lines).

### Where a unit was closed differently from its text

- **U0643.** next goes to 16.4.6, not to a 16.0 patch: the advisories cover everything up to
  16.4.4. `eslint-config-next` stays at 16.0.5, because its 16.4.6 release reports six errors in
  product code; that upgrade is U0814, done in the [follow-ups](#follow-ups). `next.config.ts` sets `agentRules: false`, because since
  16.4 `next dev` writes an `AGENTS.md` when an agent starts it. The dev server stays reachable
  from the local network, by the owner's choice.
- **U0615.** The unit asked the docs to say the tolerance catches changed text and to replace
  "delete and regenerate" with `test:visual:update`. Measured, neither holds: a changed digit and
  a 36-pixel icon pass inside 0.1%, and the update command leaves a passing baseline alone. The
  docs say what was measured and keep the advice. Tightening the tolerance is U0816.
- **U0635.** Besides the clock, `e2e/visual.css` hides the footer's year and version, which are
  rendered on the server and change with the date and with every commit.
- **U0646.** The installed-app run is `npm run test:pwa` with its own configuration, not a `pwa`
  project. The `firefox` project sets two preferences that grant persistent storage, which hides
  U0089 from it, and its two paste tests are `fixme` (U0817).
- **U0077.** Nine `console.log` lines stay as they are, because gating `info` in production would
  have silenced them: four in `storage.ts`, five in `useServiceWorker.ts`. Batch 9 decides each.
  `public/sw.js` cannot import the logger.
- **U0649.** The hook validates inline and calls no other script, because the hooks folder is
  shared by every branch and worktree.
- **U0777.** The registry is its own module, `src/storage/keys.ts`, re-exported by `storage.ts`.
  A channel name and two download file names start with `doit-` and are not storage keys.
- **U0610.** The smoke job runs on `ubuntu-24.04`, because Playwright 1.57 has no browser build
  for the image behind `ubuntu-latest` (U0815). The deploy workflow's token is read-only except
  for the deploy job.
- **U0634** also did all of **U0630** (batch 5), and **U0633** did the two stale config comments
  of **U0645** (batch 5).
- **U0570** and **U0180** both asked for `useNotes` and `useReviews` tests; they were written once.
- **U0613.** The claim that Help derives from the view registry is narrowed to Help's shortcut
  table, which is the part that does.
- **U0713.** Specs for reviews, sprints, backup and restore, import, time reports, Kanban keyboard
  moves and calendar modes. What sits on an open defect was left to the unit that fixes it; see
  the next section.

### Tests left for later units

A test in this batch pins behaviour only where it is right. Where it is a known defect there is
an `it.todo` or a `test.fixme` that names the unit: 109 `it.todo` cases across 69 units, and seven
`test.fixme` cases (U0199, U0462, U0460, U0219, U0825, U0051, U0049). To find a unit's:

```bash
grep -rn "(U0132)" src e2e
```

The fix turns each into its reproducer. End-to-end specs that have no placeholder in the code are
noted on their units under "Left by batch 1": U0087, U0099, U0132, U0247, U0389, U0446, U0459,
U0149 and U0223.

### New units

Fourteen units, 32 items, found while running the batch. Each is in its workstream file with a
proposed batch. They are not counted in the roadmap table; a batch picks up the ones proposed for
it at its reconcile step.

| Unit | Workstream | Proposed batch | What |
| --- | --- | --- | --- |
| [U0814](../workstreams/tests-ci-tooling.md#u0814) | tests-ci-tooling | 7A | Upgrade eslint-config-next to 16.4 and fix what its React Compiler rules report · **done in the [follow-ups](#follow-ups)** |
| [U0815](../workstreams/tests-ci-tooling.md#u0815) | tests-ci-tooling | 11 | Upgrade Playwright so the CI smoke job can return to ubuntu-latest |
| [U0816](../workstreams/tests-ci-tooling.md#u0816) | tests-ci-tooling | 11 | Tighten the visual tolerance now that the clock is fixed |
| [U0817](../workstreams/tests-ci-tooling.md#u0817) | tests-ci-tooling | 11 | Clean up four weak spots in the test suite |
| [U0818](../workstreams/smart-input.md#u0818) | smart-input | 3A | Fix four SmartInput defects found by its new tests |
| [U0819](../workstreams/smart-input.md#u0819) | smart-input | 6A | Decide whether a title keeps the words the date parser takes · **question** |
| [U0820](../workstreams/notes.md#u0820) | notes | 6B | Fix four useNotes defects found by its new tests |
| [U0821](../workstreams/reviews.md#u0821) | reviews | 6B | Guard the review mutators in useReviews by state and index |
| [U0822](../workstreams/dates-time.md#u0822) | dates-time | 3A | Decide what a date shorthand means on the day it names · **question** |
| [U0823](../workstreams/view-state.md#u0823) | view-state | 6C | Sort the list's category filter options and remove an unreachable priority fallback |
| [U0824](../workstreams/backup.md#u0824) | backup | 2B | Report a failed backup listing and give the statistics one date format |
| [U0825](../workstreams/kanban.md#u0825) | kanban | 8B | Keep keyboard focus on a Kanban card after it moves |
| [U0826](../workstreams/rich-text-html.md#u0826) | rich-text-html | 11 | Treat empty note markup as empty and cut previews on whole characters |
| [U0827](../workstreams/activity-comments.md#u0827) | activity-comments | 11 | Give comment rows in the activity list a key that cannot collide |

Two things were confirmed rather than found: U0089 is worse than rated in Firefox, where the app
stays on "Loading..." until the persistence prompt is answered; and U0219 has a reproducer now,
the `test.fixme` in `kanban-keyboard.spec.ts`.

## Follow-ups

Batch 1 left five questions. The owner answered them on 23 November 2026, and one change applied
the answers: branch `sweep-batch-1-followups`, twelve commits.

- **U0814 is done.** `eslint-config-next` is 16.4.6, the release `next` is on, and `npm run lint`
  is clean. Its newer hook rules had reported six errors and one warning. Each was fixed in the
  code and none was suppressed; `src` has two suppression comments fewer and none new.

  | Finding | Fix |
  | --- | --- |
  | `SmartInput.tsx`: a helper is read before its declaration | The three effects and the imperative handle that call it moved below it. A pure move. |
  | `ListView.tsx`, two reports: the export handler is memoised on lists that are rebuilt every render | A plain function. |
  | `useBackups.ts`: an async loader is called from an effect | The effect reads the list and hands it to a callback, `applyBackups`. The re-render loop of U0044 is as it was. |
  | `TodoApp.tsx`: an effect falls back to the list when the open view is switched off | The check runs while rendering. |
  | `TodoApp.tsx`: an effect restores the saved tab | Restored while rendering, once. |
  | `InfoTooltip.tsx`, the warning: a disable directive the newer rules do not need | Removed. |

  The two `TodoApp` rows are the only ones where something observable changed, both for the
  better: a switched-off view no longer mounts for one frame before the list replaces it, and on
  reload the stored tab is no longer overwritten with `list` for a moment before the saved tab is
  restored. The last two rows share a commit with the upgrade, because the older plugin skips a
  component that carries a hook-dependency suppression and still needs InfoTooltip's directive.
- **`agentRules: false` stays** in `next.config.ts`.
- **`package.json` has no `version` field** any more, which answers U0648's question and half of
  U0642's. `version.json` is the only version.
- **The pull-request rule stays**, and this change followed it.
- **The deploy workflow's two checkouts set `persist-credentials: false`**, as the CI workflow's
  already did. That belongs to U0611 in batch 4, which is ticked there once a deploy from `main`
  has run with it.

Tests written first, on the code as it was: `list-export.spec.ts` (the export with and without a
filter), `view-availability.spec.ts` (a view switched off in Settings, and a stored tab that is
not a view) and four unit tests for the last-backup date that `useBackups` keeps in step. Unit
tests went from 2,366 to 2,370.

Two things came up on the way:

- The fallback to the list was meant to be tested with a second tab switching the view off. That
  cannot pass today, because a tab that has not saved settings itself never hears another tab's
  change. This is U0072, and the test is its reproducer now, a `test.fixme` with its body
  written. The fallback is tested through Settings and back instead.
- `storage.init.test.ts` gave the IndexedDB probe a fixed 10 ms to delete its probe database and
  failed once in a full coverage run. It now waits for the database to go.

## Security units fixed in this batch

Their text was held in the untracked local file until now.

### <a id="u0643"></a>U0643 — Upgrade Next and React past the December 2025 RSC advisories
*Batch 1 · security · high · `bugfix` · effort S.* Bump next and eslint-config-next to the latest 16.x and react/react-dom to matching 19.2.x, regenerate the lockfile, run npm audit before and after.

#### <a id="sup-18"></a>SUP-18 — Next 16.0.5 predates the December 2025 security fixes for React Server Components
*high · `bugfix` · effort S.* **Where:** `package.json:37`; `package.json:38`; `package.json:39`; `package.json:50`; `package-lock.json:7473`. **Problem.** next and eslint-config-next are pinned exactly at 16.0.5, and the lockfile confirms it. That release predates the December 2025 React Server Components advisories (remote code execution, then denial-of-service and source-exposure fixes in later 16.0.x patches); this is from memory and should be confirmed. The static GitHub Pages export has no server, so production is not exposed, but next dev and next start run the vulnerable server, and next dev listens on the local network. **Proposal.** Bump next and eslint-config-next to the latest 16.x patch and react and react-dom to the latest 19.2.x, regenerate package-lock.json, and run the full checks from SUP-16. Keep the exact pins only if Dependabot (SUP-61) is added to move them. The Security-review dimension may list the same item. **Done when.** npm ls next shows a patched version, npm audit reports no next or react advisory, and npm run validate passes.

#### <a id="sec-01"></a>SEC-01 — Bump next/eslint-config-next 16.0.5 and react 19.2.0 past the known RSC advisories
*high · `bugfix` · effort S.* **Where:** `package.json:37`; `package.json:38`; `package.json:39`; `package.json:50`; `package.json:6`; `package.json:13`; `package-lock.json:7473`; `playwright.config.ts:115`. **Problem.** next and eslint-config-next are pinned to exactly 16.0.5, and react/react-dom to 19.2.0; the lockfile agrees. From memory, to be confirmed with npm audit: the December 2025 React Server Components advisories apply. CVE-2025-55182/66478 is a pre-auth RCE fixed in 16.0.7; CVE-2025-55183, 55184 and 67779 were fixed in later 16.0.x patches. The Pages static export is unaffected. `npm run dev`, which Playwright's webServer also starts, serves RSC on all interfaces, so the LAN can reach it. **Proposal.** Bump next and eslint-config-next to the latest 16.x patch, and react/react-dom to the matching 19.2.x. Run npm audit before and after, and record any remaining advisory. Let Dependabot keep these pins moving. Optional, owner decision: change the dev script to `next dev -H 127.0.0.1` so the LAN cannot reach it, which gives up testing from a phone. **Done when.** npm audit reports no high or critical advisory for next/react, and npm run validate plus the smoke and visual suites stay green.

### <a id="u0650"></a>U0650 — Stop postinstall overwriting existing or global pre-commit hooks
*Batch 1 · bugfix · medium · `bugfix` · effort S.* Skip setup-hooks in CI, write nothing when core.hooksPath is set, and overwrite only hooks carrying a doit marker line.

#### <a id="sec-18"></a>SEC-18 — postinstall overwrites any existing pre-commit hook, including a global core.hooksPath one, and runs in CI
*medium · `bugfix` · effort S.* **Where:** `scripts/setup-hooks.js:25`; `scripts/setup-hooks.js:27`; `scripts/setup-hooks.js:51`; `scripts/setup-hooks.js:53`; `scripts/setup-hooks.js:56`; `package.json:8`; `.github/workflows/deploy.yml:31`; `.github/workflows/deploy.yml:60`. **Problem.** Every npm install and npm ci copies scripts/pre-commit over the target hook without checking or backing up, then reports success. The target comes from `git rev-parse --git-path hooks`, which honours a global core.hooksPath. A developer's shared pre-commit, such as a secret scanner, is therefore replaced, which disables it in every repository and runs doit's version bump there instead. The script also runs pointlessly in CI. **Proposal.** Skip when process.env.CI is set. When `git config --get core.hooksPath` is non-empty, write nothing and print instructions. Add a marker line (# doit-managed-hook) to scripts/pre-commit and overwrite only hooks that carry it; otherwise warn, or install as pre-commit.doit with chaining instructions. Alternative: a repo-local core.hooksPath pointing to a tracked directory, documented as overriding a global one. **Done when.** Tests against a temporary repository show that an unmarked existing hook and a core.hooksPath directory are left untouched while a marked hook is updated.

### SEC-21, part of [U0612](../workstreams/tests-ci-tooling.md#u0612)

#### <a id="sec-21"></a>SEC-21 — Move CI off Node 20 (end of life since April 2026) and pin the Node version
*medium · `none` · effort S.* **Where:** `.github/workflows/deploy.yml:27`; `.github/workflows/deploy.yml:56`; `.github/workflows/deploy.yml:25`; `.github/workflows/deploy.yml:54`; `.github/workflows/deploy.yml:22`; `package.json:46`. **Problem.** Both deploy jobs use node-version "20". Node 20 reached end of life on 2026-04-30, so release builds run on a runtime that gets no security fixes. Local development uses Node 24, but there is no engines field, no .nvmrc, and @types/node is ^20. checkout and setup-node v4 are node20-runtime actions. **Proposal.** Add .nvmrc with 24, and use node-version-file: .nvmrc in both setup-node steps. Add "engines": {"node": ">=24"} and align @types/node to ^24. Move checkout and setup-node to their Node 24 majors, pinned by SHA. **Done when.** The deploy log shows Node 24 for both jobs, and npm run typecheck stays green with @types/node 24.

### SEC-44, part of [U0649](../workstreams/tests-ci-tooling.md#u0649)

#### <a id="sec-44"></a>SEC-44 — pre-commit writes invalid version.json when node is missing or the file is malformed
*low · `bugfix` · effort S.* **Where:** `scripts/pre-commit:15`; `scripts/pre-commit:17`; `scripts/pre-commit:20`; `scripts/pre-commit:23`; `scripts/pre-commit:32`; `scripts/fix-github-pages.js:79`; `scripts/fix-github-pages.js:83`; `scripts/bump-version.js:20`; `scripts/bump-version.js:31`; `scripts/bump-version.js:36`. **Problem.** pre-commit reads the version fields with three node -p calls, with no set -e and no validation. If node is not on PATH (common in GUI git clients) or version.json is malformed, the fields come back empty, $((REVISION + 1)) yields 1, and the heredoc writes "major": ,. That invalid JSON is staged and committed, and breaks the next build. bump-version.js applies += to any type, and fix-github-pages.js stamps the values into sw.js unvalidated. A robustness issue, not a trust boundary. **Proposal.** Do the bump in a single node script that requires Number.isInteger(x) && x >= 0 for major, minor and revision, writes the file, and exits non-zero on failure. scripts/pre-commit calls it and fails if node is missing. Apply the same validation in bump-version.js and before stamping in fix-github-pages.js. **Done when.** Tests of the bump script show that a string revision and a missing field exit non-zero and leave version.json unchanged.
