import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { createMemoryApi } from '../../../../../tests/renderer/memoryApi'
import { COMMAND_IDS, VIEW_IDS, type AppCommand, type CommandId, type ViewId } from '../../../../shared/commands'
import { SHORTCUTS, type KeyChord, type KeyPlatform, type ShortcutDefinition } from '../../../../shared/shortcuts'
import { useSearchTarget } from '../../commands/CommandProvider'
import { renderHarness, type Harness, type HarnessOptions } from '../../state/__tests__/harness'
import { findGlobalShortcut, findScopedCommand, findSequenceCommand, SEQUENCE_TIMEOUT_MS } from '../useKeyboardShortcuts'

/** A miniature workspace: the regions, the view title, a registered search field and some typing targets. */
function Workspace(): React.JSX.Element {
  return (
    <>
      <h1 id="view-title" tabIndex={-1}>
        View title
      </h1>
      <nav aria-label="Workspace" data-region="navigation">
        <button type="button">Overview</button>
      </nav>
      <div role="toolbar" aria-label="Tools" data-region="toolbar">
        <button type="button" id="toolbar-patient.filter">
          Filter
        </button>
      </div>
      <section aria-label="Recent patients" data-region="list">
        <input id="patient-search" type="search" aria-label="Search list" ref={useSearchTarget()} />
        <button type="button">Avery Park</button>
      </section>
      <section aria-label="Avery Park" data-region="detail">
        <button type="button">Message Avery Park</button>
      </section>
      <footer aria-label="Status" data-region="status">
        <button type="button">Keyboard help</button>
      </footer>
      <input type="text" aria-label="Note title" />
      <textarea aria-label="Note" />
      <select aria-label="Note type">
        <option>Visit note</option>
      </select>
      <input type="checkbox" aria-label="Clear the follow-up alert" />
      <button type="button" onKeyDown={(event) => event.preventDefault()}>
        Handles its own keys
      </button>
    </>
  )
}

async function renderWorkspace(options: HarnessOptions = {}): Promise<Harness> {
  const h = await renderHarness(<Workspace />, { keyboard: true, ...options })
  const platform = options.api?.appInfo.platform === 'darwin' ? 'mac' : 'windows'
  await waitFor(() => expect(h.state().ui.platform).toBe(platform))
  return h
}

/** Records every command instead of running it, so state never changes between presses. */
function recordCommands(h: Harness): AppCommand[] {
  const ran: AppCommand[] = []
  for (const id of COMMAND_IDS) h.commands().register(id, (command) => void ran.push(command))
  return ran
}

type KeyPress = { key: string; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean }

function chordPress(chord: KeyChord, platform: KeyPlatform): KeyPress {
  const shifted = Boolean(chord.shift) && /^[a-z]$/.test(chord.key)
  return {
    key: shifted ? chord.key.toUpperCase() : chord.key,
    ctrlKey: Boolean(chord.mod) && platform === 'windows',
    metaKey: Boolean(chord.mod) && platform === 'mac',
    shiftKey: Boolean(chord.shift),
    altKey: Boolean(chord.alt)
  }
}

/** Every way to trigger a shortcut: its chord, each alternate, or its sequence. */
function triggers(shortcut: ShortcutDefinition, platform: KeyPlatform): { chord?: KeyChord; presses: KeyPress[] }[] {
  if (shortcut.sequence) return [{ presses: shortcut.sequence.map((key) => ({ key })) }]
  const chords = shortcut.chord ? [shortcut.chord, ...(shortcut.alternates ?? [])] : []
  return chords.map((chord) => ({ chord, presses: [chordPress(chord, platform)] }))
}

/** Presses a key at the focused element (or the body); returns false when the app called preventDefault. */
function press(keyPress: KeyPress, target: Element = document.activeElement ?? document.body): boolean {
  return fireEvent.keyDown(target, keyPress)
}

function pressAll(presses: KeyPress[], target?: Element): boolean[] {
  return presses.map((keyPress) => press(keyPress, target))
}

/**
 * What the design says a shortcut does at the window level (design section 8):
 * global shortcuts work everywhere, patients/inbox ones only in their view,
 * compose ones only inside the compose dialog, system entries are the OS's or
 * the DOM's, and on macOS the menu owns modifier chords and function keys.
 */
