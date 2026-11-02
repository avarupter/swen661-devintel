/**
 * Browser APIs that jsdom lacks (or only stubs with a "Not implemented"
 * console error). setup.ts reinstalls fresh copies before every test, so a
 * test may change or assert on them without leaking into the next test.
 */
import { jest } from '@jest/globals';

/**
 * Replaces `window.matchMedia`. Every query reports `matches` from the
 * predicate — e.g. `mockMatchMedia((q) => q === '(display-mode: standalone)')`
 * makes InstallPrompt believe the app is already installed.
 */
export function mockMatchMedia(matches: (query: string) => boolean = () => false) {
  const matchMedia = jest.fn(
    (query: string): MediaQueryList => ({
      matches: matches(query),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(() => false),
    }),
  );
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: matchMedia,
  });
  return matchMedia;
}

export function installBrowserMocks() {
  mockMatchMedia();

  // No layout engine: scrolling is missing (scrollIntoView, used by ChatBot)
  // or logs "Not implemented" (scrollTo).
  Element.prototype.scrollIntoView = jest.fn();
  window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;

  // window.open logs "Not implemented" in jsdom (Appointments uses it for
  // directions). Tests can assert on the mock: expect(window.open).toHaveBeenCalledWith(...).
  window.open = jest.fn(() => null);
}
