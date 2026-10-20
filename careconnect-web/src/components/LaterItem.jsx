import Card from "./Card.jsx";
import Icon from "./Icon.jsx";

/**
 * One "later today" item. Two of these sit in a list that is a single column on
 * mobile and a pair from tablet up — again the parent's grid, not a prop.
 *
 * @param {{ item: { time: string, title: string, detail: string, icon: string } }} props
 */
export default function LaterItem({ item }) {
  return (
    <Card as="li" className="cc-later">
      <span className="cc-later__icon">
        <Icon name={item.icon} size={22} />
      </span>
      <div className="cc-later__text">
        <p className="cc-later__time">{item.time}</p>
        <p className="cc-later__title">{item.title}</p>
        <p className="cc-body cc-muted">{item.detail}</p>
      </div>
    </Card>
  );
}
