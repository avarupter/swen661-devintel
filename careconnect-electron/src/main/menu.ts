/**
 * The native application menu (design section 6, "Menus"). The template is a
 * pure function of the platform and the renderer's UI state, so it is fully
 * testable; `applyMenuState` keeps item enablement and checkmarks in step with
 * the renderer afterwards.
 *
 * Accelerators come from the shared shortcut table. On Windows and Linux they
 * are display-only (`registerAccelerator: false`): the renderer handles every
 * key itself, so it can ignore single-key shortcuts while the user types. On
 * macOS the menu owns modifier chords and function keys, and printable single
 * keys get no menu accelerator at all.
 */
import type { MenuItemConstructorOptions } from 'electron'
import type { UiState } from '../shared/api'
import { type AppCommand, type CommandId, isCommandId } from '../shared/commands'
import { RESOURCE_LINKS } from '../shared/links'
import { DEFAULT_PREFERENCES } from '../shared/model'
import { acceleratorForCommand, menuOwnsChord, shortcutForCommand } from '../shared/shortcuts'

export interface MenuTemplateOptions {
  /** A Node.js platform name: 'win32', 'darwin', 'linux'. */
  platform: string
  isDev: boolean
  appName: string
  /** The renderer's last reported state, or null before it has reported. */
  state: UiState | null
  send(command: AppCommand): void
  showAbout(): void
  openExternal(url: string): void
  print(): void
}

/** Ids of the menu items whose id is not a command id. */
export const MENU_ITEM_IDS = {
  print: 'file.print',
  /**
   * Edit's copy of Command Palette. It sends app.commandPalette, but follows
   * the rule for ordinary commands (no dialog open), while the Help copy, under
   * the command's own id, stays enabled like every Help item.
   */
  editCommandPalette: 'edit.commandPalette',
  accessibilityResources: 'help.accessibilityResources',
  about: 'help.about'
} as const

export const ACCESSIBILITY_RESOURCES_URL =
  RESOURCE_LINKS.find((link) => link.id === 'wcag-quickref')?.url ?? 'https://www.w3.org/WAI/WCAG22/quickref/'

/** The state assumed until the renderer reports: nothing selected, no dialog open. */
const INITIAL_STATE: UiState = {
  view: 'patients',
  hasSelection: false,
  modal: null,
  unreadCount: 0,
  unsavedChanges: 0,
  showShortcutHints: DEFAULT_PREFERENCES.showShortcutHints,
  highContrast: DEFAULT_PREFERENCES.highContrast,
  reduceMotion: DEFAULT_PREFERENCES.reduceMotion
}

/** Commands that act on the selected patient. */
const SELECTED_PATIENT_COMMANDS: ReadonlySet<CommandId> = new Set<CommandId>([
  'patient.editSummary',
  'patient.addNote',
  'patient.message',
  'patient.markCompleted',
  'patient.markNeedsReview',
  'patient.markOpen',
  'patient.copyCareId',
  'patient.export',
  'patient.contextMenu'
])

/** Commands the compose dialog handles while it is open. */
const COMPOSE_COMMANDS: ReadonlySet<CommandId> = new Set<CommandId>(['message.send', 'message.saveDraft', 'message.attach'])

/**
 * The View checkboxes and Help items stay available whatever is open. Only the
 * Help menu's Command Palette carries the app.commandPalette id; Edit's copy
 * has its own (MENU_ITEM_IDS.editCommandPalette).
 */
const ALWAYS_ENABLED: ReadonlySet<CommandId> = new Set<CommandId>([
  'view.toggleShortcutHints',
  'view.toggleHighContrast',
  'view.toggleReduceMotion',
  'app.shortcuts',
  'app.help',
  'app.commandPalette'
])

const CHECKBOX_PREFERENCES: Partial<Record<CommandId, 'showShortcutHints' | 'highContrast' | 'reduceMotion'>> = {
  'view.toggleShortcutHints': 'showShortcutHints',
  'view.toggleHighContrast': 'highContrast',
  'view.toggleReduceMotion': 'reduceMotion'
}

export function isMenuCommandEnabled(id: CommandId, state: UiState): boolean {
  if (ALWAYS_ENABLED.has(id)) return true
  if (COMPOSE_COMMANDS.has(id)) return state.modal === 'compose'
  if (SELECTED_PATIENT_COMMANDS.has(id)) return state.hasSelection && state.modal === null
  if (id === 'message.reply') return state.view === 'inbox' && state.modal === null
  return state.modal === null
}

