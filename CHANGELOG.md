# Changelog

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
