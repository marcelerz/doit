# Changelog

## 0.1.238 - 22 November 2026 - Sweep batch 1: guard rails

The first batch of the November 2026 sweep puts the safety net in place before any fix batch
touches product code. Almost nothing here changes what the app does; it changes how much is
checked before a change lands. Details and what was left for later are in
[`docs/sweep-2026-11/phases/batch-01.md`](docs/sweep-2026-11/phases/batch-01.md).

### Added

- **CI on every pull request and push to `main`** (`.github/workflows/ci.yml`): typecheck, lint,
  unit tests with the coverage floor, the unit tests again in a time zone ahead of UTC, the static
  build, and the Chromium smoke suite.
- **444 unit tests**, 1,922 to 2,366: storage initialisation and both migrations, the notes and
  reviews hooks and models, the note templates, SmartInput, the activity list, backups, the notes
  exporters, list grouping and presets, date shortcuts, drag reorder.
- **End-to-end specs** for reviews, sprints, backup and restore, import, time reports, Kanban
  keyboard moves and calendar modes. A smoke subset now runs in WebKit and Firefox
  (`npm run test:browsers`), and `npm run test:pwa` tests the static export with its service
  worker: reloading offline and the update prompt.
- **A scoped logger** (`src/utils/logger.ts`). Debug and info output is silent in a production
  build unless `localStorage["doit-debug"]` is `"true"`.
- `npm run test:tz`, which runs the unit tests in four time zones.
- A Versioning section in `CLAUDE.md` and `README.md`.

### Changed

- **Next 16.0.5 to 16.4.6, React 19.2.0 to 19.2.9**, which clears what `npm audit` reported for
  them. Node 24 is pinned in `.nvmrc`; CI and the deploy workflow read it from there.
- **Coverage floor** raised from 70.9 / 60.8 / 65 / 72.5 to 83.9 / 71 / 83.8 / 85.2 (statements /
  branches / functions / lines). Components and types are now measured.
- **Smoke tests assert real outcomes.** About 25 steps could not fail; each now checks what the
  step is named for, and was seen to fail with its feature broken.
- **Visual baselines** regenerated with a fixed clock, so they no longer depend on the day or the
  hour they are compared on.
- Storage keys are registered in one module, `src/storage/keys.ts`. Warnings and errors go through
  the logger and carry a `[doit:scope]` prefix.
- `CLAUDE.md`, `README.md`, `docs/e2e-testing.md` and both `.claude/agents` definitions rewritten
  against the code as it is.
- The deploy workflow's token is read-only except for the job that publishes.

### Fixed

- `npm run validate` passes. It had failed on every day but the one the visual baselines were
  captured on.
- The pre-commit hook no longer writes an invalid `version.json` when `node` is missing or the
  file is malformed; it aborts the commit instead. Its installer leaves a hook it did not write
  alone, including one set through a global `core.hooksPath`.
- `LocalStorageAdapter.clear()` removes only the app's own keys.
- The "mobile" smoke tests ran at desktop width. They run at a phone viewport now.

### Known gaps

- `eslint-config-next` stays at 16.0.5. Its 16.4.6 release reports six errors in product code;
  fixing them is filed as U0814.
- The visual suite, the WebKit and Firefox subset and the installed-app run are not in CI.
- The visual tolerance still lets a changed digit or a small icon pass (U0816).
- 109 `it.todo` cases and seven `test.fixme` cases mark behaviour that is known to be wrong. Each
  names the backlog unit that fixes it.
- In Firefox the app stays on "Loading..." until the browser's persistent-storage prompt is
  answered (U0089). The Firefox tests grant the request up front and do not see it.

## 0.1.199 - 21 November 2026 - Codebase sweep: backlog and roadmap

A read-only sweep of the whole codebase across twelve review items — dead code, documentation,
messages, duplication, structure, bugs, logging, UI usability, inconsistencies, support, partly
implemented features and security — and the plan for working through what it found. Nothing under
`src/` changes in this entry. Start at
[`docs/sweep-2026-11/README.md`](docs/sweep-2026-11/README.md).

