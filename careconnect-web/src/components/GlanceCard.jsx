import { useId } from "react";
import Card from "./Card.jsx";
import Icon from "./Icon.jsx";

/**
 * "Today at a glance" — a definition list, because each row is a label and its
 * value. <dl> gives that relationship to assistive tech for free, where a set
 * of divs would give nothing.
 *
 * A row of a <dl> may hold only terms and definitions, so the icon chip sits
 * inside the <dt>, not beside it (axe: definition-list). It is decorative and
 * holds no text, so the term still reads as just its label. components.css
 * draws it in the gutter beside both lines, where it always was.
 *
 * The heading id comes from useId, so the card can appear on any page without
 * an id clash.
 *
 * @param {{ data: import('../data/patientToday.js').patientToday['glance'] }} props
 */
export default function GlanceCard({ data }) {
  const headingId = useId();
  return (
    <Card as="section" className="cc-glance" aria-labelledby={headingId}>
      <h2 className="cc-section" id={headingId}>
        {data.heading}
      </h2>
      <dl className="cc-glance__list">
        {data.items.map((item) => (
          <div className="cc-glance__row" key={item.id}>
            <dt className="cc-body cc-muted">
              <span className="cc-glance__icon">
                <Icon name={item.icon} size={20} />
              </span>
              {item.label}
            </dt>
            <dd className="cc-label">{item.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
