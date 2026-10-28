import { useEffect } from "react";

/**
 * Sets the document title while the calling page is shown, on first load as
 * well as after a navigation. The title is the first thing a screen reader
 * reads when the view changes, and what a tab, a bookmark and the history list
 * are named by, so each view says which one it is. The words live in
 * src/data/shell.js.
 *
 * Nothing is restored on unmount: the page that replaces this one sets its own.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
