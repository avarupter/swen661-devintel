import type { MenuItemConstructorOptions } from 'electron'
import type { UiState } from '../../shared/api'
import { COMMAND_IDS, isCommandId, type CommandId } from '../../shared/commands'
import { acceleratorForCommand } from '../../shared/shortcuts'
import { FakeMenu, type FakeMenuItem, type FakeMenuItemOptions } from '../../../tests/mocks/electron'
import { ACCESSIBILITY_RESOURCES_URL, applyMenuState, buildMenuTemplate, MENU_ITEM_IDS, type MenuTemplateOptions } from '../menu'

const IDLE: UiState = {
  view: 'patients',
  hasSelection: false,
  modal: null,
  unreadCount: 4,
  unsavedChanges: 0,
  showShortcutHints: true,
  highContrast: false,
  reduceMotion: false
}

type Item = MenuItemConstructorOptions

function template(overrides: Partial<MenuTemplateOptions> = {}) {
  const options = {
    platform: 'win32',
    isDev: false,
    appName: 'CareConnect',
    state: IDLE,
    send: jest.fn(),
    showAbout: jest.fn(),
    openExternal: jest.fn(),
    print: jest.fn(),
    ...overrides
  }
  return { items: buildMenuTemplate(options), options }
}

function submenu(item: Item): Item[] {
  if (!Array.isArray(item.submenu)) throw new Error(`${item.label} has no submenu array`)
  return item.submenu
}

function topLevel(items: Item[], label: string): Item[] {
  const menu = items.find((item) => item.label?.replace(/&/g, '') === label)
  if (!menu) throw new Error(`No ${label} menu`)
  return submenu(menu)
}

function allItems(items: Item[]): Item[] {
  return items.flatMap((item) => [item, ...(Array.isArray(item.submenu) ? allItems(item.submenu) : [])])
}

function findById(items: Item[], id: string): Item[] {
  return allItems(items).filter((item) => item.id === id)
}

function click(item: Item): void {
  ;(item.click as unknown as () => void)()
}

/** The access-key letter of a Windows menu label ("E&xit" → "x"), or null. */
function accessKey(label: string): string | null {
  const match = /&([^&])/.exec(label.replace(/&&/g, ''))
  return match ? match[1].toLowerCase() : null
}

const NON_COMMAND_IDS: readonly string[] = Object.values(MENU_ITEM_IDS)

