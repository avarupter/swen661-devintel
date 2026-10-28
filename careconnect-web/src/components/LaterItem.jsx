import { Children } from "react";
import Badge from "./Badge.jsx";
import Card from "./Card.jsx";
import Icon from "./Icon.jsx";

/**
 * One "later today" item. Two of these sit in a list that is a single column on
 * mobile and a pair from tablet up — again the parent's grid, not a prop.
 *
 * A live list can add a status and its actions. `badge` ({ tone, label }) shows
 * under the detail, in words as well as colour and glyph (STML), and
 * `children` (the item's buttons) come after it, so the reading order is time,
 * title, detail, status, then what you can do about it. With neither, the item
 * is exactly the Week 10 row.
 *
 * @param {{
 *   item: { time: string, title: string, detail: string, icon: string },
 *   badge?: { tone: 'info' | 'neutral' | 'success' | 'error', label: string },
 *   children?: import('react').ReactNode,
 * }} props
 */
export default function LaterItem({ item, badge, children }) {
  return (
    <Card as="li" className="cc-later">
      {/* The chip is a painted circle in CSS, so rendering it around a missing
          or unrecognised glyph leaves a coloured blank beside the text. No
          icon, no chip. */}
      {item.icon ? (
        <span className="cc-later__icon">
          <Icon name={item.icon} size={22} />
        </span>
      ) : null}
      <div className="cc-later__text">
        <p className="cc-later__time">{item.time}</p>
        <p className="cc-later__title">{item.title}</p>
        <p className="cc-body cc-muted">{item.detail}</p>
        {badge ? (
          <p className="cc-later__status">
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </p>
        ) : null}
        {/* Counted, not tested for truth: a page writes its buttons as
            `{taken && <Button …/>}`, and two false conditions are [false,
            false], which is truthy but renders nothing, leaving an empty
            spaced box. */}
        {Children.toArray(children).length > 0 ? (
          <div className="cc-later__actions">{children}</div>
        ) : null}
      </div>
    </Card>
  );
}
