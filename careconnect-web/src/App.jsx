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
 */
function subscribeToHash(onChange) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const readHash = () => (typeof window === "undefined" ? "" : window.location.hash);

export default function App() {
  const showsSheet = useSyncExternalStore(subscribeToHash, readHash, readHash) === "#specimens";

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

      <Nav variant="tabs" current={CURRENT_DESTINATION} />

      <div className="cc-shell">
        <Nav variant="sidebar" current={CURRENT_DESTINATION} />

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

      <Nav variant="bar" current={CURRENT_DESTINATION} />
    </div>
  );
}