function expectedCommand(shortcut: ShortcutDefinition, chord: KeyChord | undefined, view: ViewId, platform: KeyPlatform): CommandId | null {
  if (!shortcut.command || shortcut.scope === 'system' || shortcut.scope === 'compose') return null
  if (shortcut.scope === 'patients' && view !== 'patients') return null
  if (shortcut.scope === 'inbox' && view !== 'inbox') return null
  if (chord && platform === 'mac' && (chord.mod || /^F\d{1,2}$/.test(chord.key))) return null
  return shortcut.command
}

describe('every shortcut, in every view, on both platforms', () => {
  describe.each<KeyPlatform>(['windows', 'mac'])('on %s', (platform) => {
    it.each(VIEW_IDS)('in %s, each key runs exactly the command the design gives it', async (view) => {
      const h = await renderWorkspace({ initialUi: { view }, api: createMemoryApi({ platform: platform === 'mac' ? 'darwin' : 'win32' }) })
      const ran = recordCommands(h)
      for (const shortcut of SHORTCUTS) {
        for (const { chord, presses } of triggers(shortcut, platform)) {
          ran.length = 0
          const results = pressAll(presses)
          const expected = expectedCommand(shortcut, chord, view, platform)
          expect({ shortcut: shortcut.id, presses, ran }).toEqual({ shortcut: shortcut.id, presses, ran: expected ? [{ id: expected }] : [] })
          // A handled key never reaches the browser (no find bar, no typed "/", no browser help).
          if (expected) expect(results[results.length - 1]).toBe(false)
        }
      }
      expect(h.state().ui.pendingSequence).toBeNull()
    })
  })
})

interface EffectCase {
  /** The view to press the keys in. */
  view: ViewId
  /** Optional setup, e.g. moving focus. */
  arrange?(h: Harness): void
  assert(h: Harness, prevented: boolean): void | Promise<void>
}

const navigatesTo = (view: ViewId, from: ViewId = 'patients'): EffectCase => ({
  view: from,
  async assert(h, prevented) {
    expect(prevented).toBe(true)
    expect(h.state().ui.view).toBe(view)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'View title' })).toHaveFocus())
  }
})

const opens = (modal: unknown, view: ViewId = 'patients'): EffectCase => ({
  view,
  assert(h, prevented) {
    expect(prevented).toBe(true)
    expect(h.state().ui.modal).toEqual(modal)
  }
})

/** Shortcuts that belong to the compose dialog: the window ignores them; findScopedCommand finds them. */
const composeOnly = (command: CommandId): EffectCase => ({
  view: 'inbox',
  assert(h, prevented) {
    expect(prevented).toBe(false)
    expect(h.state().ui.status).toBeNull()
    expect(h.state().ui.modal).toBeNull()
    const shortcut = SHORTCUTS.find((entry) => entry.command === command) as ShortcutDefinition
    expect(findScopedCommand(chordPress(shortcut.chord as KeyChord, 'windows') as Required<KeyPress>, 'compose', 'windows')).toBe(command)
  }
})

const ignoredAtWindowLevel: EffectCase = {
  view: 'patients',
  assert(h, prevented) {
    expect(prevented).toBe(false)
    expect(h.state().ui.modal).toBeNull()
    expect(h.state().ui.status).toBeNull()
    expect(h.api.showContextMenu).not.toHaveBeenCalled()
  }
}

