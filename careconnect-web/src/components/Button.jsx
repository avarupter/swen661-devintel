import Icon from "./Icon.jsx";

/**
 * Primary is the clearest next action; secondary is outlined.
 *
 * Disabled is `aria-disabled`, which is what the board specifies, with the
 * handler detached so the control is genuinely inert. The objection to
 * aria-disabled is that it leaves the click handler live — so this does not
 * pass one. What it buys over the native attribute is that the control stays
 * in the tab order: a keyboard user reaches it and hears "unavailable" instead
 * of it silently vanishing from the sequence, and the disabled specimen on the
 * foundations sheet can actually be focused to show that its label still reads.
 *
 * `TextField` keeps the native `disabled` attribute. The asymmetry is
 * deliberate: a disabled input must also be skipped by form submission and
 * must not be editable, which only the native attribute gives.
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
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
    >
      {icon ? <Icon name={icon} size={20} /> : null}
      <span>{children}</span>
    </button>
  );
}
