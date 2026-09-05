# Rich text editor — defect sweep, 2026-09-04

Hands-on test of `RichTextEditor` in a real browser, to establish what is actually broken before
changing it.

| | |
|---|---|
| Branch | `rich-text-editor-fix` @ `0413306` |
| App | `npm run dev` on port 3311, Chromium via the repo's own Playwright |
| Method | Scripted real-browser interaction; every claim read back from the editor's live DOM or from the app's own IndexedDB store |
| Unit suite at time of test | 1,828 passed / 72 suites, green |

**Why this was worth doing.** Reading the code produced ten plausible defects. Three of them do
not reproduce. Had they been "fixed", the change would have been churn at best and a regression at
worst — the two most obvious hypotheses, dropped keystrokes and a jumping caret, are exactly the
two that turned out to be fine.

---

## 1. Findings

| # | Severity | Area | Defect |
|---|---|---|---|
| R1 | **BLOCKER** | Notes | Escape after typing discards the text entirely |
| R2 | **HIGH** | Comments | The box never clears after Enter, and a second Enter posts a duplicate |
| R3 | **HIGH** | Paste | Pasted HTML is stored unsanitised, then silently stripped when rendered |
| R4 | MEDIUM | Comments | A visually empty box posts a comment containing `<br>` |
| R5 | MEDIUM | Lists | Backspace at the start of a formatted list item destroys the formatting |
| R6 | LOW | Blocks | `# ` and `> ` leave the caret before the line's existing text |
| R7 | **HIGH** | Toolbar | Every block button strands the line's text outside the block it makes |

---

### R1 — Escape after typing discards the text — BLOCKER

Open a note, type, press Escape. **The typing is gone.**

```
stored before typing : ""
typed                : "ESCTAIL"
Escape
stored after         : ""            <- ESCTAIL never persisted
```

`onInput` schedules the change on a 150 ms debounce (`RichTextEditor.tsx:76-82`). Escape is the
natural way to leave a note, and `NoteDetailView` binds it to `onBack`, unmounting the editor. The
unmount cleanup **clears the pending timer without flushing it**:

```ts
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current);
      }
```
`RichTextEditor.tsx:109-119`

Blur *does* flush (`:630-634`), which is why leaving via the **Back to Notes** button keeps the
text — verified, `<div>baseTAIL</div>` was stored correctly. But Escape does not blur when
`alwaysEditable` is set (`:691-696`), and the note body is `alwaysEditable`
(`NoteDetailView.tsx:629`). So the safe path works and the natural one loses data.

### R2 — The comment box never clears, and a second Enter duplicates — HIGH

Type a comment, press Enter. It posts, but the text stays on screen. Press Enter again — the same
comment is posted a second time.

```
box before Enter : "First comment"
box AFTER Enter  : "First comment"      <- expected ""
stored           : ["First comment"]
Enter again
stored           : ["First comment", "First comment"]
```

`onSubmit` reads the HTML and hands it to the parent but never clears the DOM
(`RichTextEditor.tsx:730-737`). The parent does `setNewComment("")`, so `value` becomes `""` — but
the one effect that writes `value` into the DOM is guarded on the editor **not** having focus:

```ts
      const hasFocus = document.activeElement === editorRef.current;
      if (!hasFocus && editorRef.current.innerHTML !== value) {
```
`RichTextEditor.tsx:94-95`

After Enter the caret is still in the editor, so the write is skipped, and because the effect's
only trigger is `[value, isEditing]` it never retries. Clicking the **Add** button instead works,
because that blurs first — two different outcomes for the same intent.

### R3 — Paste is stored unsanitised, then stripped on render — HIGH

There is **no `onPaste` handler anywhere in the editor**. Pasting
`<b>bold</b> <font color="red">red</font><img src="x.png">`:

```
in the editor    : <b>bold</b> <font color="red">red</font><img src="http://localhost:3311/x.png">
stored in IndexedDB : <b>bold</b> <font color="red">red</font><img src="http://localhost:3311/x.png">
```

