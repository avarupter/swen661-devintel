/**
 * Boots the real main-process entry point (and, where needed, the real
 * preload) against the in-memory Electron, in a fresh module registry per
 * test, to check the wiring between the tested modules.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { PopupOptions } from 'electron'
import type { CareConnectApi, UiState } from '../../shared/api'
import { INVOKE_CHANNELS, IPC } from '../../shared/ipc'

type ElectronMock = typeof import('../../../tests/mocks/electron')

interface Booted {
  electron: ElectronMock
  win: InstanceType<ElectronMock['FakeBrowserWindow']>
  api: CareConnectApi
}

const READY_STATE: UiState = {
  view: 'patients',
  hasSelection: true,
  modal: null,
  unreadCount: 3,
  unsavedChanges: 0,
  showShortcutHints: true,
  highContrast: false,
  reduceMotion: false
}

let userData: string

beforeEach(() => {
  userData = fs.mkdtempSync(path.join(os.tmpdir(), 'careconnect-main-'))
})

afterEach(() => {
  fs.rmSync(userData, { recursive: true, force: true })
})

function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

async function boot(options: { argv?: string[]; lock?: boolean } = {}): Promise<Booted> {
  let electron!: ElectronMock
  const argv = process.argv
  await jest.isolateModulesAsync(async () => {
    electron = await import('../../../tests/mocks/electron')
    electron.mockElectron.paths.userData = userData
    electron.mockElectron.singleInstanceLock = options.lock ?? true
    if (options.argv) process.argv = [...argv, ...options.argv]
    try {
      await import('../index')
      await flush()
      const [win] = electron.FakeBrowserWindow.windows
      if (win) electron.mockElectron.connectRenderer(win.webContents)
      await import('../../preload/index')
    } finally {
      process.argv = argv
    }
  })
  const win = electron.FakeBrowserWindow.windows[0]
  const api = electron.mockElectron.exposed.careconnect as CareConnectApi
  return { electron, win, api }
}

function commandsSent(win: Booted['win']): unknown[] {
  return win.webContents.sent.filter(([channel]) => channel === IPC.command).map(([, command]) => command)
}

function menuItem(electron: ElectronMock, id: string) {
  const item = electron.Menu.applicationMenu?.getMenuItemById(id)
  if (!item) throw new Error(`No menu item ${id}`)
  return item
}

describe('main process bootstrap', () => {
  it('registers the app:// scheme and enables the sandbox before the app is ready', async () => {
    const { electron } = await boot()
    expect(electron.protocol.registerSchemesAsPrivileged).toHaveBeenCalledWith([
      { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
    ])
    expect(electron.app.enableSandbox).toHaveBeenCalled()
    expect(electron.app.requestSingleInstanceLock).toHaveBeenCalled()
  })

  it('serves the renderer over app:// and denies every web permission', async () => {
    const { electron } = await boot()
    expect(electron.protocol.handle).toHaveBeenCalledWith('app', expect.any(Function))
    expect(electron.session.defaultSession.setPermissionRequestHandler).toHaveBeenCalled()
    expect(electron.session.defaultSession.setPermissionCheckHandler).toHaveBeenCalled()
  })

  it('opens one sandboxed window on the app entry URL with the preload bridge', async () => {
    const { electron, win } = await boot()
    expect(electron.FakeBrowserWindow.windows).toHaveLength(1)
    expect(win.options.webPreferences).toMatchObject({
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, '..', '..', 'preload', 'index.js')
    })
    expect(win.loadURL).toHaveBeenCalledWith('app://careconnect/index.html')
    win.emit('ready-to-show')
    expect(win.visible).toBe(true)
  })

  it('installs the native menu and the tray icon', async () => {
    const { electron } = await boot()
    expect(electron.Menu.setApplicationMenu).toHaveBeenCalledTimes(1)
    expect(electron.Menu.applicationMenu?.items.map((item) => item.label.replace(/&/g, ''))).toEqual([
      'File',
      'Edit',
      'View',
      'Navigate',
      'Patient',
      'Communicate',
      'Help'
    ])
    expect(electron.Tray.instances).toHaveLength(1)
    expect(electron.Tray.instances[0].toolTip).toBe('CareConnect — 0 unread messages')
  })

  it('registers a handler for every invoke channel', async () => {
    const { electron } = await boot()
    expect([...electron.mockElectron.ipcMain.handlers.keys()].sort()).toEqual([...INVOKE_CHANNELS].sort())
  })

  it('loads and saves the workspace in the user-data folder through the real bridge', async () => {
    const { api } = await boot()
    const loaded = await api.loadWorkspace()
    expect(loaded.source).toBe('seed')
    expect(loaded.workspace.patients).toHaveLength(28)
    expect(fs.existsSync(path.join(userData, 'careconnect-workspace.json'))).toBe(true)

    loaded.workspace.patients[0].plan.push('Saved through IPC')
    await api.saveWorkspace(loaded.workspace)
    expect(fs.readFileSync(path.join(userData, 'careconnect-workspace.json'), 'utf8')).toContain('Saved through IPC')
  })

  it('reports the platform, version, packaging and high-contrast state', async () => {
    const { api, electron } = await boot()
    electron.nativeTheme.shouldUseHighContrastColors = true
    await expect(api.getAppInfo()).resolves.toEqual({ platform: process.platform, version: '1.0.0', isPackaged: false, highContrast: true })
  })

  it('mirrors renderer state into the menu, the tray and the badge', async () => {
    const { api, electron } = await boot()
    expect(menuItem(electron, 'patient.addNote').enabled).toBe(false)

    api.updateUiState(READY_STATE)
    expect(menuItem(electron, 'patient.addNote').enabled).toBe(true)
    expect(electron.Tray.instances[0].toolTip).toBe('CareConnect — 3 unread messages')
    expect(electron.app.setBadgeCount).toHaveBeenCalledWith(3)
  })

  it('holds a Jump List --command until the renderer is ready, then delivers it', async () => {
    const { api, win } = await boot({ argv: ['--command=navigate.inbox'] })
    const listener = jest.fn()
    api.onCommand(listener)
    expect(commandsSent(win)).toEqual([])

    api.updateUiState(READY_STATE)
    expect(commandsSent(win)).toEqual([{ id: 'navigate.inbox' }])
    expect(listener).toHaveBeenCalledWith({ id: 'navigate.inbox' })
  })

  it('sends menu clicks to the renderer', async () => {
    const { api, electron, win } = await boot()
    api.updateUiState(READY_STATE)
    menuItem(electron, 'app.commandPalette').click?.()
    expect(commandsSent(win)).toEqual([{ id: 'app.commandPalette' }])
  })

  it('focuses the window for a second instance and runs its --command', async () => {
    const { api, electron, win } = await boot()
    api.updateUiState(READY_STATE)
    win.minimized = true
    electron.app.emit('second-instance', {}, ['CareConnect.exe', '--command=patient.new'], 'C:\\', {})
    expect(win.restore).toHaveBeenCalled()
    expect(win.show).toHaveBeenCalled()
    expect(win.focus).toHaveBeenCalled()
    expect(commandsSent(win)).toEqual([{ id: 'patient.new' }])
  })

  it('opens the patient when a follow-up notification is clicked', async () => {
    const { api, electron, win } = await boot()
    api.updateUiState(READY_STATE)
    await expect(api.showNotification({ title: '1 follow-up due today', body: 'Avery Park at 10:30', patientId: 'p-avery-park' })).resolves.toBe(true)
    const [notification] = electron.Notification.instances
    expect(notification.options.icon).toBe('/tmp/careconnect-test/resources/asset.png')
    notification.emit('click')
    expect(win.focus).toHaveBeenCalled()
    expect(commandsSent(win)).toEqual([{ id: 'patient.open', patientId: 'p-avery-park' }])
  })

  it('opens a renderer context menu over the window at its anchor when the page is zoomed to 200 %', async () => {
    const { api, electron, win } = await boot()
    win.webContents.setZoomFactor(2)
    const choice = api.showContextMenu({ items: [{ id: 'patient.addNote', label: 'Add clinical note…' }], x: 240, y: 318 })
    await flush()

    const menu = electron.Menu.buildFromTemplate.mock.results.at(-1)?.value as InstanceType<ElectronMock['Menu']>
    const [options] = menu.popup.mock.calls[0] as [PopupOptions]
    expect(options).toMatchObject({ window: win, x: 480, y: 636 })
    menu.getMenuItemById('patient.addNote')?.click?.()
    options.callback?.()
    await expect(choice).resolves.toBe('patient.addNote')
  })

  it('forwards Windows High Contrast changes to the renderer', async () => {
    const { electron, win } = await boot()
    electron.nativeTheme.shouldUseHighContrastColors = true
    electron.nativeTheme.emit('updated')
    expect(win.webContents.sent).toContainEqual([IPC.themeChanged, { highContrast: true, dark: false }])
  })

  it('shows the About box with the version and the synthetic-data notice', async () => {
    const { electron, win } = await boot()
    menuItem(electron, 'help.about').click?.()
    expect(electron.dialog.showMessageBox).toHaveBeenCalledWith(
      win,
      expect.objectContaining({ type: 'info', title: 'About CareConnect', message: 'CareConnect 1.0.0', detail: expect.stringContaining('All patient data is synthetic.') })
    )
  })

  it('opens the accessibility resources in the browser and prints from the File menu', async () => {
    const { electron, win } = await boot()
    menuItem(electron, 'help.accessibilityResources').click?.()
    expect(electron.shell.openExternal).toHaveBeenCalledWith('https://www.w3.org/WAI/WCAG22/quickref/')
    menuItem(electron, 'file.print').click?.()
    expect(win.webContents.print).toHaveBeenCalledWith({ printBackground: true })
  })

  it('remembers the window placement in the user-data folder', async () => {
    const { win } = await boot()
    win.setBounds({ x: 140, y: 90, width: 1300, height: 820 })
    win.close()
    expect(JSON.parse(fs.readFileSync(path.join(userData, 'window-state.json'), 'utf8'))).toMatchObject({
      x: 140,
      y: 90,
      width: 1300,
      height: 820
    })
  })

  it('holds a close until the renderer reports its autosave finished', async () => {
    const { api, win } = await boot()
    api.updateUiState({ ...READY_STATE, unsavedChanges: 1 })
    win.close()
    expect(win.destroyed).toBe(false)

    api.updateUiState({ ...READY_STATE, unsavedChanges: 0 })
    expect(win.destroyed).toBe(true)
  })

  it('finishes a quit that waited for the autosave, on every platform', async () => {
    const { electron } = await boot()
    electron.app.emit('before-quit')
    electron.app.emit('window-all-closed')
    expect(electron.app.quit).toHaveBeenCalledTimes(1)
  })

  it('quits when the last window closes, except on macOS', async () => {
    const { electron } = await boot()
    electron.app.emit('window-all-closed')
    expect(electron.app.quit).toHaveBeenCalledTimes(process.platform === 'darwin' ? 0 : 1)
  })

  it('reopens the window from the tray or the dock after it was closed', async () => {
    const { electron, win } = await boot()
    win.close()
    electron.app.emit('activate')
    expect(electron.FakeBrowserWindow.getAllWindows()).toHaveLength(1)
    electron.FakeBrowserWindow.getAllWindows()[0].close()

    const trayMenu = electron.Tray.instances[0].contextMenu
    trayMenu?.items[0].click?.()
    expect(electron.FakeBrowserWindow.getAllWindows()).toHaveLength(1)
  })

  it('quits at once, without a window, when another instance is already running', async () => {
    const { electron } = await boot({ lock: false })
    expect(electron.app.quit).toHaveBeenCalled()
    expect(electron.app.whenReady).not.toHaveBeenCalled()
    expect(electron.FakeBrowserWindow.windows).toHaveLength(0)
    expect(electron.mockElectron.ipcMain.handlers.size).toBe(0)
  })
})
