/**
 * Inline SVG icons, 24x24 on a 24-unit grid, drawn with currentColor so they
 * inherit the colour of the control they sit in.
 *
 * Every icon is aria-hidden and focusable="false": the icons on this screen are
 * always paired with a visible text label, so announcing them would make a
 * screen reader read the same thing twice. Where an icon is the only content of
 * a control, the control itself carries the accessible name.
 */

const PATHS = {
  home: (
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H4a1 1 0 0 1-1-1z" />
  ),
  pill: (
    <>
      <rect
        x="2.5"
        y="8.5"
        width="19"
        height="7"
        rx="3.5"
        transform="rotate(-45 12 12)"
      />
      <path d="M9.4 6.8 17.2 14.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  chat: <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.3" />
      <path d="M12 17.2h.01" />
    </>
  ),
  phone: (
    <path d="M6.6 3h3l1.5 4-2 1.4a12 12 0 0 0 5.5 5.5l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.2 2 2 0 0 1 6.6 3z" />
  ),
  video: (
    <>
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="M15 10.5 21 7.5v9l-6-3z" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.2 12.3 2.6 2.6 5-5.4" />
    </>
  ),
  shield: <path d="M12 3l7 3v5.5c0 4.3-2.9 8.2-7 9.5-4.1-1.3-7-5.2-7-9.5V6z" />,
};

/**
 * @param {{ name: keyof typeof PATHS, size?: number, strokeWidth?: number,
 *           className?: string }} props
 */
export default function Icon({
  name,
  size = 24,
  strokeWidth = 1.8,
  className,
}) {
  // Object.hasOwn, not a bare lookup: PATHS inherits from Object.prototype, so
  // `name="toString"` would otherwise resolve to a function and be rendered.
  const path = Object.hasOwn(PATHS, name) ? PATHS[name] : null;
  if (!path) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  );
}

/** The CareConnect mark. Decorative — the wordmark beside it carries the name. */
export function Mark({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" rx="12" fill="var(--cc-brand)" />
      <path
        d="M20 29c-4.8-3-8-6-8-9.6A4.4 4.4 0 0 1 20 17a4.4 4.4 0 0 1 8 2.4C28 23 24.8 26 20 29z"
        fill="#fff"
      />
      <path
        d="M13.5 20.6h4l1.6-2.6 1.8 4.4 1.7-3h4"
        stroke="var(--cc-brand)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
