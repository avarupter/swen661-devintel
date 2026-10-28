import Icon from "./Icon.jsx";

/**
 * The glyph each tone draws beside its word (D9). Status is never colour alone
 * (STML): a reader who cannot tell the tints apart still gets a different
 * shape for every status, and the word beside it.
 */
const TONE_ICONS = {
  success: "check",
  info: "clock",
  error: "alert",
  neutral: "calendar",
};

/**
 * Status badges are informational, not controls.
 *
 * Rendered as a plain <span>: giving it role="status" would make assistive tech
 * announce it as a live region on every render. When a status changes, the page
 * that changed it announces that once, through the app's live regions
 * (a11y/Announcer.jsx), not the badge. The word carries the meaning — the glyph
 * every tone draws is decorative and hidden, so "Taken" is never announced as
 * "check Taken".
 *
 * @param {{ tone?: 'info' | 'neutral' | 'success' | 'error', children: import('react').ReactNode }} props
 */
export default function Badge({ tone = "neutral", children }) {
  // Own keys only, like Icon's lookup: an unrecognised tone draws no glyph
  // rather than whatever Object.prototype happens to hold under that name.
  const icon = Object.hasOwn(TONE_ICONS, tone) ? TONE_ICONS[tone] : null;
  return (
    <span className={`cc-badge cc-badge--${tone}`}>
      {icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </span>
  );
}
