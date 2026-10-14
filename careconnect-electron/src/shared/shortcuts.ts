/**
 * The single keyboard shortcut table (from the Assignment 7 "Keyboard
 * shortcuts reference"). The native menu builds its accelerator labels from
 * it, the renderer matches key presses against it, and the Keyboard
 * shortcuts dialog renders it, so the three can never drift apart.
 */
import type { CommandId } from './commands'

/** Linux shares the Windows column of the reference sheet. */
export type KeyPlatform = 'windows' | 'mac'

export function keyPlatform(nodePlatform: string): KeyPlatform {
  return nodePlatform === 'darwin' ? 'mac' : 'windows'
}

/**
 * One key press. `key` is a KeyboardEvent.key value (letters lower-case).
 * `mod` means Ctrl on Windows/Linux and ⌘ on macOS.
 */
export interface KeyChord {
  key: string
  mod?: boolean
  shift?: boolean
  alt?: boolean
}

export type ShortcutGroup = 'navigation' | 'patient' | 'communication' | 'global'

/**
 * Where the renderer listens:
 *  - global:   anywhere, unless a modal dialog is open
 *  - patients: only in the Patients view
 *  - inbox:    only in the Inbox view
 *  - compose:  only inside the compose dialog
 *  - system:   handled by the OS, the DOM or an open layer; listed for reference
 */
export type ShortcutScope = 'global' | 'patients' | 'inbox' | 'compose' | 'system'

export interface ShortcutDefinition {
  id: string
  label: string
  group: ShortcutGroup
  /** null for reference-only entries (Alt for access keys, Esc to close). */
  command: CommandId | null
  scope: ShortcutScope
  /** Keys pressed together... */
  chord?: KeyChord
  /** ...or two plain keys pressed one after the other (G then P). */
  sequence?: readonly [string, string]
  /** Other chords that trigger the same command. */
  alternates?: readonly KeyChord[]
}

export const SHORTCUT_GROUPS: readonly { id: ShortcutGroup; title: string; description: string }[] = [
  {
    id: 'navigation',
    title: 'Navigation',
    description: 'Move between primary destinations and regions without losing context.'
  },
  {
    id: 'patient',
    title: 'Patient & workspace actions',
    description: 'Act on the selected synthetic patient record or current clinical pane.'
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'Compose, send, and navigate messages with predictable confirmations.'
  },
  {
    id: 'global',
    title: 'Global commands',
    description: 'Commands available from anywhere in the desktop application.'
  }
]

