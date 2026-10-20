import Card from "./Card.jsx";
import Icon from "./Icon.jsx";

/**
 * "Today at a glance" — a definition list, because each row is a label and its
 * value. <dl> gives that relationship to assistive tech for free, where a set
 * of divs would give nothing.
 *
 * @param {{ data: import('../data/patientToday.js').patientToday['glance'] }} props
 */
export default function GlanceCard({ data }) {
  return (
    <Card
      as="section"
      className="cc-glance"
      aria-labelledby="cc-glance-heading"
    >
      <h2 className="cc-section" id="cc-glance-heading">
        {data.heading}
      </h2>
      <dl className="cc-glance__list">
        {data.items.map((item) => (
          <div className="cc-glance__row" key={item.id}>
            <span className="cc-glance__icon">
              <Icon name={item.icon} size={20} />
            </span>
            <dt className="cc-body cc-muted">{item.label}</dt>
            <dd className="cc-label">{item.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
