/**
 * IPC integration: the real preload bridge (src/preload/index.ts) talks to
 * the real handlers (src/main/ipcHandlers.ts) over the in-memory IPC bus in
 * tests/mocks/electron.ts, which structured-clones every payload as Electron
 * does. Behind the handlers are the real workspace store on a temp folder,
 * the real file operations with scripted dialogs, and the real context menu,
 * notification, menu and command-channel modules.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { BrowserWindow, IpcMain, MenuItemConstructorOptions, Notification, PopupOptions } from 'electron'
import { createCommandChannel } from '../../src/main/commandChannel'
import { type MenuFactory, showNativeContextMenu } from '../../src/main/contextMenu'
import { createFileOps, type FileDialog } from '../../src/main/fileOps'
import { registerIpcHandlers } from '../../src/main/ipcHandlers'
import { applyMenuState, buildMenuTemplate } from '../../src/main/menu'
import { showNotification } from '../../src/main/notifications'
import { allowedOrigins } from '../../src/main/security'
import { createWorkspaceStore } from '../../src/main/store'
// Loading the preload exposes window.careconnect through the mocked contextBridge.
import '../../src/preload/index'
import type { AppInfo, CareConnectApi, UiState } from '../../src/shared/api'
import { createSeedWorkspace } from '../../src/shared/seed'
import { clipboard, FakeBrowserWindow, FakeMenu, FakeNotification, mockElectron, shell } from '../mocks/electron'

const api = mockElectron.exposed.careconnect as CareConnectApi
const NOW = new Date(2026, 9, 5, 9, 42, 0, 0)
const APP_INFO: AppInfo = { platform: 'win32', version: '1.0.0', isPackaged: true, highContrast: false }

const READY: UiState = {
  view: 'patients',
  hasSelection: true,
  modal: null,
  unreadCount: 4,
  unsavedChanges: 0,
  showShortcutHints: true,
  highContrast: false,
  reduceMotion: false
}

let dir: string
let win: FakeBrowserWindow
let dialog: { showSaveDialog: jest.Mock; showOpenDialog: jest.Mock }
let onUiState: jest.Mock
let dispose: () => void
let commands: ReturnType<typeof createCommandChannel>
let contextMenuChoice: string | null
let popups: PopupOptions[]

/** A Menu whose popup records its options, "clicks" `contextMenuChoice`, then closes, as Windows does. */
const scriptedMenu = {
  buildFromTemplate: (template: MenuItemConstructorOptions[]) => {
    const menu = FakeMenu.buildFromTemplate(template as never)
    menu.popup.mockImplementation((options: PopupOptions) => {
      popups.push(options)
      if (contextMenuChoice) menu.getMenuItemById(contextMenuChoice)?.click?.()
      options.callback?.()
    })
    return menu
  }
} as unknown as MenuFactory

beforeEach(() => {
  mockElectron.reset()
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'careconnect-ipc-'))
  win = new FakeBrowserWindow()
  mockElectron.connectRenderer(win.webContents)
  dialog = {
    showSaveDialog: jest.fn(async () => ({ canceled: true, filePath: '' })),
    showOpenDialog: jest.fn(async () => ({ canceled: true, filePaths: [] }))
  }
  onUiState = jest.fn()
  contextMenuChoice = null
  popups = []
  commands = createCommandChannel()
  commands.attach(win.webContents as unknown as BrowserWindow['webContents'])

  const getWindow = () => win as unknown as BrowserWindow
  dispose = registerIpcHandlers({
    ipcMain: mockElectron.ipcMain as unknown as IpcMain,
    origins: allowedOrigins(),
    getWindow,
    store: createWorkspaceStore({ dir, now: () => NOW }),
    fileOps: createFileOps({ dialog: dialog as unknown as FileDialog, now: () => NOW }),
    showContextMenu: (target, request) => showNativeContextMenu(target, request, scriptedMenu),
    showNotification: (request) =>
      showNotification({
        Notification: FakeNotification as unknown as typeof Notification,
        iconPath: '/opt/careconnect/resources/icon.png',
        request,
        onClick: (patientId) => {
          if (patientId) commands.send({ id: 'patient.open', patientId })
        }
      }),
    shell,
    clipboard,
    appInfo: () => APP_INFO,
    onUiState: (state) => {
      onUiState(state)
      commands.markReady()
    }
  })
})

