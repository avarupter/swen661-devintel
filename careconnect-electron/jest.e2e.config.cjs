/**
 * End-to-end tests drive the built app with Playwright's Electron support.
 * They need a display and a fresh build, so they are not part of `npm test`:
 *
 *   npm run test:e2e
 */
/** @type {import('jest').Config} */
module.exports = {
  displayName: 'e2e',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/e2e'],
  testMatch: ['**/*.e2e.test.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }] },
  testTimeout: 90_000,
  maxWorkers: 1
}
