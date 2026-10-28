import {
  useInRouterContext,
  useNavigate,
} from "react-router-dom";

import Icon from "./Icon.jsx";
import { DESTINATIONS } from "../data/patientToday.js";

const ROUTES = {
  home: "/",
  medications: "/medications",
  appointments: "/appointments",
  messages: "/messages",
  help: "/help",
};

function RoutedDestination({
  destination,
  className,
  current,
  children,
}) {
  const navigate = useNavigate();

  function handleClick(event) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigate(ROUTES[destination.id]);
  }

  return (
    <a
      className={className}
      href={`#${destination.id}`}
      aria-current={current ? "page" : undefined}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

export default function Nav({
  variant,
  current,
  unreadMessages,
}) {
  const insideRouter = useInRouterContext();

  return (
    <nav
      className={`cc-nav cc-nav--${variant}`}
      aria-label="Main"
    >
      <ul className="cc-nav__list">
        {DESTINATIONS.map((destination) => {
          const isCurrent = destination.id === current;

          const abbreviated =
            variant === "bar" &&
            destination.shortLabel !== destination.label;

          const badgeCount =
            destination.id === "messages" &&
            unreadMessages !== undefined
              ? unreadMessages
              : destination.badgeCount;

          const className =
            `cc-nav__link${isCurrent ? " is-current" : ""}`;

          const content = (
            <>
              <span
                className="cc-nav__icon"
                aria-hidden="true"
              >
                <Icon
                  name={destination.icon}
                  size={24}
                />

                {badgeCount ? (
                  <span className="cc-nav__count">
                    {badgeCount}
                  </span>
                ) : null}
              </span>

              {abbreviated ? (
                <>
                  <span
                    className="cc-nav__label"
                    aria-hidden="true"
                  >
                    {destination.shortLabel}
                  </span>

                  <span className="cc-sr-only">
                    {destination.label}
                  </span>
                </>
              ) : (
                <span className="cc-nav__label">
                  {destination.label}
                </span>
              )}

              {badgeCount ? (
                <span className="cc-sr-only">
                  , {badgeCount} unread
                </span>
              ) : null}
            </>
          );

          return (
            <li
              key={destination.id}
              className="cc-nav__item"
            >
              {insideRouter ? (
                <RoutedDestination
                  destination={destination}
                  className={className}
                  current={isCurrent}
                >
                  {content}
                </RoutedDestination>
              ) : (
                <a
                  className={className}
                  href={`#${destination.id}`}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {content}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}