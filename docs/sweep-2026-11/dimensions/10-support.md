# 10. Opportunities to improve support

93 items: 21 high, 49 medium, 23 low. These findings were spot-checked by the synthesiser, not independently verified. Every item links to its full text; the unit and batch after each title say where the work is scheduled.

## Context

STATE OF THE DIMENSION. "Support" covers three things here: helping a user who is in trouble, coping with more browsers, devices and situations, and helping the people who maintain the code. Three slices were reviewed. Before keeping any high-priority item I opened the code it cites and checked it myself. All 21 high items hold. Two things I checked go further than the reviewers did. First, the minified production chunk (build/static/chunks/c6eddffca2a5b004.js and e6867bfa49891c7d.js) really does contain `class o{dbName="doit-db"` next to `"IndexedDBAdapter"===t.constructor.name`. Second, `du` shows public/sounds is 315 MB in 18 files. The calendar visual baseline shows August 2026 with the Next dev indicator, so it fails today (20 Nov 2026). The Next 16.0.5 security advisory is taken from memory, not from the repo.

THE MAIN PATTERN: FAILURES TURN INTO EMPTY DATA, AND EMPTY DATA IS SAVED. In src/storage/storage.ts, both adapters' getItem return null on any error, and getAllKeys returns []. loadFromStorage then returns the default value on null or on a parse error, and migrateTodos returns [] for a value that is not an array. settingsStore.hydrate and sharedStore.applyExternalChange swallow errors. Every data hook (useTodos, useEntityManager, usePersistedState, useNotes, useReviews, useSprints) loads once and then writes its whole array back whenever its state changes, gated only on isLoaded. useTodos and useEntityManager set isLoaded in a finally block, so when a load fails they write [] over the stored data. TodoApp's StorageRecoveryScreen is reachable only when migrateTodo throws, for example on a null array entry. Even then the save effect has already replaced doit-todos with [] before 'Download my data' can read it.

The startup chain makes this worse. StorageInitializer runs initializeStorageClient, which does the IndexedDB probe (10 s timeout), the migration, the cleanup of stale localStorage, and then awaits persist(). Every hook awaits waitForStorageInit. useTodos then runs checkAndUpdateVersion, which calls autoBackupIfNeeded, migrateLegacyEntitiesFromSettings and cleanupOldBackups. Several problems sit in that chain. The doit-migrated-to-indexeddb flag lives inside IndexedDB, so a probe failure or a switch back to localStorage is undone on the next load and that session's work is deleted. Only settings are coordinated across tabs. Backup pruning ignores where a backup came from. These problems concentrate in storage.ts, the five data hooks, backup.ts and StorageRecoveryScreen.tsx, and they are the top of the backlog (SUP-01 to SUP-08). Several of them will also appear in the Logic-bugs dimension, so the central plan should keep one owner for each.

THE SECOND PATTERN: HAND-MAINTAINED PARALLEL LISTS DRIFT. The help prose hard-codes view digits that disagree with viewRegistry. getViewTutorialSteps has no entry for stats or timereports, which crashes the app (SUP-09). The keyboard reference does not match the real handlers. Tutorial selectors do not match the data-tutorial attributes. The export shape does not match the import parser. migrateToLocalStorage copies a different set of keys than migrateToIndexedDB. The cure each time is to derive the list from one typed source, for example Record&lt;ViewTab, ...>, rather than to fix the prose.

THE THIRD PATTERN: SUPPORT PLUMBING THAT WAS BUILT BUT NEVER WIRED UP. clearCache, getVersion and getCurrentVersion have no callers. sw.js has a notificationclick handler that no notification ever uses. notifications.checkInterval is saved but ignored. FeatureSettings.notesView and reviewsView have no toggle in the settings UI. The Dead-code dimension must not delete these if SUP-39, SUP-10 and SUP-57 are accepted.

THE FOURTH PATTERN: BEHAVIOUR THAT ONLY SHOWS UP IN PRODUCTION OR ON NON-CHROMIUM BROWSERS. Examples: the minified class name behind getStorageType, the service worker registering in dev with an unversioned cache, the static export, Android's ban on the Notification constructor, IME composition, WebKit's media and autoplay rules, and Firefox's persist() prompt. Jest cannot see these. Every Playwright project is Chromium running against next dev, and no Playwright run happens in CI. Platform findings marked medium confidence still need a check on a real device.

WHAT IS IN GOOD SHAPE AND SHOULD BE LEFT ALONE. Comments document these deliberate fixes, so read the comment before changing anything near them:
- saveToStorage resolves false and notifies onStorageWriteError, which feeds StorageErrorBanner.
- validateBackupData treats backup files as untrusted and rejects prototype keys.
- escapeCSV guards against spreadsheet formulas.
- downloadFile defers revoking the object URL.
- sw.js has no skipWaiting on install, and SKIP_WAITING runs only when the user accepts the update.
- fix-github-pages.js stamps the build version into sw.js.
- layout.tsx carries a CSP meta tag.
- migrateToIndexedDB scans by prefix and stays on localStorage when the migration fails.
- withTransaction handles onabort.
- viewRegistry, getEnabledViews and useViewShortcuts are the source of truth for tabs and digits.
- sharedStore coalesces writes and flushes on pagehide.
- jest.config.js holds a per-file coverage ratchet.
- The GitHub Actions are pinned by SHA.

