/**
 * Two Jest projects share one coverage report:
 *  - "main" runs main-process, preload, shared and integration tests in Node,
 *    with `electron` mapped to an in-memory fake (tests/mocks/electron.ts).
 *  - "renderer" runs React component tests in jsdom.
 *
 * `npm test -- --coverage` writes the HTML report to coverage/lcov-report/.
 */
const transform = { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }] }

/** @type {import('jest').Config} */
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    // The ReactDOM bootstrap only mounts <App/>; everything it renders is tested.
    '!src/renderer/src/main.tsx'
  ],
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 60, branches: 60, functions: 60, lines: 60 }
  },
  projects: [
    {
      displayName: 'main',
      testEnvironment: 'node',
      roots: ['<rootDir>/src/main', '<rootDir>/src/preload', '<rootDir>/src/shared', '<rootDir>/tests/integration'],
      testMatch: ['**/*.test.ts'],
      transform,
      moduleNameMapper: {
        '^electron$': '<rootDir>/tests/mocks/electron.ts',
        '\\?asset$': '<rootDir>/tests/mocks/asset.ts'
      },
      clearMocks: true
    },
    {
      displayName: 'renderer',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src/renderer'],
      testMatch: ['**/*.test.ts?(x)'],
      transform,
      moduleNameMapper: { '\\.css$': '<rootDir>/tests/mocks/style.ts' },
      setupFilesAfterEnv: ['<rootDir>/tests/setup/renderer.ts'],
      clearMocks: true
    }
  ]
}
