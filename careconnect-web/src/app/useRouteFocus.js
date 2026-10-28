import { useEffect, useRef } from "react";
import { destinationOf } from "./routes.js";

/**
 * Moves keyboard and screen-reader focus to the new view after a navigation.
 *
 * A hash change re-renders <main> in place, so without this, focus stays on
 * the nav link that was activated. A screen reader then announces nothing
 * about the new page, and the next Tab continues from the nav as if nothing
 * had happened.
 *
 * After each route change, focus goes to the first match inside <main> of:
 *   1. [data-route-focus="return"]: a page marks the element to come back to,
 *      such as the conversation row after "Back to messages";
 *   2. [data-route-focus]: the page heading, an h1 with tabIndex -1;
 *   3. <main> itself.
 * When the destination changed too, the page scrolls to the top first, so the
 * new page starts at its top rather than at the old one's scroll position.
 * Within one destination (a Messages sub-route), focus() scrolls only as far as
 * the target needs.
 *
 * Never on first load: focus stays at the top of the document, so Skip to main
 * content is still the first Tab stop. "First load" is detected by comparing
 * against the route the page was opened at, not with a boolean "mounted" flag:
 * StrictMode runs every effect twice on mount in development, and a flag
 * flipped by the first run would make the second run move focus on load.
 */
export function useRouteFocus(route) {
  const previous = useRef(route);

  useEffect(() => {
    const from = previous.current;
    if (from === route) return;
    previous.current = route;

    const main = document.getElementById("main");
    const target =
      main.querySelector('[data-route-focus="return"]') ??
      main.querySelector("[data-route-focus]") ??
      main;

    const newDestination = destinationOf(from) !== destinationOf(route);
    if (newDestination) window.scrollTo(0, 0);
    target.focus({ preventScroll: newDestination });
  }, [route]);
}