/**
 * Whether the menu item with this id is enabled, or null for items whose
 * state never changes (Print, Accessibility Resources, About, roles).
 */
function isMenuItemEnabled(id: string, state: UiState): boolean | null {
  if (isCommandId(id)) return isMenuCommandEnabled(id, state)
  if (id === MENU_ITEM_IDS.editCommandPalette) return state.modal === null
  return null
}

/** Accelerator display and registration for a command, per the rules above. */
function acceleratorOptions(id: CommandId, mac: boolean): Pick<MenuItemConstructorOptions, 'accelerator' | 'registerAccelerator'> {
  const accelerator = acceleratorForCommand(id)
  const chord = shortcutForCommand(id)?.chord
  if (!accelerator || !chord) return {}
  if (!mac) return { accelerator, registerAccelerator: false }
  return menuOwnsChord(chord, 'mac') ? { accelerator, registerAccelerator: true } : {}
}

export function buildMenuTemplate(options: MenuTemplateOptions): MenuItemConstructorOptions[] {
  const { platform, isDev, appName, send, showAbout, openExternal, print } = options
  const state = options.state ?? INITIAL_STATE
  const mac = platform === 'darwin'
  const separator: MenuItemConstructorOptions = { type: 'separator' }

  /** Windows and Linux underline the letter after "&"; macOS has no access keys. */
  const label = (text: string): string => (mac ? text.replace(/&(?!&)/g, '') : text)

  /** An item that sends command `id`. `menuId` gives it an id of its own (see MENU_ITEM_IDS). */
  const command = (id: CommandId, text: string, menuId: string = id): MenuItemConstructorOptions => ({
    id: menuId,
    label: label(text),
    enabled: isMenuItemEnabled(menuId, state) ?? true,
    ...acceleratorOptions(id, mac),
    click: () => send({ id })
  })

  const checkbox = (id: CommandId, text: string): MenuItemConstructorOptions => {
    const preference = CHECKBOX_PREFERENCES[id]
    return { ...command(id, text), type: 'checkbox', checked: preference ? state[preference] : false }
  }

  const role = (name: NonNullable<MenuItemConstructorOptions['role']>, text: string): MenuItemConstructorOptions => ({
    role: name,
    label: label(text)
  })

  const appMenu: MenuItemConstructorOptions = {
    label: appName,
    submenu: [
      { role: 'about' },
      separator,
      { role: 'services' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      separator,
      { role: 'quit' }
    ]
  }

  const fileMenu: MenuItemConstructorOptions = {
    label: label('&File'),
    submenu: [
      command('patient.new', '&New Patient…'),
      command('patient.import', '&Import Patients…'),
      command('patient.export', '&Export Patient Summary…'),
      { id: MENU_ITEM_IDS.print, label: label('&Print…'), click: () => print() },
      separator,
      command('app.settings', 'Se&ttings…'),
      separator,
      role('close', '&Close Window'),
      ...(mac ? [] : [role('quit', 'E&xit')])
    ]
  }

  const editMenu: MenuItemConstructorOptions = {
    label: label('&Edit'),
    submenu: [
      role('undo', '&Undo'),
      role('redo', '&Redo'),
      separator,
      role('cut', 'Cu&t'),
      role('copy', '&Copy'),
      role('paste', '&Paste'),
      role('selectAll', 'Select &All'),
      separator,
      command('patient.search', '&Find in List'),
      // "&Paste" already uses P in this menu.
      command('app.commandPalette', 'Co&mmand Palette…', MENU_ITEM_IDS.editCommandPalette)
    ]
  }

  const viewMenu: MenuItemConstructorOptions = {
    label: label('&View'),
    submenu: [
      checkbox('view.toggleShortcutHints', 'Show &Shortcut Hints'),
      checkbox('view.toggleHighContrast', '&High Contrast Theme'),
      checkbox('view.toggleReduceMotion', '&Reduce Motion'),
      separator,
      role('resetZoom', '&Actual Size'),
      role('zoomIn', 'Zoom &In'),
      // The role's own accelerator, CommandOrControl+Plus, is Ctrl+Shift+= on a US keyboard.
      // This hidden twin adds Ctrl+=, the browser convention, so 200 % is easy to reach.
      { role: 'zoomIn', accelerator: 'CommandOrControl+=', visible: false },
      role('zoomOut', 'Zoom &Out'),
      separator,
      role('togglefullscreen', 'Toggle &Full Screen'),
      ...(isDev ? [separator, role('reload', 'Re&load'), role('toggleDevTools', 'Toggle &Developer Tools')] : [])
    ]
  }

  const navigateMenu: MenuItemConstructorOptions = {
    label: label('&Navigate'),
    submenu: [
      command('navigate.overview', '&Overview'),
      command('navigate.schedule', '&Schedule'),
      command('navigate.patients', '&Patients'),
      command('navigate.inbox', '&Inbox'),
      command('navigate.tasks', '&Tasks'),
      command('navigate.reports', '&Reports'),
      command('navigate.resources', 'Reso&urces'),
      separator,
      command('region.next', '&Next Region'),
      // "&Reports" already uses R in this menu.
      command('region.previous', 'Pre&vious Region')
    ]
  }

  const patientMenu: MenuItemConstructorOptions = {
    label: label('&Patient'),
    submenu: [
      command('patient.new', '&New Patient…'),
      command('patient.editSummary', '&Edit Care Summary…'),
      command('patient.addNote', '&Add Clinical Note…'),
      command('patient.message', '&Message Patient…'),
      separator,
      // "&Copy Care ID" keeps C, the Windows convention for Copy.
      command('patient.markCompleted', 'Mark as Com&pleted'),
      command('patient.markNeedsReview', 'Mark as Needs &Review'),
      command('patient.markOpen', 'Mark as &Open'),
      separator,
      command('patient.copyCareId', '&Copy Care ID'),
      command('patient.export', 'E&xport Summary…'),
      command('patient.contextMenu', 'Open Context Men&u'),
      separator,
      // Registers ⌘⇧L on macOS, where the renderer leaves modifier chords to the menu.
      command('patient.filter', '&Filter List…'),
      command('patient.sort', '&Sort List…')
    ]
  }

  const communicateMenu: MenuItemConstructorOptions = {
    label: label('&Communicate'),
    submenu: [
      command('message.new', '&New Message…'),
      command('message.reply', '&Reply'),
      separator,
      command('message.send', '&Send Message'),
      command('message.saveDraft', 'Save &Draft'),
      command('message.attach', '&Attach Document…')
    ]
  }

  const helpMenu: MenuItemConstructorOptions = {
    label: label('&Help'),
    ...(mac ? { role: 'help' as const } : {}),
    submenu: [
      command('app.shortcuts', '&Keyboard Shortcuts'),
      command('app.help', 'CareConnect &Help'),
      command('app.commandPalette', 'Command &Palette'),
      separator,
      // "&About CareConnect" keeps A, the Windows convention for About.
      {
        id: MENU_ITEM_IDS.accessibilityResources,
        label: label('Accessibility &Resources'),
        click: () => openExternal(ACCESSIBILITY_RESOURCES_URL)
      },
      separator,
      { id: MENU_ITEM_IDS.about, label: label('&About CareConnect'), click: () => showAbout() }
    ]
  }

  return [...(mac ? [appMenu] : []), fileMenu, editMenu, viewMenu, navigateMenu, patientMenu, communicateMenu, helpMenu]
}

/** The parts of an Electron Menu that applyMenuState touches. */
export interface MenuItemLike {
  id?: string
  enabled: boolean
  checked: boolean
  submenu?: MenuLike | null
}

export interface MenuLike {
  items: MenuItemLike[]
}

/**
 * Updates enablement and checkmarks in place. Some commands appear in two
 * menus (New Patient in File and Patient), so every item is visited rather
 * than looked up by id, which would find only the first.
 */
export function applyMenuState(menu: MenuLike, state: UiState): void {
  for (const item of menu.items) {
    if (item.id) {
      const enabled = isMenuItemEnabled(item.id, state)
      if (enabled !== null) item.enabled = enabled
      const preference = isCommandId(item.id) ? CHECKBOX_PREFERENCES[item.id] : undefined
      if (preference) item.checked = state[preference]
    }
    if (item.submenu) applyMenuState(item.submenu, state)
  }
}
