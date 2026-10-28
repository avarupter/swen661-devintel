import { useDocumentTitle } from "../app/useDocumentTitle.js";
import { messagesPage as p } from "../data/messages.js";
import { TITLES } from "../data/shell.js";

/**
 * Messages.
 *
 * So far only the page heading, so the nav has a real page to go to. The shell
 * already passes `route` ("messages", "messages/new" or "messages/<id>"), and
 * every one of them shows this page, so the Messages nav item stays current on
 * all three; the list, the thread and the compose form read it when the
 * screen is built. messages.js has no date line or breadcrumb copy, so the
 * header holds the h1 alone rather than strings written here.
 *
 * The h1 is the page's focus target: tabIndex -1 lets the shell focus it after
 * a navigation (see useRouteFocus.js) without adding a Tab stop.
 */
export default function Messages() {
  useDocumentTitle(TITLES.messages);

  return (
    <>
      <header className="cc-page__header">
        <h1 className="cc-display" tabIndex={-1} data-route-focus>
          {p.heading}
        </h1>
      </header>
    </>
  );
}
