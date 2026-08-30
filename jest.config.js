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
    "src/components/providers/**/*.tsx",
    // Overlay components enter coverage as they gain tests. The directory as a
    // whole is ~5k untested lines, which would swamp the global ratio, so each
    // tested file is listed and carries its own threshold below.
    "src/components/overlays/TutorialOverlay.tsx",
    "src/components/overlays/EntityDetailsOverlay.tsx",
    "src/components/overlays/OpenFocusSetup.tsx",
    "src/components/shared/CommandPalette.tsx",
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
  // group excludes the two files that carry their own threshold, and measures
  // 67.66 / 57.80 / 62.18 / 69.14.
  coverageThreshold: {
    // Files with their own threshold below are subtracted from this group, so
    // the two overlays are ratcheted individually rather than being able to
    // hide a regression behind gains elsewhere.
    global: {
      statements: 67.6,
      branches: 57.7,
      functions: 62.1,
      lines: 69.1,
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
  },
};
