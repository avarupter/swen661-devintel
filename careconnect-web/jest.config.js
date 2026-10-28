/** @type {import('jest').Config} */
export default {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.{js,jsx}"],
  // Playwright specs live in e2e/ and are never Jest's to run.
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.js"],
  moduleNameMapper: { "\\.css$": "<rootDir>/src/test/styleStub.js" },
  restoreMocks: true,

  // Everything shipped to the browser counts, including the bootstrap.
  // `collectCoverageFrom` is the important half: it is what counts a file that
  // no test ever imports, at 0%. Without it such a file is simply absent from
  // the report rather than counted at 0%, which makes a coverage number
  // meaningless as a completeness signal.
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/test/**", "!src/**/__tests__/**"],
  // "babel" (Istanbul) counts statements, branches, functions and lines the way
  // the earlier reports did. Jest's "v8" provider counts physical lines and
  // would change every denominator.
  coverageProvider: "babel",
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "json-summary", "lcov"],
  coverageThreshold: {
    global: { statements: 90, branches: 90, functions: 90, lines: 90 },
  },
};
