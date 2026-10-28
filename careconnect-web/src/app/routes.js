/**
 * The hash grammar (D1). Routing is hash-only, because a hash needs nothing
 * from the server: the built app works from any path, including a GitHub Pages
 * project folder, with no 404 fallback.
 *
 *   ""  or  #home        home
 *   #medications         medications
 *   #appointments        appointments
 *   #messages            messages
 *   #messages/new        messages/new   (compose; "new" is never a conversation id)
 *   #messages/<id>       messages/<id>  (a conversation)
 *   #help                help
 *   #specimens           sheet          (the design-system sheet)
 *
 * Anything else is a FRAGMENT, not a route, and never changes the view. "#main"
 * is the skip link's target, and an in-page anchor such as "#sheet-color" is a
 * place on the current page. Treating every hash as a route meant following
 * one of those threw away the page it pointed into.
 *
 * A route is a plain string, never an object, so useSyncExternalStore can
 * compare two readings with === (see useRoute.js).
 */

/** The five destinations, in nav order. */
export const DESTINATION_IDS = ["home", "medications", "appointments", "messages", "help"];

/** The sheet is a view, but not a destination: no nav item is current on it. */
const SHEET = "sheet";
const SHEET_HASH = "#specimens";

const MESSAGES_PREFIX = "messages/";

/** A conversation id (D1). "new" matches too, and is the compose route. */
const CONVERSATION_ID = /^[a-z0-9][a-z0-9-]*$/;

/** The route a hash names, or null when the hash is a fragment. */
export function parseHash(hash) {
  if (hash === "") return "home";
  if (hash === SHEET_HASH) return SHEET;
  if (!hash.startsWith("#")) return null;

  const path = hash.slice(1);
  if (DESTINATION_IDS.includes(path)) return path;
  if (path.startsWith(MESSAGES_PREFIX) && CONVERSATION_ID.test(path.slice(MESSAGES_PREFIX.length))) {
    return path;
  }
  return null;
}

/** The destination a route belongs to, or null for the sheet. "messages/<id>" is in Messages. */
export function destinationOf(route) {
  const [first] = route.split("/");
  return DESTINATION_IDS.includes(first) ? first : null;
}

/** The href that leads to a route: parseHash(routeHref(route)) === route. */
export function routeHref(route) {
  return route === SHEET ? SHEET_HASH : `#${route}`;
}
