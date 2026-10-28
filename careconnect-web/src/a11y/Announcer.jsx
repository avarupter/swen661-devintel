import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Between clearing a live region and refilling it. A region whose text is set
 * to what it already says does not change, so a screen reader would stay
 * silent; emptying it first makes a repeated message ("marked as taken." twice
 * in a row) a change that is read again.
 */
export const ANNOUNCE_DELAY_MS = 50;

/** Outside a provider (a page rendered on its own in a test), announcing does nothing. */
const AnnounceContext = createContext(() => {});

/**
 * The app's two live regions, mounted once by the shell and outside <main>,
 * so they exist before anything is announced into them and are never replaced
 * when the view changes. (Electron's pattern: careconnect-electron
 * src/renderer/src/a11y/Announcer.tsx.)
 *
 * - polite (role="status") for confirmations: "Message sent to Maria Thompson."
 * - assertive (role="alert") for problems the user has to know about now, such
 *   as storage refusing to save.
 *
 * They are visually hidden, because STML rules out anything transient on
 * screen: whatever is announced is also shown, and stays shown, by the page
 * itself. The live region is only how a screen-reader user hears that it
 * changed.
 */
export function AnnouncerProvider({ children }) {
  const [messages, setMessages] = useState({ polite: "", assertive: "" });
  const timers = useRef({});

  // Stable for the provider's lifetime, so a component that announces from an
  // effect can list it as a dependency without re-running on every render.
  const announce = useCallback((message, politeness = "polite") => {
    // A newer message replaces one still waiting for its delay, rather than
    // being overwritten by it 50 ms later.
    clearTimeout(timers.current[politeness]);
    setMessages((current) => ({ ...current, [politeness]: "" }));
    timers.current[politeness] = setTimeout(() => {
      setMessages((current) => ({ ...current, [politeness]: message }));
    }, ANNOUNCE_DELAY_MS);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of Object.values(pending)) clearTimeout(timer);
    };
  }, []);

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div className="cc-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {messages.polite}
      </div>
      <div className="cc-sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {messages.assertive}
      </div>
    </AnnounceContext.Provider>
  );
}

/**
 * `announce(message, politeness = "polite")`: clears the region, then says
 * `message` after ANNOUNCE_DELAY_MS.
 *
 * Exported beside the provider on purpose: the two share the private context
 * above, and every page imports the hook from here. Fast Refresh wants a file
 * of components only; the cost of this one exception is that editing this file
 * in development reloads the page instead of hot-swapping it.
 */
// oxlint-disable-next-line react/only-export-components
export function useAnnounce() {
  return useContext(AnnounceContext);
}
