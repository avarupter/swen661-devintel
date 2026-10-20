import { useSyncExternalStore } from "react";
import Nav from "./components/Nav.jsx";
import PatientToday from "./pages/PatientToday.jsx";
import Specimens from "./pages/Specimens.jsx";
import { Mark } from "./components/Icon.jsx";
import { CURRENT_DESTINATION, patientToday as d } from "./data/patientToday.js";
import "./styles/index.css";

/**
 * The app shell.
 *
 * All three navigation presentations are rendered and CSS decides which is
 * shown, because the destinations and the current page must be identical in
 * every one and a single source for them is the only way to guarantee that.
 * The two that are not in use at a given width are `display: none`, which also
 * removes them from the accessibility tree — so a screen reader finds exactly
 * one "Main" navigation landmark at any width, not three.
 *
 * There is no router. The five destinations are inert in this cut, so the only
 * thing that needs a second view is the foundations sheet, and `#specimens` in
 * the hash is enough for that — a router would add a dependency and a build
 * concept for one evidence page. useSyncExternalStore is how React 19 reads an
 * external value like location.hash without an effect that renders twice.
 *
 * The hash is not only a route, though. "#main" is the skip link's target, and
 * treating every hash as a route meant skipping to the main content while the
 * sheet was open navigated straight back off it. So a hash that names a
 * FRAGMENT leaves the route alone, and only a hash that names a view changes
 * it. Without that distinction the most important keyboard affordance on the
 * page is also the one that throws your place away.
 */
function subscribeToHash(onChange) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** Ids that exist to be scrolled to, never to select a view. */
const FRAGMENTS = new Set(["#main", "#"]);

/**
 * Remembered across reads so a fragment hash keeps the current view. The cache
 * is also what makes this a legal getSnapshot: it returns the same string on
 * every call until a route hash actually changes it, so React never sees the
 * value flip during a render.
 */
let route = "today";

function readRoute() {
  if (typeof window === "undefined") return route;
  const hash = window.location.hash;
  if (FRAGMENTS.has(hash)) return route;
  route = hash === "#specimens" ? "sheet" : "today";
  return route;
}

export default function App() {
  const showsSheet = useSyncExternalStore(subscribeToHash, readRoute, readRoute) === "sheet";

  // The sheet is not one of the five destinations, so while it is open no
  // destination is the current page. Leaving aria-current on Home would tell a
  // screen-reader user they are somewhere they are not.

  return (
    <div className="cc-app">
      <a className="cc-skip" href="#main">
        Skip to main content
      </a>

      <header className="cc-appbar">
        <div className="cc-appbar__brand">
          <Mark size={40} />
          <span className="cc-appbar__name">{d.appName}</span>
        </div>

        <p className="cc-appbar__account">
          <span className="cc-appbar__accountText">
            {d.account.name} · {d.account.role}
          </span>
          <span className="cc-appbar__avatar" aria-hidden="true">
            {d.account.initials}
          </span>
        </p>
      </header>

      <Nav variant="tabs" current={showsSheet ? null : CURRENT_DESTINATION} />

      <div className="cc-shell">
        <Nav variant="sidebar" current={showsSheet ? null : CURRENT_DESTINATION} />

        <main
          className={`cc-page${showsSheet ? " cc-page--sheet" : ""}`}
          id="main"
        >
          {showsSheet ? <Specimens /> : <PatientToday />}
        </main>
      </div>

      {/* Evidence affordance, not part of the Figma design — see the note on
          .cc-evidence-nav in components.css. */}
      <footer className="cc-evidence-nav">
        <a href={showsSheet ? "#home" : "#specimens"}>
          {showsSheet ? "Back to Patient Today" : "Design system"}
        </a>
      </footer>

      <Nav variant="bar" current={showsSheet ? null : CURRENT_DESTINATION} />
    </div>
  );
}
