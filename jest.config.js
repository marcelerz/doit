// Date logic is tested in one known time zone unless the caller picks another.
// Without a pin the suite ran in whatever zone the machine had: Pacific time
// locally, UTC on the CI runner. In UTC `new Date("2026-01-05")` lands on the
// right day, so the "shows one day early" class of bug could never fail there.
// A zone behind UTC is the one that exposes it.
//
// Set here, not in a test: Jest hands every test file a copy of process.env,
// so assigning TZ inside a test never reaches the real process. `npm run
// test:tz` runs the suite once per zone by setting TZ before Jest starts.
process.env.TZ ||= "America/Los_Angeles";

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  // .tsx included so component and provider tests can run at all. Without it
  // no test for anything under components/ could ever execute, which is why
  // the providers' __tests__ directory sat empty.
  testMatch: ["**/__tests__/**/*.test.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
          skipLibCheck: true,
          strict: true,
          target: "ES2020",
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      },
    ],
  },
  // Measured over every directory that actually has tests. This previously
  // covered utils and models only, so hooks, storage and the providers were
  // absent from the denominator despite having test suites.
  collectCoverageFrom: [
    "src/utils/**/*.ts",
    "src/models/**/*.ts",
    "src/hooks/**/*.ts",
    "src/storage/**/*.ts",
    // Every component and type file is measured. Each components folder other
    // than providers/ has its own threshold group below, which takes its files
    // out of the global group -- so the ~41k mostly untested lines of views,
    // overlays and settings are visible to the gate without swamping the
    // global ratio.
    "src/components/**/*.{ts,tsx}",
    "src/types/**/*.ts",
    "!src/**/*.d.ts",
    // Test files and fixtures are not production code; counting them in the
    // denominator let an unused 338-line helper drag the ratio down.
    "!src/**/__tests__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  // A ratchet, not an aspiration: set just below the current numbers so
  // coverage cannot silently regress. Raise as it improves. Without this,
  // `npm run validate` printed a number and always passed.
  // Raised to just under what the suite currently reaches, so a commit that
  // drops coverage fails rather than quietly spending the headroom. The global
  // group excludes the files that carry their own threshold, and measures
  // 70.94 / 60.83 / 65.08 / 72.52.
  coverageThreshold: {
    // Files with their own threshold below are subtracted from this group, so
    // each of them is ratcheted individually rather than being able to hide a
    // regression behind gains elsewhere.
    global: {
      statements: 78.3,
      branches: 66.7,
      functions: 76.3,
      lines: 79.6,
    },
    // The adapter choice and both migrations: a mistake here loses data.
    "src/storage/storage.ts": {
      statements: 89,
      branches: 87,
      functions: 95,
      lines: 89,
    },
    // The note and review hooks and models had no tests at all before the sweep.
    // Each has its own floor so a later note or review fix cannot quietly shed them.
    "src/hooks/useNotes.ts": {
      statements: 100,
      branches: 84,
      functions: 100,
      lines: 100,
    },
    "src/hooks/useReviews.ts": {
      statements: 100,
      branches: 97,
      functions: 100,
      lines: 100,
    },
    "src/models/NoteModel.ts": {
      statements: 97,
      branches: 100,
      functions: 95,
      lines: 97,
    },
    "src/models/ReviewModel.ts": {
      statements: 95,
      branches: 94,
      functions: 96,
      lines: 94,
    },
    "src/utils/noteTemplates.ts": {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    "src/components/overlays/TutorialOverlay.tsx": {
      statements: 78,
      branches: 58,
      functions: 93,
      lines: 77,
    },
    "src/components/shared/CommandPalette.tsx": {
      statements: 100,
      branches: 91,
      functions: 100,
      lines: 100,
    },
    "src/components/overlays/OpenFocusSetup.tsx": {
      statements: 97,
      branches: 84,
      functions: 93,
      lines: 97,
    },
    "src/components/overlays/EntityDetailsOverlay.tsx": {
      statements: 87,
      branches: 75,
      functions: 71,
      lines: 87,
    },
    // Below the rest because the parts that need a real caret, real layout or
    // execCommand cannot be reached from jsdom; those are covered in e2e.
    "src/components/input/RichTextEditor.tsx": {
      statements: 77,
      branches: 67,
      functions: 64,
      lines: 79,
    },
    // The tokeniser, autocomplete and caret handling behind every add and edit form.
    "src/components/input/SmartInput.tsx": {
      statements: 93,
      branches: 72,
      functions: 86,
      lines: 94,
    },
    "src/components/settings/components/FocusModesSection.tsx": {
      statements: 87,
      branches: 78,
      functions: 82,
      lines: 89,
    },
    // One group per components folder, and one for types. A directory key is
    // checked against the folder's combined figures, and its files leave the
    // global group. The numbers are low because most of these folders have no
    // tests yet: they record where things stand so that the figure can only
    // rise. A file listed above counts in its own group and in its folder's.
    // providers/ has no key on purpose: its files stay in the global group.
    "src/components/views/": {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
    "src/components/items/": {
      statements: 1,
      branches: 0,
      functions: 0,
      lines: 1,
    },
    "src/components/settings/": {
      statements: 3,
      branches: 2,
      functions: 4,
      lines: 3,
    },
    "src/components/shared/": {
      statements: 20,
      branches: 14,
      functions: 11,
      lines: 20,
    },
    "src/components/overlays/": {
      statements: 16,
      branches: 12,
      functions: 15,
      lines: 16,
    },
    "src/components/input/": {
      statements: 86,
      branches: 70,
      functions: 78,
      lines: 87,
    },
    "src/types/": {
      statements: 95,
      branches: 100,
      functions: 86,
      lines: 96,
    },
  },
};
