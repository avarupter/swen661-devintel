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
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/test/**",
    "!src/**/__tests__/**",
    "!src/**/*.d.ts",
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