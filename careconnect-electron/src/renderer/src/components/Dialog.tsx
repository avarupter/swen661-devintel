import { useEffect, useId, useRef, type ReactNode } from 'react'
import { focusableWithin } from '../keyboard/regions'
import { Icon, type IconName } from './Icon'

export interface DialogProps {
  title: string
  icon?: IconName
  /** Shown under the title and used as the dialog's accessible description. */
  description?: ReactNode
  onClose(): void
  children: ReactNode
  footer?: ReactNode
  size?: 'small' | 'medium' | 'large'
  /** Id of the element to focus when the dialog opens; defaults to the first focusable element in the body. */
  initialFocusId?: string
  /** Close when the dimmed backdrop is clicked (off by default, so form input is never lost by a stray click). */
  closeOnBackdrop?: boolean
  className?: string
  /** Runs before the dialog's own Escape/Tab handling, e.g. for compose shortcuts. Call preventDefault to claim a key. */
  onKeyDown?(event: KeyboardEvent): void
}

/**
 * Modal dialog: role="dialog" with aria-modal, labelled by its title. Focus
 * moves in when it opens and Tab is trapped inside; Escape closes it. The app
 * shell is `inert` while a dialog is open, and the modal host returns focus
 * to the control that opened it.
 */
export function Dialog({
  title,
  icon,
  description,
  onClose,
  children,
  footer,
  size = 'medium',
  initialFocusId,
  closeOnBackdrop = false,
  className,
  onKeyDown
}: DialogProps): React.JSX.Element {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const latest = useRef({ onClose, onKeyDown, closeOnBackdrop })
  useEffect(() => {
    latest.current = { onClose, onKeyDown, closeOnBackdrop }
  })

  // Initial focus, once.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const requested = initialFocusId ? document.getElementById(initialFocusId) : null
    const body = dialog.querySelector<HTMLElement>('.dialog__body')
    const target = requested ?? (body ? focusableWithin(body)[0] : undefined) ?? dialog
    target.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial focus happens only on open
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    const backdrop = backdropRef.current
    if (!dialog || !backdrop) return

    const onDialogKeyDown = (event: KeyboardEvent): void => {
      latest.current.onKeyDown?.(event)
      if (event.defaultPrevented) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        latest.current.onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = focusableWithin(dialog)
      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    let pressedBackdrop = false
    const onBackdropMouseDown = (event: MouseEvent): void => {
      pressedBackdrop = event.target === backdrop
      // Keep focus in the dialog: a press on the backdrop would move it to <body>,
      // where Escape and the Tab trap no longer reach the dialog.
      if (pressedBackdrop) event.preventDefault()
    }
    // Close on release, never on press (WCAG 2.5.2 Pointer Cancellation): moving off the
    // backdrop before letting go cancels, and a drag that starts inside the dialog never closes it.
    const onBackdropMouseUp = (event: MouseEvent): void => {
      if (pressedBackdrop && event.target === backdrop && latest.current.closeOnBackdrop) latest.current.onClose()
      pressedBackdrop = false
    }

    dialog.addEventListener('keydown', onDialogKeyDown)
    backdrop.addEventListener('mousedown', onBackdropMouseDown)
    backdrop.addEventListener('mouseup', onBackdropMouseUp)
    return () => {
      dialog.removeEventListener('keydown', onDialogKeyDown)
      backdrop.removeEventListener('mousedown', onBackdropMouseDown)
      backdrop.removeEventListener('mouseup', onBackdropMouseUp)
    }
  }, [])

  return (
    <div className="dialog-backdrop" ref={backdropRef}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`dialog dialog--${size}${className ? ` ${className}` : ''}`}
        tabIndex={-1}
      >
        <div className="dialog__header">
          {icon && <Icon name={icon} className="dialog__icon" />}
          <h2 id={titleId} className="dialog__title">
            {title}
          </h2>
          <button type="button" className="button button--ghost dialog__close" onClick={onClose} aria-keyshortcuts="Escape">
            <span className="dialog__close-text">Close</span>
            <kbd aria-hidden="true">Esc</kbd>
          </button>
        </div>
        {description && (
          <p id={descriptionId} className="dialog__description">
            {description}
          </p>
        )}
        <div className="dialog__body">{children}</div>
        {footer && <div className="dialog__footer">{footer}</div>}
      </div>
    </div>
  )
}
