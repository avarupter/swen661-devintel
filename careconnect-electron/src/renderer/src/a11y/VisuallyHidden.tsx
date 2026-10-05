import type { ReactNode } from 'react'

/** Text for screen readers only (counts, context for repeated controls, disabled reasons). */
export function VisuallyHidden({ children, id }: { children: ReactNode; id?: string }): React.JSX.Element {
  return (
    <span className="visually-hidden" id={id}>
      {children}
    </span>
  )
}
