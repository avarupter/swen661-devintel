import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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

afterEach(() => {
  cleanup();
  window.location.hash = "";
});
