import { useDocumentTitle } from "../app/useDocumentTitle.js";
import { help } from "../data/help.js";
import { TITLES } from "../data/shell.js";

/**
 * Help.
 *
 * So far only the page heading, so the nav has a real page to go to. The
 * emergency numbers, the care team, the keyboard table, the questions and the
 * privacy section go under it when the screen is built. help.js has no date
 * line or breadcrumb copy, so the header holds the h1 alone rather than
 * strings written here.
 *
 * The h1 is the page's focus target: tabIndex -1 lets the shell focus it after
 * a navigation (see useRouteFocus.js) without adding a Tab stop.
 */
export default function Help() {
  useDocumentTitle(TITLES.help);

  return (
    <>
      <header className="cc-page__header">
        <h1 className="cc-display" tabIndex={-1} data-route-focus>
          {help.heading}
        </h1>
      </header>
    </>
  );
}
