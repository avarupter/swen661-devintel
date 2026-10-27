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
 * Two accessibility points the board asks for specifically:
 *
 *  - The current page is marked with aria-current="page", which is what makes a
 *    screen reader say "current page" rather than relying on the tint. The tint
 *    and the heavier label are the visual half of the same fact.
 *  - On mobile the visible label is abbreviated ("Meds") but the accessible name
 *    must stay the full destination ("Medications"). That is done by rendering
 *    the abbreviation aria-hidden and the full name in a visually hidden span,
 *    so exactly one name reaches assistive tech instead of both.
 *
 * @param {{ variant: 'sidebar' | 'tabs' | 'bar', current: string }} props
 */
export default function Nav({ variant, current }) {
  return (
    <nav className={`cc-nav cc-nav--${variant}`} aria-label="Main">
      <ul className="cc-nav__list">
        {DESTINATIONS.map((d) => {
          const isCurrent = d.id === current;
          const abbreviated = variant === "bar" && d.shortLabel !== d.label;

          return (
            <li key={d.id} className="cc-nav__item">
              <a
                className={`cc-nav__link${isCurrent ? " is-current" : ""}`}
                href={`#${d.id}`}
                aria-current={isCurrent ? "page" : undefined}
              >
                <span className="cc-nav__icon" aria-hidden="true">
                  <Icon name={d.icon} size={24} />
                  {d.badgeCount ? (
                    <span className="cc-nav__count">{d.badgeCount}</span>
                  ) : null}
                </span>

                {abbreviated ? (
                  <>
                    <span className="cc-nav__label" aria-hidden="true">
                      {d.shortLabel}
                    </span>
                    <span className="cc-sr-only">{d.label}</span>
                  </>
                ) : (
                  <span className="cc-nav__label">{d.label}</span>
                )}

                {/* Announced AFTER the destination, so the name reads
                    "Messages, 2 unread" rather than "2 unread messages
                    Messages" — the count is context for the destination, not a
                    replacement for it. The visible badge above is aria-hidden so
                    the number is not announced twice. */}
                {d.badgeCount ? (
                  <span className="cc-sr-only">, {d.badgeCount} unread</span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