export const SHORTCUTS: readonly ShortcutDefinition[] = [
  // Navigation
  { id: 'open-overview', label: 'Open Overview', group: 'navigation', command: 'navigate.overview', scope: 'global', sequence: ['g', 'o'] },
  { id: 'open-schedule', label: 'Open Schedule', group: 'navigation', command: 'navigate.schedule', scope: 'global', sequence: ['g', 's'] },
  { id: 'open-patients', label: 'Open Patients', group: 'navigation', command: 'navigate.patients', scope: 'global', sequence: ['g', 'p'] },
  { id: 'open-inbox', label: 'Open Inbox', group: 'navigation', command: 'navigate.inbox', scope: 'global', sequence: ['g', 'i'] },
  { id: 'open-tasks', label: 'Open Tasks', group: 'navigation', command: 'navigate.tasks', scope: 'global', sequence: ['g', 't'] },
  { id: 'next-region', label: 'Next workspace region', group: 'navigation', command: 'region.next', scope: 'global', chord: { key: 'F6' } },
  { id: 'previous-region', label: 'Previous workspace region', group: 'navigation', command: 'region.previous', scope: 'global', chord: { key: 'F6', shift: true } },

  // Patient & workspace actions
  { id: 'create-patient', label: 'Create patient record', group: 'patient', command: 'patient.new', scope: 'global', chord: { key: 'n', mod: true } },
  { id: 'search-list', label: 'Search current list', group: 'patient', command: 'patient.search', scope: 'global', chord: { key: 'f', mod: true }, alternates: [{ key: '/' }] },
  { id: 'filter-list', label: 'Filter patient list', group: 'patient', command: 'patient.filter', scope: 'patients', chord: { key: 'l', mod: true, shift: true } },
  { id: 'edit-summary', label: 'Edit care summary', group: 'patient', command: 'patient.editSummary', scope: 'patients', chord: { key: 'e' } },
  { id: 'add-note', label: 'Add clinical note', group: 'patient', command: 'patient.addNote', scope: 'patients', chord: { key: 'n' } },
  { id: 'message-patient', label: 'Message patient', group: 'patient', command: 'patient.message', scope: 'patients', chord: { key: 'm' } },
  { id: 'export-summary', label: 'Export patient summary', group: 'patient', command: 'patient.export', scope: 'patients', chord: { key: 'e', mod: true, shift: true } },
  // Chromium turns Shift+F10 and the Menu key into a `contextmenu` event, which the patient list handles.
  { id: 'context-menu', label: 'Open context menu', group: 'patient', command: 'patient.contextMenu', scope: 'system', chord: { key: 'F10', shift: true }, alternates: [{ key: 'ContextMenu' }] },

  // Communication
  { id: 'new-message', label: 'New message', group: 'communication', command: 'message.new', scope: 'global', chord: { key: 'm', mod: true, shift: true } },
  { id: 'reply', label: 'Reply', group: 'communication', command: 'message.reply', scope: 'inbox', chord: { key: 'r' } },
  { id: 'send-message', label: 'Send message', group: 'communication', command: 'message.send', scope: 'compose', chord: { key: 'Enter', mod: true } },
  { id: 'save-draft', label: 'Save draft', group: 'communication', command: 'message.saveDraft', scope: 'compose', chord: { key: 's', mod: true } },
  { id: 'attach-document', label: 'Attach document', group: 'communication', command: 'message.attach', scope: 'compose', chord: { key: 'a', mod: true, shift: true } },

  // Global commands
  { id: 'command-palette', label: 'Open command palette', group: 'global', command: 'app.commandPalette', scope: 'global', chord: { key: 'k', mod: true } },
  { id: 'keyboard-shortcuts', label: 'Keyboard shortcuts', group: 'global', command: 'app.shortcuts', scope: 'global', chord: { key: '/', mod: true } },
  { id: 'show-access-keys', label: 'Show access keys', group: 'global', command: null, scope: 'system', chord: { key: 'Alt' } },
  { id: 'close-layer', label: 'Close dialog or menu', group: 'global', command: null, scope: 'system', chord: { key: 'Escape' } },
  { id: 'open-help', label: 'Open help', group: 'global', command: 'app.help', scope: 'global', chord: { key: 'F1' } },
  { id: 'open-settings', label: 'Open settings', group: 'global', command: 'app.settings', scope: 'global', chord: { key: ',', mod: true } }
]

export function shortcutForCommand(command: CommandId): ShortcutDefinition | undefined {
  return SHORTCUTS.find((shortcut) => shortcut.command === command)
}

const NAMED_KEY_LABELS: Record<string, { windows: string; mac: string }> = {
  Enter: { windows: 'Enter', mac: 'Return' },
  Escape: { windows: 'Esc', mac: 'Esc' },
  ContextMenu: { windows: 'Menu', mac: 'Menu' },
  Alt: { windows: 'Alt', mac: '⌥' },
  ArrowUp: { windows: '↑', mac: '↑' },
  ArrowDown: { windows: '↓', mac: '↓' },
  ArrowLeft: { windows: '←', mac: '←' },
  ArrowRight: { windows: '→', mac: '→' }
}

const FUNCTION_KEY = /^F\d{1,2}$/

export function keyLabel(key: string, platform: KeyPlatform): string {
  const named = NAMED_KEY_LABELS[key]
  if (named) return named[platform]
  return key.length === 1 ? key.toUpperCase() : key
}

/** Keycaps for a chord, in reading order: ['Ctrl', 'Shift', 'M'] or ['⌘', '⇧', 'M']. */
export function chordKeys(chord: KeyChord, platform: KeyPlatform): string[] {
  const keys: string[] = []
  if (chord.mod) keys.push(platform === 'mac' ? '⌘' : 'Ctrl')
  if (chord.shift) keys.push(platform === 'mac' ? '⇧' : 'Shift')
  if (chord.alt) keys.push(platform === 'mac' ? '⌥' : 'Alt')
  // Mac laptop keyboards need Fn for the function row.
  if (platform === 'mac' && FUNCTION_KEY.test(chord.key)) keys.push('Fn')
  keys.push(keyLabel(chord.key, platform))
  return keys
}

/** Keycaps for a shortcut, whether a chord or a sequence. */
export function shortcutKeys(shortcut: ShortcutDefinition, platform: KeyPlatform): string[] {
  if (shortcut.sequence) return shortcut.sequence.map((key) => keyLabel(key, platform))
  if (shortcut.chord) return chordKeys(shortcut.chord, platform)
  return []
}

