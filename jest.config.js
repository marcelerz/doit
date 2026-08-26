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
  // drops coverage fails rather than quietly spending the headroom. Measured
  // at 67.02 / 57.30 / 61.78 / 68.48.
  coverageThreshold: {
    global: {
      statements: 67,
      branches: 57,
      functions: 61,
      lines: 68,
    },
  },
};