describe('buildMenuTemplate on Windows', () => {
  const { items } = template()

  it('has exactly File, Edit, View, Navigate, Patient, Communicate and Help, in that order', () => {
    expect(items.map((item) => item.label?.replace(/&/g, ''))).toEqual(['File', 'Edit', 'View', 'Navigate', 'Patient', 'Communicate', 'Help'])
  })

  it('gives every menu and every item an access key, unique within its menu', () => {
    const menus: Item[][] = [items, ...items.map(submenu)]
    for (const menu of menus) {
      // A hidden item is never shown, so it has no label and no access key.
      const labelled = menu.filter((item) => item.type !== 'separator' && item.visible !== false)
      const keys = labelled.map((item) => accessKey(item.label ?? ''))
      expect(keys).not.toContain(null)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('lays out the File menu', () => {
    const file = topLevel(items, 'File')
    expect(file.map((item) => item.label ?? item.type)).toEqual([
      '&New Patient…',
      '&Import Patients…',
      '&Export Patient Summary…',
      '&Print…',
      'separator',
      'Se&ttings…',
      'separator',
      '&Close Window',
      'E&xit'
    ])
    expect(file[7].role).toBe('close')
    expect(file[8].role).toBe('quit')
  })

  it('lays out the Edit menu with the native editing roles first', () => {
    const edit = topLevel(items, 'Edit')
    expect(edit.map((item) => item.role ?? item.id ?? item.type)).toEqual([
      'undo',
      'redo',
      'separator',
      'cut',
      'copy',
      'paste',
      'selectAll',
      'separator',
      'patient.search',
      MENU_ITEM_IDS.editCommandPalette
    ])
  })

  it('gives Edit its own Command Palette item, which sends the palette command and shows its shortcut', () => {
    const { items: clickable, options } = template()
    const [editPalette] = findById(clickable, MENU_ITEM_IDS.editCommandPalette)
    expect(MENU_ITEM_IDS.editCommandPalette).toBe('edit.commandPalette')
    expect(editPalette).toMatchObject({ label: 'Co&mmand Palette…', accelerator: 'CmdOrCtrl+K', registerAccelerator: false, enabled: true })
    click(editPalette)
    expect(options.send).toHaveBeenCalledWith({ id: 'app.commandPalette' })
    // The Help menu keeps the command id itself.
    expect(findById(clickable, 'app.commandPalette')).toHaveLength(1)
    expect(topLevel(clickable, 'Help')[2].id).toBe('app.commandPalette')
  })

  it('builds Edit’s Command Palette disabled, and Help’s enabled, while a dialog is open', () => {
    const { items: modal } = template({ state: { ...IDLE, modal: 'dialog' } })
    expect(findById(modal, MENU_ITEM_IDS.editCommandPalette)[0].enabled).toBe(false)
    expect(findById(modal, 'app.commandPalette')[0].enabled).toBe(true)
  })

  it('lays out the View menu: preference checkboxes, zoom and full screen', () => {
    const view = topLevel(items, 'View')
    expect(view.map((item) => item.role ?? item.id ?? item.type)).toEqual([
      'view.toggleShortcutHints',
      'view.toggleHighContrast',
      'view.toggleReduceMotion',
      'separator',
      'resetZoom',
      'zoomIn',
      'zoomIn',
      'zoomOut',
      'separator',
      'togglefullscreen'
    ])
    expect(view.slice(0, 3).map((item) => item.type)).toEqual(['checkbox', 'checkbox', 'checkbox'])
  })

  it('binds Ctrl+= to Zoom In as well, through a hidden twin of the Zoom In item', () => {
    // The zoomIn role's own accelerator, CommandOrControl+Plus, is Ctrl+Shift+= on a US keyboard.
    const zoomIn = topLevel(items, 'View').filter((item) => item.role === 'zoomIn')
    expect(zoomIn).toEqual([
      { role: 'zoomIn', label: 'Zoom &In' },
      { role: 'zoomIn', accelerator: 'CommandOrControl+=', visible: false }
    ])
    // Registered (the default): no renderer shortcut handles zoom.
    expect(zoomIn[1]).not.toHaveProperty('registerAccelerator')
  })

  it('lays out the Navigate, Patient, Communicate and Help menus', () => {
    const ids = (label: string) => topLevel(items, label).map((item) => item.id ?? item.type)
    expect(ids('Navigate')).toEqual([
      'navigate.overview',
      'navigate.schedule',
      'navigate.patients',
      'navigate.inbox',
      'navigate.tasks',
      'navigate.reports',
      'navigate.resources',
      'separator',
      'region.next',
      'region.previous'
    ])
    expect(ids('Patient')).toEqual([
      'patient.new',
      'patient.editSummary',
      'patient.addNote',
      'patient.message',
      'separator',
      'patient.markCompleted',
      'patient.markNeedsReview',
      'patient.markOpen',
      'separator',
      'patient.copyCareId',
      'patient.export',
      'patient.contextMenu'
    ])
    expect(ids('Communicate')).toEqual(['message.new', 'message.reply', 'separator', 'message.send', 'message.saveDraft', 'message.attach'])
    expect(ids('Help')).toEqual([
      'app.shortcuts',
      'app.help',
      'app.commandPalette',
      'separator',
      MENU_ITEM_IDS.accessibilityResources,
      'separator',
      MENU_ITEM_IDS.about
    ])
  })

  it('uses a valid command id for every item that sends a command', () => {
    const ids = allItems(items)
      .map((item) => item.id)
      .filter((id): id is string => id !== undefined && !NON_COMMAND_IDS.includes(id))
    expect(ids.length).toBeGreaterThan(30)
    for (const id of ids) expect(isCommandId(id)).toBe(true)
  })

  it('shows the shared shortcut table’s accelerators without registering them', () => {
    const commandItems = allItems(items).filter((item) => item.id !== undefined && isCommandId(item.id))
    for (const item of commandItems) {
      const expected = acceleratorForCommand(item.id as CommandId)
      expect(item.accelerator).toBe(expected)
      if (expected) expect(item.registerAccelerator).toBe(false)
    }
    expect(findById(items, 'app.commandPalette')[0].accelerator).toBe('CmdOrCtrl+K')
    expect(findById(items, 'patient.editSummary')[0].accelerator).toBe('E')
    expect(findById(items, 'region.previous')[0].accelerator).toBe('Shift+F6')
    expect(findById(items, 'navigate.inbox')[0].accelerator).toBeUndefined()
  })

  it('sends the command when an item is clicked', () => {
    const { items: clickable, options } = template()
    click(findById(clickable, 'patient.new')[0])
    expect(options.send).toHaveBeenCalledWith({ id: 'patient.new' })
    click(topLevel(clickable, 'Navigate')[3])
    expect(options.send).toHaveBeenLastCalledWith({ id: 'navigate.inbox' })
  })

  it('opens the accessibility resources, the About box and printing', () => {
    const { items: clickable, options } = template()
    click(findById(clickable, MENU_ITEM_IDS.accessibilityResources)[0])
    expect(options.openExternal).toHaveBeenCalledWith(ACCESSIBILITY_RESOURCES_URL)
    expect(ACCESSIBILITY_RESOURCES_URL).toBe('https://www.w3.org/WAI/WCAG22/quickref/')
    click(findById(clickable, MENU_ITEM_IDS.about)[0])
    expect(options.showAbout).toHaveBeenCalled()
    click(findById(clickable, MENU_ITEM_IDS.print)[0])
    expect(options.print).toHaveBeenCalled()
    expect(options.send).not.toHaveBeenCalled()
  })

  it('reflects the preferences in the View checkboxes', () => {
    const { items: checked } = template({ state: { ...IDLE, showShortcutHints: false, highContrast: true, reduceMotion: true } })
    expect(findById(checked, 'view.toggleShortcutHints')[0].checked).toBe(false)
    expect(findById(checked, 'view.toggleHighContrast')[0].checked).toBe(true)
    expect(findById(checked, 'view.toggleReduceMotion')[0].checked).toBe(true)
  })

  it('adds Reload and Developer Tools only in development', () => {
    const roles = (list: Item[]) => allItems(list).map((item) => item.role)
    expect(roles(items)).not.toContain('reload')
    expect(roles(items)).not.toContain('toggleDevTools')
    const { items: dev } = template({ isDev: true })
    const view = topLevel(dev, 'View')
    expect(view.slice(-3).map((item) => item.role ?? item.type)).toEqual(['separator', 'reload', 'toggleDevTools'])
  })

  it('starts with patient and compose items disabled before the renderer reports its state', () => {
    const { items: initial } = template({ state: null })
    expect(findById(initial, 'patient.addNote')[0].enabled).toBe(false)
    expect(findById(initial, 'message.send')[0].enabled).toBe(false)
    expect(findById(initial, 'patient.new')[0].enabled).toBe(true)
    expect(findById(initial, 'view.toggleShortcutHints')[0].checked).toBe(true)
  })
})

describe('buildMenuTemplate on Linux', () => {
  it('uses the same menus, access keys and display-only accelerators', () => {
    const { items } = template({ platform: 'linux' })
    expect(items.map((item) => item.label)).toEqual(['&File', '&Edit', '&View', '&Navigate', '&Patient', '&Communicate', '&Help'])
    expect(topLevel(items, 'File').at(-1)).toMatchObject({ role: 'quit', label: 'E&xit' })
    expect(findById(items, 'patient.new')[0]).toMatchObject({ accelerator: 'CmdOrCtrl+N', registerAccelerator: false })
  })
})

describe('buildMenuTemplate on macOS', () => {
  const { items } = template({ platform: 'darwin' })

  it('starts with the standard application menu', () => {
    expect(items[0].label).toBe('CareConnect')
    expect(submenu(items[0]).map((item) => item.role ?? item.type)).toEqual([
      'about',
      'separator',
      'services',
      'hide',
      'hideOthers',
      'unhide',
      'separator',
      'quit'
    ])
    expect(items.slice(1).map((item) => item.label)).toEqual(['File', 'Edit', 'View', 'Navigate', 'Patient', 'Communicate', 'Help'])
  })

  it('has no Windows access-key markers and no Exit item in File', () => {
    for (const item of allItems(items)) expect(item.label ?? '').not.toMatch(/&/)
    expect(topLevel(items, 'File').map((item) => item.role)).not.toContain('quit')
  })

  it('never gives a printable single key an accelerator, and registers the chords the menu owns', () => {
    for (const item of allItems(items)) {
      if (!item.id || !isCommandId(item.id) || !item.accelerator) continue
      expect(item.accelerator).toMatch(/CmdOrCtrl|F\d/)
      expect(item.registerAccelerator).not.toBe(false)
    }
    for (const id of ['patient.editSummary', 'patient.addNote', 'patient.message', 'message.reply'] as const) {
      expect(findById(items, id)[0].accelerator).toBeUndefined()
    }
    expect(findById(items, 'app.commandPalette')[0]).toMatchObject({ accelerator: 'CmdOrCtrl+K' })
    expect(findById(items, MENU_ITEM_IDS.editCommandPalette)[0]).toMatchObject({ label: 'Command Palette…', accelerator: 'CmdOrCtrl+K', registerAccelerator: true })
    expect(findById(items, 'region.next')[0]).toMatchObject({ accelerator: 'F6' })
  })

  it('marks the Help menu with the help role', () => {
    expect(items.at(-1)?.role).toBe('help')
  })

  it('binds Command+= to Zoom In through the hidden twin', () => {
    expect(topLevel(items, 'View').filter((item) => item.role === 'zoomIn')).toEqual([
      { role: 'zoomIn', label: 'Zoom In' },
      { role: 'zoomIn', accelerator: 'CommandOrControl+=', visible: false }
    ])
  })
})

describe('applyMenuState', () => {
  function liveMenu() {
    const { items } = template()
    return FakeMenu.buildFromTemplate(items as unknown as FakeMenuItemOptions[])
  }

  function itemsWithId(menu: FakeMenu, id: string): FakeMenuItem[] {
    const found: FakeMenuItem[] = []
    const walk = (current: FakeMenu): void => {
      for (const item of current.items) {
        if (item.id === id) found.push(item)
        if (item.submenu) walk(item.submenu)
      }
    }
    walk(menu)
    return found
  }

  function enabled(menu: FakeMenu, id: CommandId): boolean {
    const items = itemsWithId(menu, id)
    expect(items.length).toBeGreaterThan(0)
    const states = new Set(items.map((item) => item.enabled))
    expect(states.size).toBe(1)
    return items[0].enabled
  }

  const PATIENT_ITEMS: CommandId[] = [
    'patient.editSummary',
    'patient.addNote',
    'patient.message',
    'patient.markCompleted',
    'patient.markNeedsReview',
    'patient.markOpen',
    'patient.copyCareId',
    'patient.export',
    'patient.contextMenu'
  ]

  it('enables patient items only with a selected patient and no open dialog', () => {
    const menu = liveMenu()
    applyMenuState(menu, IDLE)
    for (const id of PATIENT_ITEMS) expect(enabled(menu, id)).toBe(false)
    applyMenuState(menu, { ...IDLE, hasSelection: true })
    for (const id of PATIENT_ITEMS) expect(enabled(menu, id)).toBe(true)
    applyMenuState(menu, { ...IDLE, hasSelection: true, modal: 'dialog' })
    for (const id of PATIENT_ITEMS) expect(enabled(menu, id)).toBe(false)
  })

  it('updates every copy of an item that appears in two menus', () => {
    const menu = liveMenu()
    expect(itemsWithId(menu, 'patient.new')).toHaveLength(2)
    expect(itemsWithId(menu, 'patient.export')).toHaveLength(2)
    applyMenuState(menu, { ...IDLE, modal: 'dialog' })
    expect(itemsWithId(menu, 'patient.new').map((item) => item.enabled)).toEqual([false, false])
    applyMenuState(menu, IDLE)
    expect(itemsWithId(menu, 'patient.new').map((item) => item.enabled)).toEqual([true, true])
  })

  it('enables Send, Save Draft and Attach only while composing', () => {
    const menu = liveMenu()
    applyMenuState(menu, IDLE)
    for (const id of ['message.send', 'message.saveDraft', 'message.attach'] as const) expect(enabled(menu, id)).toBe(false)
    applyMenuState(menu, { ...IDLE, modal: 'compose' })
    for (const id of ['message.send', 'message.saveDraft', 'message.attach'] as const) expect(enabled(menu, id)).toBe(true)
    expect(enabled(menu, 'message.new')).toBe(false)
  })

  it('enables Reply only in the Inbox with no dialog open', () => {
    const menu = liveMenu()
    applyMenuState(menu, IDLE)
    expect(enabled(menu, 'message.reply')).toBe(false)
    applyMenuState(menu, { ...IDLE, view: 'inbox' })
    expect(enabled(menu, 'message.reply')).toBe(true)
    applyMenuState(menu, { ...IDLE, view: 'inbox', modal: 'palette' })
    expect(enabled(menu, 'message.reply')).toBe(false)
  })

  it('disables every other command while a dialog is open, except the View checkboxes and Help items', () => {
    const menu = liveMenu()
    applyMenuState(menu, { ...IDLE, modal: 'dialog' })
    for (const id of ['patient.new', 'patient.import', 'patient.search', 'navigate.inbox', 'region.next', 'message.new', 'app.settings'] as const) {
      expect(enabled(menu, id)).toBe(false)
    }
    for (const id of ['view.toggleShortcutHints', 'view.toggleHighContrast', 'view.toggleReduceMotion', 'app.shortcuts', 'app.help', 'app.commandPalette'] as const) {
      expect(enabled(menu, id)).toBe(true)
    }
    applyMenuState(menu, IDLE)
    for (const id of ['patient.new', 'patient.import', 'patient.search', 'navigate.inbox', 'region.next', 'message.new', 'app.settings'] as const) {
      expect(enabled(menu, id)).toBe(true)
    }
  })

  it('disables Edit’s Command Palette while any dialog, the palette or compose is open, but keeps Help’s enabled', () => {
    const menu = liveMenu()
    const [editPalette] = itemsWithId(menu, MENU_ITEM_IDS.editCommandPalette)
    const [helpPalette] = itemsWithId(menu, 'app.commandPalette')
    for (const modal of ['dialog', 'palette', 'compose'] as const) {
      applyMenuState(menu, { ...IDLE, modal })
      expect(editPalette.enabled).toBe(false)
      expect(helpPalette.enabled).toBe(true)
    }
    applyMenuState(menu, IDLE)
    expect(editPalette.enabled).toBe(true)
    expect(helpPalette.enabled).toBe(true)
  })

  it('mirrors the preferences in the View checkboxes', () => {
    const menu = liveMenu()
    applyMenuState(menu, { ...IDLE, showShortcutHints: false, highContrast: true, reduceMotion: true })
    expect(itemsWithId(menu, 'view.toggleShortcutHints')[0].checked).toBe(false)
    expect(itemsWithId(menu, 'view.toggleHighContrast')[0].checked).toBe(true)
    expect(itemsWithId(menu, 'view.toggleReduceMotion')[0].checked).toBe(true)
  })

  it('leaves role and non-command items alone', () => {
    const menu = liveMenu()
    applyMenuState(menu, { ...IDLE, modal: 'compose' })
    expect(itemsWithId(menu, MENU_ITEM_IDS.about)[0].enabled).toBe(true)
    const edit = menu.items[1].submenu as FakeMenu
    expect(edit.items.filter((item) => item.role).every((item) => item.enabled)).toBe(true)
  })

  it('covers every command the menu contains', () => {
    const menu = liveMenu()
    const commandIds = new Set<string>()
    const walk = (current: FakeMenu): void => {
      for (const item of current.items) {
        if (item.id && isCommandId(item.id)) commandIds.add(item.id)
        if (item.submenu) walk(item.submenu)
      }
    }
    walk(menu)
    // Everything except palette-only actions (filter, sort, open patient) has a menu item.
    expect([...COMMAND_IDS].filter((id) => !commandIds.has(id)).sort()).toEqual(['patient.filter', 'patient.open', 'patient.sort'])
  })
})
