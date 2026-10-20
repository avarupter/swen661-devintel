import Icon from "./Icon.jsx";

/**
 * Primary is the clearest next action; secondary is outlined.
 *
 * Disabled uses the native `disabled` attribute. The board's wording is
 * "remains legible and is not actionable", and native disabled is the only
 * thing that genuinely makes a button non-actionable — aria-disabled leaves the
 * click handler live. The cost is that the control leaves the tab order, which
 * is the accepted trade for a control that is not meant to be used yet.
 *
 * @param {{
 *   children: import('react').ReactNode,
 *   variant?: 'primary' | 'secondary',
 *   icon?: string,
 *   disabled?: boolean,
 *   fullWidth?: boolean,
 *   type?: 'button' | 'submit',
 *   onClick?: () => void,
 * }} props
 */
export default function Button({
  children,
  variant = "primary",
  icon,
  disabled = false,
  fullWidth = false,
  type = "button",
  onClick,
}) {
  const classes = ["cc-btn", `cc-btn--${variant}`];
  if (fullWidth) classes.push("cc-btn--full");

  return (
    <button
      type={type}
      className={classes.join(" ")}
      disabled={disabled}
      onClick={onClick}
    >
      {icon ? <Icon name={icon} size={20} /> : null}
      <span>{children}</span>
    </button>
  );
}
