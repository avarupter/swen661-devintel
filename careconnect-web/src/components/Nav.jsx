import Icon from "./Icon.jsx";
import { DESTINATIONS } from "../data/patientToday.js";

/**
 * One navigation component, three presentations.
 *
 * The destinations are declared once in data/patientToday.js and rendered by
 * all three layouts, which is what guarantees "same destinations everywhere".
 * The presentation differs only by the `variant` class — sidebar (desktop),
 * tabs (tablet) and bar (mobile) are CSS, not three component trees.
 *
 * `counts` maps a destination id to its unread number. App passes
 * `{ messages: n }` from the demo store, so the badge follows what the user has
 * read. A count of 0, or none, shows no badge.
 *
 * Accessibility points the board asks for specifically:
 *
 *  - The current page is marked with aria-current="page", which is what makes a
 *    screen reader say "current page" rather than relying on the tint. The tint
 *    and the heavier label are the visual half of the same fact.
 *  - Every name starts with the words on screen (WCAG 2.5.3 Label in Name). On
 *    mobile the bar shows "Meds", so it is named "Meds (Medications)" (D8),
 *    which also says where it goes. The count follows the destination:
 *    "Messages, 2 unread", never "2 unread Messages".
 *  - A name that is not just the visible label is ONE visually hidden span
 *    holding all of it, and the visible label and badge are aria-hidden, so the
 *    name is read once. One span, not the label followed by a hidden ", 2
 *    unread": .cc-sr-only is position: absolute, and Chromium puts a space
 *    between text in separate boxes, which named the link "Messages , 2
 *    unread". A plain label is its own name and is never hidden.
 *
 * @param {{
 *   variant: 'sidebar' | 'tabs' | 'bar',
 *   current?: string | null,
 *   counts?: Record<string, number>,
 * }} props
 */
export default function Nav({ variant, current, counts = {} }) {
  return (
    <nav className={`cc-nav cc-nav--${variant}`} aria-label="Main">
      <ul className="cc-nav__list">
        {DESTINATIONS.map((d) => {
          const isCurrent = d.id === current;
          const abbreviated = variant === "bar" && d.shortLabel !== d.label;
          // Own keys only, so a destination id can never find Object.prototype.
          const count = counts && Object.hasOwn(counts, d.id) ? counts[d.id] : 0;
          const unread = count > 0;

          const label = abbreviated ? d.shortLabel : d.label;
          const named = abbreviated ? `${d.shortLabel} (${d.label})` : d.label;
          const name = unread ? `${named}, ${count} unread` : named;

          return (
            <li key={d.id} className="cc-nav__item">
              <a
                className={`cc-nav__link${isCurrent ? " is-current" : ""}`}
                href={`#${d.id}`}
                aria-current={isCurrent ? "page" : undefined}
              >
                <span className="cc-nav__icon" aria-hidden="true">
                  <Icon name={d.icon} size={24} />
                  {unread ? <span className="cc-nav__count">{count}</span> : null}
                </span>

                {name === label ? (
                  <span className="cc-nav__label">{label}</span>
                ) : (
                  <>
                    <span className="cc-nav__label" aria-hidden="true">
                      {label}
                    </span>
                    <span className="cc-sr-only">{name}</span>
                  </>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