afterEach(() => {
  dispose()
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('workspace persistence over IPC', () => {
  it('loadWorkspace seeds the 28 synthetic patients on first run', async () => {
    const result = await api.loadWorkspace()
    expect(result.source).toBe('seed')
    expect(result.workspace.patients).toHaveLength(28)
    expect(result.workspace.patients[0].name).toBe('Avery Park')
    expect(fs.existsSync(path.join(dir, 'careconnect-workspace.json'))).toBe(true)
  })

  it('saveWorkspace persists a change that a fresh store loads', async () => {
    const { workspace } = await api.loadWorkspace()
    workspace.patients[0].status = 'completed'
    workspace.patients[0].plan.push('Discharge summary sent')

    const { savedAt } = await api.saveWorkspace(workspace)
    expect(savedAt).toBe(NOW.toISOString())

    const reloaded = await createWorkspaceStore({ dir, now: () => NOW }).load()
    expect(reloaded.source).toBe('file')
    expect(reloaded.workspace.patients[0]).toMatchObject({ status: 'completed', plan: expect.arrayContaining(['Discharge summary sent']) })
  })

  it('rejects an invalid workspace and keeps the saved file', async () => {
    const { workspace } = await api.loadWorkspace()
    const before = fs.readFileSync(path.join(dir, 'careconnect-workspace.json'), 'utf8')
    workspace.patients[0].careId = ''
    await expect(api.saveWorkspace(workspace)).rejects.toThrow('workspace.patients[0].careId: must not be empty')
    expect(fs.readFileSync(path.join(dir, 'careconnect-workspace.json'), 'utf8')).toBe(before)
  })

  it('recovers from a corrupt workspace file and reports where the backup is', async () => {
    fs.writeFileSync(path.join(dir, 'careconnect-workspace.json'), 'not json')
    const result = await api.loadWorkspace()
    expect(result.source).toBe('recovered')
    expect(result.backupPath && fs.readFileSync(result.backupPath, 'utf8')).toBe('not json')
  })
})

describe('files through native dialogs', () => {
  it('exportPatient writes the summary the user saved', async () => {
    const { workspace } = await api.loadWorkspace()
    const target = path.join(dir, 'CC-1048-avery-park.txt')
    dialog.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: target })

    await expect(api.exportPatient({ patient: workspace.patients[0], format: 'txt' })).resolves.toEqual({ filePath: target })
    expect(dialog.showSaveDialog).toHaveBeenCalledWith(win, expect.objectContaining({ defaultPath: 'CC-1048-avery-park.txt' }))
    const text = fs.readFileSync(target, 'utf8')
    expect(text).toContain('Avery Park')
    expect(text).toContain('CC-1048')
  })

  it('exportPatient resolves null when the user cancels', async () => {
    const { workspace } = await api.loadWorkspace()
    await expect(api.exportPatient({ patient: workspace.patients[0], format: 'json' })).resolves.toBeNull()
  })

  it('importPatients returns validated patients and counts the invalid ones', async () => {
    const [avery, morgan] = createSeedWorkspace(NOW).patients
    const file = path.join(dir, 'transfer.json')
    fs.writeFileSync(file, JSON.stringify({ patients: [{ ...avery, internalNote: 'strip me' }, { name: 'Incomplete' }, morgan] }))
    dialog.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: [file] })

    const result = await api.importPatients()
    expect(result).toEqual({ patients: [avery, morgan], skipped: 1, filePath: file })
    expect(result?.patients[0]).not.toHaveProperty('internalNote')
  })

  it('importPatients reports an unreadable file as an error the renderer can show', async () => {
    const file = path.join(dir, 'broken.json')
    fs.writeFileSync(file, '{"patients": [')
    dialog.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: [file] })
    await expect(api.importPatients()).rejects.toThrow('That file is not valid JSON.')
  })

  it('pickAttachment returns only the name and size', async () => {
    const file = path.join(dir, 'referral-letter.pdf')
    fs.writeFileSync(file, Buffer.alloc(4096))
    dialog.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: [file] })
    await expect(api.pickAttachment()).resolves.toEqual({ name: 'referral-letter.pdf', size: 4096 })
  })
})