/** The observable effect of each shortcut through the default command handlers (Windows keys). */
const EFFECTS: Record<string, EffectCase> = {
  'open-overview': navigatesTo('overview'),
  'open-schedule': navigatesTo('schedule'),
  'open-patients': navigatesTo('patients', 'overview'),
  'open-inbox': navigatesTo('inbox'),
  'open-tasks': navigatesTo('tasks'),
  'next-region': {
    view: 'patients',
    arrange: () => screen.getByRole('button', { name: 'Overview' }).focus(),
    assert: (_h, prevented) => {
      expect(prevented).toBe(true)
      expect(screen.getByRole('button', { name: 'Filter' })).toHaveFocus()
    }
  },
  'previous-region': {
    view: 'patients',
    arrange: () => screen.getByRole('button', { name: 'Overview' }).focus(),
    assert: (_h, prevented) => {
      expect(prevented).toBe(true)
      expect(screen.getByRole('button', { name: 'Keyboard help' })).toHaveFocus()
    }
  },
  'create-patient': opens({ kind: 'newPatient' }, 'overview'),
  'search-list': {
    view: 'patients',
    assert: (_h, prevented) => {
      expect(prevented).toBe(true)
      expect(screen.getByRole('searchbox', { name: 'Search list' })).toHaveFocus()
    }
  },
  'filter-list': {
    view: 'patients',
    async assert(h, prevented) {
      expect(prevented).toBe(true)
      expect(h.state().ui.view).toBe('patients')
      await waitFor(() => expect(screen.getByRole('button', { name: 'Filter' })).toHaveFocus())
    }
  },
  'edit-summary': opens({ kind: 'editSummary', patientId: 'p-avery-park' }),
  'add-note': opens({ kind: 'addNote', patientId: 'p-avery-park' }),
  'message-patient': opens({ kind: 'compose', patientId: 'p-avery-park', conversationId: 'c-home-monitoring', draftId: null }),
  'export-summary': {
    view: 'patients',
    async assert(h, prevented) {
      expect(prevented).toBe(true)
      await waitFor(() => expect(h.api.exportPatient).toHaveBeenCalledTimes(1))
      expect(h.api.exportPatient.mock.calls[0][0]).toMatchObject({ patient: { id: 'p-avery-park' }, format: 'txt' })
    }
  },
  // Chromium turns Shift+F10 and the Menu key into a `contextmenu` event, which the patient list handles.
  'context-menu': ignoredAtWindowLevel,
  'new-message': opens({ kind: 'compose', patientId: null, conversationId: null, draftId: null }, 'schedule'),
  reply: {
    view: 'inbox',
    assert(h, prevented) {
      expect(prevented).toBe(true)
      expect(h.state().ui.view).toBe('inbox')
      expect(h.state().ui.status?.text).toBe('Choose a conversation, then press R to reply.')
    }
  },
  'send-message': composeOnly('message.send'),
  'save-draft': composeOnly('message.saveDraft'),
  'attach-document': composeOnly('message.attach'),
  'command-palette': opens({ kind: 'palette' }, 'tasks'),
  'keyboard-shortcuts': opens({ kind: 'shortcuts' }, 'reports'),
  'show-access-keys': {
    view: 'patients',
    assert(h) {
      expect(h.state().ui.revealHints).toBe(true)
      fireEvent.keyUp(document.body, { key: 'Alt' })
      expect(h.state().ui.revealHints).toBe(false)
    }
  },
  // Esc belongs to the open layer (Dialog); with nothing open the window does nothing.
  'close-layer': ignoredAtWindowLevel,
  'open-help': opens({ kind: 'help' }, 'resources'),
  'open-settings': opens({ kind: 'settings' }, 'inbox')
}

describe('what each shortcut does', () => {
  it('has an expected effect for every entry in SHORTCUTS', () => {
    expect(Object.keys(EFFECTS).sort()).toEqual(SHORTCUTS.map((shortcut) => shortcut.id).sort())
  })

  it.each(SHORTCUTS.map((shortcut) => [shortcut.id, shortcut] as const))('%s', async (id, shortcut) => {
    const effect = EFFECTS[id]
    const h = await renderWorkspace({ initialUi: { view: effect.view } })
    for (const { presses } of triggers(shortcut, 'windows')) {
      // Each trigger (chord, then each alternate) starts from the same place.
      ;(document.activeElement as HTMLElement | null)?.blur()
      h.dispatch({ type: 'ui/closeModal' })
      effect.arrange?.(h)
      const results = pressAll(presses)
      await effect.assert(h, results[results.length - 1] === false)
    }
  })
})

