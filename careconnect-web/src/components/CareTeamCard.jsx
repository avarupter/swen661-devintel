import { useId } from "react";
import Button from "./Button.jsx";
import ButtonLink from "./ButtonLink.jsx";
import Card from "./Card.jsx";
import Icon from "./Icon.jsx";

/**
 * The supporting care card. Uses the soft surface (#F4F8FF) from the board.
 *
 * `children` sit between the body and the action: Help adds the care team's
 * hours and phone numbers there. With `actionHref` the action is a link to that
 * address (a ButtonLink), because "Message care team" goes to the new-message
 * form rather than doing something here. Without it the action is the Week 10
 * button, which does nothing.
 *
 * The heading id comes from useId, so the card can appear on any page without
 * an id clash.
 *
 * @param {{
 *   data: import('../data/patientToday.js').patientToday['careTeam'],
 *   actionHref?: string,
 *   children?: import('react').ReactNode,
 * }} props
 */
export default function CareTeamCard({ data, actionHref, children }) {
  const headingId = useId();
  return (
    <Card
      as="section"
      tone="soft"
      className="cc-care"
      aria-labelledby={headingId}
    >
      <div className="cc-care__head">
        <span className="cc-care__icon">
          <Icon name="shield" size={22} />
        </span>
        <div>
          <h2 className="cc-section" id={headingId}>
            {data.heading}
          </h2>
          <p className="cc-care__available">{data.availability}</p>
        </div>
      </div>
      <p className="cc-body">{data.body}</p>
      {children}
      {actionHref ? (
        <ButtonLink href={actionHref} variant="secondary" icon="chat" fullWidth>
          {data.action}
        </ButtonLink>
      ) : (
        <Button variant="secondary" icon="chat" fullWidth>
          {data.action}
        </Button>
      )}
    </Card>
  );
}