describe('desktop services over IPC', () => {
  it('openExternal opens an allow-listed link and rejects anything else', async () => {
    await expect(api.openExternal('https://www.nvaccess.org/files/nvda/documentation/userGuide.html')).resolves.toBe(true)
    expect(shell.openExternal).toHaveBeenCalledWith('https://www.nvaccess.org/files/nvda/documentation/userGuide.html')

    await expect(api.openExternal('https://phishing.example/login')).rejects.toThrow('url: only allow-listed https links can be opened')
    await expect(api.openExternal('file:///C:/Windows/System32/cmd.exe')).rejects.toThrow('url:')
    expect(shell.openExternal).toHaveBeenCalledTimes(1)
  })

  it('copyText writes to the system clipboard', async () => {
    await expect(api.copyText('CC-1048')).resolves.toBeUndefined()
    expect(clipboard.writeText).toHaveBeenCalledWith('CC-1048')
  })

  it('getAppInfo returns plain data', async () => {
    await expect(api.getAppInfo()).resolves.toEqual(APP_INFO)
  })

  it('printPage resolves when printing finishes', async () => {
    win.webContents.print.mockImplementation((_options: unknown, callback: (success: boolean, reason: string) => void) => callback(true, ''))
    await expect(api.printPage()).resolves.toBeUndefined()
    expect(win.webContents.print).toHaveBeenCalledWith({ printBackground: true }, expect.any(Function))
  })

  it('showContextMenu returns the item the user chose, or null when dismissed', async () => {
    const items = [
      { id: 'patient.message', label: 'Message Avery Park…', accelerator: 'M' },
      { id: 'separator-status', label: '', type: 'separator' as const },
      { id: 'patient.addNote', label: 'Add clinical note…', accelerator: 'N' }
    ]
    contextMenuChoice = 'patient.addNote'
    await expect(api.showContextMenu({ items, x: 240, y: 318 })).resolves.toBe('patient.addNote')
    expect(popups[0]).toMatchObject({ window: win, x: 240, y: 318 })
    contextMenuChoice = null
    await expect(api.showContextMenu({ items })).resolves.toBeNull()
  })

  it('showContextMenu opens the native menu at its anchor when the page is zoomed', async () => {
    // The renderer sends CSS pixels (getBoundingClientRect, clientX/Y); popup() takes window DIPs.
    const items = [{ id: 'patient.addNote', label: 'Add clinical note…', accelerator: 'N' }]
    win.webContents.setZoomFactor(2)
    contextMenuChoice = 'patient.addNote'
    await expect(api.showContextMenu({ items, x: 240, y: 318 })).resolves.toBe('patient.addNote')
    expect(popups.at(-1)).toMatchObject({ window: win, x: 480, y: 636 })

    // View > Zoom In once (zoom level 0.5): positions are rounded to whole DIPs.
    win.webContents.setZoomLevel(0.5)
    await api.showContextMenu({ items, x: 240, y: 318 })
    expect(popups.at(-1)).toMatchObject({ x: 263, y: 348 })

    // Without a position the menu opens at the pointer, whatever the zoom.
    win.webContents.setZoomFactor(2)
    await api.showContextMenu({ items })
    expect(popups.at(-1)).not.toHaveProperty('x')
    expect(popups.at(-1)).not.toHaveProperty('y')
  })

  it('showNotification shows a toast whose click opens the patient in the renderer', async () => {
    const received = jest.fn()
    const unsubscribe = api.onCommand(received)
    api.updateUiState(READY)

    await expect(api.showNotification({ title: '1 follow-up due today', body: 'Avery Park at 10:30', patientId: 'p-avery-park' })).resolves.toBe(true)
    FakeNotification.instances[0].emit('click')
    expect(received).toHaveBeenCalledWith({ id: 'patient.open', patientId: 'p-avery-park' })
    unsubscribe()
  })
})

