import { useDocumentTitle } from "../app/useDocumentTitle.js";
import Button from "../components/Button.jsx";
import { medicationsPage as p } from "../data/medications.js";
import { TITLES } from "../data/shell.js";

/**
 * Medications.
 *
 * So far only the page header, with its final heading, so the nav has a real
 * page to go to. The dose sections and the medicine list go under it, in
 * .cc-page__main and .cc-page__support, when the screen is built.
 *
 * The h1 is the page's focus target: tabIndex -1 lets the shell focus it after
 * a navigation (see useRouteFocus.js) without adding a Tab stop.
 */
export default function Medications() {
  useDocumentTitle(TITLES.medications);

  return (
    <>
      <header className="cc-page__header">
        <p className="cc-body cc-muted">{p.header.meta}</p>
        <h1 className="cc-display" tabIndex={-1} data-route-focus>
          {p.header.heading}
        </h1>
        <nav className="cc-breadcrumb" aria-label="Breadcrumb">
          <ol>
            {p.header.breadcrumb.map((crumb, i) => {
              const isLast = i === p.header.breadcrumb.length - 1;
              return (
                <li key={crumb}>
                  {isLast ? (
                    <span aria-current="page">{crumb}</span>
                  ) : (
                    <a href="#home">{crumb}</a>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="cc-page__headerAction">
          <Button variant="primary" icon="phone" fullWidth>
            {p.header.callAction}
          </Button>
        </div>
      </header>
    </>
  );
}