describe('typing', () => {
  const singleKeys: KeyPress[] = [{ key: 'e' }, { key: 'n' }, { key: 'm' }, { key: '/' }, { key: 'r' }]

  it.each(['Note title', 'Note', 'Note type', 'Search list'])('ignores single-key shortcuts and sequences while typing in "%s"', async (label) => {
    const h = await renderWorkspace({ initialUi: { view: 'patients' } })
    const ran = recordCommands(h)
    const field = screen.getByLabelText(label)
    field.focus()
    for (const keyPress of singleKeys) expect(press(keyPress)).toBe(true)
    expect(pressAll([{ key: 'g' }, { key: 'p' }])).toEqual([true, true])
    expect(ran).toEqual([])
    expect(h.state().ui.pendingSequence).toBeNull()
  })

  it('still runs modifier and function-key shortcuts from a text field', async () => {
    const h = await renderWorkspace({ initialUi: { view: 'patients' } })
    const ran = recordCommands(h)
    screen.getByLabelText('Note title').focus()
    expect(press({ key: 'k', ctrlKey: true })).toBe(false)
    expect(press({ key: 'F6' })).toBe(false)
    expect(press({ key: 'F1' })).toBe(false)
    expect(press({ key: 'E', ctrlKey: true, shiftKey: true })).toBe(false)
    expect(ran.map((command) => command.id)).toEqual(['app.commandPalette', 'region.next', 'app.help', 'patient.export'])
  })

  it('runs single-key shortcuts from non-text controls such as checkboxes and buttons', async () => {
    const h = await renderWorkspace({ initialUi: { view: 'patients' } })
    const ran = recordCommands(h)
    screen.getByRole('checkbox', { name: 'Clear the follow-up alert' }).focus()
    press({ key: 'n' })
    screen.getByRole('button', { name: 'Avery Park' }).focus()
    press({ key: 'e' })
    expect(ran.map((command) => command.id)).toEqual(['patient.addNote', 'patient.editSummary'])
  })

  it('leaves keys alone when a control already handled them, or while an IME is composing', async () => {
    const h = await renderWorkspace({ initialUi: { view: 'patients' } })
    const ran = recordCommands(h)
    press({ key: 'k', ctrlKey: true }, screen.getByRole('button', { name: 'Handles its own keys' }))
    fireEvent.keyDown(document.body, { key: 'e', isComposing: true })
    expect(ran).toEqual([])
  })
})

describe('modals own the keyboard', () => {
  it('runs nothing and prevents nothing while a dialog is open', async () => {
    const h = await renderWorkspace({ initialUi: { view: 'patients', modal: { kind: 'help' } } })
    const ran = recordCommands(h)
    for (const shortcut of SHORTCUTS) {
      for (const { presses } of triggers(shortcut, 'windows')) {
        if (presses[0].key === 'Alt') continue
        expect({ shortcut: shortcut.id, prevented: pressAll(presses).includes(false) }).toEqual({ shortcut: shortcut.id, prevented: false })
      }
    }
    expect(ran).toEqual([])
    expect(h.state().ui.pendingSequence).toBeNull()
  })

  it('does not reveal hints while a dialog is open', async () => {
    const h = await renderWorkspace({ initialUi: { modal: { kind: 'palette' } } })
    press({ key: 'Alt', altKey: true })
    expect(h.state().ui.revealHints).toBe(false)
  })

  it('drops a pending sequence when a dialog opens before the second key', async () => {
    const h = await renderWorkspace({ initialUi: { view: 'patients' } })
    press({ key: 'g' })
    expect(h.state().ui.pendingSequence).toBe('g')
    h.dispatch({ type: 'ui/openModal', modal: { kind: 'help' } })
    press({ key: 'o' })
    expect(h.state().ui.view).toBe('patients')
  })
})

