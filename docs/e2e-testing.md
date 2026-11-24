# E2E Testing Guide

This project uses [Playwright](https://playwright.dev/) for end-to-end testing.

## Setup

The browsers are not installed with `npm install`. Install them once:

```bash
npx playwright install chromium          # smoke and visual suites, and the PWA run
npx playwright install webkit firefox    # only for npm run test:browsers
```

## What runs, and how

| Command | What it runs | Against |
| --- | --- | --- |
| `npm run test:smoke` | The smoke specs: `smoke-tests` (desktop Chrome) and `smoke-mobile` (a phone profile, `mobile.spec.ts` only) | `next dev` |
| `npm run test:visual` | `visual.spec.ts`: sixteen screenshots compared with committed baselines | `next dev` |
| `npm run test:browsers` | Three smoke specs in WebKit and Firefox: task creation, the rich-text editor, settings and storage | `next dev` |
| `npm run test:pwa` | Offline reload and the update prompt | the static export, built first |
| `npm run test:e2e` | Every project in `playwright.config.ts`, so it needs all three browsers | `next dev` |

`npm run test:smoke:quick` and `test:smoke:headed` run the desktop smoke project only.
`test:e2e:ui`, `:headed`, `:debug` and `:report` are the usual Playwright modes.

A single file or test:

```bash
npx playwright test --project=smoke-tests e2e/smoke/crud-workflow.spec.ts
npx playwright test --project=smoke-tests -g "Step 3"
```

### The port

Playwright starts `npm run dev` itself and reuses a server that is already running.
That means whatever answers on the port gets tested -- including another project's dev
server on 3000, which fails with "todo-app not visible" and no hint at the cause. Set
`PLAYWRIGHT_PORT` to be sure:

```bash
PLAYWRIGHT_PORT=3317 npm run test:smoke
```

The PWA run has its own port, `PLAYWRIGHT_PWA_PORT` (default 3100), and never reuses a
server: building the export is part of starting it, so a leftover server would mean
testing an earlier build.

### Locally and in CI

Locally: four workers, one retry. With `CI` set: two workers, two retries, and
`test.only` fails the run.

`.github/workflows/ci.yml` runs `npm run test:smoke` on every pull request and push to
`main`, and uploads the Playwright report when it fails. The visual suite is not in CI
because its baselines are captured on macOS; the WebKit and Firefox subset and the PWA
run are local too.

## Test structure

```
e2e/
├── fixtures/
│   ├── todo-app.fixture.ts   # Page helpers, and the two test objects below
│   └── smoke-helpers.ts      # clearAppStorage and resetAppStorage
├── smoke/
│   ├── accessibility-keyboard.spec.ts
│   ├── backup-restore.spec.ts
│   ├── calendar-modes.spec.ts
│   ├── crud-workflow.spec.ts
│   ├── dates-recurring.spec.ts
│   ├── edge-cases.spec.ts
│   ├── focus-timer.spec.ts
│   ├── import-tasks.spec.ts
│   ├── kanban-keyboard.spec.ts
│   ├── list-export.spec.ts
│   ├── mobile.spec.ts
│   ├── notes-workflow.spec.ts
│   ├── persistence-settings.spec.ts
│   ├── regressions.spec.ts
│   ├── reviews-workflow.spec.ts
│   ├── rich-text-editor.spec.ts
│   ├── smart-input-search.spec.ts
│   ├── sprints-workflow.spec.ts
│   ├── time-reports.spec.ts
│   ├── todo-details-workflow.spec.ts
│   └── views-workflow.spec.ts
├── pwa/
│   ├── offline-and-update.spec.ts
│   └── serve-export.mjs      # The static server behind npm run test:pwa
├── visual.spec.ts
├── visual.css                # Applied while a screenshot is taken
└── visual.spec.ts-snapshots/ # The baselines
```

`playwright.config.ts` has the projects `smoke-tests`, `smoke-mobile`, `visual-tests`,
`webkit` and `firefox`. `playwright.pwa.config.ts` is separate, with the one project
`pwa`: Playwright starts every web server of a configuration whichever project is
selected, and that one has to build the export first.

## Two test objects, and which to import

`todo-app.fixture.ts` exports two:

- **`test`** shares one browser context per worker. The older smoke specs are
  `describe.serial` and each step builds on the state the last one left, which
  Playwright's default per-test context does not preserve -- every step after
  the first would open an empty app. Each spec's `beforeAll` calls
  `resetAppStorage(workerPage)` on that shared page, which is also what isolates
  one spec file from the next.

- **`isolatedTest`** is Playwright's ordinary per-test context: every test starts
  with an empty app. Use it for a new spec. It is also the only one that works when
  a spec sets its own context options: `test.use({ viewport })` cannot apply to a
  context the worker fixture has already created, which is how the mobile tests
  once ran at desktop width. A fixed clock belongs here too -- on the shared page it
  would leak into every spec that follows in the same worker.

## Writing a new spec

1. Create `e2e/smoke/<what-it-covers>.spec.ts`. A spec placed directly in `e2e/`
   matches no project and never runs.
2. Import the isolated fixture:
   ```typescript
   import { isolatedTest as test, expect } from "../fixtures/todo-app.fixture";
   ```
3. Have each test create what it needs.

```typescript
import { isolatedTest as test, expect } from "../fixtures/todo-app.fixture";

test.describe("My feature", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
  });

  test("does the thing", async ({ page, todoApp }) => {
    await todoApp.addTodo("Buy groceries");
    await expect(page.getByTestId("todo-item")).toHaveCount(1);
  });
});
```

Check it is picked up:

```bash
npx playwright test --list --project=smoke-tests e2e/smoke/<what-it-covers>.spec.ts
```

### What an assertion has to be able to do

Fail. Several smoke steps used to read `if (await x.isVisible()) { expect(x)... }`, or
asserted a count the previous step already guaranteed, and passed whatever the app did.

- Assert the outcome: the row that changed, the value that was stored
  (`todoApp.getStoredValue(STORAGE_KEYS.X)`), the announcement that was made.
- Before committing a new assertion, break the feature locally and watch it fail.
- When a step cannot pass because the app has a defect, do not weaken it. Mark the
  case `test.fixme("what should happen (U0000)")`, naming the backlog unit that fixes it.

### The fixture's helpers

```typescript
await todoApp.waitForAppLoad();          // Waits for the app and dismisses the tutorial
await todoApp.addTodo("Buy groceries");
await todoApp.toggleTodo("Buy groceries");
await todoApp.openTodoDetails("Buy groceries");
await todoApp.switchView("kanban");      // Any id from src/types/viewRegistry.ts
await todoApp.search("groceries");
await todoApp.getStoredValue(STORAGE_KEYS.TODOS); // Reads IndexedDB or localStorage
await todoApp.clearStorage();            // Only needed on the shared page
```

Storage names come from `src/storage/keys.ts`, never from a literal. A function passed
to `page.evaluate` runs in the browser and cannot see imports, so pass the names in as
arguments.

## Selectors

Roles and labels first, where the app has them: `getByRole("dialog", { name: "Task details" })`,
`getByRole("button", { name: "Complete review" })`. Then `data-testid`.

Text selectors are brittle here in a specific way: the add-todo button's visible label is
"Todo" while its title is "Add new todo", and below `sm:` the label is hidden entirely. A
suite matching on `has-text("Add")` went unnoticed for seven months. A substring match also
finds more than intended -- "Pin" matches "Unpin" -- so ask for `exact: true`.

Test ids follow a few patterns:

- `view-tab-<id>` for every tab, from the view registry
- `todo-item`, `note-item`, `review-item`, `sprint-item` for rows; `todo-text`, `todo-checkbox`
  and `todo-delete` inside a todo row
- `kanban-view`, `gantt-view`, `calendar-view` for those views; `kanban-column-<state>`
  for a board column
- `todo-details-overlay`, and `action-archive`, `action-delete`, `action-duplicate` inside
  a details dialog
- `add-todo-button`, `add-todo-submit`, `smart-input`, `search-input`, `sort-button`,
  `filter-button`, `settings-button`

Add a test id only where a role or label cannot do the job.

## Visual baselines

Committed under `e2e/visual.spec.ts-snapshots/`, one per platform suffix. Only macOS
baselines exist.

Three things keep a screenshot from depending on when it is taken:

- The clock is fixed at Sunday 30 August 2026, 10:00, before the first navigation.
  Without it the calendar, the Gantt chart and every "Created" line change with the
  day, and by evening a task due today turns overdue and red.
- The time zone is pinned in `playwright.config.ts`.
- `e2e/visual.css` hides the Next.js dev indicator and the footer's year and version,
  which are rendered on the server and so are out of the fixed clock's reach.

**The tolerance** is 0.1% of the pixels by default (`playwright.config.ts`) and 0.2% for
the shots in `visual.spec.ts` that ask for it. That is about 920 pixels at 1280x720 and
about 250 at phone width. Measured, not assumed: a changed digit, a highlight that moved
one calendar cell, and the whole 36-pixel dev indicator each fit inside it and pass. A
layout change does not.

Two consequences:

- A green visual run does not prove nothing changed; it proves nothing large did.
- `npm run test:visual:update` rewrites only the baselines that fail. A baseline that is
  stale but inside the tolerance stays stale -- two of the old ones kept passing without
  a header button that had been added after they were captured.

So after an intended visual change, delete the affected baselines, regenerate, and look
at old against new before committing:

```bash
rm e2e/visual.spec.ts-snapshots/kanban-view-darwin.png
PLAYWRIGHT_PORT=3317 npm run test:visual:update
git diff --stat e2e/visual.spec.ts-snapshots
```

## The other browsers

`npm run test:browsers` runs the three specs listed in `CROSS_BROWSER_SPECS` in
`playwright.config.ts`. Two things are particular to Firefox:

- At startup the app asks for persistent storage and waits for the answer. Firefox
  answers with a prompt, which a test cannot click, so the project sets two Firefox
  preferences that grant it. The wait itself is therefore invisible to these tests
  (U0089).
- Firefox gives a script-made paste event an empty clipboard, so the two paste tests
  are `fixme` there. Pasting in Firefox is not covered.

## The installed app

`npm run test:pwa` builds the static export and serves it under `/doit/`, as GitHub
Pages does, with `e2e/pwa/serve-export.mjs`. That server differs from a plain one on
purpose:

- `/doit/sounds/` answers 404, so the service worker does not precache 315 MB.
- Every response is `no-store`, so only the worker's cache can answer offline.
- `POST /__pwa-test/next-worker` makes `sw.js` differ from then on, which is what a new
  deploy looks like to the browser.
- `POST /__pwa-test/offline` drops every connection until `POST /__pwa-test/online`.

The last one is needed because `context.setOffline(true)` does not reach the requests
a service worker makes. With that switch alone the worker keeps fetching from the
network, and an offline test passes even with all of the worker's caching removed.

Open pages with `./`, not `/`: the base URL ends in `/doit/`.

## Debugging

1. **UI mode**: `npm run test:e2e:ui` -- interactive, with time travel
2. **Debug mode**: `npm run test:e2e:debug` -- step through with DevTools
3. **Headed mode**: `npm run test:smoke:headed` -- watch the browser
4. **Trace viewer**: a retried failure records a trace; open it from the HTML report
   (`npm run test:e2e:report`)

`await page.pause()` stops a test where it is. `test.only()` narrows a run while
developing; CI refuses it.
