import { useId } from 'react'
import { VIEW_LABELS, viewForCommand, type CommandId } from '../../../../shared/commands'
import { RESOURCE_LINKS } from '../../../../shared/links'
import {
  ariaKeyShortcuts,
  describeShortcut,
  matchesChord,
  menuOwnsChord,
  SHORTCUTS,
  shortcutForCommand,
  shortcutKeys,
  type KeyPlatform
} from '../../../../shared/shortcuts'
import { useApi } from '../../api/ApiContext'
import { VisuallyHidden } from '../../a11y/VisuallyHidden'
import { useCommandHandler, useCommands } from '../../commands/CommandProvider'
import { Dialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { KeyHint } from '../../components/KeyHint'
import { describeError, useAppState, useStatus } from '../../state/AppStateProvider'
import './help.css'

const SEQUENCES = SHORTCUTS.filter((shortcut) => shortcut.sequence && shortcut.command)
const ACCESSIBILITY_LINKS = RESOURCE_LINKS.filter((link) => link.category === 'Accessibility')
const SHORTCUTS_CHORD = shortcutForCommand('app.shortcuts')?.chord

/** "F6", "Ctrl+K", "Fn+F6" for a command's shortcut on this platform. */
function keysFor(command: CommandId, platform: KeyPlatform): string {
  const shortcut = shortcutForCommand(command)
  return shortcut ? describeShortcut(shortcut, platform) : ''
}

/** Keycaps for display only; the text beside them says the same for screen readers. */
function Keycaps({ keys }: { keys: readonly string[] }): React.JSX.Element {
  return (
    <span className="help__caps" aria-hidden="true">
      {keys.map((key, index) => (
        <kbd key={`${key}-${index}`}>{key}</kbd>
      ))}
    </span>
  )
}

/**
 * CareConnect help (F1): how to get around with the keyboard, how to use the
 * app with NVDA or Narrator, where status and errors appear, and links to
 * accessibility resources. Focus starts on the first heading so a screen
 * reader reads the help from the top.
 */
export function HelpDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const { ui } = useAppState()
  const api = useApi()
  const setStatus = useStatus()
  const { openModal } = useCommands()
  const platform = ui.platform
  const id = useId()
  const firstHeadingId = `${id}-getting-around`

  const openLink = async (url: string): Promise<void> => {
    try {
      const opened = await api.openExternal(url)
      if (!opened) setStatus('That link can’t be opened.', 'warning')
    } catch (error) {
      setStatus(`Couldn’t open the link: ${describeError(error)}`, 'error')
    }
  }

  // Help hands over to the keyboard shortcuts, keeping the original opener for focus return.
  const openShortcuts = (): void => openModal({ kind: 'shortcuts' })

  // The shortcut shown on the "Open keyboard shortcuts" button works here too. While a dialog is open
  // the app's key handler stands aside and the default command refuses to replace a dialog, so Help
  // takes both paths itself: the native menu's Keyboard Shortcuts item (which, on macOS, ⌘/ triggers)...
  useCommandHandler('app.shortcuts', openShortcuts)

  // ...and the key press on Windows and Linux. Where the menu owns the chord, it arrives as that command.
  const onKeyDown = (event: KeyboardEvent): void => {
    if (!SHORTCUTS_CHORD || menuOwnsChord(SHORTCUTS_CHORD, platform) || !matchesChord(event, SHORTCUTS_CHORD, platform)) return
    event.preventDefault()
    openShortcuts()
  }

  return (
    <Dialog
      title="CareConnect help"
      icon="help"
      onClose={onClose}
      size="medium"
      initialFocusId={firstHeadingId}
      className="help"
      onKeyDown={onKeyDown}
    >
      <section className="help__section">
        <h3 id={firstHeadingId} className="help__heading" tabIndex={-1}>
          Getting around
        </h3>
        <p>
          Press {keysFor('region.next', platform)} to move between the regions of the window, and {keysFor('region.previous', platform)} to go back.
          Each region remembers where you were. On the Patients view the order is:
        </p>
        <ol className="help__list" aria-label="Regions in F6 order">
          <li>Navigation: the sidebar with every destination</li>
          <li>Toolbar: the actions for the current view</li>
          <li>Patient list: the patients, with search above them (the conversation list in Inbox)</li>
          <li>Detail pane: the selected patient’s care summary and recent activity</li>
          <li>Status: messages, saving and keyboard help</li>
        </ol>
        <p>Other views have Navigation, Toolbar, Main and Status.</p>
        <p>
          The first Tab stops in the window are skip links: “Skip to main workspace”, “Skip to patient list” on the Patients view, and “Skip to
          status”.
        </p>
        <p>Go to a view by pressing G and then a letter:</p>
        <ul className="help__list help__keys" aria-label="Go to a view">
          {SEQUENCES.map((shortcut) => {
            const view = shortcut.command ? viewForCommand(shortcut.command) : null
            return (
              <li key={shortcut.id}>
                <Keycaps keys={shortcutKeys(shortcut, platform)} />
                <VisuallyHidden>{describeShortcut(shortcut, platform)}: </VisuallyHidden>
                {view ? VIEW_LABELS[view] : shortcut.label}
              </li>
            )
          })}
        </ul>
        <p>
          Press {keysFor('app.commandPalette', platform)} for the command palette: type a command, a patient’s name or Care ID, or a destination,
          choose with the Up and Down arrow keys, and press Enter.
        </p>
      </section>

      <section className="help__section">
        <h3 className="help__heading">Using a screen reader</h3>
        <p>CareConnect is tested with NVDA on Windows 11, and also with Narrator. Every area of the window is a named landmark:</p>
        <ul className="help__list" aria-label="Landmarks">
          <li>Workspace (navigation): destinations, keyboard mode and settings</li>
          <li>Banner: the view title and its toolbar</li>
          <li>Main: the current view</li>
          <li>Recent patients (region): the patient list, on the Patients view</li>
          <li>Patient list (search): the patient search, on the Patients view</li>
          <li>Care summary (region): the selected patient’s alert and current plan</li>
          <li>Recent activity (complementary): the selected patient’s latest activity</li>
          <li>Status (content information): messages, saving and keyboard help</li>
        </ul>
        <p>
          In NVDA browse mode, press D and Shift+D to move between landmarks, and H to move between headings. The patient list is a list box:
          move to it and press Enter, or Tab into it, and NVDA switches to focus mode. Then the Up and Down arrow keys move through patients,
          Home and End jump to the first and last, and the care summary follows your selection.
        </p>
        <p className="callout help__tip">
          <Icon name="info" />
          <span>
            <strong className="callout__title">Tip: </strong>
            if the arrow keys read the page instead of moving through the list, press Insert+Space to switch NVDA to focus mode. Press it again
            to go back to browse mode.
          </span>
        </p>
        <p>
          With Narrator, press Caps Lock+Space to turn scan mode on or off. In scan mode, D and H move by landmark and by heading, as in NVDA.
        </p>
      </section>

      <section className="help__section">
        <h3 className="help__heading">Status and errors</h3>
        <p>
          Messages such as “Note added for Avery Park.” appear in the status bar at the bottom of the window. They stay until you dismiss them
          or a new message replaces them. Screen readers announce confirmations politely and problems straight away.
        </p>
        <p>Status is never shown by colour alone: each status pairs an icon with a word, such as Needs review, Open or Completed.</p>
        <p>
          When a form has problems, focus moves to a summary at its top that lists each one. Choose an item in the summary to go to the field
          to fix. Nothing you typed is lost.
        </p>
        <p>The status bar also counts unsaved changes and shows when your work was last saved. If saving fails, a Retry save button appears.</p>
      </section>

      <section className="help__section">
        <h3 className="help__heading">Keyboard shortcuts</h3>
        <p>Every shortcut, with its Windows / Linux and macOS keys, on one page you can filter and print.</p>
        <button type="button" className="button help__shortcuts" aria-keyshortcuts={ariaKeyShortcuts('app.shortcuts', platform)} onClick={openShortcuts}>
          <Icon name="keyboard" />
          Open keyboard shortcuts
          <KeyHint command="app.shortcuts" />
        </button>
      </section>

      <section className="help__section">
        <h3 className="help__heading">Accessibility resources</h3>
        <ul className="help__resources">
          {ACCESSIBILITY_LINKS.map((link) => {
            const descriptionId = `${id}-${link.id}`
            return (
              <li key={link.id}>
                <button type="button" className="link-button help__resource" aria-describedby={descriptionId} onClick={() => void openLink(link.url)}>
                  {link.title}
                  <VisuallyHidden>{' (opens in your browser)'}</VisuallyHidden>
                  <Icon name="external" />
                </button>
                <p id={descriptionId} className="field__hint">
                  {link.description}
                </p>
              </li>
            )
          })}
        </ul>
      </section>
    </Dialog>
  )
}
