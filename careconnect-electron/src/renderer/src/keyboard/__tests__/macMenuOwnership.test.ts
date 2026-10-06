/**
 * On macOS the native menu owns modifier chords and function keys
 * (menuOwnsChord), so the renderer's key handlers step aside for them. Such a
 * key does nothing unless a macOS menu item registers it as its accelerator.
 * This cross-checks every chord the renderer defers against the real menu
 * template (src/main/menu.ts), including alternates.
 */
import type { CommandId } from '../../../../shared/commands'
import { menuOwnsChord, SHORTCUTS, toAccelerator, type KeyChord } from '../../../../shared/shortcuts'
import { findGlobalShortcut, findScopedCommand } from '../useKeyboardShortcuts'

interface MenuItem {
  label?: string
  accelerator?: string
  registerAccelerator?: boolean
  submenu?: MenuItem[]
  click?: () => void
}

interface MenuModule {
  buildMenuTemplate(options: {
    platform: string
    isDev: boolean
    appName: string
    state: null
    send(command: { id: CommandId }): void
    showAbout(): void
    openExternal(url: string): void
    print(): void
  }): MenuItem[]
}

// Loaded at run time, so the renderer's type check does not take in the main process and Electron's types.
const { buildMenuTemplate } = jest.requireActual<MenuModule>('../../../../main/menu')

/**
 * Deferred chords with no macOS menu item yet, as "command: accelerator".
 * Reported to the main-process task: remove an entry once its menu item exists.
 */
const KNOWN_GAPS = ['patient.filter: CmdOrCtrl+Shift+L']

interface Registered {
  command: CommandId
  accelerator: string
}

/** Every macOS menu item that registers an accelerator, with the command its click sends. */
function registeredOnMac(): Registered[] {
  let sent: CommandId | null = null
  const template = buildMenuTemplate({
    platform: 'darwin',
    isDev: false,
    appName: 'CareConnect',
    state: null,
    send: (command) => {
      sent = command.id
    },
    showAbout: () => {},
    openExternal: () => {},
    print: () => {}
  })
  const flatten = (items: MenuItem[]): MenuItem[] => items.flatMap((item) => [item, ...flatten(item.submenu ?? [])])
  return flatten(template).flatMap((item) => {
    if (!item.accelerator || item.registerAccelerator !== true || !item.click) return []
    sent = null
    item.click()
    const command = sent as CommandId | null
    return command ? [{ command, accelerator: item.accelerator }] : []
  })
}

/** A key event for a chord as a Mac keyboard sends it. */
function macEvent(chord: KeyChord) {
  return {
    key: chord.shift && /^[a-z]$/.test(chord.key) ? chord.key.toUpperCase() : chord.key,
    ctrlKey: false,
    metaKey: Boolean(chord.mod),
    shiftKey: Boolean(chord.shift),
    altKey: Boolean(chord.alt)
  }
}

/** Every chord, primary or alternate, that the renderer leaves to the macOS menu. */
function deferredOnMac(): Registered[] {
  return SHORTCUTS.flatMap((shortcut) => {
    if (!shortcut.command || shortcut.scope === 'system' || !shortcut.chord) return []
    const command = shortcut.command
    return [shortcut.chord, ...(shortcut.alternates ?? [])]
      .filter((chord) => menuOwnsChord(chord, 'mac'))
      .map((chord) => ({ command, accelerator: toAccelerator(chord) }))
  })
}

describe('chords the renderer leaves to the macOS menu', () => {
  it('are really left alone by the renderer’s key handlers', () => {
    const deferred = deferredOnMac()
    expect(deferred.length).toBeGreaterThan(5)
    for (const shortcut of SHORTCUTS.filter((entry) => entry.command && entry.scope !== 'system' && entry.chord && menuOwnsChord(entry.chord, 'mac'))) {
      const chord = shortcut.chord as KeyChord
      expect(findGlobalShortcut(macEvent(chord), 'patients', 'mac', false)).toBeUndefined()
      expect(findGlobalShortcut(macEvent(chord), 'inbox', 'mac', false)).toBeUndefined()
      expect(findScopedCommand(macEvent(chord), 'compose', 'mac')).toBeUndefined()
    }
  })

  it('each have a macOS menu item that registers them, apart from the known gaps', () => {
    const registered = registeredOnMac()
    const missing = deferredOnMac()
      .filter(({ command, accelerator }) => !registered.some((item) => item.command === command && item.accelerator === accelerator))
      .map(({ command, accelerator }) => `${command}: ${accelerator}`)
    expect(missing).toEqual(KNOWN_GAPS)
  })

  it('include the gap from the design: ⌘⇧L (Filter list) has no menu item, so it does nothing on macOS', () => {
    const filter = deferredOnMac().find((entry) => entry.command === 'patient.filter')
    expect(filter).toEqual({ command: 'patient.filter', accelerator: 'CmdOrCtrl+Shift+L' })
    expect(registeredOnMac().some((item) => item.command === 'patient.filter')).toBe(false)
  })
})
