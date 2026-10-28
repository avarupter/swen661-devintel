import { useSyncExternalStore } from "react";
import { parseHash } from "./routes.js";

/**
 * The current route, read from location.hash.
 *
 * useSyncExternalStore is how React 19 reads an external value like the hash
 * without an effect that renders twice. Back and Forward between hash entries
 * fire `hashchange` too, so this one listener follows history as well as
 * clicked links.
 */
function subscribeToHash(onChange) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/**
 * Remembered across reads so a fragment hash keeps the current view: when the
 * skip link's "#main", or any other hash that is not a route, is in the
 * address bar, the view is whatever it was before. The cache is also what makes
 * this a legal getSnapshot: it returns the same string on every call until a
 * route hash actually changes it, so React never sees the value flip during a
 * render.
 *
 * It starts at "home", so a page first opened at a fragment shows Patient
 * Today.
 */
let route = "home";

function readRoute() {
  const next = parseHash(window.location.hash);
  if (next !== null) route = next;
  return route;
}

/**
 * The route string, re-rendering whenever it changes. See routes.js for the
 * grammar.
 *
 * No getServerSnapshot third argument: main.jsx mounts with createRoot, never
 * hydrateRoot, so React has no server pass to take one. If this app ever does
 * gain SSR, React throws a clear error here rather than silently serving a
 * guessed route.
 */
export function useRoute() {
  return useSyncExternalStore(subscribeToHash, readRoute);
}

/**
 * Test isolation: the cache is module state, so it outlives a test just as the
 * hash does. src/test/setup.js calls this after each test, after resetting the
 * hash, so a view left open by one test cannot become the next one's starting
 * point.
 */
export function __resetRouteForTests() {
  route = "home";
}
