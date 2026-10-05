import type { CommandId } from '../../../shared/commands'
import { shortcutForCommand, shortcutKeys } from '../../../shared/shortcuts'
import { useAppState } from '../state/AppStateProvider'

/**
 * The small shortcut label beside a control ("Ctrl+N", "G P", "E"). Purely
 * visual (aria-hidden): the control exposes the same shortcut through
 * aria-keyshortcuts. Shown when "Show shortcut hints" is on or Alt is held.
 */
export function KeyHint({
  command,
  keys,
  variant = 'text'
}: {
  command?: CommandId
  keys?: string[]
  variant?: 'text' | 'keys'
}): React.JSX.Element | null {
  const { ui } = useAppState()
  const shortcut = command ? shortcutForCommand(command) : undefined
  const caps = keys ?? (shortcut ? shortcutKeys(shortcut, ui.platform) : [])
  if (caps.length === 0) return null
  if (variant === 'keys') {
    return (
      <span className="key-hint key-hint--keys" aria-hidden="true">
        {caps.map((cap, index) => (
          <kbd key={`${cap}-${index}`}>{cap}</kbd>
        ))}
      </span>
    )
  }
  const text = shortcut?.sequence ? caps.join(' ') : caps.join('+')
  return (
    <span className="key-hint" aria-hidden="true">
      {text}
    </span>
  )
}