describe('G-sequences', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it.each<[string, ViewId]>([
    ['o', 'overview'],
    ['s', 'schedule'],
    ['p', 'patients'],
    ['i', 'inbox'],
    ['t', 'tasks']
  ])('G then %s opens %s', async (key, view) => {
    const h = await renderWorkspace({ initialUi: { view: view === 'tasks' ? 'inbox' : 'tasks' } })
    expect(press({ key: 'g' })).toBe(false)
    expect(h.state().ui.pendingSequence).toBe('g')
    expect(press({ key })).toBe(false)
    expect(h.state().ui.view).toBe(view)
    expect(h.state().ui.pendingSequence).toBeNull()
  })

  it('waits up to 1.5 seconds for the second key, then gives up', async () => {
    jest.useFakeTimers()
    const h = await renderWorkspace({ initialUi: { view: 'tasks' } })
    expect(SEQUENCE_TIMEOUT_MS).toBe(1500)

    press({ key: 'g' })
    act(() => jest.advanceTimersByTime(SEQUENCE_TIMEOUT_MS - 1))
    expect(h.state().ui.pendingSequence).toBe('g')
    press({ key: 'p' })
    expect(h.state().ui.view).toBe('patients')

    press({ key: 'g' })
    act(() => jest.advanceTimersByTime(SEQUENCE_TIMEOUT_MS))
    expect(h.state().ui.pendingSequence).toBeNull()
    expect(press({ key: 'i' })).toBe(true)
    expect(h.state().ui.view).toBe('patients')
  })

  it('restarts the timer when G is pressed again', async () => {
    jest.useFakeTimers()
    const h = await renderWorkspace({ initialUi: { view: 'tasks' } })
    press({ key: 'g' })
    act(() => jest.advanceTimersByTime(1000))
    press({ key: 'g' })
    act(() => jest.advanceTimersByTime(1000))
    expect(h.state().ui.pendingSequence).toBe('g')
    press({ key: 'i' })
    expect(h.state().ui.view).toBe('inbox')
  })

  it('abandons the sequence on any other key, which then acts normally', async () => {
    const h = await renderWorkspace({ initialUi: { view: 'patients' } })
    const ran = recordCommands(h)
    press({ key: 'g' })
    press({ key: 'x' })
    expect(h.state().ui.pendingSequence).toBeNull()
    press({ key: 'g' })
    press({ key: 'P', shiftKey: true })
    press({ key: 'g' })
    press({ key: 'p', ctrlKey: true })
    expect(ran).toEqual([])
    press({ key: 'g' })
    press({ key: 'e' })
    expect(ran).toEqual([{ id: 'patient.editSummary' }])
  })

  it('only starts on a plain G', async () => {
    const h = await renderWorkspace({ initialUi: { view: 'patients' } })
    for (const keyPress of [
      { key: 'g', ctrlKey: true },
      { key: 'g', altKey: true },
      { key: 'g', metaKey: true },
      { key: 'G', shiftKey: true }
    ]) {
      press(keyPress)
      expect(h.state().ui.pendingSequence).toBeNull()
    }
    screen.getByLabelText('Note title').focus()
    press({ key: 'g' })
    expect(h.state().ui.pendingSequence).toBeNull()
  })

  it('shows the pending key in state for the status bar hint', async () => {
    const h = await renderWorkspace()
    press({ key: 'g' })
    expect(h.state().ui.pendingSequence).toBe('g')
  })
})

describe('Alt shows access keys and shortcut hints', () => {
  it('reveals hints while Alt is held, and hides them on release or when the window loses focus', async () => {
    const h = await renderWorkspace()
    press({ key: 'Alt', altKey: true })
    expect(h.state().ui.revealHints).toBe(true)
    fireEvent.keyUp(document.body, { key: 'Alt' })
    expect(h.state().ui.revealHints).toBe(false)

    press({ key: 'Alt', altKey: true })
    press({ key: 'Alt', altKey: true, repeat: true } as KeyPress)
    expect(h.state().ui.revealHints).toBe(true)
    fireEvent.keyUp(document.body, { key: 'Shift' })
    expect(h.state().ui.revealHints).toBe(true)
    fireEvent.blur(window)
    expect(h.state().ui.revealHints).toBe(false)
  })
})

describe('macOS', () => {
  it('leaves modifier chords and function keys to the native menu, which registers them there', async () => {
    const h = await renderWorkspace({ api: createMemoryApi({ platform: 'darwin' }), initialUi: { view: 'patients' } })
    const ran = recordCommands(h)
    expect(press({ key: 'k', metaKey: true })).toBe(true)
    expect(press({ key: 'F1' })).toBe(true)
    expect(press({ key: 'F6', shiftKey: true })).toBe(true)
    expect(ran).toEqual([])
    expect(press({ key: 'e' })).toBe(false)
    expect(pressAll([{ key: 'g' }, { key: 'i' }])).toEqual([false, false])
    expect(ran).toEqual([{ id: 'patient.editSummary' }, { id: 'navigate.inbox' }])
  })

  it('does not treat Ctrl as the command key on macOS', async () => {
    const h = await renderWorkspace({ api: createMemoryApi({ platform: 'darwin' }) })
    const ran = recordCommands(h)
    press({ key: 'k', ctrlKey: true })
    press({ key: 'e', ctrlKey: true })
    expect(ran).toEqual([])
  })
})