describe('main-to-renderer commands and renderer state', () => {
  function menuItem(template: MenuItemConstructorOptions[], id: string): MenuItemConstructorOptions {
    for (const top of template) {
      const found = (top.submenu as MenuItemConstructorOptions[]).find((item) => item.id === id)
      if (found) return found
    }
    throw new Error(`No menu item ${id}`)
  }

  it('a menu click reaches api.onCommand listeners once the renderer is ready', () => {
    const template = buildMenuTemplate({
      platform: 'win32',
      isDev: false,
      appName: 'CareConnect',
      state: null,
      send: (command) => commands.send(command),
      showAbout: jest.fn(),
      openExternal: jest.fn(),
      print: jest.fn()
    })
    const received = jest.fn()
    api.onCommand(received)

    ;(menuItem(template, 'patient.new').click as unknown as () => void)()
    expect(received).not.toHaveBeenCalled()

    api.updateUiState(READY)
    expect(received).toHaveBeenCalledWith({ id: 'patient.new' })

    ;(menuItem(template, 'navigate.inbox').click as unknown as () => void)()
    expect(received).toHaveBeenLastCalledWith({ id: 'navigate.inbox' })
  })

  it('updateUiState reaches onUiState, which drives the native menu', () => {
    api.updateUiState(READY)
    expect(onUiState).toHaveBeenCalledWith(READY)

    const menu = FakeMenu.buildFromTemplate(
      buildMenuTemplate({
        platform: 'win32',
        isDev: false,
        appName: 'CareConnect',
        state: null,
        send: jest.fn(),
        showAbout: jest.fn(),
        openExternal: jest.fn(),
        print: jest.fn()
      }) as never
    )
    applyMenuState(menu, onUiState.mock.calls[0][0] as UiState)
    expect(menu.getMenuItemById('patient.addNote')?.enabled).toBe(true)
  })

  it('a malformed ui:state never reaches the main process logic', () => {
    api.updateUiState({ ...READY, view: 'admin' } as unknown as UiState)
    expect(onUiState).not.toHaveBeenCalled()
  })
})

describe('untrusted senders', () => {
  it('rejects every request from a frame on another origin', async () => {
    mockElectron.connectRenderer(win.webContents, 'https://evil.example/index.html')
    await expect(api.loadWorkspace()).rejects.toThrow('Blocked IPC from an untrusted sender')
    await expect(api.copyText('stolen')).rejects.toThrow('Blocked IPC from an untrusted sender')
    await expect(api.openExternal('https://www.w3.org/')).rejects.toThrow('Blocked IPC from an untrusted sender')
    expect(clipboard.writeText).not.toHaveBeenCalled()
    expect(fs.existsSync(path.join(dir, 'careconnect-workspace.json'))).toBe(false)
  })

  it('rejects a lookalike app origin and ignores its UI state', async () => {
    mockElectron.connectRenderer(win.webContents, 'app://careconnect.evil/index.html')
    await expect(api.getAppInfo()).rejects.toThrow('Blocked IPC from an untrusted sender')
    api.updateUiState(READY)
    expect(onUiState).not.toHaveBeenCalled()
  })
})