WHAT AN IMPLEMENTER MUST KNOW FIRST:
- STORAGE_KEYS and INTERNAL_STORAGE_KEYS in storage.ts are authoritative, and the startup cleanup removes every STORAGE_KEYS entry from localStorage, including the doit-settings mirror the theme script reads.
- The production build is minified, statically exported under basePath /doit, and versioned per commit by scripts/pre-commit.
- Write a reproducer test before each storage fix (SUP-19 adds fake-indexeddb). For SUP-01, assert that the stored value stays byte-identical after a failed load.
- Many items here are feature extensions or need an owner decision, and are marked that way. Translating UI strings is out of scope.
- The owner's constraint applies: no existing feature is removed. SUP-57 and SUP-49/50 change visible behaviour and wait for an owner decision.

## Items, high to low

- [SUP-01](../workstreams/storage-core.md#sup-01) · high · `bugfix` · M — A failed load writes empty collections over the stored data · U0137, batch 2A
- [SUP-02](../workstreams/storage-core.md#sup-02) · high · `bugfix` · M — Unreadable or corrupt storage cannot be told apart from 'no data' · U0137, batch 2A
- [SUP-03](../workstreams/storage-core.md#sup-03) · high · `bugfix` · M — If the IndexedDB probe fails, the session runs on empty localStorage and its work is deleted on the next load · U0086, batch 2A
- [SUP-04](../workstreams/storage-core.md#sup-04) · high · `bugfix` · M — 'Switch to localStorage' is undone on reload, and edits made after switching are deleted · U0087, batch 2A
- [SUP-05](../workstreams/cross-tab.md#sup-05) · high · `bugfix` · L — Two open tabs silently overwrite each other's todos, notes, people, projects, reviews and sprints · U0071, batch 2C
- [SUP-06](../workstreams/storage-core.md#sup-06) · high · `bugfix` · S — In production the backend always shows as localStorage, because the check compares a minified class name · U0084, batch 2A
- [SUP-07](../workstreams/feedback-states.md#sup-07) · high · `bugfix` · S — The recovery screen's download cannot be restored, and an empty download is reported as a success · U0038, batch 2B
- [SUP-08](../workstreams/backup.md#sup-08) · high · `needs-decision` · S — Backup pruning silently deletes manual and imported backups · U0043, batch 2B
- [SUP-09](../workstreams/keyboard-help.md#sup-09) · high · `bugfix` · S — The 'Learn about this view' icon on the Stats and Time tabs crashes the app · U0446, batch 3C
- [SUP-10](../workstreams/notifications.md#sup-10) · high · `bugfix` · M — Task notifications never appear on Android Chrome, because the app uses the Notification constructor · U0743, batch 3B
- [SUP-11](../workstreams/pwa-service-worker.md#sup-11) · high · `needs-decision` · S — The service worker downloads 315 MB of ambient sounds on install and again after every deploy · U0003, batch 3B
- [SUP-12](../workstreams/smart-input.md#sup-12) · high · `bugfix` · M — The smart input and the rich-text editor break IME composition (Android keyboards, Chinese, Japanese, Korean) · U0504, batch 3A
- [SUP-13](../workstreams/storage-core.md#sup-13) · high · `bugfix` · S — Startup waits for navigator.storage.persist(), which can prompt on Firefox and leave the app on 'Loading...' · U0089, batch 2A
- [SUP-14](../workstreams/import-export.md#sup-14) · high · `bugfix` · M — The app's own JSON export does not survive a round trip through Import · U0099, batch 2B
- [SUP-15](../workstreams/keyboard-help.md#sup-15) · high · `bugfix` · S — On the Gantt view, the keyboard handler swallows typing in the rich-text editors, and T fires two actions · U0337, batch 3C
- [SUP-16](../workstreams/tests-ci-tooling.md#sup-16) · high · `none` · M — Nothing checks pull requests, and Playwright never runs in CI · U0610, batch 1
- [SUP-17](../workstreams/tests-ci-tooling.md#sup-17) · high · `none` · M — The visual baselines depend on the day they were captured, so validate and test:all always fail · U0635, batch 1
- SUP-18 · high · `bugfix` · S — held back with security unit U0643 · batch 1
- [SUP-19](../workstreams/tests-ci-tooling.md#sup-19) · high · `none` · M — Storage startup and migration code is untested (about 24% line coverage) · U0078, batch 1
- [SUP-20](../workstreams/tests-ci-tooling.md#sup-20) · high · `none` · L — Notes and Reviews have no tests, which blocks merging the undo code · U0570, batch 1
- [SUP-21](../workstreams/tests-ci-tooling.md#sup-21) · high · `none` · M — About 20 smoke e2e steps can never fail · U0634, batch 1
- [SUP-22](../workstreams/backup.md#sup-22) · medium · `bugfix` · S — Auto-backup failures are silent, and the Backup tab never says backups have stopped · U0061, batch 2B
- [SUP-23](../workstreams/backup.md#sup-23) · medium · `feature-extension` · M — No automatic safety snapshot before restore, migration, Clear All Data or import · U0016, batch 2B
- [SUP-24](../workstreams/cross-tab.md#sup-24) · medium · `bugfix` · M — Restore, Clear All Data and Import do not tell other open tabs, which then write the old data back · U0017, batch 2C
- [SUP-25](../workstreams/migrations-versioning.md#sup-25) · medium · `needs-decision` · M — Data saved by a newer version only logs a warning, and the older version keeps writing · U0067, batch 2A
- [SUP-26](../workstreams/import-export.md#sup-26) · medium · `bugfix` · S — Importing a DoIt backup or recovery file floods the screen with warnings and finds nothing · U0107, batch 2B
- [SUP-27](../workstreams/backup.md#sup-27) · medium · `bugfix` · S — The backup size cap counts characters as if they were bytes · U0060, batch 2B
- [SUP-28](../workstreams/import-export.md#sup-28) · medium · `bugfix` · S — Backup file export revokes its download URL at once and duplicates downloadFile · U0100, batch 2B
- [SUP-29](../workstreams/storage-core.md#sup-29) · medium · `bugfix` · S — Debounced saves are not flushed when a phone sends the page to the background · U0724, batch 2A
- [SUP-30](../workstreams/storage-core.md#sup-30) · medium · `bugfix` · S — The IndexedDB connection never recovers once it is closed · U0081, batch 2A
- [SUP-31](../workstreams/feedback-states.md#sup-31) · medium · `feature-extension` · M — The error screen cannot save data, report the problem or break a crash loop · U0009, batch 8A
- [SUP-32](../workstreams/pwa-service-worker.md#sup-32) · medium · `bugfix` · S — An update that is already waiting is never offered again · U0049, batch 6C
- [SUP-33](../workstreams/pwa-service-worker.md#sup-33) · medium · `bugfix` · S — Accepting an update reloads only the tab that clicked · U0052, batch 6C
- [SUP-34](../workstreams/pwa-service-worker.md#sup-34) · medium · `none` · S — The service worker also registers on the dev server, with a cache name that never changes · U0047, batch 3B
- [SUP-35](../workstreams/pwa-service-worker.md#sup-35) · medium · `feature-extension` · M — The app works offline only after a second online visit, because the precache misses the code files and /settings · U0051, batch 10
- [SUP-36](../workstreams/pwa-service-worker.md#sup-36) · medium · `feature-extension` · S — On a flaky connection, app launch stalls waiting for the network · U0005, batch 10
- [SUP-37](../workstreams/pwa-service-worker.md#sup-37) · medium · `bugfix` · M — Cached sounds ignore Range requests, which Safari needs to play audio · U0007, batch 6C
- [SUP-38](../workstreams/stats-time-focus.md#sup-38) · medium · `bugfix` · M — Focus sounds rely on autoplay and volume control that Safari and iOS block · U0761, batch 6B
- [SUP-39](../workstreams/logging-diagnostics.md#sup-39) · medium · `feature-extension` · M — No diagnostics or troubleshooting panel, although the building blocks already exist unused · U0053, batch 10
- [SUP-40](../workstreams/keyboard-help.md#sup-40) · medium · `bugfix` · S — Help and the tutorial hard-code view numbers that are wrong with the default settings · U0433, batch 3C
- [SUP-41](../workstreams/keyboard-help.md#sup-41) · medium · `bugfix` · M — The Views help is static: it leaves out Notes, Reviews and Time, and looks up a label that does not exist · U0443, batch 3C
- [SUP-42](../workstreams/keyboard-help.md#sup-42) · medium · `feature-extension` · S — The keyboard reference is incomplete and partly wrong, and Cmd/Ctrl+K can only be found by accident · U0439, batch 8A
- [SUP-43](../workstreams/keyboard-help.md#sup-43) · medium · `bugfix` · S — Help and tutorials describe UI that no longer exists, and two Gantt tutorial selectors match nothing · U0431, batch 6C
- [SUP-44](../workstreams/keyboard-help.md#sup-44) · medium · `feature-extension` · M — The in-app help has no troubleshooting or data-safety section, and the Settings help skips five tabs · U0445, batch 10
- [SUP-45](../workstreams/settings.md#sup-45) · medium · `feature-extension` · S — The Notes and Reviews views cannot be switched off, although their feature flags exist · U0262, batch 3C
- [SUP-46](../workstreams/storage-core.md#sup-46) · medium · `bugfix` · S — IndexedDB users see the wrong theme flash at launch, because the copy of the settings it reads is deleted at startup · U0776, batch 2A
- [SUP-47](../workstreams/visual-system.md#sup-47) · medium · `none` · S — ThemeProvider polls storage every second for the whole session · U0014, batch 6C
- [SUP-48](../workstreams/todos-core.md#sup-48) · medium · `bugfix` · S — Swipe gestures cannot stop the page scrolling (passive listener, no touch-action) · U0195, batch 6A
- [SUP-49](../workstreams/accessibility.md#sup-49) · medium · `needs-decision` · S — The viewport setting maximumScale: 1 blocks pinch zoom on Android · U0774, batch 8B
- [SUP-50](../workstreams/pwa-service-worker.md#sup-50) · medium · `needs-decision` · S — The manifest locks the installed app to portrait · U0002, batch 8C
- [SUP-51](../workstreams/pwa-service-worker.md#sup-51) · medium · `feature-extension` · M — No install guidance, although Safari data retention and iOS notifications both depend on installing · U0036, batch 10
- [SUP-52](../workstreams/storage-core.md#sup-52) · medium · `feature-extension` · S — When the browser blocks site storage, the user gets an empty app and a generic error · U0085, batch 2A
- [SUP-53](../workstreams/dates-time.md#sup-53) · medium · `bugfix` · S — Dates stored as local YYYY-MM-DD show one day early west of UTC · U0416, batch 3A
- [SUP-54](../workstreams/dates-time.md#sup-54) · medium · `feature-extension` · L — Dates and times are hard-coded to US English and mix 12-hour and 24-hour clocks · U0332, batch 10
- [SUP-55](../workstreams/dates-time.md#sup-55) · medium · `needs-decision` · M — Three different week starts; Calendar offers only Sunday or Monday, and week numbers are off by one with a Sunday start · U0272, batch 10
- [SUP-56](../workstreams/dates-time.md#sup-56) · medium · `needs-decision` · L — Due dates without a time shift to another day when the time zone changes · U0168, batch 6A
- [SUP-57](../workstreams/notifications.md#sup-57) · medium · `needs-decision` · S — The 'Check for due tasks every' setting has no effect · U0737, batch 6B
- [SUP-58](../workstreams/import-export.md#sup-58) · medium · `feature-extension` · S — The Markdown export drops people and projects, and the JSON export leaves out core fields · U0097, batch 2B
- [SUP-59](../workstreams/backup.md#sup-59) · medium · `feature-extension` · M — Nothing tracks or reminds the user to keep a copy of their data off the device · U0022, batch 10
- [SUP-60](../workstreams/kanban.md#sup-60) · medium · `needs-decision` · S — An empty list of allowed Kanban transitions means 'anything goes' in two places and 'nothing allowed' in two others · U0154, batch 7B
- [SUP-61](../workstreams/tests-ci-tooling.md#sup-61) · medium · `none` · S — Node 20 is past end of life, and nothing pins the Node version or proposes dependency updates · U0612, batch 1
- [SUP-62](../workstreams/tests-ci-tooling.md#sup-62) · medium · `none` · L — No e2e tests for Reviews, Sprints, Time Reports, Settings, Kanban moves or offline use · U0713, batch 1
- [SUP-63](../workstreams/tests-ci-tooling.md#sup-63) · medium · `none` · M — E2E runs only in Chromium against next dev, with no WebKit, Firefox or installed-app project · U0646, batch 1
- [SUP-64](../workstreams/tests-ci-tooling.md#sup-64) · medium · `none` · S — The 'Mobile Viewport Tests' run at desktop size, and the smoke-mobile project never runs from the npm scripts · U0633, batch 1
- [SUP-65](../workstreams/stats-time-focus.md#sup-65) · medium · `none` · M — Business metrics computed inside view components have no tests · U0365, batch 7B
- [SUP-66](../workstreams/smart-input.md#sup-66) · medium · `none` · M — SmartInput (1299 lines) has no component tests · U0500, batch 1
- [SUP-67](../workstreams/tests-ci-tooling.md#sup-67) · medium · `none` · M — Backup import, list grouping and presets, notes export and date shortcuts have little or no test coverage · U0040, batch 1
- [SUP-68](../workstreams/tests-ci-tooling.md#sup-68) · medium · `none` · S — The coverage ratchet ignores components/ and types/, including files that already have tests · U0640, batch 1
- [SUP-69](../workstreams/code-hygiene.md#sup-69) · medium · `none` · M — Weak spots in type safety cluster in the import, undo and storage code · U0103, batch 7A
- [SUP-70](../workstreams/tests-ci-tooling.md#sup-70) · medium · `needs-decision` · S — The pre-commit hook only bumps the version, and can write invalid JSON · U0649, batch 1
- [SUP-71](../workstreams/backup.md#sup-71) · low · `feature-extension` · S — The backup list says nothing about what each backup holds, and importing a backup file does not restore it · U0018, batch 8C
- [SUP-72](../workstreams/storage-core.md#sup-72) · low · `feature-extension` · S — The storage-full banner appears only on the main page and offers no action · U0685, batch 10
- [SUP-73](../workstreams/pwa-service-worker.md#sup-73) · low · `feature-extension` · S — The update toast does not say which version is coming or what changed · U0013, batch 10
- [SUP-74](../workstreams/import-export.md#sup-74) · low · `feature-extension` · M — Import has no duplicate detection and no undo · U0110, batch 10
- [SUP-75](../workstreams/notifications.md#sup-75) · low · `feature-extension` · S — Notifications do nothing when clicked, disappear after 5 seconds, and fire only while a tab is open · U0743, batch 3B
- [SUP-76](../workstreams/visual-system.md#sup-76) · low · `bugfix` · S — Printing includes the app's header and footer, dark mode prints dark pages, and landscape is forced on every print · U0771, batch 8C
- [SUP-77](../workstreams/import-export.md#sup-77) · low · `bugfix` · S — Exported CSV files show garbled accented names in Excel (no UTF-8 marker) · U0098, batch 11
- [SUP-78](../workstreams/storage-core.md#sup-78) · low · `bugfix` · S — The Storage tab overstates free space because it ignores the browser's own usage figure · U0092, batch 11
- [SUP-79](../workstreams/storage-core.md#sup-79) · low · `none` · S — The Storage tab and README describe outdated Safari Private Mode behaviour · U0037, batch 9
- [SUP-80](../workstreams/visual-system.md#sup-80) · low · `bugfix` · S — The page extends under the notch and home indicator (viewportFit 'cover') but nothing keeps content clear of them · U0775, batch 8C
- [SUP-81](../workstreams/visual-system.md#sup-81) · low · `bugfix` · S — Native controls and scrollbars stay light in dark mode because color-scheme is never set · U0765, batch 6C
- [SUP-82](../workstreams/pwa-service-worker.md#sup-82) · low · `feature-extension` · S — Installed-app polish: no maskable icon, light colours in dark mode, no shortcuts or screenshots · U0001, batch 10
- [SUP-83](../workstreams/kanban.md#sup-83) · low · `feature-extension` · M — Kanban and list reordering rely on HTML5 drag-and-drop only (check on touch devices first) · U0222, batch 10
- [SUP-84](../workstreams/pwa-service-worker.md#sup-84) · low · `none` · S — The /doit base path is guessed from the URL in three places · U0048, batch 7B
- [SUP-85](../workstreams/keyboard-help.md#sup-85) · low · `none` · S — Shortcut hints show only one platform's modifier key · U0793, batch 8A
- [SUP-86](../workstreams/tests-ci-tooling.md#sup-86) · low · `none` · S — Lint warnings never fail, and the deploy scripts are not linted · U0636, batch 11
- [SUP-87](../workstreams/tests-ci-tooling.md#sup-87) · low · `none` · S — Hook tests hand-write storage mocks that do not behave like the real saveToStorage · U0127, batch 1
- [SUP-88](../workstreams/tests-ci-tooling.md#sup-88) · low · `none` · M — The e2e suite relies on fixed sleeps, and local retries hide flaky tests · U0631, batch 11
- [SUP-89](../workstreams/tests-ci-tooling.md#sup-89) · low · `none` · S — tsconfig type-checks the stale build/ directory · U0652, batch 11
- [SUP-90](../workstreams/tests-ci-tooling.md#sup-90) · low · `bugfix` · S — build:gh-pages fails unless the caller sets GITHUB_PAGES · U0647, batch 11
- [SUP-91](../workstreams/tests-ci-tooling.md#sup-91) · low · `none` · S — Contributor test docs are out of date and duplicated · U0619, batch 1
- [SUP-92](../workstreams/tests-ci-tooling.md#sup-92) · low · `none` · S — Unit tests for date logic run only in the machine's own time zone · U0638, batch 1

### Added from the independent rerun

- [IND-01](../workstreams/pwa-service-worker.md#ind-01) · low · `needs-decision` · S — public/sounds keeps 315 MB of audio in the git repository · U0813, batch 11

## Commit groupings suggested by the reviewer

Superseded by the work units where they differ; kept because they show what the reviewer expected to land together.

- **CI checks and a passing baseline** — SUP-16, SUP-17, SUP-89, SUP-90. Gives every later phase an automatic check and a visual suite that can actually pass. Ships first.
- **Dependency security and runtime versions** — SUP-18, SUP-61. One package.json and lockfile change, verified by the new CI. The package-lock diff may exceed 1000 lines, which is a justified exception (generated file).
- **Pin today's storage behaviour with tests** — SUP-19. Adds fake-indexeddb and startup and migration tests before any storage fix lands.
- **Never save after a failed load** — SUP-01, SUP-29. Both change when the hooks persist. This is the highest-value data-loss fix and is small enough to land before the storage-layer change.
- **Storage reads: unreadable is not empty** — SUP-02, SUP-30. Adapter-level error handling and connection recovery in the same file. Safe only after the failed-load gate exists.
- **One source of truth for the active backend** — SUP-03, SUP-04, SUP-06, SUP-13. All four change initializeStorage, the migrate functions or the adapter interface in storage.ts, and they share the backend marker.
- **Recovery screen and error screen** — SUP-07, SUP-31. They share the new raw-dump-as-BackupData util and the same recovery actions.
- **Backup retention and reliability** — SUP-08, SUP-22, SUP-27, SUP-28. All in backup.ts, BackupTab and useBackups: pruning policy, surfacing failures, size units and the download helper.
- **Safety snapshots and copies kept off the device** — SUP-23, SUP-59, SUP-71. Feature extensions to backup bookkeeping and BackupTab that build on the retention package.
- **Cross-tab notice after data is replaced** — SUP-24. Cheap BroadcastChannel protection that also covers SUP-05 until it lands.
- **Collections on the shared store** — SUP-05. Large change to the five data hooks; coordinate with the Duplication dimension and split into one commit per hook if the diff grows.
- **Update flow and outdated versions** — SUP-25, SUP-32, SUP-33, SUP-34, SUP-73. useServiceWorker, ServiceWorkerProvider and the newer-data guard together decide how a tab on old code learns it must reload.
- **Service-worker caching** — SUP-11, SUP-35, SUP-36, SUP-37. All change sw.js routing and precaching, plus fix-github-pages.js.
- **Crash and keystroke fixes** — SUP-09, SUP-15. Two small, user-visible bugs in TutorialOverlay, ViewTabs and GanttView that can ship early on their own.
- **Import and export portability** — SUP-14, SUP-26, SUP-58, SUP-77. export.ts and import.ts round trip, backup-file detection and CSV encoding in one coherent change.
- **Import duplicate detection and undo** — SUP-74. A separate feature extension to the import flow that builds on the parser changes.
- **Notifications that reach the user** — SUP-10, SUP-57, SUP-75. browserApis, notifications.ts, useTaskNotifications and the sw.js notificationclick handler change together.
- **IME composition** — SUP-12. Focused editor change, landing after the SmartInput tests.
- **Touch interactions** — SUP-48, SUP-83. Swipe and drag behaviour on touch devices in the item components.
- **Focus audio on Safari and iOS** — SUP-38. Audio priming and GainNode work across notifications.ts and the focus views.
- **Help derived from the view registry** — SUP-40, SUP-41, SUP-45. Registry-driven view help and digits, with the Notes and Reviews toggles that change those digits.
- **Keyboard reference** — SUP-42, SUP-85. One shortcut table plus platform-aware modifier labels.
- **Help accuracy and troubleshooting** — SUP-43, SUP-44. Rewrites outdated help and tutorial text and adds the troubleshooting section in the same help files.
- **Diagnostics panel** — SUP-39. New settings tab that uses the backend kind, update state and backup error added by earlier packages.
- **Storage problem notices** — SUP-52, SUP-72, SUP-78, SUP-79. Storage messaging and figures shown in StorageTab and StorageErrorBanner.
- **Theme, colour scheme and printing** — SUP-46, SUP-47, SUP-76, SUP-81. ThemeProvider, the layout theme script and globals.css styling.
- **Installed app and viewport** — SUP-49, SUP-50, SUP-51, SUP-80, SUP-82. Manifest, viewport metadata and install guidance; three items wait on owner decisions.
- **Locale-aware dates and times** — SUP-53, SUP-54, SUP-55. Shared formatter module and week-start handling. Split SUP-53 out first if SUP-54 is deferred or its diff gets large.
- **All-day due dates** — SUP-56. Data-model migration that needs its own decision and commit.
- **Extract and test view logic and the Kanban transition rule** — SUP-60, SUP-65. Moving business rules out of the views and unifying the transition check overlap in KanbanView and the new utils.
- **Notes and Reviews tests** — SUP-20. Must exist before the Duplication dimension merges the undo code. Expect two commits, one per hook.
- **A smoke suite that can fail** — SUP-21, SUP-64, SUP-88. All change the e2e fixture and smoke specs to assert real outcomes and wait properly.
- **E2E coverage for untested views** — SUP-62. New specs and test ids. Split into one commit per spec to stay under 1000 lines.
- **Cross-browser and installed-app e2e** — SUP-63. New Playwright projects for WebKit, Firefox and the static export.
- **SmartInput tests and coverage scope** — SUP-66, SUP-68. Both change jest.config.js coverage settings and add component-level tests.
- **Missing unit tests, shared mocks and a time-zone matrix** — SUP-67, SUP-87, SUP-92. Test-only work that shares the new storage mock factory.
- **Type safety** — SUP-69. Removes casts and suppressions across import, undo and storage after those areas have their tests.
- **Tooling hygiene** — SUP-70, SUP-86. Pre-commit hook and lint settings.
- **Contributor docs** — SUP-91. Doc-only change, landing after the CI and e2e packages so it describes the real setup.
- **Configurable base path** — SUP-84. next.config, one runtime helper and fix-github-pages.js.

## Dependencies

ORDER INSIDE THIS DIMENSION
1. CI and visual baseline (SUP-16, 17, 89, 90) go first, so every later commit is checked automatically. The dependency bump (SUP-18, 61) comes right after and is verified by that CI.
2. Storage work runs in this order: storage tests (SUP-19), then the failed-load gate (SUP-01, 29), then the storage-layer change (SUP-02, 30), then the backend marker (SUP-03, 04, 06, 13).
   - SUP-02 makes more errors reach the hooks, so it is safe only once SUP-01 stops the hooks saving after a failed load.
   - SUP-03 and SUP-04 share the same localStorage marker.
3. Things that need SUP-06's adapter kind: SUP-27 (backend-scaled cap), SUP-78 and SUP-39.
4. SUP-46 (theme key) comes after the backend-marker package, because both edit INTERNAL_STORAGE_KEYS and the cleanup branch at storage.ts:816.
5. SUP-07's dump util comes before SUP-31 (which reuses it) and before SUP-26 (which detects that file shape).
6. SUP-08 lands together with or before SUP-23, so the new pre-restore, pre-migration and pre-import backups are not pruned straight away.
7. SUP-22 comes before SUP-39 (the panel shows the last backup error).
8. Cross-tab work: SUP-24 comes before SUP-05 (the interim notice first, the full shared store after). SUP-05 also comes after SUP-01 and SUP-02.
9. Updates: SUP-25 reuses SUP-01's mechanism for suspending auto-save. SUP-32 comes before SUP-73 and SUP-39.
10. SUP-10 comes before SUP-75 (notificationclick uses data.todoId).
11. Help: SUP-45 comes before SUP-40 (it changes the digits). SUP-41's view-id-keyed shortcutFor comes before SUP-40 and SUP-42. SUP-39 comes before SUP-44 (help buttons open the About tab). SUP-15's decision about the t key feeds SUP-42.
12. SUP-66 (SmartInput tests) comes before SUP-12 (IME).
13. Tests before the code they protect: SUP-21 and SUP-64 before any view refactor. SUP-87's mock factory before or together with SUP-67.
14. SUP-60 needs the owner decision on the empty-list rule before SUP-65 extracts the WIP and transition checks.
15. SUP-53 can be taken out of the locale package and shipped first. SUP-56 should follow SUP-54's formatter.
16. SUP-35 and SUP-36 are best verified by SUP-63's pwa project. SUP-11 lands before SUP-78, otherwise the usage figure is dominated by the sound cache.
17. SUP-69 comes after the import (SUP-14, 26) and undo (SUP-20) work, to avoid conflicting edits. SUP-86's --max-warnings 0 comes after SUP-16.

AGAINST OTHER DIMENSIONS
- Logic and business-logic bugs: SUP-01, 02, 03, 04, 09, 15, 53 and 60 will very likely appear there too. Give each one owner and one fix in the central plan. Their reproducer tests belong with whichever dimension implements the fix.
- Security review: SUP-18 (Next/RSC advisories) and SUP-16 (contents: read) may be duplicated there. SUP-07 and SUP-26 change paths that read untrusted backup files and must keep validateBackupData's protections. SUP-31 and SUP-39 copy diagnostics and must exclude task text and names.
- Duplication to consolidate:
  - SUP-05 overlaps any plan to merge the five load/save hooks. Land SUP-01's gate first, then consolidate onto createSharedStore once.
  - SUP-20 must land before the undo code in useTodos, useNotes and useReviews is merged.
  - SUP-28 (download helper), SUP-54 (date formatting), SUP-60 (transition rule), SUP-84 (base path) and the SUP-07/31 dump util are consolidations the Duplication dimension may also list.
- Restructuring for consistency: SUP-65 is an extraction, so coordinate it. SUP-21, 62 and 64 should land before views are restructured.
- Dead-code removal: clearCache, getVersion, getCurrentVersion (used by SUP-39), the SettingsModel checkInterval getter (SUP-57) and the sw.js notificationclick handler (SUP-10, 75) look dead today. Dead-code must not remove them while those items are accepted. SUP-21 removes assertViewState and unused fixture helpers, which overlaps Dead-code's e2e findings.
- Documentation cleanup: SUP-17 (CLAUDE.md:159), SUP-79 (README browser support), SUP-91 and the help prose in SUP-40 to 44. Let Documentation settle terminology first, or let these items carry it.
- Error, validation and other string messages: SUP-07, 22, 24, 25, 31, 39, 44, 51, 52, 59, 71, 72 and 73 add user-facing strings. If that dimension introduces a message module or conventions, land its scaffolding first so these strings follow it.
- Missing, wrong or out-of-date logging:
  - SUP-22 moves backup failures from console logging to the write-failure channel.
  - requestPersistentStorage's console.log (SUP-13) and the noisy sw.js console.log calls belong to that dimension's logging policy.
  - SUP-02 changes which errors are logged and which are surfaced to the user.
- UI design review: SUP-31, 39, 42 (header search button), 44, 51, 59, 71, 72 and 73 need UI placement decisions. SUP-49 and SUP-80 are accessibility and layout work.
- Inconsistencies across the codebase: SUP-04 (migrate key sets differ), SUP-54 and 55 (locale and week start) and SUP-60 (transition rule) are inconsistencies by nature.
- Partly implemented features: SUP-45 (notesView/reviewsView flags), SUP-57 (checkInterval), SUP-39 (unwired SW helpers), SUP-10 and 75 (notificationclick) and SUP-09 (no tutorials for Stats and Time) overlap that dimension.

## Open questions

- [ ] When stored data cannot be read or a domain fails to load (SUP-01, 02, 03), should the app block on the recovery screen, or continue read-only with a warning banner and auto-save turned off?
- [ ] Backup retention (SUP-08): should manual and imported backups be exempt from age and count pruning, and if not, what limits should they have? Should the 2 MB cap grow on IndexedDB?
- [ ] Ambient sounds (SUP-11): is it acceptable that sounds never played are not available offline? Do you want a 'Download sounds for offline use' button and/or files re-encoded at a lower bitrate?
- [ ] Data saved by a newer version (SUP-25): should the older version go fully blocked or read-only until the user reloads?
- [ ] Kanban (SUP-60): should an empty list of allowed transitions mean 'every move allowed' or 'no move allowed'?
- [ ] Notification check interval (SUP-57): wire the existing 5/15/30/60-minute setting into the checker, or remove the control?
- [ ] Should due and overdue reminders stay on screen instead of closing after 5 seconds (SUP-75)?
- [ ] Persistent storage (SUP-13): request it automatically at startup only where the browser decides silently, after a first meaningful action such as adding the first task, or only from the Storage tab button?
- [ ] Viewport and manifest (SUP-49, SUP-50): may we remove maximumScale (allowing pinch zoom) and the portrait-only orientation lock?
- [ ] Week start (SUP-55): should defaults come from the browser locale, should Calendar offer Saturday, and should Gantt follow the Calendar's week-start setting?
- [ ] All-day due dates (SUP-56): do you accept a data migration that adds an explicit all-day marker to due dates?
- [ ] Stats and Time tutorials (SUP-09): write new tutorial steps for these views, or hide the 'Learn about this view' icon on them?
- [ ] Should Cmd/Ctrl+K global search get a visible header button (SUP-42)?
- [ ] Diagnostics (SUP-39, SUP-44): which issue-tracker URL may the app show, and is linking to a public GitHub issues page from inside the app acceptable?
- [ ] Off-device reminder (SUP-59): do you want a reminder to export a backup? After how many days by default, and should it be on by default?
- [ ] Cross-tab sync (SUP-05): invest in moving every collection onto the shared store (large), or settle for the 'open in another tab' notice and data-replaced broadcast (SUP-24) for now?
- [ ] Pre-commit hook (SUP-70): should an amend or reword bump the version again, and should the hook lint staged files?
- [ ] CI (SUP-16): should Playwright smoke tests run on every pull request, and will you mark ci as a required check in branch protection (manual)?
- [ ] Time format (SUP-54): add a 'Time format: Auto/12h/24h' setting? Translating UI text is assumed to stay out of scope; please confirm.
- [ ] Mobile drag (SUP-83): should someone check drag-and-drop on real iOS and Android devices before deciding on a touch fallback?
- [ ] Notes and Reviews toggles (SUP-45): OK to expose these feature flags in Settings → General?

## Dropped during synthesis

- (user-supportability) If the IndexedDB probe fails, the app silently runs on empty localStorage, and anything entered then is wiped on the next load — Merged with the matching platform-support finding into SUP-03. Both locations and proposals are combined, including the backup before cleanup.
- (platform-support) When the IndexedDB probe fails, the session runs on empty localStorage and its work is deleted on the next load — Merged into SUP-03.
- (user-supportability) Corrupt or unreadable storage silently becomes defaults and is overwritten; the recovery screen never appears — Merged into SUP-02 (storage-layer distinction between missing and unreadable data, with quarantine).
- (platform-support) An IndexedDB read error looks like 'no data', and the hooks then save empty collections over the real data — Split. The adapter and loadFromStorage part went into SUP-02; the hook save-gating part went into SUP-01.
- (maintainer-support) [OTHER] getStorageType() checks constructor.name, which minification renames — Merged with the platform-support finding into SUP-06. I confirmed it in both production chunks.
- (platform-support) An update that is already waiting is never offered, so a reload hides the update toast for good — Merged with the user-supportability finding into SUP-32.
- (maintainer-support) The service worker registers on the dev server under an unversioned cache name — Merged with the platform-support finding into SUP-34.
- (user-supportability) 'Last Auto-Backup' shows the previous day for users west of UTC — Merged with the platform finding 'YYYY-MM-DD strings parsed with new Date() display one day early west of UTC' into SUP-53. Its priority was normalised from low to medium.
- (platform-support) YYYY-MM-DD strings parsed with new Date() display one day early west of UTC — Merged into SUP-53.
- (user-supportability) The Markdown todo export drops people and projects, and the JSON export is lossy — Split. The ISO due date needed for the import round trip went into SUP-14; the Markdown people/projects fix and the extra JSON fields stay as SUP-58.
- Priority changes for transparency (nothing dropped) — SUP-29 (debounced saves on pagehide) was raised from low to medium because it loses the last edit. All other priorities are as reported. No reviewer finding was refuted or discarded.

## Coverage gaps

No reviewer read these:
- src/components/overlays/help/InputSection.tsx, PeopleProjectsSection.tsx and ProductivityTechniquesSection.tsx. WorkflowsSection.tsx was checked by grep only, for hard-coded digits.
- The Todoist, Things, Apple Reminders and CSV parsers in src/utils/import.ts (lines roughly 170-600).
- The full step text of the Calendar, Notes, People, Projects and Sprints tutorials. Only their target selectors were grepped, so SUP-43's selector test may find more mismatches.
- usePersistedViewOptions.ts, useViewPresets.ts and src/storage/renameInStoredFilters.ts. usePersistedState.ts was read only around its load and save effects.
- Most settings tabs. Read: General (grep only), Notifications, DateTime, Calendar, Storage, Backup and Import. Not read: the Kanban, Priorities, Templates, Focus, Notes, Sprints and other tabs.
- docs/*.md except docs/e2e-testing.md, and .claude/agents.
- The e2e specs crud-workflow, smart-input-search, regressions, rich-text-editor and focus-timer (seen only through their test titles).
- FocusView and OpenFocusView beyond their sound effects and key handlers, CommandPalette beyond its top section, and the People, Projects, Sprints, Notes, Reviews and EntityListView view components (not read for support).
- Unit test bodies other than the useTodos and useSettings headers and storage.test.ts.

Nothing was run, because the sweep was read-only:
- Lint warning counts, the current Jest and Playwright pass state, and the coverage percentages are taken from the last coverage/lcov.info and from reading the code, not measured now.

Platform findings are not verified on real devices:
- The Android Notification constructor (SUP-10), IME composition (SUP-12), Firefox's persist() prompt (SUP-13), Safari Range requests (SUP-37), iOS autoplay and volume (SUP-38), touch drag-and-drop (SUP-83) and safe areas (SUP-80) combine reading the code with known browser behaviour.
- SUP-18's advisory details come from memory and should be checked with npm audit.

What I checked myself:
- I re-opened and confirmed the code behind every high item: SUP-01 to SUP-21. For SUP-19 and SUP-20 that was structure only; their coverage numbers are the reviewer's lcov figures.
- I also checked SUP-22, 28, 29, 32, 39, 40, 41, 43, 45, 46, 47, 48, 49, 50, 53, 54 (31 'en-US' sites counted), 57, 60, 70, 76 and 89.

Medium and low items I did not re-open rest on the reviewers' citations:
- SUP-23 to SUP-27, SUP-30, SUP-31, SUP-33 to SUP-38, SUP-42, SUP-44, SUP-51, SUP-52, SUP-55, SUP-56, SUP-58, SUP-59, SUP-61 to SUP-69, SUP-71 to SUP-75, SUP-77 to SUP-88 and SUP-90 to SUP-92.

No slice's finder failed, and no finding was refuted.
