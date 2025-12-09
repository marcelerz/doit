/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
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
  collectCoverageFrom: ["src/utils/**/*.ts", "src/models/**/*.ts", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
