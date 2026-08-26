# E2E Testing Guide

This project uses [Playwright](https://playwright.dev/) for end-to-end testing.

## Setup

Playwright is already configured in the project. The browsers are installed automatically when you run tests for the first time.

To manually install browsers:

```bash
npx playwright install
```

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run tests with UI mode (interactive)

```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see the browser)

```bash
npm run test:e2e:headed
```

### Run tests in debug mode

```bash
npm run test:e2e:debug
```

### View test report

```bash
npm run test:e2e:report
```

## Test Structure

```
e2e/
├── fixtures/
│   ├── todo-app.fixture.ts   # Page helpers, and the two test objects below
│   └── smoke-helpers.ts      # resetAppStorage, used by every smoke spec
├── smoke/                    # Sequential workflow specs, 69 tests
│   ├── accessibility-keyboard.spec.ts
│   ├── crud-workflow.spec.ts
│   ├── dates-recurring.spec.ts
│   ├── edge-cases-mobile.spec.ts
│   ├── notes-workflow.spec.ts
│   ├── persistence-settings.spec.ts
│   ├── smart-input-search.spec.ts
│   ├── todo-details-workflow.spec.ts
│   └── views-workflow.spec.ts
└── visual.spec.ts            # Visual regression, 16 screenshots
```

Projects in `playwright.config.ts`: `smoke-tests`, `smoke-mobile` and
`visual-tests`. 93 tests across 10 files.

## Two test objects, and which to import

`todo-app.fixture.ts` exports two:

- **`test`** shares one browser context per worker. The smoke specs are
  `describe.serial` and each step builds on the state the last one left, which
  Playwright's default per-test context does not preserve -- every step after
  the first would open an empty app. Each spec's `beforeAll` calls
  `resetAppStorage(workerPage)` on that shared page, which is also what isolates
  one spec file from the next.

- **`isolatedTest`** is Playwright's ordinary per-test context. Use it when
  tests are independent, and whenever a spec sets its own context options:
  `test.use({ viewport })` cannot apply to a context the worker fixture has
  already created. `visual.spec.ts` imports this one.

## Selectors

Prefer `data-testid`. Text selectors are brittle here in a specific way: the
add-todo button's visible label is "Todo" while its title is "Add new todo", and
below `sm:` the label is hidden entirely. A suite matching on `has-text("Add")`
went unnoticed for seven months.

## Running against a different port

`reuseExistingServer` means whatever answers on the configured port gets tested,
including another project's dev server. Set `PLAYWRIGHT_PORT` to avoid the
collision:

```bash
PLAYWRIGHT_PORT=3100 npx playwright test --project=smoke-tests
```

## Visual baselines

Committed under `e2e/visual.spec.ts-snapshots/`, one per platform suffix. The
comparison allows a 1-2% pixel difference, which is enough to pass a genuine
layout change -- delete the baseline and regenerate if you need to see the real
before and after.

```bash
npm run test:visual:update
```

## Custom Fixtures

The `todo-app.fixture.ts` provides custom helpers for common operations:

```typescript
import { test, expect } from "./fixtures/todo-app.fixture";

test("example test", async ({ page, todoApp }) => {
  // Clear storage for a fresh start
  await todoApp.clearStorage();

  // Wait for app to load
  await todoApp.waitForAppLoad();

  // Add a todo
  await todoApp.addTodo("Buy groceries");

  // Toggle completion
  await todoApp.toggleTodo("Buy groceries");

  // Delete a todo
  await todoApp.deleteTodo("Buy groceries");

  // Search for todos
  await todoApp.search("groceries");

  // Switch views
  await todoApp.switchView("kanban");
});
```

## Test IDs

Components use `data-testid` attributes for reliable element selection:

- `todo-app` - Main app container
- `smart-input` - The todo input field
- `search-input` - Search input
- `todo-item` - Individual todo items
- `todo-text` - Todo text content
- `todo-checkbox` - Todo completion checkbox
- `todo-delete` - Delete button
- `todo-details-overlay` - Todo details modal
- `overlay-close` - Close button for overlays
- `view-tab-list` - List view tab
- `view-tab-kanban` - Kanban view tab
- `view-tab-gantt` - Gantt view tab
- `view-tab-calendar` - Calendar view tab
- `view-tab-people` - People view tab
- `view-tab-projects` - Projects view tab
- `kanban-view` - Kanban view container
- `gantt-view` - Gantt view container
- `calendar-view` - Calendar view container
- `people-view` - People view container
- `projects-view` - Projects view container

## Configuration

Playwright configuration is in `playwright.config.ts`:

- Tests run against `http://localhost:3000`
- Dev server starts automatically
- Screenshots and videos captured on failure
- Runs on Chromium and Mobile Chrome by default

## Writing New Tests

1. Create a new `.spec.ts` file in the `e2e/` directory
2. Import the custom fixture:
   ```typescript
   import { test, expect } from "./fixtures/todo-app.fixture";
   ```
3. Use `test.beforeEach` to set up clean state
4. Use the `todoApp` fixture for common operations

Example:

```typescript
import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("My Feature", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should do something", async ({ page, todoApp }) => {
    // Your test code here
  });
});
```

## CI/CD Integration

For CI environments, set the `CI` environment variable. This enables:

- Fail on `test.only`
- Retry failed tests 2 times
- Single worker for stability

Example GitHub Actions workflow:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

1. **UI Mode**: `npm run test:e2e:ui` - Interactive mode with time travel debugging
2. **Debug Mode**: `npm run test:e2e:debug` - Step through tests with DevTools
3. **Headed Mode**: `npm run test:e2e:headed` - Watch tests run in real browser
4. **Trace Viewer**: After failed tests, view traces in the HTML report

## Tips

- Use `await page.pause()` to stop test execution for debugging
- Use `test.only()` to run a single test during development
- Use `page.locator()` with data-testid for reliable element selection
- Test on multiple viewports to catch responsive issues
- Keep tests independent - each test should clean up after itself
