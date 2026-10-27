import Button from "./Button.jsx";
import Card from "./Card.jsx";
import Icon from "./Icon.jsx";

/**
 * The supporting care card. Uses the soft surface (#F4F8FF) from the board.
 *
 * @param {{ data: import('../data/patientToday.js').patientToday['careTeam'] }} props
 */
export default function CareTeamCard({ data }) {
  return (
    <Card
      as="section"
      tone="soft"
      className="cc-care"
      aria-labelledby="cc-care-heading"
    >
      <div className="cc-care__head">
        <span className="cc-care__icon">
          <Icon name="shield" size={22} />
        </span>
        <div>
          <h2 className="cc-section" id="cc-care-heading">
            {data.heading}
          </h2>
          <p className="cc-care__available">{data.availability}</p>
        </div>
      </div>
      <p className="cc-body">{data.body}</p>
      <Button variant="secondary" icon="chat" fullWidth>
        {data.action}
      </Button>
    </Card>
  );
}
