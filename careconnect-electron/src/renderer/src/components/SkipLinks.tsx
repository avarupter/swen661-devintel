import type { ViewId } from '../../../shared/commands'

function focusTarget(id: string): void {
  const target = document.getElementById(id)
  if (!target) return
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus()
}

/** First in the DOM and visible only when focused (spec card 03). */
export function SkipLinks({ view }: { view: ViewId }): React.JSX.Element {
  const links = [
    { target: 'main', label: 'Skip to main workspace' },
    ...(view === 'patients' ? [{ target: 'patient-list', label: 'Skip to patient list' }] : []),
    { target: 'status-bar', label: 'Skip to status' }
  ]
  return (
    <div className="skip-links">
      {links.map((link) => (
        <a
          key={link.target}
          className="skip-link"
          href={`#${link.target}`}
          onClick={(event) => {
            event.preventDefault()
            focusTarget(link.target)
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}
