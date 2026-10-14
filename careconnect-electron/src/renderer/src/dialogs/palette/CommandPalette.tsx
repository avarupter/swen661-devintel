import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { flushSync } from 'react-dom'
import { pluralize } from '../../../../shared/format'
import { describeShortcut, keyLabel, shortcutForCommand, shortcutKeys, type KeyPlatform } from '../../../../shared/shortcuts'
import { VisuallyHidden } from '../../a11y/VisuallyHidden'
import { useCommands } from '../../commands/CommandProvider'
import { Dialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { useAppDispatch, useAppState } from '../../state/AppStateProvider'
import { useNow } from '../../state/clock'
import { buildPaletteItems, filterPaletteItems, groupPaletteItems, type PaletteItem } from './paletteCommands'
import { useQueryAnnouncement } from './useQueryAnnouncement'
import './palette.css'

/** Decorative keycaps; the option's description gives screen readers the same shortcut as text. */
function Keycaps({ keys }: { keys: readonly string[] }): React.JSX.Element {
  return (
    <span className="palette__keys" aria-hidden="true">
      {keys.map((key, index) => (
        <kbd key={`${key}-${index}`}>{key}</kbd>
      ))}
    </span>
  )
}

/** "Ctrl+N", "G then P": the text form of the shortcut an item's keycaps show. */
function spokenShortcut(item: PaletteItem, platform: KeyPlatform): string | undefined {
  const shortcut = item.keys ? shortcutForCommand(item.command.id) : undefined
  return shortcut ? describeShortcut(shortcut, platform) : undefined
}

const PALETTE_SHORTCUT = shortcutForCommand('app.commandPalette')

/** A press on any of these keeps its native behaviour: the combobox itself, and the dialog's Close button. */
const OWN_FOCUS_TARGETS = 'input, button, a[href]'

/**
 * Command palette (design image 3, Ctrl+K): an editable combobox that owns
 * a grouped listbox. Focus never leaves the input; the active option is
 * conveyed with aria-activedescendant, so results update without moving
 * focus. Choosing an item closes the palette and runs its command through the
 * same dispatcher as the menu, the keyboard and the buttons.
 */
export function CommandPalette({ onClose }: { onClose(): void }): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { run } = useCommands()
  const now = useNow()
  const platform = state.ui.platform
  const baseId = useId()
  const inputId = `${baseId}palette-input`
  const listboxId = `${baseId}palette-listbox`
  const helperId = `${baseId}palette-helper`
  const optionId = (item: PaletteItem): string => `${baseId}palette-${item.id.replace(/[^\w-]/g, '-')}`

  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo(() => buildPaletteItems(state, now, platform), [state, now, platform])
  const results = useMemo(() => filterPaletteItems(items, query), [items, query])
  const sections = useMemo(() => groupPaletteItems(results), [results])
  const active = results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1)
  const activeId = active >= 0 ? optionId(results[active]) : undefined

  // Keep the active option visible in the scrolling list.
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeId])

  // Focus stays in the combobox the whole time. A press anywhere else in the palette (an option, a
  // group heading, the list's scrollbar, the title, the footer, the padding) would otherwise move
  // focus to the dialog itself, and typing and the arrow keys would stop reaching the combobox. The
  // Dialog renders the header and footer, so the guard listens on the dialog element as a whole.
  useEffect(() => {
    const input = inputRef.current
    const dialog = input?.closest<HTMLElement>('[role="dialog"]')
    if (!input || !dialog) return
    const keepFocusInInput = (event: MouseEvent): void => {
      if (!(event.target instanceof Element) || event.target.closest(OWN_FOCUS_TARGETS)) return
      event.preventDefault()
      input.focus()
    }
    dialog.addEventListener('mousedown', keepFocusInInput)
    return () => dialog.removeEventListener('mousedown', keepFocusInInput)
  }, [])

  useQueryAnnouncement(query, results.length === 0 ? 'No results' : pluralize(results.length, 'result'))

  const runItem = (item: PaletteItem): void => {
    // Close synchronously first: the app stops being inert and focus is back on
    // the control that opened the palette before the command moves focus
    // (Search) or opens another dialog, which then returns focus there too.
    flushSync(() => dispatch({ type: 'ui/closeModal' }))
    run(item.command)
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (event.nativeEvent.isComposing) return
    const count = results.length
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (count > 0) setActiveIndex((active + 1) % count)
        return
      case 'ArrowUp':
        event.preventDefault()
        if (count > 0) setActiveIndex((active - 1 + count) % count)
        return
      case 'Enter':
        // Always claimed: once the palette has closed, this same key press must
        // not reach the window shortcuts or activate the button focus returned to.
        event.preventDefault()
        if (active >= 0) runItem(results[active])
        return
    }
  }

  return (
    <Dialog
      title="Command palette"
      icon="command"
      onClose={onClose}
      size="medium"
      closeOnBackdrop
      initialFocusId={inputId}
      className="palette"
      footer={
        <>
          <p className="dialog__footer-note">Searching CareConnect · synthetic demo data only</p>
          {PALETTE_SHORTCUT && (
            <p className="palette__open-hint">
              Open anytime <Keycaps keys={shortcutKeys(PALETTE_SHORTCUT, platform)} />
              <VisuallyHidden>{describeShortcut(PALETTE_SHORTCUT, platform)}</VisuallyHidden>
            </p>
          )}
        </>
      }
    >
      <div className="palette__content">
        <div className="palette__search">
          <Icon name="search" className="palette__search-icon" />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            className="palette__input"
            aria-label="Search commands"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            aria-describedby={helperId}
            placeholder="Search commands, patients or destinations"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onKeyDown}
          />
          <span className="chip chip--neutral palette__scope" aria-hidden="true">
            All commands
          </span>
        </div>

        <div className="palette__meta">
          <p id={helperId} className="palette__helper">
            Type a command, patient label, or destination
          </p>
          <p className="palette__legend" aria-hidden="true">
            <kbd>{keyLabel('ArrowUp', platform)}</kbd>
            <kbd>{keyLabel('ArrowDown', platform)}</kbd> move · <kbd>{keyLabel('Enter', platform)}</kbd> open
          </p>
        </div>

        <div id={listboxId} role="listbox" aria-label="Commands" className="palette__results">
          {sections.map((section) => {
            const headingId = `${listboxId}-${section.id}`
            return (
              <div key={section.id} role="group" aria-labelledby={headingId} className="palette__group">
                <div id={headingId} className="palette__group-heading">
                  {section.title}
                </div>
                {section.items.map(({ item, index }) => {
                  const id = optionId(item)
                  const isActive = index === active
                  const spoken = spokenShortcut(item, platform)
                  return (
                    // Options are never focused: the combobox keeps focus and points at
                    // them with aria-activedescendant, so keys are handled on the input.
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                    <div
                      key={item.id}
                      id={id}
                      role="option"
                      tabIndex={-1}
                      aria-selected={isActive}
                      aria-posinset={index + 1}
                      aria-setsize={results.length}
                      aria-describedby={spoken ? `${id}-shortcut` : undefined}
                      className={`palette__option${isActive ? ' palette__option--active' : ''}`}
                      onMouseMove={() => {
                        if (!isActive) setActiveIndex(index)
                      }}
                      onClick={() => runItem(item)}
                    >
                      <Icon name={item.icon} className="palette__option-icon" />
                      {/* One exact spoken name; the visible text is hidden from screen readers rather than
                          overridden with aria-label (WCAG 2.5.3). */}
                      <span className="visually-hidden">{item.subtitle ? `${item.title}, ${item.subtitle}` : item.title}</span>
                      <span className="palette__option-text" aria-hidden="true">
                        <span className="palette__option-title">{item.title}</span>
                        {item.subtitle && <span className="palette__option-subtitle">{item.subtitle}</span>}
                      </span>
                      {item.keys && <Keycaps keys={item.keys} />}
                      {spoken && (
                        <span id={`${id}-shortcut`} className="visually-hidden" aria-hidden="true">
                          Shortcut: {spoken}
                        </span>
                      )}
                      {isActive && (
                        <span className="palette__position" aria-hidden="true">
                          {index + 1} of {results.length}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {results.length === 0 && <p className="palette__empty">No commands, patients or destinations match “{query.trim()}”.</p>}
      </div>
    </Dialog>
  )
}
