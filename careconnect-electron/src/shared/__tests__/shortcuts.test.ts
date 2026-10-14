import { COMMAND_IDS, isCommandId, type CommandId } from '../commands'
import {
  acceleratorForCommand,
  ariaKeyShortcuts,
  chordKeys,
  describeShortcut,
  hintForCommand,
  isCharacterKey,
  isCharacterKeyShortcut,
  isPlainKey,
  keyLabel,
  keyPlatform,
  matchesChord,
  menuOwnsChord,
  SHORTCUT_GROUPS,
  shortcutForCommand,
  shortcutKeys,
  SHORTCUTS,
  toAccelerator,
  type KeyChord,
  type KeyEventLike,
  type KeyPlatform,
  type ShortcutDefinition
} from '../shortcuts'

const PLATFORMS: readonly KeyPlatform[] = ['windows', 'mac']

/** The key event a user produces by pressing `chord` on `platform`. */
function eventFor(chord: KeyChord, platform: KeyPlatform, extra: Partial<KeyEventLike> = {}): KeyEventLike {
  return {
    key: chord.key,
    ctrlKey: Boolean(chord.mod) && platform === 'windows',
    metaKey: Boolean(chord.mod) && platform === 'mac',
    shiftKey: Boolean(chord.shift),
    altKey: Boolean(chord.alt),
    ...extra
  }
}

function chordsOf(shortcut: ShortcutDefinition): KeyChord[] {
  return shortcut.chord ? [shortcut.chord, ...(shortcut.alternates ?? [])] : []
}

const isPunctuation = (key: string): boolean => key.length === 1 && !/^[a-z0-9]$/i.test(key)

/** Every chord in the table, labelled for test names. */
const CHORDS = SHORTCUTS.flatMap((shortcut) =>
  chordsOf(shortcut).map((chord, index) => ({ name: `${shortcut.id}${index === 0 ? '' : ` (alternate ${index})`}`, shortcut, chord }))
)

