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

E2E tests are located in the `e2e/` directory:

```
e2e/
├── fixtures/
│   └── todo-app.fixture.ts   # Custom test fixtures and helpers
├── accessibility.spec.ts     # Accessibility and ARIA tests (6 tests)
├── advanced-search.spec.ts   # Advanced search functionality (13 tests)
├── archive-duplicate.spec.ts # Archive/unarchive and duplicate (8 tests)
├── bulk-operations.spec.ts   # Bulk selection and operations (7 tests)
├── comments.spec.ts          # Comments functionality (5 tests)
├── keyboard.spec.ts          # Keyboard navigation and shortcuts (10 tests)
├── mobile.spec.ts            # Mobile responsiveness (4 tests)
├── persistence.spec.ts       # Data persistence tests (5 tests)
├── search-filter.spec.ts     # Basic search and filtering (5 tests)
├── settings.spec.ts          # Settings page tests (3 tests)
├── smart-input.spec.ts       # Smart input and auto-detection (7 tests)
├── subtasks.spec.ts          # Subtask functionality (7 tests)
├── todo-crud.spec.ts         # Todo CRUD operations (7 tests)
├── todo-details.spec.ts      # Todo details overlay (13 tests)
└── views.spec.ts             # View navigation tests (7 tests)
```

**Total: 106 tests** (212 with mobile browser = 106 × 2)

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
