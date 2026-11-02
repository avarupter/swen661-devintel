// Runs before every test file, after the test framework is installed
// (jest `setupFilesAfterEnv`).
import '@testing-library/jest-dom/jest-globals';
import { beforeEach } from '@jest/globals';
import { installBrowserMocks } from './browserMocks';
import { resetViteEnv } from './viteEnv';

// Every test starts from a clean browser: no stored session or data, the URL
// back at "/", default import.meta.env values and fresh browser-API mocks.
// (A file's own beforeEach hooks run after this one, so they can seed state.)
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  resetViteEnv();
  installBrowserMocks();
});
