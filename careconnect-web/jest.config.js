/**
 * Jest config for careconnect-web — unit and component tests
 * (Jest 30 + jsdom + React Testing Library). ESM because package.json has
 * "type": "module"; Babel turns the app's TS/JSX into CommonJS (babel.config.cjs).
 *
 *   npm test            run every test
 *   npm run coverage    run with coverage (text summary + coverage/lcov-report)
 */

// Pin the time zone so date-dependent code renders the same on every machine
// (the mock data derives "today" from toISOString(), Layout prints local time).
// Jest's workers inherit this from the parent process.
process.env.TZ = 'UTC';

// Packages that ship ESM only must be compiled by babel-jest. None do today:
// under Jest's jsdom export conditions lucide-react resolves its "main" CJS
// build, react-router / react-router-dom 7 resolve their "default" CJS build,
// and @supabase/supabase-js (CJS "main") is not imported by src/ at all.
// If an upgrade switches one to ESM only, list it here, e.g. ['lucide-react'].
const ESM_ONLY_PACKAGES = [];

/** @type {import('jest').Config} */
export default {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/src/test/polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  // Before every test: forget recorded mock calls, and undo jest.spyOn()
  // spies (in Jest 30 this restores spies only — jest.fn() mocks keep their
  // implementations). Create spies in beforeEach or in the test, not beforeAll.
  clearMocks: true,
  restoreMocks: true,

  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: ESM_ONLY_PACKAGES.length
    ? [`/node_modules/(?!(?:${ESM_ONLY_PACKAGES.join('|')})/)`]
    : ['/node_modules/'],

  // Stylesheets and static assets have no meaning in jsdom.
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/src/test/stubs/style.cjs',
    '\\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|woff2?|ttf|otf|eot|mp3|mp4|webm|wav)$':
      '<rootDir>/src/test/stubs/file.cjs',
  },

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx', // bootstraps ReactDOM into #root — nothing to unit test
    '!src/vite-env.d.ts',
    '!src/**/*.d.ts',
    '!src/types/**', // type-only declarations, erased at compile time
    // Pure re-export barrel: no executable statements, so istanbul would list
    // it as "0%" (0 of 0). components/index.test.ts checks its exports.
    '!src/components/index.ts',
    '!src/test/**', // shared test helpers
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    // 75% on all four metrics is the course brief's minimum for the final
    // coverage report. It is measured across the whole app, so it is only met
    // once the page tests (src/pages) are in place as well.
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