Neither `font` nor `img` is in the allow-list (`sanitize.ts:14-35`), and `sanitizeHtml` runs only
when *rendering* (`RichTextEditor.tsx:377`). So the user pastes something, sees it intact, and it
mutates or vanishes the next time the content is displayed. Sanitising on the way in — rather than
only on the way out — is the fix.

### R4 — A visually empty box posts a blank comment — MEDIUM

Type a character into a comment box and delete it. The box looks empty; its HTML is `<br>`.
Press Enter:

```
stored comments before : []
stored comments after  : ["<br>"]
```

`TodoDetailsOverlay.tsx:1161`, `NoteDetailView.tsx:827` and `ActivitySection.tsx:73` gate on `html.trim()`, which tests the
**HTML** — and `"<br>"` is truthy. `Comments.tsx:102` gets this right by using a text-based check.
`isHtmlEmpty` already exists and is exported from `sanitize.ts:143-153`; three of the call sites
simply do not use it.

### R5 — Backspace destroys inline formatting in a list item — MEDIUM

With the caret at the very start of `<ul><li><b>Bold</b> tail</li></ul>`, press Backspace:

```
before : <ul><li><b>Bold</b> tail</li></ul>
after  : <div>Bold tail</div>            <- the <b> is gone
```

Unwrapping a list item back to a plain block round-trips the content through `textContent`
(`keyHandlers.ts:194-204`), which keeps the characters and discards every inline element. The
blockquote and header unwrap handlers do the same (`:245`, `:280`).

### R6 — `# ` and `> ` leave the caret before the existing text — LOW

On a line that already reads `existing`, put the caret at the start, type `# `, then type `X`:

```
result : <h1>Xexisting</h1>       <- X landed before the text
```

The list conversions restore the caret **after** the text (`blocks.ts:103`, `:145`) while the
header and blockquote conversions use `setStart(block, 0)` (`blocks.ts:235`, `:273`), i.e. before
it. Two conventions in one file. There are fourteen hand-rolled caret restores across `blocks.ts`
and `keyHandlers.ts` and no shared save/restore helper.

### R7 — the block toolbar buttons do not convert the line — HIGH

*Found on 2026-09-04 while writing the component's first tests, after the report
above was written. Verified in the browser the same way.*

Put the caret on a line and click **Bullet**, **Numbered**, **Checkbox**,
**Blockquote** or any heading — the normal way to use these buttons. You get an
empty block, and your text stays where it was:

```
typed  keep this text
click  Bullet
        -> keep this text<ul><li><br></li></ul>
click  Blockquote
        -> keep this text<blockquote><br></blockquote>
click  Heading 2
        -> keep this text<h2><br></h2>
```

Select the line first and every one of them is correct
(`<ul><li>keep this text</li></ul>`), which is why this survived: it works in
the one case a developer testing a toolbar button is most likely to try.

`insertBlockElement` reads the text to convert from `selection.toString()` alone
(`RichTextEditor.tsx:337-347`). A collapsed caret has no selection text, so it
hands `""` to the conversion, which duly builds an empty block. Nothing reads the
line the caret is actually on.

A first pass at this measured contaminated state — each case ran on the wreckage
of the last, which produced invalid nested `<ul><ul>` output and made the defect
look worse and stranger than it is. Re-run with a verified-empty editor each
time, the result is the six clean lines above. Worth recording: the first
measurement was wrong in a way that would have sent the fix somewhere useless.

---

## 2. What works

Verified hands-on, and worth recording precisely because it was expected to be broken:

- **Typing is fine.** Fast (`delay: 10`) and slow (`delay: 120`) both produce exactly
  `"Hello world"`. No dropped characters, no caret reset. The `hasFocus` guard at `:94` does
  correctly prevent the classic re-render-wipes-the-caret failure.
- **Typing mid-text is fine.** `XYZ` typed at offset 3 of `ABCDEF` gives `ABCXYZDEF`.
- **Leaving via a button keeps the text.** Blur flushes the pending debounce correctly; only the
  Escape path (R1) loses it.
- **Markdown triggers build the right structure.** `# `, `- ` and `> ` on an empty line produce
  `<h1>`, `<ul><li>` and `<blockquote>` correctly. Only the caret placement is wrong (R6).
- No console or page errors were produced by any of the above.

---

## 3. Coverage