/** Text form for labels and screen readers: "Ctrl+K", "G then P". */
export function describeShortcut(shortcut: ShortcutDefinition, platform: KeyPlatform): string {
  const keys = shortcutKeys(shortcut, platform)
  return shortcut.sequence ? keys.join(' then ') : keys.join('+')
}

/** Short hint text for on-screen key badges: "Ctrl+N", "G P", "E". */
export function hintForCommand(command: CommandId, platform: KeyPlatform): string | undefined {
  const shortcut = shortcutForCommand(command)
  if (!shortcut) return undefined
  const keys = shortcutKeys(shortcut, platform)
  return shortcut.sequence ? keys.join(' ') : keys.join('+')
}

/** Electron accelerator for a chord: "CmdOrCtrl+Shift+M", "Shift+F6", "E". */
export function toAccelerator(chord: KeyChord): string {
  const parts: string[] = []
  if (chord.mod) parts.push('CmdOrCtrl')
  if (chord.shift) parts.push('Shift')
  if (chord.alt) parts.push('Alt')
  parts.push(chord.key.length === 1 ? chord.key.toUpperCase() : chord.key)
  return parts.join('+')
}

/** The accelerator a native menu item shows for a command (sequences have none). */
export function acceleratorForCommand(command: CommandId): string | undefined {
  const shortcut = shortcutForCommand(command)
  return shortcut?.chord ? toAccelerator(shortcut.chord) : undefined
}

/**
 * Who handles a chord. On Windows and Linux native menu items only *display*
 * app accelerators (`registerAccelerator: false`) and the renderer handles every
 * key, so it can respect context (typing in a field, a dialog being open). On
 * macOS menu key equivalents are always registered, so the menu owns modifier
 * chords and function keys there and the renderer steps aside. Printable single
 * keys (E, N, M, R) are never menu accelerators on macOS, or typing "e" in a
 * text field would fire them.
 */
export function menuOwnsChord(chord: KeyChord, platform: KeyPlatform): boolean {
  return platform === 'mac' && (Boolean(chord.mod) || FUNCTION_KEY.test(chord.key))
}

/**
 * `aria-keyshortcuts` value for a command ("Control+Shift+M"), or undefined for
 * sequences. With single-key shortcuts turned off (`characterKeys` false), a
 * plain character key such as E is not advertised either, because it no longer works.
 */
export function ariaKeyShortcuts(command: CommandId, platform: KeyPlatform, characterKeys = true): string | undefined {
  const chord = shortcutForCommand(command)?.chord
  if (!chord || (!characterKeys && isCharacterKey(chord))) return undefined
  const parts: string[] = []
  if (chord.mod) parts.push(platform === 'mac' ? 'Meta' : 'Control')
  if (chord.shift) parts.push('Shift')
  if (chord.alt) parts.push('Alt')
  parts.push(chord.key.length === 1 ? chord.key.toUpperCase() : chord.key)
  return parts.join('+')
}

export interface KeyEventLike {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}

function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key
}

/**
 * Whether a keyboard event is exactly this chord. Shift is ignored for
 * punctuation keys, because some layouts need Shift to type "/" or ",".
 */
export function matchesChord(event: KeyEventLike, chord: KeyChord, platform: KeyPlatform): boolean {
  if (normalizeKey(event.key) !== normalizeKey(chord.key)) return false
  const modPressed = platform === 'mac' ? event.metaKey : event.ctrlKey
  const foreignModPressed = platform === 'mac' ? event.ctrlKey : event.metaKey
  if (foreignModPressed) return false
  if (Boolean(chord.mod) !== modPressed) return false
  if (Boolean(chord.alt) !== event.altKey) return false
  const shiftMatters = chord.key.length > 1 || /^[a-z0-9]$/i.test(chord.key)
  if (shiftMatters && Boolean(chord.shift) !== event.shiftKey) return false
  return true
}

/**
 * A character key in WCAG 2.1.4's sense: a single printable key with no Ctrl, ⌘
 * or Alt (E, N, /). Shift doesn't change that. Function keys and modifier chords
 * are not character keys.
 */
export function isCharacterKey(chord: KeyChord): boolean {
  return !chord.mod && !chord.alt && chord.key.length === 1
}

/** Whether a shortcut is a character key, or a sequence of them (G then P). */
export function isCharacterKeyShortcut(shortcut: ShortcutDefinition): boolean {
  if (shortcut.sequence) return true
  return Boolean(shortcut.chord && isCharacterKey(shortcut.chord))
}

/** Whether the event is a plain key with no Ctrl, ⌘ or Alt (Shift is allowed). */
export function isPlainKey(event: KeyEventLike): boolean {
  return !event.ctrlKey && !event.metaKey && !event.altKey
}
