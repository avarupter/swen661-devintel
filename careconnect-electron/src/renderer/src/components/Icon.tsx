import type { ReactNode } from 'react'

/**
 * Inline stroke icons (24×24). Icons are always decorative: the control
 * around them carries the accessible name, so every icon is aria-hidden.
 */
const ICONS = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.8a3.4 3.4 0 0 1 0 7M18 14.4c2 .7 3.5 2.6 3.5 5.6" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 13 6 5.6A2 2 0 0 1 7.9 4.2h8.2A2 2 0 0 1 18 5.6l2.5 7.4v5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <path d="M3.5 13H8l1.5 2.5h5L16 13h4.5" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
      <rect x="9" y="2.75" width="6" height="3.5" rx="1" />
      <path d="M9 11h6M9 15h4" />
    </>
  ),
  chart: <path d="M4 20V11M10 20V5M16 20v-7M3 20h18" />,
  book: (
    <>
      <path d="M3.5 5.5A1.5 1.5 0 0 1 5 4h6v16H5a1.5 1.5 0 0 1-1.5-1.5z" />
      <path d="M20.5 5.5A1.5 1.5 0 0 0 19 4h-6v16h6a1.5 1.5 0 0 0 1.5-1.5z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  sort: <path d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4M13.5 16.5 17 20l3.5-3.5" />,
  userPlus: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M19 8v6M16 11h6" />
    </>
  ),
  message: <path d="M20.5 11.5a8 8 0 0 1-11.7 7.1L4 20l1.3-4.4A8 8 0 1 1 20.5 11.5z" />,
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8 12.4 2.8 2.8L16 10" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4.5M12 17.2v.3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.7v.3" />
    </>
  ),
  exclamation: <path d="M12 4.5v10M12 19v.5" />,
  infoMark: <path d="M12 10v9.5M12 4.7v.3" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  command: (
    <path d="M9 6.5a2.5 2.5 0 1 0-2.5 2.5H17.5A2.5 2.5 0 1 0 15 6.5v11a2.5 2.5 0 1 0 2.5-2.5h-11A2.5 2.5 0 1 0 9 17.5z" />
  ),
  keyboard: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.6M12 16.7v.3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.6M12 18.6v2.6M3.4 7l2.3 1.3M18.3 15.7l2.3 1.3M3.4 17l2.3-1.3M18.3 8.3 20.6 7" />
      <circle cx="12" cy="12" r="6.5" />
    </>
  ),
  chevronsUpDown: <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />,
  file: <path d="M6 3h8l5 5v13H6zM14 3v5h5M9 13h6M9 17h6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  paperclip: <path d="m20 11.3-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" />,
  send: <path d="M4 12 20 4l-4 16-4-7zM12 13l8-9" />,
  save: <path d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  printer: <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" />,
  reply: <path d="M10 7 4 12l6 5M4 12h10a6 6 0 0 1 6 6v1" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9.5" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4.5V11h-6.5" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  activity: <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof ICONS

export function Icon({ name, className }: { name: IconName; className?: string }): React.JSX.Element {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  )
}