### Added

- `docs/sweep-2026-11/` — the backlog: 1,235 review items merged into 729 work units, each with
  where, problem, proposal and a done-when check.
- A roadmap of 21 batches in twelve phases, ordered data safety first, fixes before refactors,
  cleanup before polish. Each batch is run on request with its own plan.
- `decisions.md` — the 188 work units that wait on an answer from the owner, by batch.
- The twelve review lists, each with its context, its items from high to low, dependencies,
  dropped findings and the areas no reviewer read.

### Known gaps

- Nothing was built or run; every finding comes from reading the code as of `0596933`. Each fix
  starts with a reproducer.
- Security findings are not in the repository. They sit in an untracked local file until the batch
  that fixes them lands.
- Documentation, messages, UI and support findings were spot-checked, not independently verified
  like the other eight lists.
- Three areas had no reviewer and have a gap review scheduled: some stored-data loaders and the
  third-party import parsers, several settings tabs, and the live-rendered UI.

## 0.1.179 - 5 September 2026 - Rich text editor rewrite

The editor lost text, lost formatting, and had no tests. Seven defects were reproduced in a
browser first, then fixed and re-verified the same way. Full evidence in
[`docs/rich-text-editor-defects-2026-09-04.md`](docs/rich-text-editor-defects-2026-09-04.md).

### Fixed

- **Escape in a note no longer discards what you typed.** Two debounces were stacked — the
  editor's 150ms and the view's 500ms autosave — and closing the note cancelled both instead of
  running them.
- **A comment box empties when you press Enter.** It used to keep the text, and a second Enter
  posted a duplicate.
- **A visually empty box can no longer post a comment.** An empty editor serialises to `<br>`,
  which three of the four composers read as non-empty.
- **Pasted content is sanitised as it arrives**, so what you see is what gets stored. There was no
  paste handler at all; the clipboard went in raw and was silently stripped at render time.
- **Block toolbar buttons convert the line the caret is on.** Bullet, Numbered, Checkbox,
  Blockquote and the headings used to append an empty block and strand the line's text outside it.
- **Backspacing out of a list, quote or heading keeps its formatting.** Bold, links and code spans
  were being flattened to plain text.
- **`# ` and `> ` in front of existing text leave the caret after it**, not in front of it.
- Toggling a checkbox in view mode no longer writes generated link-pattern anchors into the note.
- The inline-code button wraps the selection instead of inserting an empty span when focus has
  moved.

### Changed

- One `emitChange` replaces fourteen copies of "read innerHTML, call onChange". Typing debounced
  while every other path fired immediately without cancelling it, so typing and then clicking a
  toolbar button inside 150ms let the older text win.
- The DOM↔prop contract no longer hinges on whether the editor has focus. Incoming `value` is
  compared against what this component last emitted, and applied with the caret preserved as a
  character offset.
- `useDebouncedSave` replaces three hand-rolled autosave effects. Its cleanup tells "a newer save
  is coming" apart from "nothing else is coming", and running on unmount is the difference.
- `execCommand` is gone except for bold/italic/underline, where it remains the only primitive that
  splits inline ranges correctly and takes part in the native undo stack. `styleWithCSS` is pinned
  off so its output is deterministic.
- All four comment composers share one emptiness rule.

### Added

- First tests for `RichTextEditor.tsx` — 50 of them, and a place in the coverage ratchet. The file
  had none, and was absent from `collectCoverageFrom`, so no gate could see 867 lines.
- `e2e/smoke/rich-text-editor.spec.ts` — 12 browser cases covering what jsdom cannot: a real
  caret, real key events, a real selection.
- Live app URL and the GitHub Pages deploy flow in the README.

### Known gaps

- Undo/redo is untested. The mix of `execCommand` and direct DOM mutation suggests it is
  incoherent, but that is a hypothesis, not a measurement.
- Four visual baselines fail because they bake in relative dates; three fail identically on the
  commit before this work.
