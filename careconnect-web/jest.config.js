/** @type {import("jest").Config} */
export default {
  testEnvironment: "jsdom",

  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/?(*.)+(spec|test).{js,jsx,ts,tsx}",
  ],

  testPathIgnorePatterns: [
    "/node_modules/",
    "/e2e/",
  ],

  setupFilesAfterEnv: [
    "<rootDir>/src/test/setup.js",
  ],

  moduleNameMapper: {
    "\\.css$": "<rootDir>/src/test/styleStub.js",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },

  restoreMocks: true,

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",

    // Test infrastructure
    "!src/test/**",
    "!src/**/__tests__/**",
    "!src/**/*.d.ts",

    // Barrel/type-only files
    "!src/**/index.ts",

    // Vite production service-worker registration is tested
    // with the built application/browser rather than Jest.
    "!src/pwa/registerSW.ts",

    // Temporary/backup source copies are not production code
    "!src/**/*.backup-*.tsx",
    "!src/**/*.before-*.tsx",

    // Active entry point is main.tsx/App.tsx.
    // Legacy JSX application remains in the repository but is not
    // the Vite application submitted for Week 12.
    "!src/**/*.jsx",
    "!src/**/*.js",
  ],

  coverageProvider: "babel",
  coverageDirectory: "coverage",
  coverageReporters: [
    "text",
    "html",
    "json-summary",
    "lcov",
  ],

  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
};
