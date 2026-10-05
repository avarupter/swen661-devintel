import { useEffect, useId, useRef, type ReactNode } from 'react'
import type { CommandId } from '../../../shared/commands'
import { ariaKeyShortcuts } from '../../../shared/shortcuts'
import { useCommands } from '../commands/CommandProvider'
import { useAppState } from '../state/AppStateProvider'
import { Icon, type IconName } from './Icon'
import { KeyHint } from './KeyHint'

/**
 * role="toolbar" with a roving tabindex (spec card 04): the toolbar is one Tab
 * stop, Left/Right move between items, Home/End jump to the ends. Items are any
 * descendants marked `data-toolbar-item`.
 */
export function Toolbar({
  label,
  children,
  className,
  region
}: {
  label: string
  children: ReactNode
  className?: string
  /** Set to make the toolbar an F6 region. */
  region?: string
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const items = (): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>('[data-toolbar-item]'))
    const activate = (target: HTMLElement): void => {
      for (const item of items()) item.tabIndex = item === target ? 0 : -1
    }
    const ensureOneTabStop = (): void => {
      const list = items()
      if (list.length === 0) return
      activate(list.find((item) => item.tabIndex === 0) ?? list[0])
    }
    ensureOneTabStop()
    const observer = new MutationObserver(ensureOneTabStop)
    observer.observe(root, { childList: true, subtree: true })

    const onKeyDown = (event: KeyboardEvent): void => {
      const list = items()
      const index = list.indexOf(document.activeElement as HTMLElement)
      if (index === -1) return
      let next: number
      switch (event.key) {
        case 'ArrowRight':
          next = (index + 1) % list.length
          break
        case 'ArrowLeft':
          next = (index - 1 + list.length) % list.length
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = list.length - 1
          break
        default:
          return
      }
      event.preventDefault()
      activate(list[next])
      list[next].focus()
    }
    const onFocusIn = (event: FocusEvent): void => {
      const target = event.target as HTMLElement
      if (items().includes(target)) activate(target)
    }
    root.addEventListener('keydown', onKeyDown)
    root.addEventListener('focusin', onFocusIn)
    return () => {
      observer.disconnect()
      root.removeEventListener('keydown', onKeyDown)
      root.removeEventListener('focusin', onFocusIn)
    }
  }, [])

  return (
    <div ref={ref} role="toolbar" aria-label={label} className={className ? `toolbar ${className}` : 'toolbar'} data-region={region}>
      {children}
    </div>
  )
}

export interface ToolbarButtonProps {
  label: string
  icon?: IconName
  /** Runs this command on click unless `onClick` is given; also supplies the key hint and aria-keyshortcuts. */
  command?: CommandId
  onClick?(): void
  id?: string
  variant?: 'default' | 'primary'
  /** Makes the button aria-disabled (still focusable) and describes why. */
  disabledReason?: string
  pressed?: boolean
  hasPopup?: 'menu' | 'dialog'
  /** Visible label override; the accessible name stays `label`. */
  children?: ReactNode
  /** Key hint override, e.g. ["/"] where the design shows the alternate key. */
  hintKeys?: string[]
}

export function ToolbarButton({
  label,
  icon,
  command,
  onClick,
  id,
  variant = 'default',
  disabledReason,
  pressed,
  hasPopup,
  children,
  hintKeys
}: ToolbarButtonProps): React.JSX.Element {
  const { run } = useCommands()
  const { ui } = useAppState()
  const reasonId = useId()
  const disabled = Boolean(disabledReason)
  return (
    <>
      <button
        type="button"
        id={id ?? (command ? `toolbar-${command}` : undefined)}
        data-toolbar-item=""
        className={`button toolbar__button${variant === 'primary' ? ' button--primary' : ''}`}
        aria-disabled={disabled || undefined}
        aria-describedby={disabled ? reasonId : undefined}
        aria-pressed={pressed}
        aria-haspopup={hasPopup}
        aria-keyshortcuts={command ? ariaKeyShortcuts(command, ui.platform) : undefined}
        aria-label={children ? label : undefined}
        title={disabledReason}
        onClick={() => {
          if (disabled) return
          if (onClick) onClick()
          else if (command) run({ id: command })
        }}
      >
        {icon && <Icon name={icon} />}
        <span className="button__label">{children ?? label}</span>
        {(command || hintKeys) && <KeyHint command={command} keys={hintKeys} />}
      </button>
      {disabled && (
        <span id={reasonId} className="visually-hidden">
          {disabledReason}
        </span>
      )}
    </>
  )
}
