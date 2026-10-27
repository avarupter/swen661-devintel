import Badge from "./Badge.jsx";
import Button from "./Button.jsx";
import Card from "./Card.jsx";
import Icon from "./Icon.jsx";

/**
 * "Next thing to do" — the appointment recipe.
 *
 * The same markup is used at every breakpoint. How it arranges is the parent's
 * job: the time and the call details stack on mobile and share a row from
 * tablet up, and that is done by a CSS grid on `.cc-appointment__body` rather
 * than by a layout prop. Adding `variant="stacked" | "wide"` here would push a
 * layout decision into a content component and the three pages would start to
 * drift.
 *
 * @param {{ data: import('../data/patientToday.js').patientToday['next'] }} props
 */
export default function AppointmentCard({ data }) {
  return (
    <Card
      as="section"
      className="cc-appointment"
      aria-labelledby="cc-next-heading"
    >
      <header className="cc-appointment__head">
        <h2 className="cc-label" id="cc-next-heading">
          {data.eyebrow}
        </h2>
        {data.badge ? <Badge tone="neutral">{data.badge}</Badge> : null}
      </header>

      <div className="cc-appointment__body">
        <p className="cc-appointment__when">
          <span className="cc-muted cc-body">{data.kindLabel}</span>
          <span className="cc-time">{data.time}</span>
        </p>

        <div className="cc-appointment__what">
          <p className="cc-appointment__title">
            <Icon name="video" size={22} />
            <span>{data.title}</span>
          </p>
          <p className="cc-body cc-muted">{data.detail}</p>
        </div>
      </div>

      {/* Both of these are pills and icon rows that CSS paints. Rendered around
          absent copy they leave a bordered blank rather than nothing, so the
          slot goes away with its content — same rule as the later-today chip. */}
      <footer className="cc-appointment__foot">
        {data.readiness ? (
          <p className="cc-appointment__ready">
            <Icon name="check" size={20} />
            <span>{data.readiness}</span>
          </p>
        ) : null}
        <Button variant="primary">{data.action}</Button>
      </footer>
    </Card>
  );
}
