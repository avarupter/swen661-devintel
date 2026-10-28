import { useEffect } from "react";
import { AnnouncerProvider, useAnnounce } from "./a11y/Announcer.jsx";
import { destinationOf, routeHref } from "./app/routes.js";
import { useRoute } from "./app/useRoute.js";
import { useRouteFocus } from "./app/useRouteFocus.js";
import Nav from "./components/Nav.jsx";
import Icon, { Mark } from "./components/Icon.jsx";
import Appointments from "./pages/Appointments.jsx";
import Help from "./pages/Help.jsx";
import Medications from "./pages/Medications.jsx";
import Messages from "./pages/Messages.jsx";
import PatientToday from "./pages/PatientToday.jsx";
import Specimens from "./pages/Specimens.jsx";
import { unreadCount } from "./data/messageModel.js";
import { patientToday as d } from "./data/patientToday.js";
import { EVIDENCE_LINK, SKIP_LINK, STORAGE_BANNER } from "./data/shell.js";
import { useDemoStore } from "./store/useDemoStore.js";
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
 * The view comes from the hash (app/routes.js has the grammar). Only a hash
 * that names a view changes it; any other hash is a fragment and leaves the
 * view alone. After a navigation the shell moves focus into the new view and
 * each page sets the document title, so a keyboard or screen-reader user
 * arrives on the new page instead of being left on the link they activated.
 */

/** The view for a route. "sheet" is the only route that is not a destination. */
function pageFor(route) {
  switch (destinationOf(route)) {
    case "home":
      return <PatientToday />;
    case "medications":
      return <Medications />;
    case "appointments":
      return <Appointments />;
    case "messages":
      return <Messages route={route} />;
    case "help":
      return <Help />;
    default:
      return <Specimens />;
  }
}

/**
 * The skip link moves focus itself instead of letting the browser follow
 * "#main". Following it would replace a route such as "#messages/video-call"
 * with a fragment in the address bar, so the view would survive (a fragment
 * never changes it) but every later reload and bookmark would land on Patient
 * Today. The href stays "#main", so it is still a link to what it skips to,
 * and a fragment, so even followed it could not change the view.
 */
function skipToMain(event) {
  event.preventDefault();
  const main = document.getElementById("main");
  main.focus();
  main.scrollIntoView();
}

/**
 * Shown on every page for as long as storage refuses to save, and announced
 * once, assertively, each time it appears (R3). The banner itself is not a
 * live region: the announcer makes the one announcement, and a second live
 * region here would read it twice. The alert glyph is decorative: the error
 * tone, the glyph and the words say it together (STML), and only the words are
 * read.
 *
 * Its own component because the announcer it calls is provided by App's own
 * markup, so App itself cannot call useAnnounce.
 */
function StorageBanner() {
  const { storageOk } = useDemoStore();
  const announce = useAnnounce();

  useEffect(() => {
    if (!storageOk) announce(STORAGE_BANNER, "assertive");
  }, [storageOk, announce]);

  if (storageOk) return null;
  return (
    <div className="cc-banner cc-banner--error">
      <Icon name="alert" />
      <p>{STORAGE_BANNER}</p>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  useRouteFocus(route);

  // The sheet is not one of the five destinations, so while it is open no
  // destination is the current page (destinationOf gives null). Leaving
  // aria-current on Home would tell a screen-reader user they are somewhere
  // they are not.
  const current = destinationOf(route);
  const showsSheet = route === "sheet";

  // One count for all three presentations, read from the store, so the badge
  // drops as conversations are read, here or in another tab, and cannot
  // differ between the bar, the tabs and the sidebar.
  const counts = { messages: unreadCount(useDemoStore().conversations) };

  return (
    <AnnouncerProvider>
      <div className="cc-app">
        <a className="cc-skip" href="#main" onClick={skipToMain}>
          {SKIP_LINK}
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

        {/* Persistent notices (D11). Empty, and not displayed, while there is
            nothing to say; see banners.css. */}
        <div className="cc-banners">
          <StorageBanner />
        </div>

        <Nav variant="tabs" current={current} counts={counts} />

        <div className="cc-shell">
          <Nav variant="sidebar" current={current} counts={counts} />

          {/* tabIndex -1: a <main> is not focusable, so without it the skip link
              and a navigation that finds no heading could not put focus here.
              -1 keeps it out of the tab sequence while making it a legal focus
              target. */}
          <main
            className={`cc-page${showsSheet ? " cc-page--sheet" : ""}`}
            id="main"
            tabIndex={-1}
          >
            {pageFor(route)}
          </main>
        </div>

        {/* Evidence affordance, not part of the Figma design — see the note on
            .cc-evidence-nav in components.css. */}
        <footer className="cc-evidence-nav">
          <a href={routeHref(showsSheet ? "home" : "sheet")}>
            {showsSheet ? EVIDENCE_LINK.toHome : EVIDENCE_LINK.toSheet}
          </a>
        </footer>

        <Nav variant="bar" current={current} counts={counts} />
      </div>
    </AnnouncerProvider>
  );
}