**Exercised:** typing at two speeds; caret placement mid-text; markdown triggers for heading,
bullet and blockquote, on both empty and non-empty lines; backspace-unwrap out of a formatted list
item; comment submit via Enter and the resulting store contents; repeat-Enter duplication; empty
comment submission; real clipboard paste of mixed HTML and its round-trip into IndexedDB; Escape
and button exits from a note.

**Not verified — stated plainly rather than implied:**

- **Undo/redo.** Not tested. The mix of `document.execCommand` (which uses the browser's undo
  stack) and direct DOM mutation in `blocks.ts`/`keyHandlers.ts` (which does not) suggests undo is
  incoherent, but that is untested and should not be assumed.
- **View-mode checkbox toggling** writing link-pattern anchors back into storage
  (`RichTextEditor.tsx:356`). The note body is `alwaysEditable` and so has no view mode; this needs
  the task **Context** or sprint-goal consumer to reproduce, which was not done.
- **The display/edit mode swap** and its focus race (`:368-374`) — same reason.
- Tab/Shift+Tab list indentation, nested lists, inline code via backtick, the link dialog and its
  30-second selection staleness rule, and the toolbar buttons other than through code reading.

---

## 4. Why the automated suite did not catch any of this

- **`RichTextEditor.tsx` has no test file at all**, and `jest.config.js` does not list it in
  `collectCoverageFrom` — so its 867 lines are invisible to the coverage gate. The extracted
  helpers *are* tested (74 tests, 77-94%), which is why the defects that remain are all in the
  component and at its boundaries rather than in the helpers.
- The one E2E test that touches the editor uses `contentArea.fill(...)`
  (`e2e/smoke/notes-workflow.spec.ts:116`). Playwright's `fill` sets content wholesale, so it
  exercises none of the key handling, and the test then only asserts that the note still exists.
- `EntityDetailsOverlay.test.tsx:28-34` stubs the editor out with a `<textarea>`.

---

## 5. Outcome

All seven are fixed, each re-verified in the browser the same way it was found.

| # | Fix | Verified |
|---|---|---|
| R1 | `useDebouncedSave` runs the pending save on unmount rather than cancelling it, and the note body commits on blur with the html passed as an argument — Escape blurs before it closes | Type `ESCTAIL`, press Escape at once: stored `"ESCTAIL"`, before and after a reload. Was `""` |
| R2 | The submit path empties the DOM and drops the queued change; the value→DOM sync applies while focused, with the caret saved as an offset | The box empties on Enter, and a second Enter posts nothing. Was a duplicate |
| R3 | An `onPaste` handler that sanitises on entry, plus `insertHtmlAtCaret`/`insertTextAtCaret` replacing `execCommand("insertHTML")` | Editor and storage agree on `<b>bold</b> red`; `<font>`, `<img>` and `<table>` are gone at paste time, not later |
| R4 | The shared `isHtmlEmpty` at all four composers — in the Enter handler, the click and the disabled state alike | An emptied box leaves Add disabled and Enter inert |
| R5 | The unwrap handlers move child nodes instead of copying `textContent` | `<b>Bold</b> tail` survives Backspace, and so do links and code spans |
| R6 | One `placeCaretAtEnd` behind all five block conversions | `# ` in front of existing text leaves the caret after it |
| R7 | `insertBlockElement` reads the caret's block, or its text node when there is none | All six block buttons convert the line, with a selection and without |

Two more were found on the way, both by writing tests rather than by reading code:

- `insertInlineCode` read the selection *after* focusing the editor, so anything that moved focus
  first turned "wrap this in code" into "insert an empty code span". jsdom collapses the selection
  on `focus()`, which is what exposed it.
- R7 itself was not on the original list at all.

And the hole that let all of this live: `RichTextEditor.tsx` went from no test file and no place in
`collectCoverageFrom` to 50 unit tests at 77% statements with its own ratchet entry, plus 12 e2e
cases in `e2e/smoke/rich-text-editor.spec.ts` covering what jsdom cannot reach.

The gaps in §3 are still gaps. Undo/redo remains untested, as do the Tab indentation depth limit
and the link dialog's staleness rule beyond its unit test.
