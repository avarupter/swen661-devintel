import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "@jest/globals";
import { __resetRouteForTests } from "../app/useRoute.js";
import { __resetDemoStoreForTests } from "../store/demoStore.js";

/**
 * jsdom implements neither matchMedia nor layout, which matters here because
 * the whole responsive design is media queries and measured boxes.
 *
 * Read this before writing a test: a jsdom test CANNOT tell you which of the
 * three layouts is showing, how tall a target is, or what a contrast ratio
 * computes to. Those are measured for real, in a real browser, by the
 * Playwright verification script that lives with the team's demo tooling.
 * These tests cover the other half — markup, accessible names, state wiring and
 * the data contract the three layouts share — and should not pretend to cover
 * the first half by asserting on class names as a proxy for layout.
 *
 * matchMedia is stubbed only so components that touch it do not throw; it
 * always reports "no match" and nothing should assert on it.
 */
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

/**
 * Scrolling is layout, so jsdom has none of it: Element#scrollIntoView does not
 * exist (calling it throws) and window.scrollTo only reports "Not implemented"
 * through console.error. The shell calls both, the skip link and the scroll to
 * the top after a change of page, so both are no-ops here. A test can spy on
 * them to see that they were called; nothing here can say where the page ended
 * up, which, like the layouts, is the real browser's to show.
 */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
window.scrollTo = () => {};

// The demo store keeps its state in a module variable, which outlives a test
// just as localStorage does. Clearing only one of them lets a dose marked in one
// test leak into the next, and Patient Today's seeded counts with it. The route
// is cached the same way, so a view left open by one test would otherwise be
// the next test's starting point whenever it opens at a fragment hash.
afterEach(() => {
  cleanup();
  window.location.hash = "";
  localStorage.clear();
  __resetDemoStoreForTests();
  __resetRouteForTests();
});