describe('reserved combinations', () => {
  it.each<[string, KeyPress]>([
    ['Ctrl+C', { key: 'c', ctrlKey: true }],
    ['Ctrl+V', { key: 'v', ctrlKey: true }],
    ['Ctrl+X', { key: 'x', ctrlKey: true }],
    ['Ctrl+Z', { key: 'z', ctrlKey: true }],
    ['Ctrl+A', { key: 'a', ctrlKey: true }],
    ['Alt+F', { key: 'f', altKey: true }],
    ['Alt+H', { key: 'h', altKey: true }],
    ['F10', { key: 'F10' }],
    ['F5', { key: 'F5' }],
    ['Tab', { key: 'Tab' }],
    ['Enter', { key: 'Enter' }],
    ['Space', { key: ' ' }]
  ])('never overrides %s', async (_name, keyPress) => {
    const h = await renderWorkspace({ initialUi: { view: 'patients' } })
    const ran = recordCommands(h)
    expect(press(keyPress)).toBe(true)
    expect(ran).toEqual([])
  })
})

describe('the hook’s lifetime', () => {
  it('removes its window listeners when unmounted', async () => {
    const remove = jest.spyOn(window, 'removeEventListener')
    const h = await renderWorkspace()
    h.unmount()
    const removed = remove.mock.calls.map(([type]) => type)
    expect(removed).toEqual(expect.arrayContaining(['keydown', 'keyup', 'blur']))
    remove.mockRestore()
  })
})

describe('lookup helpers', () => {
  const event = (key: string, mods: Partial<KeyPress> = {}) => ({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...mods })

  it('findGlobalShortcut respects view scope, system entries and typing', () => {
    expect(findGlobalShortcut(event('e'), 'patients', 'windows', false)?.command).toBe('patient.editSummary')
    expect(findGlobalShortcut(event('e'), 'inbox', 'windows', false)).toBeUndefined()
    expect(findGlobalShortcut(event('r'), 'inbox', 'windows', false)?.command).toBe('message.reply')
    expect(findGlobalShortcut(event('r'), 'patients', 'windows', false)).toBeUndefined()
    expect(findGlobalShortcut(event('e'), 'patients', 'windows', true)).toBeUndefined()
    expect(findGlobalShortcut(event('/'), 'patients', 'windows', false)?.command).toBe('patient.search')
    expect(findGlobalShortcut(event('k', { ctrlKey: true }), 'patients', 'windows', true)?.command).toBe('app.commandPalette')
    expect(findGlobalShortcut(event('F10', { shiftKey: true }), 'patients', 'windows', false)).toBeUndefined()
    expect(findGlobalShortcut(event('Escape'), 'patients', 'windows', false)).toBeUndefined()
    expect(findGlobalShortcut(event('s', { ctrlKey: true }), 'patients', 'windows', false)).toBeUndefined()
  })

  it('findScopedCommand finds compose shortcuts, and leaves them to the macOS menu', () => {
    expect(findScopedCommand(event('Enter', { ctrlKey: true }), 'compose', 'windows')).toBe('message.send')
    expect(findScopedCommand(event('s', { ctrlKey: true }), 'compose', 'windows')).toBe('message.saveDraft')
    expect(findScopedCommand(event('A', { ctrlKey: true, shiftKey: true }), 'compose', 'windows')).toBe('message.attach')
    expect(findScopedCommand(event('Enter'), 'compose', 'windows')).toBeUndefined()
    expect(findScopedCommand(event('k', { ctrlKey: true }), 'compose', 'windows')).toBeUndefined()
    expect(findScopedCommand(event('Enter', { metaKey: true }), 'compose', 'mac')).toBeUndefined()
    expect(findScopedCommand(event('e'), 'patients', 'windows')).toBe('patient.editSummary')
    expect(findScopedCommand(event('Escape'), 'system', 'windows')).toBeUndefined()
  })

  it('findSequenceCommand maps G sequences to navigation', () => {
    expect(findSequenceCommand('g', 'p')).toBe('navigate.patients')
    expect(findSequenceCommand('g', 'P')).toBe('navigate.patients')
    expect(findSequenceCommand('g', 'x')).toBeUndefined()
    expect(findSequenceCommand('x', 'p')).toBeUndefined()
  })
})
