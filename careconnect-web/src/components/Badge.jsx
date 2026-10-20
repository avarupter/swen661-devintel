import Icon from "./Icon.jsx";

/**
 * Status badges are informational, not controls.
 *
 * Rendered as a plain <span>: giving it role="status" would make assistive tech
 * announce it as a live region on every render, and these never change. The
 * word carries the meaning — the check mark on the success tones is decorative
 * and hidden, so "Taken" is never announced as "check Taken".
 *
 * @param {{ tone?: 'info' | 'neutral' | 'success' | 'error', children: import('react').ReactNode }} props
 */
export default function Badge({ tone = "neutral", children }) {
  const showsCheck = tone === "success";
  return (
    <span className={`cc-badge cc-badge--${tone}`}>
      {showsCheck ? <Icon name="check" size={18} /> : null}
      {children}
    </span>
  );
}