describe('SHORTCUTS table', () => {
  it('has unique ids', () => {
    const ids = SHORTCUTS.map((shortcut) => shortcut.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('maps every non-null command to a valid CommandId, at most once', () => {
    const commands = SHORTCUTS.flatMap((shortcut) => (shortcut.command === null ? [] : [shortcut.command]))
    for (const command of commands) expect(isCommandId(command)).toBe(true)
    expect(new Set(commands).size).toBe(commands.length)
  })

  it('gives every shortcut either a chord or a two-key sequence, never both', () => {
    for (const shortcut of SHORTCUTS) {
      expect(Boolean(shortcut.chord) !== Boolean(shortcut.sequence)).toBe(true)
      if (shortcut.sequence) {
        expect(shortcut.sequence).toHaveLength(2)
        for (const key of shortcut.sequence) expect(key).toMatch(/^[a-z]$/)
      }
    }
  })

  it('stores letter keys in lower case, as KeyboardEvent.key reports them without Shift', () => {
    for (const { chord } of CHORDS) {
      if (chord.key.length === 1) expect(chord.key).toBe(chord.key.toLowerCase())
    }
  })

  it('puts every shortcut in a known group, and every group has shortcuts', () => {
    const groupIds = SHORTCUT_GROUPS.map((group) => group.id)
    expect(groupIds).toEqual(['navigation', 'patient', 'communication', 'global'])
    for (const shortcut of SHORTCUTS) expect(groupIds).toContain(shortcut.group)
    for (const group of SHORTCUT_GROUPS) {
      expect(group.title).not.toBe('')
      expect(group.description).not.toBe('')
      expect(SHORTCUTS.some((shortcut) => shortcut.group === group.id)).toBe(true)
    }
  })

  it('keeps reference-only entries (no command) in the system scope', () => {
    for (const shortcut of SHORTCUTS.filter((entry) => entry.command === null)) expect(shortcut.scope).toBe('system')
  })

  it('never binds two shortcuts to the same keys', () => {
    for (const platform of PLATFORMS) {
      for (const a of CHORDS) {
        for (const b of CHORDS) {
          if (a === b) continue
          expect({ pressed: a.name, matched: matchesChord(eventFor(a.chord, platform), b.chord, platform) ? b.name : null }).toEqual({
            pressed: a.name,
            matched: null
          })
        }
      }
      const sequences = SHORTCUTS.flatMap((shortcut) => (shortcut.sequence ? [shortcut.sequence.join(' ')] : []))
      expect(new Set(sequences).size).toBe(sequences.length)
    }
  })

  // "CareConnect does not override reserved key combinations" (design section 8).
  it.each<[string, KeyEventLike]>([
    ['Ctrl+C (copy)', { key: 'c', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }],
    ['Ctrl+V (paste)', { key: 'v', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }],
    ['Ctrl+X (cut)', { key: 'x', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }],
    ['Ctrl+Z (undo)', { key: 'z', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }],
    ['Ctrl+Y (redo)', { key: 'y', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }],
    ['Ctrl+A (select all)', { key: 'a', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }],
    ['Ctrl+W (close window)', { key: 'w', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }],
    ['Alt+F (File menu access key)', { key: 'f', ctrlKey: false, metaKey: false, shiftKey: false, altKey: true }],
    ['Alt+E (Edit menu access key)', { key: 'e', ctrlKey: false, metaKey: false, shiftKey: false, altKey: true }],
    ['Alt+H (Help menu access key)', { key: 'h', ctrlKey: false, metaKey: false, shiftKey: false, altKey: true }],
    ['F10 (menu bar)', { key: 'F10', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }],
    ['F7 (caret browsing)', { key: 'F7', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }],
    ['Insert (NVDA key)', { key: 'Insert', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }],
    ['Insert+Space (NVDA focus mode)', { key: ' ', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }]
  ])('leaves the reserved combination %s alone', (_name, event) => {
    for (const { chord } of CHORDS) expect(matchesChord(event, chord, 'windows')).toBe(false)
  })

  it('uses Ctrl+Shift+L for the filter, not Alt+F (design deviation 1)', () => {
    expect(shortcutForCommand('patient.filter')?.chord).toEqual({ key: 'l', mod: true, shift: true })
  })
})

describe('matchesChord, table-driven over SHORTCUTS', () => {
  describe.each(PLATFORMS)('on %s', (platform) => {
    it.each(CHORDS)('$name matches the key event it describes', ({ chord }) => {
      expect(matchesChord(eventFor(chord, platform), chord, platform)).toBe(true)
    })

    it.each(CHORDS)('$name matches letter keys typed with Caps Lock on', ({ chord }) => {
      expect(matchesChord(eventFor(chord, platform, { key: chord.key.length === 1 ? chord.key.toUpperCase() : chord.key }), chord, platform)).toBe(true)
    })

    it.each(CHORDS)('$name fails with an extra modifier', ({ chord }) => {
      // The other platform's command key is always foreign; this platform's counts when the chord has no mod.
      const extras: Partial<KeyEventLike>[] = [platform === 'mac' ? { ctrlKey: true } : { metaKey: true }]
      if (!chord.mod) extras.push(platform === 'mac' ? { metaKey: true } : { ctrlKey: true })
      if (!chord.alt) extras.push({ altKey: true })
      if (!chord.shift && !isPunctuation(chord.key)) extras.push({ shiftKey: true })
      for (const extra of extras) {
        expect({ extra, matches: matchesChord(eventFor(chord, platform, extra), chord, platform) }).toEqual({ extra, matches: false })
      }
    })

    it.each(CHORDS)('$name fails when one of its modifiers is missing', ({ chord }) => {
      const missing: Partial<KeyEventLike>[] = []
      if (chord.mod) missing.push(platform === 'mac' ? { metaKey: false } : { ctrlKey: false })
      if (chord.alt) missing.push({ altKey: false })
      if (chord.shift) missing.push({ shiftKey: false })
      for (const change of missing) expect(matchesChord(eventFor(chord, platform, change), chord, platform)).toBe(false)
    })

    it('fails for a different key', () => {
      expect(matchesChord(eventFor({ key: 'k', mod: true }, platform), { key: 'j', mod: true }, platform)).toBe(false)
    })
  })

  it('treats the other platform’s command key as foreign', () => {
    const palette = { key: 'k', mod: true }
    expect(matchesChord({ key: 'k', ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, palette, 'windows')).toBe(false)
    expect(matchesChord({ key: 'k', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }, palette, 'mac')).toBe(false)
  })

  it('ignores Shift for punctuation, since some layouts need it to type / or ,', () => {
    const punctuation = CHORDS.filter(({ chord }) => isPunctuation(chord.key))
    expect(punctuation.map(({ name }) => name).sort()).toEqual(['keyboard-shortcuts', 'open-settings', 'search-list (alternate 1)'])
    for (const platform of PLATFORMS) {
      for (const { chord } of punctuation) expect(matchesChord(eventFor(chord, platform, { shiftKey: true }), chord, platform)).toBe(true)
    }
  })

  it('does not ignore Shift for letters, digits or named keys', () => {
    expect(matchesChord(eventFor({ key: 'k', mod: true }, 'windows', { shiftKey: true }), { key: 'k', mod: true }, 'windows')).toBe(false)
    expect(matchesChord(eventFor({ key: '1', mod: true }, 'windows', { shiftKey: true }), { key: '1', mod: true }, 'windows')).toBe(false)
    expect(matchesChord(eventFor({ key: 'F6' }, 'windows', { shiftKey: true }), { key: 'F6' }, 'windows')).toBe(false)
  })
})

describe('isPlainKey', () => {
  const base: KeyEventLike = { key: 'e', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }
  it('allows Shift but not Ctrl, ⌘ or Alt', () => {
    expect(isPlainKey(base)).toBe(true)
    expect(isPlainKey({ ...base, shiftKey: true })).toBe(true)
    expect(isPlainKey({ ...base, ctrlKey: true })).toBe(false)
    expect(isPlainKey({ ...base, metaKey: true })).toBe(false)
    expect(isPlainKey({ ...base, altKey: true })).toBe(false)
  })
})

describe('keyPlatform', () => {
  it('uses the macOS column only on darwin; Linux shares the Windows keys', () => {
    expect(keyPlatform('darwin')).toBe('mac')
    expect(keyPlatform('win32')).toBe('windows')
    expect(keyPlatform('linux')).toBe('windows')
  })
})

describe('key labels', () => {
  it.each<[string, KeyPlatform, string]>([
    ['Enter', 'windows', 'Enter'],
    ['Enter', 'mac', 'Return'],
    ['Escape', 'windows', 'Esc'],
    ['Escape', 'mac', 'Esc'],
    ['ContextMenu', 'windows', 'Menu'],
    ['Alt', 'windows', 'Alt'],
    ['Alt', 'mac', '⌥'],
    ['ArrowUp', 'windows', '↑'],
    ['ArrowDown', 'mac', '↓'],
    ['ArrowLeft', 'windows', '←'],
    ['ArrowRight', 'windows', '→'],
    ['k', 'windows', 'K'],
    ['/', 'windows', '/'],
    ['F6', 'mac', 'F6']
  ])('keyLabel(%s, %s) is %s', (key, platform, label) => {
    expect(keyLabel(key, platform)).toBe(label)
  })

  it.each<[KeyChord, string[], string[]]>([
    [{ key: 'k', mod: true }, ['Ctrl', 'K'], ['⌘', 'K']],
    [{ key: 'm', mod: true, shift: true }, ['Ctrl', 'Shift', 'M'], ['⌘', '⇧', 'M']],
    [{ key: 'x', alt: true }, ['Alt', 'X'], ['⌥', 'X']],
    [{ key: 'F6' }, ['F6'], ['Fn', 'F6']],
    [{ key: 'F6', shift: true }, ['Shift', 'F6'], ['⇧', 'Fn', 'F6']],
    [{ key: 'F1' }, ['F1'], ['Fn', 'F1']],
    [{ key: 'Enter', mod: true }, ['Ctrl', 'Enter'], ['⌘', 'Return']],
    [{ key: 'e' }, ['E'], ['E']],
    [{ key: 'Escape' }, ['Esc'], ['Esc']]
  ])('chordKeys(%j) reads %j on Windows and %j on macOS', (chord, windows, mac) => {
    expect(chordKeys(chord, 'windows')).toEqual(windows)
    expect(chordKeys(chord, 'mac')).toEqual(mac)
  })

  it('labels sequences key by key and returns nothing for an entry without keys', () => {
    const openPatients = shortcutForCommand('navigate.patients') as ShortcutDefinition
    expect(shortcutKeys(openPatients, 'windows')).toEqual(['G', 'P'])
    expect(shortcutKeys({ id: 'empty', label: 'Empty', group: 'global', command: null, scope: 'system' }, 'windows')).toEqual([])
  })

  it('describes chords with + and sequences with "then"', () => {
    expect(describeShortcut(shortcutForCommand('message.new') as ShortcutDefinition, 'windows')).toBe('Ctrl+Shift+M')
    expect(describeShortcut(shortcutForCommand('message.new') as ShortcutDefinition, 'mac')).toBe('⌘+⇧+M')
    expect(describeShortcut(shortcutForCommand('navigate.inbox') as ShortcutDefinition, 'windows')).toBe('G then I')
  })

  it('gives short hints for key badges', () => {
    expect(hintForCommand('patient.new', 'windows')).toBe('Ctrl+N')
    expect(hintForCommand('patient.new', 'mac')).toBe('⌘+N')
    expect(hintForCommand('navigate.patients', 'windows')).toBe('G P')
    expect(hintForCommand('patient.editSummary', 'windows')).toBe('E')
    expect(hintForCommand('patient.sort', 'windows')).toBeUndefined()
  })
})

// The "Keyboard shortcuts reference" sheet from Assignment 7, with design deviation 1 (filter).
const REFERENCE_SHEET: [label: string, windows: string, mac: string][] = [
  ['Open Overview', 'G then O', 'G then O'],
  ['Open Schedule', 'G then S', 'G then S'],
  ['Open Patients', 'G then P', 'G then P'],
  ['Open Inbox', 'G then I', 'G then I'],
  ['Open Tasks', 'G then T', 'G then T'],
  ['Next workspace region', 'F6', 'Fn+F6'],
  ['Previous workspace region', 'Shift+F6', '⇧+Fn+F6'],
  ['Create patient record', 'Ctrl+N', '⌘+N'],
  ['Search current list', 'Ctrl+F', '⌘+F'],
  ['Filter patient list', 'Ctrl+Shift+L', '⌘+⇧+L'],
  ['Edit care summary', 'E', 'E'],
  ['Add clinical note', 'N', 'N'],
  ['Message patient', 'M', 'M'],
  ['Export patient summary', 'Ctrl+Shift+E', '⌘+⇧+E'],
  ['Open context menu', 'Shift+F10', '⇧+Fn+F10'],
  ['New message', 'Ctrl+Shift+M', '⌘+⇧+M'],
  ['Reply', 'R', 'R'],
  ['Send message', 'Ctrl+Enter', '⌘+Return'],
  ['Save draft', 'Ctrl+S', '⌘+S'],
  ['Attach document', 'Ctrl+Shift+A', '⌘+⇧+A'],
  ['Open command palette', 'Ctrl+K', '⌘+K'],
  ['Keyboard shortcuts', 'Ctrl+/', '⌘+/'],
  ['Show access keys', 'Alt', '⌥'],
  ['Close dialog or menu', 'Esc', 'Esc'],
  ['Open help', 'F1', 'Fn+F1'],
  ['Open settings', 'Ctrl+,', '⌘+,']
]

describe('the reference sheet', () => {
  it.each(REFERENCE_SHEET)('lists "%s" as %s (Windows) and %s (macOS)', (label, windows, mac) => {
    const shortcut = SHORTCUTS.find((entry) => entry.label === label)
    expect(shortcut).toBeDefined()
    expect(describeShortcut(shortcut as ShortcutDefinition, 'windows')).toBe(windows)
    expect(describeShortcut(shortcut as ShortcutDefinition, 'mac')).toBe(mac)
  })

  it('has no shortcut missing from the sheet', () => {
    expect(SHORTCUTS.map((shortcut) => shortcut.label).sort()).toEqual(REFERENCE_SHEET.map(([label]) => label).sort())
  })

  it('offers / as the alternate for search and the Menu key for the context menu', () => {
    expect(shortcutForCommand('patient.search')?.alternates).toEqual([{ key: '/' }])
    expect(shortcutForCommand('patient.contextMenu')?.alternates).toEqual([{ key: 'ContextMenu' }])
  })
})

describe('accelerators', () => {
  it.each<[KeyChord, string]>([
    [{ key: 'k', mod: true }, 'CmdOrCtrl+K'],
    [{ key: 'F6', shift: true }, 'Shift+F6'],
    [{ key: 'e' }, 'E'],
    [{ key: '/', mod: true }, 'CmdOrCtrl+/'],
    [{ key: 'm', mod: true, shift: true }, 'CmdOrCtrl+Shift+M'],
    [{ key: 'x', alt: true }, 'Alt+X'],
    [{ key: 'Enter', mod: true }, 'CmdOrCtrl+Enter']
  ])('toAccelerator(%j) is %s', (chord, accelerator) => {
    expect(toAccelerator(chord)).toBe(accelerator)
  })

  it.each<[CommandId, string | undefined]>([
    ['app.commandPalette', 'CmdOrCtrl+K'],
    ['region.previous', 'Shift+F6'],
    ['patient.editSummary', 'E'],
    ['app.shortcuts', 'CmdOrCtrl+/'],
    ['app.settings', 'CmdOrCtrl+,'],
    ['patient.export', 'CmdOrCtrl+Shift+E'],
    ['navigate.patients', undefined],
    ['patient.sort', undefined]
  ])('acceleratorForCommand(%s) is %s', (command, accelerator) => {
    expect(acceleratorForCommand(command)).toBe(accelerator)
  })

  it('gives every chord-based command an accelerator, and every accelerator is valid Electron syntax', () => {
    for (const command of COMMAND_IDS) {
      const shortcut = shortcutForCommand(command)
      const accelerator = acceleratorForCommand(command)
      expect(accelerator === undefined).toBe(!shortcut?.chord)
      if (accelerator) expect(accelerator).toMatch(/^((CmdOrCtrl|Shift|Alt)\+)*([A-Z0-9]|F\d{1,2}|Enter|Escape|ContextMenu|Alt|[/,])$/)
    }
  })
})

describe('menuOwnsChord', () => {
  it.each(CHORDS)('$name is never owned by the menu on Windows or Linux', ({ chord }) => {
    expect(menuOwnsChord(chord, 'windows')).toBe(false)
  })

  it.each(CHORDS)('$name is owned by the macOS menu only when it is a modifier chord or a function key', ({ chord }) => {
    expect(menuOwnsChord(chord, 'mac')).toBe(Boolean(chord.mod) || /^F\d{1,2}$/.test(chord.key))
  })

  it('never lets the macOS menu own printable single keys', () => {
    for (const key of ['e', 'n', 'm', 'r', '/']) expect(menuOwnsChord({ key }, 'mac')).toBe(false)
    expect(menuOwnsChord({ key: 'F10', shift: true }, 'mac')).toBe(true)
    expect(menuOwnsChord({ key: 'k', mod: true }, 'mac')).toBe(true)
    expect(menuOwnsChord({ key: 'Escape' }, 'mac')).toBe(false)
  })
})

describe('ariaKeyShortcuts', () => {
  it.each<[CommandId, KeyPlatform, string | undefined]>([
    ['message.new', 'windows', 'Control+Shift+M'],
    ['message.new', 'mac', 'Meta+Shift+M'],
    ['app.commandPalette', 'windows', 'Control+K'],
    ['region.previous', 'windows', 'Shift+F6'],
    ['patient.editSummary', 'mac', 'E'],
    ['app.settings', 'windows', 'Control+,'],
    ['message.send', 'windows', 'Control+Enter'],
    ['navigate.patients', 'windows', undefined],
    ['patient.sort', 'windows', undefined]
  ])('%s on %s is %s', (command, platform, value) => {
    expect(ariaKeyShortcuts(command, platform)).toBe(value)
  })

  it('stops advertising single character keys when single-key shortcuts are off', () => {
    expect(ariaKeyShortcuts('patient.editSummary', 'windows', false)).toBeUndefined()
    expect(ariaKeyShortcuts('message.reply', 'mac', false)).toBeUndefined()
    expect(ariaKeyShortcuts('patient.new', 'windows', false)).toBe('Control+N')
    expect(ariaKeyShortcuts('region.previous', 'windows', false)).toBe('Shift+F6')
  })

  it('gives every chord-based command a value made only of valid aria-keyshortcuts tokens', () => {
    for (const platform of PLATFORMS) {
      for (const command of COMMAND_IDS) {
        const value = ariaKeyShortcuts(command, platform)
        expect(value === undefined).toBe(!shortcutForCommand(command)?.chord)
        if (value) expect(value).toMatch(/^((Control|Meta|Shift|Alt)\+)*([A-Z0-9]|F\d{1,2}|Enter|ContextMenu|[/,])$/)
      }
    }
  })
})

describe('character-key shortcuts (WCAG 2.1.4)', () => {
  it('are the single-key actions and the G-sequences, which Settings can turn off', () => {
    expect(SHORTCUTS.filter(isCharacterKeyShortcut).map((shortcut) => shortcut.id)).toEqual([
      'open-overview',
      'open-schedule',
      'open-patients',
      'open-inbox',
      'open-tasks',
      'edit-summary',
      'add-note',
      'message-patient',
      'reply'
    ])
  })

  it('treat Shift as part of the character, but not Ctrl, ⌘ or Alt, and never a named key', () => {
    expect(isCharacterKey({ key: '/' })).toBe(true)
    expect(isCharacterKey({ key: 'e', shift: true })).toBe(true)
    expect(isCharacterKey({ key: 'e', mod: true })).toBe(false)
    expect(isCharacterKey({ key: 'e', alt: true })).toBe(false)
    expect(isCharacterKey({ key: 'F6' })).toBe(false)
    expect(isCharacterKey({ key: 'Escape' })).toBe(false)
  })
})
