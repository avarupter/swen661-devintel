import { Fragment, useId, useMemo, useRef, useState } from 'react'
import { pluralize } from '../../../../shared/format'
import {
  chordKeys,
  describeShortcut,
  matchesChord,
  SHORTCUT_GROUPS,
  SHORTCUTS,
  shortcutForCommand,
  shortcutKeys,
  type KeyChord,
  type KeyPlatform,
  type ShortcutDefinition
} from '../../../../shared/shortcuts'
import { useApi } from '../../api/ApiContext'
import { Dialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { describeError, useAppState, useStatus } from '../../state/AppStateProvider'
import { useQueryAnnouncement } from '../palette/useQueryAnnouncement'
import './shortcuts.css'

const PLATFORM_COLUMNS: readonly { platform: KeyPlatform; title: string }[] = [
  { platform: 'windows', title: 'Windows / Linux' },
  { platform: 'mac', title: 'macOS' }
]

/** A shortcut's alternate chords that exist on this platform's keyboards: Macs have no Menu key. */
function alternatesFor(shortcut: ShortcutDefinition, platform: KeyPlatform): readonly KeyChord[] {
  const alternates = shortcut.alternates ?? []
  return platform === 'mac' ? alternates.filter((chord) => chord.key !== 'ContextMenu') : alternates
}

/** Every way to press a shortcut on one platform: the main keys, then any alternates. */
function keyOptions(shortcut: ShortcutDefinition, platform: KeyPlatform): string[][] {
  return [shortcutKeys(shortcut, platform), ...alternatesFor(shortcut, platform).map((chord) => chordKeys(chord, platform))]
}

/** "Ctrl+F or /", "G then P": what a screen reader hears for a keys cell. */
function spokenKeys(shortcut: ShortcutDefinition, platform: KeyPlatform): string {
  const alternates = alternatesFor(shortcut, platform).map((chord) => chordKeys(chord, platform).join('+'))
  return [describeShortcut(shortcut, platform), ...alternates].join(' or ')
}

function searchText(shortcut: ShortcutDefinition): string {
  return [shortcut.label, ...PLATFORM_COLUMNS.map((column) => spokenKeys(shortcut, column.platform))].join(' ').toLowerCase()
}

function Keycaps({ keys }: { keys: readonly string[] }): React.JSX.Element {
  return (
    <span className="shortcuts__caps">
      {keys.map((key, index) => (
        <kbd key={`${key}-${index}`}>{key}</kbd>
      ))}
    </span>
  )
}

function KeysCell({ shortcut, platform, current }: { shortcut: ShortcutDefinition; platform: KeyPlatform; current: boolean }): React.JSX.Element {
  return (
    <td className={current ? 'shortcuts__keys shortcuts__current' : 'shortcuts__keys'}>
      <span className="shortcuts__key-list" aria-hidden="true">
        {keyOptions(shortcut, platform).map((keys, index) => (
          <Fragment key={index}>
            {index > 0 && <span className="shortcuts__or">or</span>}
            <Keycaps keys={keys} />
          </Fragment>
        ))}
      </span>
      <span className="visually-hidden">{spokenKeys(shortcut, platform)}</span>
    </td>
  )
}

function legendKeys(command: 'app.commandPalette' | 'navigate.patients', platform: KeyPlatform): string[] {
  const shortcut = shortcutForCommand(command)
  return shortcut ? shortcutKeys(shortcut, platform) : []
}

/**
 * Keyboard shortcuts reference (design image 4, Ctrl+/): one table per
 * group with Windows / Linux and macOS keycaps, read from the same table the
 * menu and the key handler use. A filter narrows the rows; Ctrl+F (⌘F) jumps
 * back to it from anywhere in the dialog.
 */
export function ShortcutsDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const { ui } = useAppState()
  const api = useApi()
  const setStatus = useStatus()
  const platform = ui.platform
  const filterId = useId()
  const filterRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  const needle = query.trim().toLowerCase()
  const groups = useMemo(
    () =>
      SHORTCUT_GROUPS.map((group) => ({
        ...group,
        rows: SHORTCUTS.filter((shortcut) => shortcut.group === group.id && (!needle || searchText(shortcut).includes(needle)))
      })).filter((group) => group.rows.length > 0),
    [needle]
  )
  const count = groups.reduce((total, group) => total + group.rows.length, 0)
  useQueryAnnouncement(query, count === 0 ? 'No shortcuts' : pluralize(count, 'shortcut'))

  const onKeyDown = (event: KeyboardEvent): void => {
    if (matchesChord(event, { key: 'f', mod: true }, platform)) {
      event.preventDefault()
      filterRef.current?.focus()
      filterRef.current?.select()
    }
  }

  const print = async (): Promise<void> => {
    try {
      await api.printPage()
    } catch (error) {
      setStatus(`Couldn’t print the shortcuts reference: ${describeError(error)}`, 'error')
    }
  }

  return (
    <Dialog
      title="Keyboard shortcuts"
      icon="keyboard"
      onClose={onClose}
      size="large"
      className="shortcuts"
      onKeyDown={onKeyDown}
      footer={
        <>
          <p className="dialog__footer-note">
            Browser or assistive technology shortcuts take priority. CareConnect does not override reserved key combinations.
          </p>
          <button type="button" className="button" onClick={() => void print()}>
            <Icon name="printer" />
            Print reference
          </button>
        </>
      }
    >
      <div className="shortcuts__intro">
        <ul className="shortcuts__legend">
          <li>
            <Keycaps keys={legendKeys('app.commandPalette', platform)} />
            <span>Press together</span>
          </li>
          <li>
            <Keycaps keys={legendKeys('navigate.patients', platform)} />
            <span>Press in sequence</span>
          </li>
        </ul>
        <div className="field shortcuts__filter">
          <label htmlFor={filterId} className="field__label">
            Find a command
          </label>
          <input
            ref={filterRef}
            id={filterId}
            type="search"
            className="input"
            placeholder="Action or key"
            autoComplete="off"
            spellCheck={false}
            aria-keyshortcuts={platform === 'mac' ? 'Meta+F' : 'Control+F'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="shortcuts__empty">No shortcuts match “{query.trim()}”.</p>
      ) : (
        <div className="shortcuts__tables">
          {groups.map((group) => (
            <table key={group.id} className="data-table shortcuts__table">
              <caption>
                <h3 className="shortcuts__group-title">{group.title}</h3>
                <p className="shortcuts__group-description">{group.description}</p>
              </caption>
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  {PLATFORM_COLUMNS.map((column) => (
                    <th key={column.platform} scope="col" className={column.platform === platform ? 'shortcuts__current' : undefined}>
                      {column.title}
                      {column.platform === platform ? ' (this computer)' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.rows.map((shortcut) => (
                  <tr key={shortcut.id}>
                    <th scope="row">
                      {shortcut.label}
                      {shortcut.sequence && (
                        <>
                          {' '}
                          <span className="chip chip--neutral shortcuts__badge">Sequence</span>
                        </>
                      )}
                    </th>
                    {PLATFORM_COLUMNS.map((column) => (
                      <KeysCell key={column.platform} shortcut={shortcut} platform={column.platform} current={column.platform === platform} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      )}
    </Dialog>
  )
}
