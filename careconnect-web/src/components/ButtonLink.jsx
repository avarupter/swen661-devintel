import Icon from "./Icon.jsx";

/**
 * A link drawn as a button, for an action that goes somewhere rather than doing
 * something here: "Message care team" opens the new-message form, and "Call my
 * caregiver" is a `tel:` link (D7).
 *
 * It stays an <a>, so a screen reader announces a link, which is what it is,
 * and it works with no click handler at all. A <button> that navigated would be
 * announced as the wrong kind of control. It carries Button's classes, so it
 * has the same size, shape, 52px floor and focus ring.
 *
 * There is no disabled state: a link that cannot be followed should not be
 * rendered. Every other prop (`id`, `ref`, `aria-*`) reaches the <a>.
 *
 * @param {{
 *   href: string,
 *   children: import('react').ReactNode,
 *   variant?: 'primary' | 'secondary',
 *   icon?: string,
 *   fullWidth?: boolean,
 *   className?: string,
 * }} props
 */
export default function ButtonLink({
  href,
  children,
  variant = "secondary",
  icon,
  fullWidth = false,
  className = "",
  ...rest
}) {
  const classes = ["cc-btn", `cc-btn--${variant}`];
  if (fullWidth) classes.push("cc-btn--full");
  if (className) classes.push(className);

  return (
    <a {...rest} href={href} className={classes.join(" ")}>
      {icon ? <Icon name={icon} size={20} /> : null}
      <span>{children}</span>
    </a>
  );
}
